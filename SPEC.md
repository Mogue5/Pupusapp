# Pupusapp — Product Specification

## Overview

Digital pupusa order sheet. Solves two problems:
1. **Ordering from home** (phone/WhatsApp) — no way to easily track a group order.
2. **At the pupusería** — nobody remembers whose pupusas are whose when the food arrives.

## Links

- **Live app:** https://pupusapp.vercel.app
- **Repo:** https://github.com/Mogue5/Pupusapp

## Tech Stack

- **Framework:** Expo (React Native) with Expo Router (file-based routing)
- **Language:** TypeScript
- **Platforms:** Web (deployed on Vercel), iOS, Android (same codebase)
- **State:** React Context + useReducer, persisted to AsyncStorage
- **Font:** Nunito (Google Fonts via @expo-google-fonts/nunito)
- **Styling:** React Native StyleSheet (no external UI library)

## Project Structure

```
app/
  _layout.tsx        — Root layout, font loading, StoreProvider
  index.tsx          — Home screen (mode selection)
  order.tsx          — Order sheet (core interaction)
  summary.tsx        — Order summary with copy/share
  distribution.tsx   — Per-person breakdown + bill splitting

src/
  types.ts           — TypeScript interfaces (Flavor, PupusaOrder, PersonOrder, AppState)
  flavors.ts         — Default flavor catalog (data-driven, not hardcoded in UI)
  store.tsx          — Global state (Context + Reducer + AsyncStorage persistence)
  i18n.tsx           — ESP/ENG translations + I18nProvider
  share.ts           — Web Share API + clipboard fallback (used by summary + distribution)
  theme.ts           — Colors, spacing, radius, font families

assets/
  pupusapp_logo.png       — Full logo (brandmark + text)
  pupusapp_brandmark.png  — Brandmark only (pupusa icon)
  favicon.png             — Browser tab icon (= brandmark)
  icon.png                — App icon (= brandmark)
```

## Principles

- **UX/UI at the center.** Frictionless. Zero learning curve for anyone who has ordered pupusas before.
- **Super simple, minimalist, friendly.**
- **No sign-up, no account.** Open the app, tap, order.
- **Spanish-first.** The whole app is in Spanish.
- **Mobile-first.** Works as a webapp from any phone browser, adaptable to native app.

---

## Screen Flow

```
Inicio
  ├── "Por Persona"
  │     └── ¿Cómo se llama? (name prompt)
  │           └── Hoja (with person chips + "Siguiente" button)
  │                 └── Resumen
  │                       ├── Copiar / Compartir
  │                       ├── Editar pedido
  │                       └── ¿De quién es? (y cuánto toca pagar)
  │                             └── Price inputs + per-person totals
  │
  └── "Hoja Completa"
        └── Hoja (no chips, single sheet)
              └── Resumen
                    ├── Copiar / Compartir
                    └── Editar pedido
```

---

## Screen 1: Inicio (`app/index.tsx`)

Full logo (pupusapp_logo.png) centered, two big cards below.

- **Por Persona** — "Cada quien lo suyo"
- **Hoja Completa** — "Como en la pupusería"

No onboarding, no tutorial, no sign-up. Tap and you're in.

---

## Screen 2: La Hoja de Pedido (`app/order.tsx`)

The core of the app. Must feel as fast as marking sticks on paper.

### Layout

- Flavor list with two columns: **ARROZ** and **MAÍZ**
- Each row: flavor name on the left, two tap targets on the right (one per dough type)
- Per-person mode: person name chips at the top with a `+` to add more people
- Master sheet mode: identical, but no person chips
- Max width of 500px for readability on desktop
- Active rows (count > 0) get a subtle warm highlight
- Brandmark in top-right corner of header

### Tapping interaction (implemented)

