import type { ReactNode } from "react";

import {
  BoxIcon,
  CategoryIcon,
  DashboardIcon,
  OrdersIcon,
  SettingsIcon,
  type AdminSection,
} from "@/app/admin/admin-ui";

export const adminNavItems: {
  href: string;
  icon: ReactNode;
  label: string;
  section: AdminSection;
}[] = [
  { href: "/admin", icon: <DashboardIcon />, label: "Dashboard", section: "dashboard" },
  { href: "/admin/products", icon: <BoxIcon />, label: "Productos", section: "products" },
  { href: "/admin/categories", icon: <CategoryIcon />, label: "Categorias", section: "categories" },
  { href: "/admin/orders", icon: <OrdersIcon />, label: "Pedidos", section: "orders" },
  { href: "/admin/settings", icon: <SettingsIcon />, label: "Configuracion", section: "settings" },
];

export function getActiveAdminSection(pathname: string): AdminSection {
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}
