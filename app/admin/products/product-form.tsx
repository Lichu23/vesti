"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";

import { type ProductFormState } from "@/app/admin/products/actions";
import { compressProductImage } from "@/app/admin/products/compress-product-image";

const initialProductFormState: ProductFormState = {
  message: "",
  status: "idle",
};

export type ProductOption = {
  id: string;
  name: string;
};

export type ProductFormProduct = {
  id: string;
  name: string;
  categoryId: string;
  modelCode: string | null;
  description: string | null;
  audience: string;
  basePrice: string;
  saleUnit: string;
  colorMode: string;
  sizeDisplayText: string | null;
  isFeatured: boolean;
  isActive: boolean;
  image?: {
    alt: string | null;
    url: string;
  } | null;
};

type ProductFormProps = {
  action: (
    previousState: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  buttonLabel: string;
  categories: ProductOption[];
  onSuccess?: (state: ProductFormState) => void;
  product?: ProductFormProduct;
};

type DraftVariant = {
  color: string;
  isActive: boolean;
  price: string;
  size: string;
  sku: string;
  stock: string;
};

type InventoryMode = "SIMPLE" | "VARIANTS";

const audiences = [
  { label: "Mujer", value: "WOMEN" },
  { label: "Hombre", value: "MEN" },
  { label: "Ninos", value: "KIDS" },
  { label: "Unisex", value: "UNISEX" },
];
const saleUnits = [
  { label: "Unidad", value: "UNIT" },
  { label: "Pack", value: "PACK" },
];
const colorModes = [
  { label: "Sin color", value: "NONE" },
  { label: "Colores por variante", value: "VARIANTS" },
  { label: "Consultar color", value: "ASK" },
  { label: "Colores surtidos", value: "ASSORTED" },
];

const colorModeDescriptions = [
  "Sin color: el producto no tiene seleccion de color.",
  "Colores por variante: el cliente elige color desde las variantes.",
  "Consultar color: el cliente consulta colores disponibles por mensaje.",
  "Colores surtidos: el producto se envia con colores surtidos.",
];

function fieldClassName() {
  return "rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
}

export function ProductForm({
  action,
  buttonLabel,
  categories,
  onSuccess,
  product,
}: ProductFormProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [selectedColorMode, setSelectedColorMode] = useState(
    product?.colorMode ?? "NONE",
  );
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>("SIMPLE");
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [simpleStock, setSimpleStock] = useState("10");
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [state, formAction, pending] = useActionState(
    action,
    initialProductFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.(state);
    }
  }, [onSuccess, state]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setImageError("");

    if (file && product?.image && !removeCurrentImage) {
      event.target.value = "";
      setImageError("Elimina la imagen actual antes de seleccionar otra.");
      return;
    }

    if (!file) {
      setImagePreviewUrl(null);
      return;
    }

    try {
      const compressedFile = await compressProductImage(file);
      const dataTransfer = new DataTransfer();

      dataTransfer.items.add(compressedFile);
      event.target.files = dataTransfer.files;

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }

      setImagePreviewUrl(URL.createObjectURL(compressedFile));
    } catch {
      event.target.value = "";
      setImagePreviewUrl(null);
      setImageError("No se pudo procesar la imagen seleccionada.");
    }
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        color: "",
        isActive: true,
        price: "",
        size: "",
        sku: "",
        stock: "10",
      },
    ]);
  }

  function updateVariant(index: number, changes: Partial<DraftVariant>) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...changes } : variant,
      ),
    );
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index));
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-4 overflow-hidden rounded-xl border p-3 sm:p-4">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      {product ? (
        <input
          name="removeExistingImage"
          type="hidden"
          value={removeCurrentImage ? "true" : "false"}
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Nombre
          <input
            className={fieldClassName()}
            defaultValue={product?.name}
            name="name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Codigo de modelo (opcional)
          <input
            className={fieldClassName()}
            defaultValue={product?.modelCode ?? ""}
            name="modelCode"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Categoria
        <select
          className={fieldClassName()}
          defaultValue={product?.categoryId ?? ""}
          name="categoryId"
          required
        >
          <option value="">Seleccionar categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <section className="grid min-w-0 gap-3 rounded-lg border bg-card p-3">
        <div className="space-y-1">
          <h4 className="font-semibold">Imagen del producto</h4>
          <p className="text-xs font-normal text-muted-foreground">
            Solo se guarda una imagen por producto. Para cambiarla, elimina la
            actual y selecciona una nueva.
          </p>
        </div>

        {product?.image && !removeCurrentImage ? (
          <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border p-2">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                alt={product.image.alt ?? product.name}
                className="object-cover"
                fill
                sizes="80px"
                src={product.image.url}
              />
            </div>
            <button
              className="cursor-pointer rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive"
              onClick={() => setRemoveCurrentImage(true)}
              type="button"
            >
              Eliminar imagen
            </button>
          </div>
        ) : null}

        <label className="grid min-w-0 gap-1 text-sm font-medium">
          {product?.image && !removeCurrentImage
            ? "Nueva imagen (primero elimina la actual)"
            : "Seleccionar imagen (opcional)"}
          <input
            accept="image/avif,image/jpeg,image/png,image/webp"
            className={fieldClassName()}
            name="image"
            onChange={handleImageChange}
            type="file"
          />
          <span className="text-xs font-normal text-zinc-500">
            Se comprime automaticamente antes de guardarla.
          </span>
          {imagePreviewUrl ? (
            <span
              aria-label="Vista previa de la imagen del producto"
              className="h-24 w-24 rounded-md border bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${imagePreviewUrl})` }}
            />
          ) : null}
          {imageError ? (
            <span className="text-xs font-normal text-red-600">
              {imageError}
            </span>
          ) : null}
        </label>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Audiencia
          <select
            className={fieldClassName()}
            defaultValue={product?.audience ?? "WOMEN"}
            name="audience"
            required
          >
            {audiences.map((audience) => (
              <option key={audience.value} value={audience.value}>
                {audience.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Precio base
          <input
            className={fieldClassName()}
            defaultValue={product?.basePrice}
            min="0"
            name="basePrice"
            placeholder="ej: 7000"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Unidad de venta
          <select
            className={fieldClassName()}
            defaultValue={product?.saleUnit ?? "UNIT"}
            name="saleUnit"
            required
          >
            {saleUnits.map((saleUnit) => (
              <option key={saleUnit.value} value={saleUnit.value}>
                {saleUnit.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Modo de color
          <select
            className={fieldClassName()}
            name="colorMode"
            onChange={(event) => {
              const nextColorMode = event.target.value;

              setSelectedColorMode(nextColorMode);

              if (nextColorMode !== "VARIANTS") {
                setVariants((current) =>
                  current.map((variant) => ({ ...variant, color: "" })),
                );
              }
            }}
            required
            value={selectedColorMode}
          >
            {colorModes.map((colorMode) => (
              <option key={colorMode.value} value={colorMode.value}>
                {colorMode.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-zinc-500">
            {colorModeDescriptions.join(" ")}
          </span>
        </label>

        <label className="grid gap-1 self-start text-sm font-medium">
          Talles disponibles
          <input
            className={fieldClassName()}
            defaultValue={product?.sizeDisplayText ?? ""}
            name="sizeDisplayText"
            placeholder="Ej: S a XL o 80/90"
          />
        </label>
      </div>

      {!product ? (
        <section className="grid gap-3 rounded-lg border bg-card p-3">
          <div className="space-y-1">
            <h4 className="font-semibold">Inventario</h4>
            <p className="text-sm text-muted-foreground">
              Elige si el producto tiene un stock general o variantes.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
              <input
                checked={inventoryMode === "SIMPLE"}
                name="inventoryMode"
                onChange={() => {
                  setInventoryMode("SIMPLE");
                  setIsVariantFormOpen(false);
                }}
                type="radio"
                value="SIMPLE"
              />
              <span>
                <span className="block font-medium">Producto simple</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Un solo stock para todo el producto.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
              <input
                checked={inventoryMode === "VARIANTS"}
                name="inventoryMode"
                onChange={() => {
                  setInventoryMode("VARIANTS");
                  setIsVariantFormOpen(true);
                }}
                type="radio"
                value="VARIANTS"
              />
              <span>
                <span className="block font-medium">Producto con variantes</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Stock separado por talle o color.
                </span>
              </span>
            </label>
          </div>

          <input name="variants" type="hidden" value={JSON.stringify(variants)} />

          {inventoryMode === "SIMPLE" ? (
            <label className="grid max-w-sm gap-1 text-sm font-medium">
              Stock
              <input
                className={fieldClassName()}
                min="0"
                name="simpleStock"
                onChange={(event) => setSimpleStock(event.target.value)}
                required
                step="1"
                type="number"
                value={simpleStock}
              />
              <span className="text-xs font-normal text-zinc-500">
                Se guardara como una variante general del producto.
              </span>
            </label>
          ) : (
            <div className="grid gap-3">
              <div className="space-y-1">
                <h4 className="font-semibold">Variantes</h4>
                <p className="text-sm text-muted-foreground">
                  Combina diferentes propiedades de tu producto. Ejemplo: color + tamaño.
                </p>
              </div>

              <details
                className="grid gap-3 rounded-lg border p-3"
                onToggle={(event) =>
                  setIsVariantFormOpen(event.currentTarget.open)
                }
                open={isVariantFormOpen}
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 text-primary">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary text-sm leading-none"
                  >
                    +
                  </span>
                  Crear variantes
                </summary>

                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Agrega talles, colores y stock para este producto.
                  </p>
                ) : (
                  <div className="grid gap-3">
                  {variants.map((variant, index) => (
                    <div className="grid gap-3 rounded-lg border p-3" key={index}>
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="grid gap-1 text-sm font-medium">
                      Talle
                      <input
                        className={fieldClassName()}
                        onChange={(event) =>
                          updateVariant(index, { size: event.target.value })
                        }
                        placeholder="S"
                        required
                        value={variant.size}
                      />
                    </label>

                    <label className="grid gap-1 text-sm font-medium">
                      Color
                      <input
                        className={fieldClassName()}
                        disabled={selectedColorMode !== "VARIANTS"}
                        onChange={(event) =>
                          updateVariant(index, { color: event.target.value })
                        }
                        placeholder="Negro"
                        required={selectedColorMode === "VARIANTS"}
                        value={variant.color}
                      />
                    </label>

                    <label className="grid gap-1 text-sm font-medium">
                      Stock
                      <input
                        className={fieldClassName()}
                        min="0"
                        onChange={(event) =>
                          updateVariant(index, { stock: event.target.value })
                        }
                        required
                        step="1"
                        type="number"
                        value={variant.stock}
                      />
                    </label>

                    <label className="grid gap-1 text-sm font-medium">
                      Precio especial (opcional)
                      <input
                        className={fieldClassName()}
                        min="0"
                        onChange={(event) =>
                          updateVariant(index, { price: event.target.value })
                        }
                        placeholder="Opcional"
                        step="0.01"
                        type="number"
                        value={variant.price}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="grid gap-1 text-sm font-medium">
                      SKU (opcional)
                      <input
                        className={fieldClassName()}
                        onChange={(event) =>
                          updateVariant(index, { sku: event.target.value })
                        }
                        placeholder="SKU unico"
                        value={variant.sku}
                      />
                    </label>

                    <button
                      className="self-end text-left text-sm font-medium text-red-600"
                      onClick={() => removeVariant(index)}
                      type="button"
                    >
                      Eliminar variante
                    </button>
                  </div>
                    </div>
                  ))}
                  </div>
                )}

                <button
                  className="w-full cursor-pointer rounded-md border px-4 py-2 text-sm font-medium text-foreground sm:w-fit"
                  onClick={addVariant}
                  type="button"
                >
                  Agregar otra variante
                </button>
              </details>
            </div>
          )}
        </section>
      ) : null}

      <label className="grid gap-1 text-sm font-medium">
        Descripcion
        <textarea
          className="min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          defaultValue={product?.description ?? ""}
          name="description"
        />
      </label>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={product?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Activo
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={product?.isFeatured ?? false}
            name="isFeatured"
            type="checkbox"
          />
          Destacado
        </label>
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error" ? "text-sm text-red-600" : "text-sm"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending || categories.length === 0}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
      </button>
    </form>
  );
}
