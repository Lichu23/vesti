-- CreateTable
CREATE TABLE "StoreInvite" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreInvite_storeId_email_key" ON "StoreInvite"("storeId", "email");

-- CreateIndex
CREATE INDEX "StoreInvite_email_acceptedAt_idx" ON "StoreInvite"("email", "acceptedAt");

-- CreateIndex
CREATE INDEX "StoreInvite_storeId_acceptedAt_idx" ON "StoreInvite"("storeId", "acceptedAt");

-- AddForeignKey
ALTER TABLE "StoreInvite" ADD CONSTRAINT "StoreInvite_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row-Level Security
-- The app accesses invite data through server-side Prisma with database credentials.
-- No public Supabase API policies are added yet, so anon/authenticated API access is denied by default.
ALTER TABLE "StoreInvite" ENABLE ROW LEVEL SECURITY;
