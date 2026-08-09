"use client";

import { useActionState, useState } from "react";

import type { OrderFormState } from "@/app/admin/orders/actions";

type OrderVariantOption = {
  id: string;
  label: string;
  stock: number;
};

type OrderFormProps = {
  action: (
    previousState: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  variants: OrderVariantOption[];
};

const initialState: OrderFormState = {
  message: "",
  status: "idle",
};

export function OrderForm({ action, variants }: OrderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [itemRows, setItemRows] = useState([0]);
  const [selectedVariantIdsByRow, setSelectedVariantIdsByRow] = useState<
    Record<number, string>
  >({});
  const selectedVariantIds = new Set(
    Object.values(selectedVariantIdsByRow).filter(Boolean),
  );
  const disabled = pending || variants.length === 0;
  const canAddItemRow = !disabled && selectedVariantIds.size < variants.length;

  function addItemRow() {
    setItemRows((currentRows) => [
      ...currentRows,
      Math.max(...currentRows) + 1,
    ]);
  }

  function removeItemRow(rowId: number) {
    setItemRows((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((itemRow) => itemRow !== rowId),
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
    <form action={formAction} className="grid gap-4 rounded-xl border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Nombre del cliente
          <input
            className="rounded-md border px-3 py-2"
            name="customerName"
            placeholder="Nombre"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Telefono
          <input
            className="rounded-md border px-3 py-2"
            name="customerPhone"
            placeholder="5491123456789"
            required
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Estado del pago
        <select
          className="rounded-md border px-3 py-2"
          defaultValue="REVIEWING"
          name="status"
        >
          <option value="REVIEWING">Pendiente</option>
          <option value="CONFIRMED">Completado</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        Notas
        <textarea
          className="min-h-24 rounded-md border px-3 py-2"
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

        {itemRows.map((rowId) => (
          <div
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
            key={rowId}
          >
            <label className="grid gap-1 text-sm">
              Producto y variante
              <select
                className="rounded-md border px-3 py-2"
                name="variantId"
                onChange={(event) =>
                  updateItemRowVariant(rowId, event.target.value)
                }
                value={selectedVariantIdsByRow[rowId] ?? ""}
              >
                <option value="">Seleccionar</option>
                {variants.map((variant) => (
                  <option
                    disabled={
                      selectedVariantIds.has(variant.id) &&
                      selectedVariantIdsByRow[rowId] !== variant.id
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
                className="rounded-md border px-3 py-2"
                min="1"
                name="quantity"
                placeholder="0"
                type="number"
              />
            </label>
            {itemRows.length > 1 ? (
              <button
                className="h-fit self-end rounded-md border px-3 py-2 text-sm"
                onClick={() => removeItemRow(rowId)}
                type="button"
              >
                Quitar
              </button>
            ) : null}
          </div>
        ))}

        <button
          className="w-fit rounded-md border px-3 py-2 text-sm font-medium"
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
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        type="submit"
      >
        {pending ? "Creando..." : "Crear pedido"}
      </button>
    </form>
  );
}
