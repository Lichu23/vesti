CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key"
ON "ProductVariant" ("productId", "size", "color")
WHERE "color" IS NOT NULL;

CREATE UNIQUE INDEX "ProductVariant_productId_size_no_color_key"
ON "ProductVariant" ("productId", "size")
WHERE "color" IS NULL;
