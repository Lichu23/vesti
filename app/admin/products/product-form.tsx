"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
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

export type ProductFormVariant = {
  id: string;
  color: string | null;
  isActive: boolean;
  price: string | null;
  size: string;
  sku: string | null;
  stock: number;
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
  variants: ProductFormVariant[];
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
  id?: string;
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

const colorModeDescriptions: Record<string, string> = {
  NONE: "El producto no tiene seleccion de color.",
  VARIANTS: "El cliente elige el color desde las variantes.",
  ASK: "El cliente consulta los colores disponibles por mensaje.",
  ASSORTED: "El producto se envia con colores surtidos.",
};

function createEmptyVariant(): DraftVariant {
  return {
    color: "",
    isActive: true,
    price: "",
    size: "",
    sku: "",
    stock: "10",
  };
}

function toDraftVariant(variant: ProductFormVariant): DraftVariant {
  return {
    color: variant.color ?? "",
    id: variant.id,
    isActive: variant.isActive,
    price: variant.price ?? "",
    size: variant.size,
    sku: variant.sku ?? "",
    stock: String(variant.stock),
  };
}

// Simple products are stored as a single uncolored "UNICO" variant.
function isSimpleProduct(product: ProductFormProduct) {
  const [only] = product.variants;

  return (
    product.variants.length === 1 &&
    only.size === "UNICO" &&
    !only.color &&
    product.colorMode !== "VARIANTS"
  );
}

function fieldClassName() {
  return "block w-full min-w-0 rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
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
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>(
    product && !isSimpleProduct(product) ? "VARIANTS" : "SIMPLE",
  );
  const [simpleStock, setSimpleStock] = useState(() =>
    String(product?.variants[0]?.stock ?? 10),
  );
  const [variants, setVariants] = useState<DraftVariant[]>(() =>
    product ? product.variants.map(toDraftVariant) : [],
  );
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
    setVariants((current) => [...current, createEmptyVariant()]);
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

  const isCreate = !product;
  const isVariantsMode = inventoryMode === "VARIANTS";
  const availableColorModes = isVariantsMode
    ? colorModes
    : colorModes.filter((colorMode) => colorMode.value !== "VARIANTS");
  const selectedColorModeDescription = colorModeDescriptions[selectedColorMode];

  function handleInventoryModeChange(nextMode: InventoryMode) {
    setInventoryMode(nextMode);

    if (nextMode === "VARIANTS") {
      setSelectedColorMode("VARIANTS");
      setVariants((current) =>
        current.length > 0 ? current : [createEmptyVariant()],
      );
      return;
    }

    if (selectedColorMode === "VARIANTS") {
      setSelectedColorMode("NONE");
    }
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-8">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      {product ? (
        <input name="inventoryMode" type="hidden" value={inventoryMode} />
      ) : null}
      {product ? (
        <input
          name="removeExistingImage"
          type="hidden"
          value={removeCurrentImage ? "true" : "false"}
        />
      ) : null}

      <FormSection title="Informacion basica">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid min-w-0 gap-1 text-sm font-medium">
            Nombre
            <input
              className={fieldClassName()}
              defaultValue={product?.name}
              name="name"
              required
            />
          </label>

          <label className="grid min-w-0 gap-1 text-sm font-medium">
            Codigo de modelo (opcional)
            <input
              className={fieldClassName()}
              defaultValue={product?.modelCode ?? ""}
              name="modelCode"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid min-w-0 gap-1 text-sm font-medium">
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

          <label className="grid min-w-0 gap-1 text-sm font-medium">
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
        </div>

        <label className="grid min-w-0 gap-1 text-sm font-medium">
          Descripcion (opcional)
          <textarea
            className={`${fieldClassName()} min-h-24`}
            defaultValue={product?.description ?? ""}
            name="description"
          />
        </label>
      </FormSection>

      <FormSection
        description={
          isCreate
            ? "Elige como se maneja el stock. El modo de color se ajusta segun esta eleccion."
            : undefined
        }
        title="Inventario y color"
      >
        {isCreate ? (
          <div
            aria-label="Tipo de producto"
            className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
            role="radiogroup"
          >
            {(
              [
                { hint: "Un solo stock", label: "Simple", value: "SIMPLE" },
                {
                  hint: "Stock por talle o color",
                  label: "Con variantes",
                  value: "VARIANTS",
                },
              ] as const
            ).map((option) => (
              <label
                className="flex min-h-12 cursor-pointer flex-col justify-center rounded-md px-3 py-2 text-center text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
                key={option.value}
              >
                <input
                  checked={inventoryMode === option.value}
                  className="sr-only"
                  name="inventoryMode"
                  onChange={() => handleInventoryModeChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="font-medium">{option.label}</span>
                <span className="text-xs opacity-80">{option.hint}</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <label className="grid min-w-0 gap-1 text-sm font-medium">
            Precio base
            <input
              className={fieldClassName()}
              defaultValue={product?.basePrice}
              inputMode="decimal"
              min="0"
              name="basePrice"
              placeholder="ej: 7000"
              required
              step="0.01"
              type="number"
            />
          </label>

          <label className="grid min-w-0 gap-1 text-sm font-medium">
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

          {!isVariantsMode ? (
            <label className="grid min-w-0 gap-1 text-sm font-medium">
              Stock
              <input
                className={fieldClassName()}
                inputMode="numeric"
                min="0"
                name="simpleStock"
                onChange={(event) => setSimpleStock(event.target.value)}
                required
                step="1"
                type="number"
                value={simpleStock}
              />
            </label>
          ) : null}

          <label className="grid min-w-0 gap-1 text-sm font-medium">
            Modo de color
            <select
              className={fieldClassName()}
              aria-describedby="color-mode-description"
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
              {availableColorModes.map((colorMode) => (
                <option key={colorMode.value} value={colorMode.value}>
                  {colorMode.label}
                </option>
              ))}
            </select>
          </label>

          {selectedColorModeDescription ? (
            <p
              className="col-span-2 -mt-1 text-xs text-muted-foreground"
              id="color-mode-description"
            >
              {selectedColorModeDescription}
            </p>
          ) : null}

          <label className="col-span-2 grid min-w-0 gap-1 text-sm font-medium">
            Talles disponibles (opcional)
            <input
              className={fieldClassName()}
              defaultValue={product?.sizeDisplayText ?? ""}
              name="sizeDisplayText"
              placeholder="Ej: S a XL o 80/90"
            />
          </label>
        </div>

        {isCreate || isVariantsMode ? (
          <input name="variants" type="hidden" value={JSON.stringify(variants)} />
        ) : null}

        {!isCreate && !isVariantsMode ? (
          <button
            className="w-full cursor-pointer rounded-md border border-dashed px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted/40 sm:w-fit"
            onClick={() => setInventoryMode("VARIANTS")}
            type="button"
          >
            Agregar talles o colores
          </button>
        ) : null}

        {isVariantsMode ? (
          <div className="grid gap-3">
            {variants.map((variant, index) => {
              return (
              <fieldset
                className="grid gap-3 rounded-lg border p-3"
                key={variant.id ?? `new-${index}`}
              >
                <legend className="px-1 text-xs font-medium text-muted-foreground">
                  Variante {index + 1}
                </legend>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <label className="grid min-w-0 gap-1 text-sm font-medium">
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

                  <label className="grid min-w-0 gap-1 text-sm font-medium">
                    Color
                    <input
                      className={`${fieldClassName()} disabled:opacity-50`}
                      disabled={selectedColorMode !== "VARIANTS"}
                      onChange={(event) =>
                        updateVariant(index, { color: event.target.value })
                      }
                      placeholder="Negro"
                      required={selectedColorMode === "VARIANTS"}
                      value={variant.color}
                    />
                  </label>

                  <label className="grid min-w-0 gap-1 text-sm font-medium">
                    Stock
                    <input
                      className={fieldClassName()}
                      inputMode="numeric"
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

                  <label className="grid min-w-0 gap-1 text-sm font-medium">
                    Precio especial
                    <input
                      className={fieldClassName()}
                      inputMode="decimal"
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

                <div className="grid gap-2">
                  <label className="grid min-w-0 gap-1 text-sm font-medium">
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

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {!isCreate ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          checked={variant.isActive}
                          onChange={(event) =>
                            updateVariant(index, {
                              isActive: event.target.checked,
                            })
                          }
                          type="checkbox"
                        />
                        Activa
                      </label>
                    ) : (
                      <span />
                    )}

                    {variants.length > 1 || !isCreate ? (
                      <button
                        className="cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-destructive hover:underline"
                        onClick={() => removeVariant(index)}
                        type="button"
                      >
                        Eliminar variante
                      </button>
                    ) : null}
                  </div>
                </div>
              </fieldset>
              );
            })}

            <button
              className="w-full cursor-pointer rounded-md border border-dashed px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted/40 sm:w-fit"
              onClick={addVariant}
              type="button"
            >
              + Agregar variante
            </button>
          </div>
        ) : null}
      </FormSection>

      <FormSection
        description="Solo se guarda una imagen por producto. Se comprime automaticamente."
        title="Imagen"
      >
        {product?.image && !removeCurrentImage ? (
          <div className="flex min-w-0 flex-wrap items-center gap-3">
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
          {imagePreviewUrl ? (
            <span
              aria-label="Vista previa de la imagen del producto"
              className="mt-2 h-24 w-24 rounded-md border bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${imagePreviewUrl})` }}
            />
          ) : null}
          {imageError ? (
            <span className="text-xs font-normal text-destructive">
              {imageError}
            </span>
          ) : null}
        </label>
      </FormSection>

      <FormSection title="Visibilidad">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
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
      </FormSection>

      <div className="sticky bottom-0 -mx-3 -mb-3 grid gap-2 border-t bg-white px-3 py-3 sm:-mx-5 sm:-mb-5 sm:px-5">
        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm text-destructive"
                : "text-sm"
            }
          >
            {state.message}
          </p>
        ) : null}

        <button
          className="w-full cursor-pointer rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:justify-self-end"
          disabled={pending || categories.length === 0}
          type="submit"
        >
          {pending ? "Guardando..." : buttonLabel}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="grid min-w-0 gap-3">
      <div className="border-b pb-2">
        <h4 className="text-base font-semibold">{title}</h4>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
