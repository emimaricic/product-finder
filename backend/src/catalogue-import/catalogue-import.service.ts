import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { readFile } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildImportPlan,
  changedFields,
  ImportPlan,
} from './build-import-plan';
import { CatalogueProduct, ImportIssue } from './catalogue-row';
import { parseCatalogueCsv } from './parse-catalogue-csv';

/** Arbitrary app-wide key for pg_advisory_xact_lock — one import at a time. */
const IMPORT_LOCK_KEY = 4_242_001;

/**
 * Guard against a truncated or partial export: if the file contains fewer
 * than this share of the currently listed SKUs, we import what's there but
 * do NOT delist anything. Mass-hiding the catalogue needs a human decision.
 */
export const MIN_EXPORT_RATIO_FOR_DELISTING = 0.5;

const CREATE_CHUNK = 1000;
const IMPORT_TIMEOUT_MS = 10 * 60_000;
const MAX_STORED_ISSUES = 1000;
/** Above this many changed rows the import refreshes table statistics itself. */
const LARGE_CHANGE_ROWS = 1000;

export interface ImportCounts {
  rowsRead: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  delisted: number;
  relisted: number;
}

export interface ImportSummary extends ImportCounts {
  runId: string;
  issues: ImportIssue[];
}

export class ImportAlreadyRunningError extends Error {
  constructor() {
    super('Another catalogue import is already running');
    this.name = 'ImportAlreadyRunningError';
  }
}

type Tx = Prisma.TransactionClient;

const PIM_SELECT = {
  id: true,
  sku: true,
  name: true,
  chemicalName: true,
  function: true,
  applicationArea: true,
  region: true,
  certifications: true,
  status: true,
  launchYear: true,
  description: true,
  delistedAt: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class CatalogueImportService {
  private readonly logger = new Logger(CatalogueImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFromFile(path: string): Promise<ImportSummary> {
    const content = await readFile(path, 'utf8');
    return this.importCsv(content, path);
  }

  /**
   * Idempotent: running the same export twice yields 0 created / 0 updated
   * the second time. Only PIM-owned columns are written; reviews and rating
   * aggregates are never touched.
   */
  async importCsv(
    content: string,
    source: string,
    now: Date = new Date(),
  ): Promise<ImportSummary> {
    await this.failInterruptedRuns();
    const run = await this.prisma.importRun.create({
      data: { source, status: 'RUNNING' },
    });

    try {
      const records = parseCatalogueCsv(content);
      const plan = buildImportPlan(records, now);

      const counts = await this.prisma.$transaction(
        async (tx) => {
          const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
            SELECT pg_try_advisory_xact_lock(${IMPORT_LOCK_KEY}) AS locked`;
          if (!locked) throw new ImportAlreadyRunningError();
          return this.apply(tx, plan, records.length, now);
        },
        { timeout: IMPORT_TIMEOUT_MS, maxWait: 10_000 },
      );

      await this.prisma.importRun.update({
        where: { id: run.id },
        data: {
          ...counts,
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          issues: plan.issues.slice(
            0,
            MAX_STORED_ISSUES,
          ) as unknown as Prisma.InputJsonValue,
        },
      });

      this.logSummary(counts, plan.issues);
      await this.refreshStatistics(counts);
      return { runId: run.id, ...counts, issues: plan.issues };
    } catch (err) {
      await this.prisma.importRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: (err as Error).message,
        },
      });
      throw err;
    }
  }

  private async apply(
    tx: Tx,
    plan: ImportPlan,
    rowsRead: number,
    now: Date,
  ): Promise<ImportCounts> {
    const counts: ImportCounts = {
      rowsRead,
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: plan.skipped,
      delisted: 0,
      relisted: 0,
    };

    // Full scan is fine up to ~50k rows (a few MB) and lets us diff in memory,
    // so unchanged products cost zero writes and keep their updatedAt.
    const existing = await tx.product.findMany({ select: PIM_SELECT });
    const bySku = new Map(existing.map((p) => [p.sku, p]));

    const toCreate: CatalogueProduct[] = [];
    for (const product of plan.products) {
      const current = bySku.get(product.sku);
      if (!current) {
        toCreate.push(product);
        continue;
      }
      const changed = changedFields(current, product).length > 0;
      const relist = current.delistedAt !== null;
      if (!changed && !relist) {
        counts.unchanged++;
        continue;
      }
      await tx.product.update({
        where: { id: current.id },
        // PIM fields only + clear delistedAt. Never rating*/reviews.
        data: { ...product, delistedAt: null },
      });
      if (changed) counts.updated++;
      if (relist) counts.relisted++;
    }

    for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
      const { count } = await tx.product.createMany({
        data: toCreate.slice(i, i + CREATE_CHUNK),
      });
      counts.created += count;
    }

    counts.delisted = await this.delistMissing(tx, plan, existing, now);
    return counts;
  }

  private async delistMissing(
    tx: Tx,
    plan: ImportPlan,
    existing: { id: string; sku: string; delistedAt: Date | null }[],
    now: Date,
  ): Promise<number> {
    const listed = existing.filter((p) => p.delistedAt === null);
    const missing = listed.filter((p) => !plan.skusInExport.has(p.sku));
    if (missing.length === 0) return 0;

    if (
      plan.skusInExport.size <
      listed.length * MIN_EXPORT_RATIO_FOR_DELISTING
    ) {
      plan.issues.push({
        line: 0,
        sku: null,
        severity: 'warning',
        message:
          `Export contains ${plan.skusInExport.size} SKUs but ${listed.length} are listed; ` +
          `looks truncated, so ${missing.length} missing product(s) were NOT delisted`,
      });
      return 0;
    }

    const { count } = await tx.product.updateMany({
      where: { id: { in: missing.map((p) => p.id) } },
      data: { delistedAt: now },
    });
    return count;
  }

  /**
   * A process killed mid-import (deploy, restart) leaves its run RUNNING
   * forever. Anything RUNNING for longer than the transaction timeout cannot
   * still be alive, so close it as FAILED — monitoring then sees it.
   */
  private async failInterruptedRuns(): Promise<void> {
    await this.prisma.importRun.updateMany({
      where: {
        status: 'RUNNING',
        startedAt: { lt: new Date(Date.now() - IMPORT_TIMEOUT_MS) },
      },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        error: 'Interrupted (process stopped mid-import)',
      },
    });
  }

  /**
   * After a large change, refresh planner statistics and visibility info now
   * instead of leaving it to autovacuum: `npm run bench:scale` showed searches
   * at ~0.5–1 s while autovacuum was still processing a 50k-row load, versus
   * ~25 ms afterwards. Runs outside the import transaction (VACUUM can't).
   */
  private async refreshStatistics(counts: ImportCounts): Promise<void> {
    const changed =
      counts.created + counts.updated + counts.delisted + counts.relisted;
    if (changed < LARGE_CHANGE_ROWS) return;
    try {
      await this.prisma.$executeRawUnsafe('VACUUM (ANALYZE) products');
    } catch (err) {
      this.logger.warn(`VACUUM ANALYZE skipped: ${(err as Error).message}`);
    }
  }

  private logSummary(counts: ImportCounts, issues: ImportIssue[]) {
    this.logger.log(
      `Catalogue import done: ${JSON.stringify(counts)}; ${issues.length} issue(s)`,
    );
    for (const i of issues.slice(0, 50)) {
      const msg = `line ${i.line}${i.sku ? ` [${i.sku}]` : ''}: ${i.message}`;
      if (i.severity === 'error') this.logger.warn(`SKIPPED ${msg}`);
      else this.logger.log(`corrected ${msg}`);
    }
  }
}
