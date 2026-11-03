import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns ok when the database responds', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('returns 503 when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
