import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      storeId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    storeId: string | null;
  }
}
