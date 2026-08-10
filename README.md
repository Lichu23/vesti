# Thoemia Intimo

Thoemia Intimo is a boutique e-commerce MVP for clothing stores. The first store is **Thoemia Intimo**, but the codebase is structured around store ownership, admin access, products, inventory, orders, and future multi-store growth.

The app is not a generic storefront template. It models the real selling flow for a small clothing business: customers browse products, build a cart, send the order through WhatsApp, and the store owner confirms stock before the order becomes final.

## What this repository contains

This repository contains the full storefront and admin system for the MVP:

- Storefront product browsing
- Dynamic categories and audience filters
- Product variants with size, color, price override, stock, and SKU
- Product image management through Supabase Storage
- Cart flow with WhatsApp order handoff
- Admin dashboard
- Product, category, order, and inventory management
- Owner/admin access control
- Store invite flow for handing off ownership or inviting admins
- Production deployment requirements and development tracker docs

## Product flow

Customers browse active products, add available variants to the cart, and send the order summary to the store through WhatsApp.

Orders are created internally before the WhatsApp redirect. The admin can review and edit pending orders, then confirm them. Stock is deducted only when an order is confirmed, not when the customer first submits the cart.

## Admin model

The admin area separates store operation from platform ownership:

- `OWNER` can manage store settings and invite or remove admins.
- `ADMIN` can manage operational areas such as products, orders, and inventory.

Store access is handled through invites. An owner invites a Gmail account, and when that person signs in with Google, the app links the user to the correct store and role.

## Technical shape

The app uses:

- Next.js App Router
- React Server Components and Server Actions
- Prisma with PostgreSQL
- Supabase for database and product image storage
- Auth.js with Google login
- Vercel-oriented production deployment

The database schema is centered on stores, users, categories, products, variants, inventory movements, orders, and store invites.

## Current MVP boundary

Included in the MVP:

- Product catalog
- Cart
- WhatsApp order handoff
- Admin dashboard
- Inventory management
- Order review and confirmation
- Owner/admin handoff flow

Not included yet:

- Online payments
- Shipping integrations
- Coupons
- Customer accounts
- Automated multi-store onboarding

