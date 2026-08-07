# Technology & Architecture

> UI language: Spanish.

## Stack

-   Next.js App Router
-   TypeScript
-   Node.js
-   PostgreSQL
-   Prisma
-   NextAuth/Auth.js
-   TailwindCSS
-   shadcn/ui
-   React Hook Form
-   Zod
-   TanStack Query
-   UploadThing or S3 compatible storage

## Architecture

Feature-based architecture.

apps/ - web

Modules - auth - catalog - categories - brands - products - variants -
inventory - cart - orders - admin - media - settings

## Database

Core entities: - Store - User - Category - Product - ProductVariant -
ProductImage - Order - OrderItem - InventoryMovement - SizeGuide

## Multi-tenant Ready

Every business entity contains storeId from day one.

## Product Design Decisions

-   Categories are dynamic.
-   Audience is independent from category.
-   Brand stored separately.
-   Model code supported.
-   Packs supported.
-   Variants always exist.
-   Color mode supports ASK and ASSORTED.