- Empty state shows `·` (dot). Tap → `1`. Tap again → `2`. Fast consecutive taps = fast counting.
- When count > 0: visible `−` and `+` buttons appear flanking the number.
- Tap `−` to decrement, `+` to increment. Clean and discoverable.
- **Haptic feedback** on each tap (on native, not web).
- **No animations that slow down tapping.**

### Person chips (per-person mode)

- First person: centered name prompt screen ("¿Cómo se llama?"). Skippable (defaults to "Persona 1"). Shown whenever the user enters per-person mode with no persons yet.
- Subsequent people: opening a modal (see "Add-person modal" below) — never an inline field, because testing showed users would type a name and start tapping pupusas without confirming, so the person was never created.
- Tap any chip to switch to that person's order.
- Active person chip is highlighted (brown background, white text).
- `+` chip at end of row to add more people (opens the same modal).
- **Empty-person badge:** any chip whose person has no pupusas shows a small orange `!` badge in the top-right corner. Catches the common case of "added a person but forgot to enter their pupusas."

### Add-person modal (per-person mode)

Opened via either the `+` chip at the end of the chips row or the **"+ Agregar persona"** button in the bottom bar.

- Title: `¿Cómo se llama?`
- Optional name input (auto-focused, defaults to "Persona N" if blank).
- **Cancelar** closes without adding.
- **Agregar** (or pressing Enter inside the input) adds the person and switches to their chip.
- Tapping the backdrop = Cancelar.
- The modal **never auto-opens** when returning to the order screen from summary (Editar / back arrow). It only opens in response to an explicit user action.

### Empty-person warning (per-person mode)

When the user taps **"Pedido terminado"** while one or more people have no pupusas, a confirmation modal appears instead of going straight to summary.

- Message names the missing people: 1 → `"Ana no ha agregado sus pupusas. ¿Seguro/a que quieres continuar?"`, 2 → `"Ana y Carlos no han agregado..."`, 3+ → `"3 personas no han agregado..."`.
- **Cancelar** keeps the user on the order sheet (so they can fill in the missing pupusas).
- **Continuar** proceeds to summary anyway.
- Tapping the backdrop = Cancelar.

### Bottom bar (per-person mode)

Two buttons side by side:
- **"+ Agregar persona"** — opens the add-person modal (same as the `+` chip at the top, but much more discoverable at the bottom)
- **"Pedido terminado"** — goes to summary (clearly signals finality; triggers the empty-person warning if any person has no pupusas)

### Exit warning (back arrow)

The back arrow in the order-screen header always returns to home, but with a safety net:

- If there is order data (any persons or master orders), tapping back opens a confirmation modal: `"¿Seguro que quieres salir? Todo tu progreso se perderá."` with **Cancelar** / **Salir** buttons.
- Confirming dispatches `RESET_ALL` (clears persons, master orders, prices, shared cost — keeps custom flavors) and goes home.
- Cancelling keeps the user on the order screen with everything intact.
- With nothing to lose, back goes home silently — no popup.

This is the only place data is intentionally cleared. Any other navigation (Resumen, ¿De quién es?, page reload, browser close) keeps everything; the app is designed to be refresh-safe.

### Bottom bar (master mode)

Single button:
- **"Pedido terminado"** — goes to summary

### Adding custom flavors

- `+ Agregar sabor` at the bottom of the list.
- Tap → inline text field appears right there → type flavor name → enter → it's a row.
- No modal, no extra screen.

### Default flavor list (defined in `src/flavors.ts`)

```
── Clásicas ──
Revueltas
Queso
Frijol
Frijol con Queso

── Especialidades ──
Queso con Loroco
Chicharrón con Frijol
Chicharrón con Queso
Queso con Ayote
Queso con Jalapeño
Queso con Ajo
Queso con Chipilín
Queso con Espinaca
Queso con Mora
Queso con Jamón
Queso con Pollo
Queso con Camarón

── Mis sabores ──
(custom flavors appear here)

+ Agregar sabor
```

---

## Screen 3: Resumen (`app/summary.tsx`)

