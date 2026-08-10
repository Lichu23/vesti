import { notFound } from "next/navigation";

import { AdminShell, SettingsIcon, StoreIcon } from "@/app/admin/admin-ui";
import { updateStoreSettings } from "@/app/admin/settings/actions";
import { StoreSettingsForm } from "@/app/admin/settings/store-settings-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const store = await prisma.store.findUnique({
    select: {
      isActive: true,
      name: true,
      slug: true,
      whatsapp: true,
    },
    where: {
      id: storeId,
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <AdminShell activeSection="settings">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.36em] text-muted-foreground">
          Configuracion
        </p>
        <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          Configuracion de tienda
        </h1>
        <p className="text-lg text-muted-foreground">
          Ajusta los datos minimos para entregar el MVP y operar por WhatsApp.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="rounded-[4px] border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <SettingsIcon />
            <h2 className="font-serif text-3xl text-foreground">
              Datos principales
            </h2>
          </div>
          <StoreSettingsForm action={updateStoreSettings} store={store} />
        </div>

        <aside className="grid h-fit gap-4 rounded-[4px] border border-border bg-card p-6">
          <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
            <StoreIcon />
          </div>
          <h2 className="font-serif text-3xl text-foreground">
            Antes de entregar
          </h2>
          <ul className="grid gap-3 text-sm text-muted-foreground">
            <li>Verifica que el nombre sea el de la tienda real.</li>
            <li>Confirma que el WhatsApp recibe el resumen del carrito.</li>
            <li>Manten la tienda activa si el catalogo ya esta listo.</li>
          </ul>
        </aside>
      </section>
    </AdminShell>
  );
}
