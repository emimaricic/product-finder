-- Trigram matching for substring search (ILIKE %term%) on name/sku/chemical/description.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'PHASE_OUT', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chemical_name" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "application_area" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProductStatus" NOT NULL,
    "launch_year" INTEGER,
    "description" TEXT NOT NULL,
    "delisted_at" TIMESTAMP(3),
    "rating_avg" DECIMAL(3,2),
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "author_name" VARCHAR(80) NOT NULL,
    "company" VARCHAR(120),
    "comment" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "rows_read" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "delisted" INTEGER NOT NULL DEFAULT 0,
    "relisted" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_status_delisted_at_idx" ON "products"("status", "delisted_at");

-- CreateIndex
CREATE INDEX "products_function_idx" ON "products"("function");

-- CreateIndex
CREATE INDEX "products_application_area_idx" ON "products"("application_area");

-- CreateIndex
CREATE INDEX "products_region_idx" ON "products"("region");

-- CreateIndex
CREATE INDEX "products_certifications_idx" ON "products" USING GIN ("certifications");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_launch_year_idx" ON "products"("launch_year");

-- CreateIndex
CREATE INDEX "products_rating_avg_idx" ON "products"("rating_avg");

-- CreateIndex
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_sku_trgm_idx" ON "products" USING GIN ("sku" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_chemical_name_trgm_idx" ON "products" USING GIN ("chemical_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_description_trgm_idx" ON "products" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_runs_started_at_idx" ON "import_runs"("started_at" DESC);

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Defence in depth: the API validates too, but the DB is the last line.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