Shown after tapping "Pedido terminado". Displays the master sheet — totals by flavor and dough type in a card with bold brown border.

### Actions

- **Copiar texto** — Copies formatted text to clipboard, ready to paste into WhatsApp. Shows "Copiado!" feedback for 1.5s.
  ```
  Pedido de Pupusas:
  - 3 Queso (maíz)
  - 2 Frijol (arroz)
  - 1 Revuelta (arroz), 2 (maíz)
  - 1 Loroco (maíz)
  Total: 9 pupusas (3 arroz, 6 maíz)
  ```
- **Compartir / Copiar texto** — single button. Label and behavior depend on platform support for the Web Share API:
  - Browsers that expose `navigator.share` (most mobile browsers; Chrome/Edge on Win/Mac): label is **"Compartir"**, opens the OS share sheet (WhatsApp, Messages, Copy, etc.). User-cancel is silent; non-cancel errors fall back to clipboard.
  - Browsers without it (Firefox, Linux Chrome): label is **"Copiar texto"**, copies to clipboard with a brief **"Copiado!"** flash.
  - Native iOS/Android: same as the share-API path — `Share.share` opens the native sheet.
  - Implemented in `src/share.ts`.
- **¿De quién es? (y cuánto toca pagar)** — (per-person mode only) Goes to distribution screen.
- **Editar pedido** — Goes back to the order sheet (dashed border, secondary style).

### Empty state handling

If the page is loaded with no order data (e.g. direct URL or reload), redirects to home.

---

## Screen 4: ¿De quién es? (`app/distribution.tsx`)

Per-person mode only. Combined distribution + bill splitting screen.

### Price input section (top)

- Shows only the flavors that were actually ordered.
- Each flavor has a `$___` input field.
- Prices update per-person totals live as you type.
- No prices required — section works as a pure distribution view without them.
- **Shared cost row** at the bottom of the same card, separated by a hairline divider and extra spacing. Label: **"Envío"** with subtitle *"u otros costos compartidos"*. Amount is split evenly across people who actually ordered (people with no pupusas are excluded from the split).
- **Bank-app cents-fill input** (`formatCents` in `app/distribution.tsx`): typed digits land in cents from the right — `85` → `0.85`, `300` → `3.00`, `1234` → `12.34`. The decimal key is filtered, and the keyboard is `numeric` (not `decimal-pad`) so users cannot type a stray period. Backspacing through all-zeros clears the field.

### Person cards (below prices)

Each person as a card showing:
- Person name (bold, brown)
- Their ordered items with dough type
- Per-item price breakdown (when prices are entered)
- **Envío line** (italic, muted) showing this person's share of the shared cost — only when a shared cost > 0 is entered.
- Person total in the header (e.g. "$5.25") — includes their share of the shared cost.
- Pupusa count

### Grand total card

Appears when any price is entered (per-flavor or shared). Golden background with brown border, showing total for the whole order including any shared cost.

### Share bill split

When at least one price (per-flavor or shared) is entered, a single share button appears below the grand total card — same Web Share API / clipboard logic as the summary screen, but the message is the bill split. Format is deliberately compact for big group chats:

```
División del pedido:
- Ana: $5.25
- Carlos: $3.50
- Miguel: $4.75
Total: $13.50
```

One line per person plus a total. Only people who actually ordered appear. No itemization — that lives on-screen for whoever wants the details.

### Empty state handling

If no persons in state (e.g. reload), redirects to home.

---

## Brand Identity

### Colors (defined in `src/theme.ts`)

