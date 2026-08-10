import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

async function acceptPendingStoreInvite({
  email,
  storeId,
  userId,
}: {
  email: string | null | undefined;
  storeId: string | null | undefined;
  userId: string;
}) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || storeId) {
    return;
  }

  const invite = await prisma.storeInvite.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      role: true,
      storeId: true,
    },
    where: {
      acceptedAt: null,
      email: normalizedEmail,
    },
  });

  if (!invite) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const claimedInvite = await tx.storeInvite.updateMany({
      data: {
        acceptedAt: new Date(),
      },
      where: {
        acceptedAt: null,
        id: invite.id,
      },
    });

    if (claimedInvite.count !== 1) {
      return;
    }

    await tx.user.update({
      data: {
        role: invite.role,
        storeId: invite.storeId,
      },
      where: {
        id: userId,
      },
    });
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.storeId = user.storeId;

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await acceptPendingStoreInvite({
        email: user.email,
        storeId: user.storeId,
        userId: user.id,
      });
    },
  },
});
