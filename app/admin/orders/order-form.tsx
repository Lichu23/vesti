"use client";

import { useActionState, useEffect, useState } from "react";

import type { OrderFormState } from "@/app/admin/orders/actions";

type OrderVariantOption = {
  id: string;
  label: string;
  stock: number;
};

type OrderFormOrder = {
  customerName: string;
  customerPhone: string;
  id: string;
  items: {
    id: string;
    quantity: number;
    variantId: string;
  }[];
  notes: string | null;
};

type OrderFormProps = {
  action: (
    previousState: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  buttonLabel?: string;
  onSuccess?: () => void;
  order?: OrderFormOrder;
  variants: OrderVariantOption[];
};

type OrderItemRow = {
  id: number;
  item: OrderFormOrder["items"][number] | null;
};

const initialState: OrderFormState = {
  message: "",
  status: "idle",
};

export function OrderForm({
  action,
  buttonLabel = "Crear pedido",
  onSuccess,
  order,
  variants,
}: OrderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialRows: OrderItemRow[] =
    order && order.items.length > 0
      ? order.items.map((item, index) => ({
          id: index,
          item,
        }))
      : [{ id: 0, item: null }];
  const [itemRows, setItemRows] = useState(initialRows);
  const [selectedVariantIdsByRow, setSelectedVariantIdsByRow] = useState<
    Record<number, string>
  >(
    Object.fromEntries(
      initialRows.map((row) => [row.id, row.item?.variantId ?? ""]),
    ),
  );
  const selectedVariantIds = new Set(
    Object.values(selectedVariantIdsByRow).filter(Boolean),
  );
  const variantsById = new Map(
    variants.map((variant) => [variant.id, variant]),
  );
  const selectableVariantCount = variants.filter(
    (variant) => variant.stock > 0,
  ).length;
  const disabled = pending || variants.length === 0;
  const canAddItemRow =
    !disabled && selectedVariantIds.size < selectableVariantCount;

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  function addItemRow() {
    setItemRows((currentRows) => [
      ...currentRows,
      {
        id: Math.max(...currentRows.map((row) => row.id)) + 1,
        item: null,
      },
    ]);
  }

  function removeItemRow(rowId: number) {
    setItemRows((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((itemRow) => itemRow.id !== rowId),
    );
    setSelectedVariantIdsByRow((currentValues) => {
      const nextValues = { ...currentValues };
      delete nextValues[rowId];
      return nextValues;
    });
  }

  function updateItemRowVariant(rowId: number, variantId: string) {
    setSelectedVariantIdsByRow((currentValues) => ({
      ...currentValues,
      [rowId]: variantId,
    }));
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-xl border p-3 sm:p-4">
      {order ? <input name="orderId" type="hidden" value={order.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Nombre del cliente
          <input
            className="rounded-md border px-3 py-2 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            defaultValue={order?.customerName}
            name="customerName"
            placeholder="Nombre"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Telefono
          <input
            className="rounded-md border px-3 py-2 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            defaultValue={order?.customerPhone}
            name="customerPhone"
            placeholder="5491123456789"
            required
          />
        </label>
      </div>

      <input name="status" type="hidden" value="REVIEWING" />

      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
        <span>Estado del pago:</span>
        <span className="font-medium text-zinc-900">Pendiente</span>
        <span className="group relative inline-flex">
          <button
            aria-label="Informacion sobre el estado del pago"
            className="flex size-5 cursor-pointer items-center justify-center rounded-full border text-xs font-semibold text-zinc-500"
            type="button"
          >
            i
          </button>
          <span className="pointer-events-none absolute left-0 top-7 z-10 hidden w-64 rounded-md border bg-white p-3 text-left text-xs leading-5 text-zinc-600 shadow-lg group-focus-within:block group-hover:block">
            El pedido se crea como pendiente. Cuando confirmes el pedido, el
            stock se descuenta automaticamente.
          </span>
        </span>
      </div>

      <label className="grid gap-1 text-sm">
        Notas
        <textarea
          className="min-h-24 rounded-md border px-3 py-2 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          defaultValue={order?.notes ?? ""}
          name="notes"
          placeholder="Datos del chat, envio o comentarios"
        />
      </label>

      <section className="grid gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold">Items</h3>
          <p className="text-sm text-zinc-600">
            Agrega los productos necesarios. El precio se calcula desde la base
            de datos y el stock no se descuenta todavia.
          </p>
        </div>

        {itemRows.map((row) => {
          const selectedVariant = variantsById.get(
            selectedVariantIdsByRow[row.id] ?? "",
          );

          return (
            <div
              className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
              key={row.id}
            >
              <label className="grid gap-1 text-sm">
                Producto y variante
                <select
                  className="rounded-md border px-3 py-2 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  name="variantId"
                  onChange={(event) =>
                    updateItemRowVariant(row.id, event.target.value)
                  }
                  required
                  value={selectedVariantIdsByRow[row.id] ?? ""}
                >
                  <option value="">Seleccionar</option>
                  {variants.map((variant) => (
                    <option
                      disabled={
                        variant.stock <= 0 ||
                        (selectedVariantIds.has(variant.id) &&
                          selectedVariantIdsByRow[row.id] !== variant.id)
                      }
                      key={variant.id}
                      value={variant.id}
                    >
                      {variant.label} - Stock {variant.stock}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Cantidad
                <input
                  className="rounded-md border px-3 py-2 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  defaultValue={row.item?.quantity ?? 1}
                  max={selectedVariant?.stock}
                  min="1"
                  name="quantity"
                  required
                  type="number"
                />
              </label>
              {itemRows.length > 1 ? (
                <button
                  className="h-fit w-full cursor-pointer self-end rounded-md border px-3 py-2 text-sm sm:w-auto"
                  onClick={() => removeItemRow(row.id)}
                  type="button"
                >
                  Quitar
                </button>
              ) : null}
            </div>
          );
        })}

        <button
          className="w-full cursor-pointer rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed sm:w-fit"
          disabled={!canAddItemRow}
          onClick={addItemRow}
          type="button"
        >
          Agregar producto
        </button>
      </section>

      {state.message ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {variants.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Crea productos con variantes activas antes de cargar pedidos.
        </p>
      ) : null}

      <button
        className="w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
        disabled={disabled}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
      </button>
    </form>
  );
}
