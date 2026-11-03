-- CreateIndex
CREATE INDEX "products_function_trgm_idx" ON "products" USING GIN ("function" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_application_area_trgm_idx" ON "products" USING GIN ("application_area" gin_trgm_ops);
