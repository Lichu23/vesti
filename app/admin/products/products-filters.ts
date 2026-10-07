// Shared by the products page (server) and its filter components (client).

export type ProductSort = "" | "price-asc" | "price-desc";
export type ProductStockFilter = "" | "bajo";

export const PRODUCT_SORT_OPTIONS: { label: string; value: ProductSort }[] = [
  { label: "Nombre (A-Z)", value: "" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
];

export function parseProductSort(value?: string): ProductSort {
  return value === "price-asc" || value === "price-desc" ? value : "";
}

export function parseProductStockFilter(value?: string): ProductStockFilter {
  return value === "bajo" ? "bajo" : "";
}

export function buildProductsUrl(
  pathname: string,
  filters: {
    categoryId?: string;
    query?: string;
    sort?: ProductSort;
    stock?: ProductStockFilter;
  },
) {
  const params = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) params.set("buscar", query);
  if (filters.categoryId) params.set("categoria", filters.categoryId);
  if (filters.sort) params.set("ordenar", filters.sort);
  if (filters.stock) params.set("stock", filters.stock);

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}
