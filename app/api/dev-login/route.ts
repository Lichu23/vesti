import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

// Local-development shortcut that signs in without Google OAuth.
// Disabled unless NODE_ENV is "development" AND DEV_LOGIN_ENABLED=true.
const sessionCookieName = "authjs.session-token";
const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.DEV_LOGIN_ENABLED !== "true"
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = (
    request.nextUrl.searchParams.get("email") ?? "dev@local.test"
  )
    .trim()
    .toLowerCase();

  const store = await prisma.store.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
    where: { isActive: true },
  });

  if (!store) {
    return new NextResponse(
      "No store in the dev database. Run `pnpm db:seed:dev <email>` first.",
      { status: 409 },
    );
  }

  const user = await prisma.user.upsert({
    create: { email, name: "Dev Admin", role: "OWNER", storeId: store.id },
    select: { id: true },
    update: { role: "OWNER", storeId: store.id },
    where: { email },
  });

  const expires = new Date(Date.now() + sessionMaxAgeMs);
  const sessionToken = randomUUID();

  await prisma.session.create({
    data: { expires, sessionToken, userId: user.id },
  });

  const response = NextResponse.redirect(new URL("/admin", request.url));

  response.cookies.set(sessionCookieName, sessionToken, {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
  });

  return response;
}
