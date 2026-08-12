-- Indexes support the storefront's active, filtered, sorted product queries
-- and its first-image lookup.
CREATE INDEX "Product_storeId_isActive_audience_updatedAt_idx"
ON "Product"("storeId", "isActive", "audience", "updatedAt");

CREATE INDEX "Product_storeId_isActive_basePrice_idx"
ON "Product"("storeId", "isActive", "basePrice");

CREATE INDEX "Product_storeId_categoryId_isActive_idx"
ON "Product"("storeId", "categoryId", "isActive");

CREATE INDEX "ProductImage_productId_sortOrder_createdAt_idx"
ON "ProductImage"("productId", "sortOrder", "createdAt");