| Token | Hex | Usage |
|-------|-----|-------|
| background | `#F5F0E8` | App background (warm cream) |
| surface | `#FEFCF8` | Cards, inputs |
| primary | `#D4793A` | Primary actions (soft orange) |
| primaryLight | `#F5E6D3` | Active row highlight, hover states |
| brown | `#5C3D2E` | Borders, headings, logo text color |
| brownLight | `#7A5A4A` | Secondary brown |
| golden | `#E8B84B` | Accent (grand total card, pupusa color) |
| goldenLight | `#F2D88A` | Light golden |
| text | `#3D2B1F` | Body text |
| textSecondary | `#7A5A4A` | Secondary text |
| textMuted | `#B8A090` | Placeholders, muted text |
| border | `#D9CDBF` | Card borders, dividers |
| arroz | `#F5E6D3` | Arroz column background |
| maiz | `#F9E8A0` | Maíz column background |

### Typography

- **Font family:** Nunito (rounded, bold, friendly)
- **Weights used:** Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)
- All text uses Nunito — no system fonts.

### Visual style

- Bold brown borders (2.5px) on cards and primary buttons — matches logo outline
- Rounded corners (8-24px radius)
- No emojis in buttons (removed — custom icons planned for future)
- Brandmark (32x32) in top-right corner of inner screen headers
- Full logo on home screen

---

## Key UX Decisions

1. **No sign-up, no account.** Data lives on-device only (AsyncStorage / localStorage).
2. **Prices are deferred, not upfront.** Ordering flow has no prices — they're optional, entered only at the end for bill splitting.
3. **Tally interaction must feel instant.** Haptic feedback, no slow animations.
4. **Spanish-first.** English can come later.
5. **Refresh-safe persistence.** Persons, master orders, custom flavors, prices, and shared cost all live in the persisted store; navigating away or reloading the page keeps everything. The only intentional reset is confirmed exit via the order screen's back arrow.
6. **Explicit navigation.** Back buttons use known routes (not browser history) — works on direct URL access and reload.
7. **Responsive.** Max-width 500px on the order sheet for desktop readability. Active row highlight helps track which row you're on.

---

## Architecture Notes

### State management (`src/store.tsx`)

- React Context + useReducer pattern.
- Actions: `SET_MODE`, `ADD_PERSON`, `UPDATE_ORDER`, `RESET_ORDER`, `ADD_FLAVOR`, `SET_PRICE`, `SET_SHARED_COST`, `RESET_ALL`, `HYDRATE`.
- State shape: mode, persons, masterOrders, flavors, prices (`Record<flavorId, string>`), sharedCost (string).
- State is persisted to AsyncStorage on every change (after initial hydration). The `isReady` flag prevents rendering before hydration completes.
- `SET_MODE` only updates `mode`; it never clears order data. Switching modes from home preserves both per-person and master state side-by-side.
- `RESET_ALL` clears persons, master orders, prices, and shared cost — but keeps custom flavors (catalog metadata).
- `HYDRATE` backfills `prices` and `sharedCost` to their empty defaults when loading state from older versions of the storage schema.

### Flavor catalog (`src/flavors.ts`)

Flavors are data (id, name, category), not hardcoded in UI. Categories: `clasica`, `especialidad`, `custom`. This enables future B2B integration where a pupusería could publish their own catalog.

### Future B2B consideration

The architecture supports eventually:
- A pupusería publishing their own menu (flavors, prices, categories)
- The app loading a different catalog per restaurant
- Orders sent directly to the pupusería instead of copy-pasted to WhatsApp

None of this is built — just the data structure is ready for it.

---

## Deployment

- **Web:** Vercel (static export via `npx expo export --platform web`)
- **Config:** `vercel.json` with SPA rewrite rule (`/(.*) → /`)
- **Mobile:** Not yet published to app stores. Expo EAS Build ready when needed.
  - Google Play: $25 one-time
  - Apple App Store: $99/year

---

## Known Limitations / Future Work

- No image export (share as image) — currently text-only
- No drinks menu — pupusas only for MVP
- No custom icons — buttons are text-only (emojis removed, custom icons planned)
- No i18n — Spanish only
- No user accounts or cloud sync
- Prices assume same price regardless of dough type (arroz vs maíz)
- No order history — each session is fresh (unless state persists from previous incomplete order)
