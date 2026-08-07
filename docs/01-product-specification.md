# Product Specification

> **Application language:** Spanish (UI, admin panel, WhatsApp messages,
> emails and customer-facing content). Documentation and codebase are
> written in English.

## Vision

Build a modern e-commerce platform for clothing stores. The first tenant
is **Thoemia Íntimo**, but the architecture is designed to support
multiple stores in the future.

## MVP

-   Browse products
-   Cart
-   Internal order creation
-   Redirect customer to WhatsApp with the order summary
-   Admin dashboard
-   Inventory management
-   No online checkout yet

## Domain Model

### Audience

-   Women
-   Men
-   Kids
-   Unisex

### Categories

Categories are **dynamic**, not hardcoded.

Examples: - Bombachas - Bras - Sets - Body - Clothing - Boxers - Slips -
Socks - T-Shirts

### Product

Fields: - Name - Slug - Brand - Model Code (optional) - Description -
Audience - Category - Base Price - Sale Unit (Unit / Pack) - Pack
Quantity - Color Mode - Size Display Text - Featured - Active

### Variants

Every product internally uses variants.

Variant fields: - Size (string) - Color (optional) - Stock - Active -
SKU (optional) - Price Override (optional)

Examples: - Unique size - 85 / Black - XL / White - S

### Color Modes

-   NONE
-   VARIANTS
-   ASK (consult available colors)
-   ASSORTED (mixed colors)

### Sale Units

-   UNIT
-   PACK

### Size Guides

Support configurable size guides. Initial implementation can use one
guide imported from Thoemia.

## Inventory

Stock is always stored per variant.

Product visibility: - Active + Stock 0 = visible with "Out of Stock" -
Inactive = hidden

## Orders

Flow: 1. Customer adds products. 2. Internal order is created. 3.
Customer is redirected to WhatsApp. 4. Admin reviews order. 5. Admin can
edit items. 6. Admin confirms order. 7. Stock is deducted only after
confirmation.

## Future

-   Checkout
-   Payments
-   Shipping
-   Coupons
-   Multi-tenant onboarding
