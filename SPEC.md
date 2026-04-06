# Pupusapp — Product Specification

## Overview

Digital pupusa order sheet. Solves two problems:
1. **Ordering from home** (phone/WhatsApp) — no way to easily track a group order.
2. **At the pupusería** — nobody remembers whose pupusas are whose when the food arrives.

## Principles

- **UX/UI at the center.** Frictionless. Zero learning curve for anyone who has ordered pupusas before.
- **Super simple, minimalist, friendly.**
- **No sign-up, no account.** Open the app, tap, order.
- **Spanish-first.** The whole app is in Spanish.
- **Mobile-first.** Native app, but easily adaptable to a webapp usable from the phone.

---

## Screen Flow

```
Inicio
  ├── "Por Persona"
  │     └── Hoja (with person chips)
  │           └── Resumen
  │                 ├── Copiar / Compartir
  │                 └── ¿De quién es?
  │
  └── "Hoja Completa"
        └── Hoja (no chips)
              └── Resumen
                    └── Copiar / Compartir
```

---

## Screen 1: Inicio

Two big, friendly cards. That's the whole screen.

- **Por Persona** — "Cada quien lo suyo"
- **Hoja Completa** — "Como en la pupusería"

The micro-copy under each option tells you what it means without jargon. No onboarding, no tutorial, no sign-up. You tap and you're in.

---

## Screen 2: La Hoja de Pedido (the core)

This is where the app lives or dies. It must feel as fast as marking sticks on paper.

### Layout

- Flavor list with two columns: **ARROZ** and **MAÍZ**
- Each row: flavor name on the left, two tap targets on the right (one per dough type)
- Per-person mode: person name chips at the top with a `+` to add more people
- Master sheet mode: identical, but no person chips
- Running total at the bottom
- "LISTO" button at the bottom

### Tapping interaction (most critical UX element)

- Empty state shows `·` (dot). Tap → `1`. Tap again → `2`. Fast consecutive taps = fast counting.
- To subtract: **swipe left on the number**, or tap-and-hold to reset to zero.
- No visible minus button cluttering the UI — keeps it clean like the paper.
- Numbers could display as tally sticks (│││ for 3) up to 5 for authentic feel, then switch to digits. Design detail to test.
- **Haptic feedback** on each tap (subtle vibration) to confirm the count went up.
- **No animations that slow down tapping.** Speed is everything.

### Person chips (per-person mode)

- Start with a name prompt (inline, not a separate screen): "¿Cómo se llama?" → type name → done. If skipped, defaults to "Persona 1."
- Tap `+` chip to add next person. Same quick name prompt.
- Tap any chip to switch to that person's order. Their counts show.
- Active person is visually highlighted.
- The sheet remembers each person's tallies separately.

### Adding custom flavors

- `+ Agregar sabor` at the bottom of the list.
- Tap → inline text field appears right there in the list → type the flavor name → hit enter → it's now a row in the list, ready to tap.
- No modal, no extra screen. It just becomes part of the list.

### Default flavor list

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

No prices in MVP. The app tracks *what* you ordered, not *how much it costs*. Keeps it clean and avoids the "this price is wrong" problem. Prices vary per pupusería anyway.

---

## Screen 3: Resumen

Shown after tapping "LISTO". Displays the master sheet — totals by flavor and dough type.

### Actions

- **📋 Copiar texto** — Copies a formatted text summary ready to paste into WhatsApp:
  ```
  Pedido de Pupusas:
  - 3 Queso (maíz)
  - 2 Frijol (arroz)
  - 1 Revuelta (arroz), 2 (maíz)
  - 1 Loroco (maíz)
  Total: 9 pupusas
  ```
- **📤 Compartir imagen** — Generates a clean receipt-like image of the summary. Shareable via native share menu.
- **🧑‍🤝‍🧑 Ver por persona** — (per-person mode only) Goes to Screen 4.
- **✏️ Editar pedido** — Goes back to the order sheet to make changes.

---

## Screen 4: ¿De quién es? (per-person mode only)

The "food just arrived" screen. Title: **"¿De quién es?"** — literally what everyone asks when the pupusas arrive.

Shows each person as a card with their name and their order listed below:

```
María
  2 Queso (maíz)
  1 Frijol (arroz)

Juan
  1 Revuelta (arroz)
  2 Revueltas (maíz)
  1 Loroco (maíz)

Abuela
  1 Queso (maíz)
  1 Frijol (arroz)
```

---

## Key UX Decisions

1. **No sign-up, no account.** Data lives on-device only. Accounts come later if B2B happens.
2. **No prices in MVP.** Tracks what, not how much.
3. **Tally interaction must feel instant.** Haptic feedback, no slow animations.
4. **Spanish-first.** English can come later.
5. **Persistent order.** If you close the app mid-order, it's still there when you come back.

---

## Architecture Consideration: Future B2B (Pupusería Integration)

Separate the flavor catalog from the app logic. Model flavors as data (a list with name, price, category, dough options) rather than hardcoding them. This way:

- A pupusería could eventually publish their own menu (specific flavors, prices, categories).
- The app would just load a different catalog.
- Orders could be sent directly to the pupusería instead of copy-pasted to WhatsApp.

Don't build any of this now. Just make sure the flavor list is a data structure, not baked into the UI.
