# Thoemia Intimo Design Guide

Design rules for the storefront and admin UI. The application UI is Spanish for customers and admins, but project documentation stays in English. UI examples in this document intentionally avoid accent marks to follow the project accent policy.

## Brand direction

Thoemia Intimo should feel soft, warm, calm, editorial, and premium. The interface should feel like refined lingerie packaging, not a generic ecommerce template.

## Color system

Use semantic tokens only. Do not use direct colors like `text-white` or `bg-black` in new UI.

| Token | Use |
| --- | --- |
| `background` | Main cream app background |
| `foreground` | Main slate text and icons |
| `primary` | Buttons, active states, cart badge |
| `primary-foreground` | Text on primary |
| `card` | Cards, header, inputs |
| `muted` | Soft image placeholders and subtle backgrounds |
| `muted-foreground` | Secondary text, labels, metadata |
| `secondary` | Active nav chips and soft icon backgrounds |
| `accent` | Stock badge and soft highlights |
| `border` / `input` | Dividers and form borders |
| `destructive` | Delete actions and `Sin stock` only |

Rules:

- Default pairing is cream background with slate text.
- Slate is reserved for actions and active states.
- Red/destructive appears only for delete actions and `Sin stock`.
- Keep contrast at AA level when changing backgrounds.
- Avoid gradients, neon shadows, and glow effects.

## Typography

Use two font families maximum:

| Family | Role |
| --- | --- |
| Cormorant Garamond | Wordmark, headings, prices, highlighted numbers |
| Jost | UI text, labels, buttons, tables, descriptions |

Rules:

- Section headings and prices use serif.
- Body and UI use Jost with comfortable line height.
- Labels and metadata use uppercase, small size, and wide letter spacing.
- Body text should not go below 14px.

## Shape, spacing, and actions

- Cards, inputs, and tables use small radius, around `4px`.
- Buttons, chips, badges, search, and select controls use pill shapes.
- Actionable elements must use `cursor-pointer`.
- Disabled controls must use `cursor-not-allowed` and a muted visual state.
- Use generous Tailwind spacing with `gap`, `px`, and `py` scales.
- Build mobile-first, then enhance for wider screens.

## Product images

- Product photos should be flat-lay, soft light, cream background, and neutral tones.
- Product image containers are square with `aspect-square`.
- If no product image exists, show a quiet `Sin imagen` placeholder.

## Storefront Home

Before implementing or changing the Home page, inspect `docs/home.png`. Use it as the primary visual reference for structure, hierarchy, spacing, and composition.

### Header

- Sticky header with subtle background blur.
- Left: wordmark linking to Home.
- Desktop: highlighted category links and `Ver todo`.
- Search input in the header on desktop/tablet.
- Cart button on the right. Cart behavior is not implemented in the Home slice.

### Desktop layout

Use a three-column catalog layout only on wide desktop screens:

1. Left sidebar: `Colecciones` category navigation.
2. Center: page title, product count, and product grid.
3. Right sidebar: `Ordenar por` links.

The full three-column layout starts at `xl` to avoid broken tablet/mobile widths.

### Mobile layout

Do not use horizontal category pills for the product-list filters. Dynamic category lists can overflow and crowd the viewport.

Use:

- Debounced realtime search.
- A category `select`.
- A sort `select`.
- One `Aplicar filtros` button.

Search updates automatically with debounce. Category and sort use deliberate apply behavior on mobile.

### Product card

- Card has subtle border and small radius.
- Image area is square.
- Hover may tint the border and slightly zoom the image on pointer devices.
- Show product name in serif.
- Show `Talle`, optional description, and ARS price.
- Price displays from `Product.basePrice` so visual price sorting matches the rendered price.
- Add button is circular and uses `primary`.
- If active variant stock total is zero, show `Sin stock` overlay and disable the add button.

## Storefront Cart

Before implementing or changing the Cart UI, inspect both references:

- `docs/cart-mobile.png`
- `docs/cart-desktop.png`

Use the cart as a right-side drawer on desktop and a full-width panel on mobile.

### Cart structure

- Background page dims while the cart is open.
- Header uses `Mi carrito` and a close action.
- Items show product image, name, quantity marker, `Talle`, optional `Color`, quantity stepper, remove action, and line subtotal.
- Footer stays anchored at the bottom with `Total`, `Consultar pedido`, and `Vaciar carrito`.
- Quantity controls must not go below `1` or above available stock.
- Empty cart state uses quiet Spanish no-accent copy.
- `Consultar pedido` opens WhatsApp with the cart items, variants, quantities, and total. It does not create an internal order.

## Content and language

- UI copy is Spanish, Argentina/Rioplatense vocabulary, without accent marks.
- Examples: `Bombachas`, `Corpinos`, `Conjuntos`, `Talle`, `Sin stock`, `Agregar al carrito`.
- Prices use ARS formatting with no decimals, like `$ 7.000`.
- Products without a price should eventually show `Consultar`.

## Accessibility

- Controls need clear `aria-label` values.
- Focus states must be visible.
- Images need descriptive alt text or equivalent accessible labels.
- Touch targets should be at least around 40px.
- Disabled buttons need both visual and cursor feedback.

## Checklist

- [ ] Cream background and slate text use semantic tokens.
- [ ] Cormorant is used for headings/prices and Jost for UI.
- [ ] Cards have small radius; actions use pill/circular shapes.
- [ ] Actionable elements use `cursor-pointer`.
- [ ] Disabled controls use `cursor-not-allowed`.
- [ ] Home follows `docs/home.png`.
- [ ] Desktop uses three columns only at wide `xl` size.
- [ ] Mobile uses search + category select + sort select + `Aplicar filtros`.
- [ ] Product cards show Spanish no-accent copy and ARS prices.
- [ ] Stock state is based on active variant stock.
- [ ] Cart follows `docs/cart-mobile.png` and `docs/cart-desktop.png`.
