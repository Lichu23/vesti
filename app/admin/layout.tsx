import { AdminNavigation } from "@/app/admin/admin-navigation";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminNavigation>{children}</AdminNavigation>;
}
