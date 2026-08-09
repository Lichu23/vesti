# Development Tracker

## Project Rules

- [x] Application language is Spanish for UI, admin panel, WhatsApp messages, emails, and customer-facing content. Documentation and codebase remain in English unless a specific artifact requires Spanish.
- [x] Do not use accent marks in UI copy, admin content, WhatsApp messages, emails, docs, seeds, or identifiers unless an external legal/source text must be preserved exactly.


## Phase 1

-   [x] Initialize project
-   [x] CI
-   [x] Database
-   [x] Authentication

Branch: feature/bootstrap

## Phase 2 Catalog

-   [x] Categories CRUD
-   [x] Brands
-   [x] Products CRUD
-   [x] Images
-   [x] Dynamic categories

Branches: feat/categories feat/brands feat/products
feature/product-images feature/dynamic-categories

## Phase 3 Variants

-   [x] Product variants
-   [ ] Size guides
-   [x] Color modes
-   [x] Inventory

Branches: feature/product-variants feature/size-guides feature/inventory

## Phase 4 Storefront

-   [x] Home
-   [x] Audience pages
-   [ ] Category pages
-   [ ] Product page
-   [x] Size/variant selector on product cards
-   [x] Cart
-   [x] WhatsApp cart handoff

Branches: feat/storefront feat/cart feat/storefront-variant-selector feat/storefront-audience-pages

## Phase 5 Orders

-   [x] Admin manual order creation
-   [x] Admin order list/detail
-   [x] Admin order editing
-   [x] Confirm order
-   [x] Inventory deduction

Decision: storefront checkout should not require a customer form before WhatsApp. The customer sends the cart through WhatsApp first, then the store creates or completes the internal order manually in admin using the WhatsApp conversation data.

Order flow:

1. Customer adds products to cart.
2. Customer clicks `Consultar pedido`.
3. Storefront opens WhatsApp with cart items, quantities, variants, and total.
4. No internal order is created from the storefront at this step.
5. Admin creates the order manually from the WhatsApp conversation.
6. Inventory is deducted only when the order is confirmed.

Branches: feat/whatsapp-handoff feat/admin-orders feat/order-confirmation feat/order-editing

## Phase 6 Admin

-   [ ] Dashboard
-   [ ] Settings
-   [ ] Store configuration

Branch: feature/admin

## Phase 7 Future

-   Checkout
-   Payments
-   Shipping
-   Multi-tenancy onboarding
