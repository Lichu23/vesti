import { notFound } from "next/navigation";

import { AdminShell, SettingsIcon } from "@/app/admin/admin-ui";
import { ConfirmActionForm } from "@/app/admin/confirm-action-form";
import {
  createStoreInvite,
  removeStoreAdmin,
  removeStoreInvite,
  updateStoreSettings,
} from "@/app/admin/settings/actions";
import { StoreInviteForm } from "@/app/admin/settings/store-invite-form";
import { StoreSettingsForm } from "@/app/admin/settings/store-settings-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const isOwner = session.user.role === "OWNER";

  if (!storeId) {
    return null;
  }

  const [store, users, invites] = await Promise.all([
    prisma.store.findUnique({
      select: {
        isActive: true,
        name: true,
        slug: true,
        whatsapp: true,
      },
      where: {
        id: storeId,
      },
    }),
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { email: "asc" }],
      select: {
        email: true,
        id: true,
        name: true,
        role: true,
      },
      where: {
        storeId,
      },
    }),
    prisma.storeInvite.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        role: true,
      },
      where: {
        acceptedAt: null,
        storeId,
      },
    }),
  ]);

  if (!store) {
    notFound();
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[admin settings]", {
      loadedInvites: invites.length,
      loadedUsers: users.length,
    });
  }

  return (
    <AdminShell>
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.36em] text-muted-foreground">
          Configuracion
        </p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
          Configuracion de tienda
        </h1>
        <p className="text-lg text-muted-foreground">
          Ajusta los datos minimos para entregar el MVP y operar por WhatsApp.
        </p>
      </header>

      <section className="grid gap-5">
        <div className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <SettingsIcon />
            <h2 className="font-serif text-3xl text-foreground">
              Datos principales
            </h2>
          </div>
          {isOwner ? (
            <StoreSettingsForm action={updateStoreSettings} store={store} />
          ) : (
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p>
                Solo el owner puede editar la configuracion principal de la
                tienda.
              </p>
              <p>Nombre: {store.name}</p>
              <p>Slug: {store.slug}</p>
              <p>WhatsApp: {store.whatsapp ?? "Sin configurar"}</p>
              <p>Estado: {store.isActive ? "Activa" : "Inactiva"}</p>
            </div>
          )}
        </div>

      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 space-y-1">
            <h2 className="font-serif text-3xl text-foreground">
              Accesos actuales
            </h2>
            <p className="text-sm text-muted-foreground">
              Usuarios que ya pueden entrar al admin de esta tienda.
            </p>
          </div>

          <div className="grid gap-3">
            {users.map((user) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-background p-4"
                key={user.id}
              >
                <div>
                  <p className="font-medium text-foreground">
                    {user.name || user.email || "Usuario sin nombre"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.email} - {user.role === "OWNER" ? "Owner" : "Admin"}
                  </p>
                </div>
                {isOwner &&
                user.role === "ADMIN" &&
                user.id !== session.user.id ? (
                  <ConfirmActionForm
                    action={removeStoreAdmin}
                    buttonClassName="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-destructive hover:text-destructive"
                    buttonContent="Quitar acceso"
                    confirmMessage={`¿Quitar el acceso de ${user.name || user.email || "este usuario"}? Debera recibir una nueva invitacion para volver a entrar.`}
                    fields={{ userId: user.id }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid h-fit gap-5">
          {isOwner ? <StoreInviteForm action={createStoreInvite} /> : null}

          <div className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 space-y-1">
              <h2 className="font-serif text-3xl text-foreground">
                Invitaciones pendientes
              </h2>
              <p className="text-sm text-muted-foreground">
                Se activan cuando ese Gmail inicia sesion con Google.
              </p>
            </div>

            {invites.length ? (
              <div className="grid gap-3">
                {invites.map((invite) => (
                  <div
                    className="grid gap-3 rounded-[4px] border border-border bg-background p-4"
                    key={invite.id}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {invite.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invite.role === "OWNER" ? "Owner" : "Admin"} -{" "}
                        {invite.createdAt.toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    {isOwner ? (
                      <form action={removeStoreInvite}>
                        <input name="inviteId" type="hidden" value={invite.id} />
                        <button
                          className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-destructive hover:text-destructive"
                          type="submit"
                        >
                          Cancelar invitacion
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay invitaciones pendientes.
              </p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
