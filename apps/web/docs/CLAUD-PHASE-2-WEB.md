# CLAUDE-PHASE-2-WEB.md
# Enterprise Evaluation & Ranking System (EERS)
# Frontend Phase 2: Business Feature + Figma Design — Agent Instructions

Version: 2.2
Date: 2026-08-04
Applies to: apps/web with Next.js, TanStack Query, Zod, React Hook Form
Depends on: Phase 1 (Auth) fully complete
Figma Design: File ID: 0wO1xj82IEVPuSwyLZQqQ2 (Phase 2+ business screens)
Status: Figma-first, design tokens from MCP query

---

## Critical Rules (Phase 1 Still Active)

1. Access Token: Memory only
2. Refresh Token: HttpOnly cookie
3. All API calls: Through apiClient
4. All data fetching: TanStack Query
5. No hardcoded URLs: Use env vars
6. Component structure: Feature-based
7. **NEW:** All design values from Figma (extracted via MCP)

---

## How to Use This Document

**Workflow:**
1. [DESIGN PHASE] Query Figma via MCP → Extract design tokens
   - Agent uses Figma MCP to fetch file (File ID: 0wO1xj82IEVPuSwyLZQqQ2)
   - Agent extracts ACTUAL hex values, font sizes, spacing from Figma
   - Agent creates token files with real Figma values
2. [FEATURE PHASE] Implement business CRUD
3. [STYLING PHASE] Apply tokens to components
4. [TEST PHASE] Verify design + functionality
**Key principle:** Agent should **query Figma directly**, not rely on hardcoded examples in this .md.

---

## TASK 2.0: EXTRACT DESIGN SYSTEM FROM FIGMA

### Task 2.0.1: Query Figma & Inventory Components

**Agent should:**

1. Use Figma MCP to query file: 0wO1xj82IEVPuSwyLZQqQ2
2. Look for frames/screens (NOT component instances) related to business feature:
   - Business list/browse screen
   - Business detail screen
   - Create business form screen
   - Edit business form screen
   - Any other business-related screens
3. For each screen, document the visual elements:
   - What sections exist? (header, list, form, etc.)
   - What UI elements are in each section? (buttons, inputs, cards, badges, etc.)
   - How are elements styled? (colors, spacing, etc.)
4. Create visual inventory (not component library, just what's drawn):
   - List of screens
   - Elements in each screen
   - How they're visually structured
**What agent does:**

   - Queries Figma frames (not components)
   - Documents visual hierarchy
   - Notes what UI patterns appear (button, input, card, badge, etc.)
   - Takes screenshots or notes for reference

**Expected output:**
Screens found:
1. Business List
   - Header with search input
   - Filter section (category dropdown, province input)
   - Business cards in grid (name, category badge, rating, location)
   - Pagination controls

2. Business Detail
   - Header (name, category, rating, stats)
   - Location cards
   - Reviews section (placeholder)

3. Create Business Form
   - Form header
   - Input fields (name, description, category select, province, address)
   - Submit button

4. Edit Business Form
   - Same as create form (pre-filled)

(etc.)
**Report:** "✓ Task 2.0.1 done: Figma scanned, [X] screens found, visual inventory created"

---

### Task 2.0.2: Extract Color Palette

**Agent should:**

1. Query Figma for **all color values** used in business screens
2. Group colors by purpose:
   - Brand/primary color (CTAs, active states)
   - Secondary color (accents, badges)
   - Success, error, warning colors
   - Neutral grays (backgrounds, text, borders)
3. For each color, **query exact hex value from Figma** (not guess)
4. Create `apps/web/src/shared/tokens/colors.ts` with **actual hex values from Figma**:
   - Extract exact color codes
   - Include all variants (light/dark if available)
   - Document where each is used

**What agent does:**
- Opens Figma MCP
- Looks at each component color value
- Copies exact hex codes to TypeScript file
- No placeholder examples

**Report:** "✓ Task 2.0.2 done: Color palette from Figma ([X] colors, all hex values actual)"

---

### Task 2.0.3: Extract Typography System

**Agent should:**

1. Query Figma for **all text styles** in business screens
2. For each text style, **query exact values:**
   - Font family (what font is Figma using?)
   - Font size (px value)
   - Font weight (400, 500, 600, 700, etc.)
   - Line height (1.2, 1.5, etc.)
3. Group into categories:
   - Heading 1, 2, 3, 4 (or whatever Figma calls them)
   - Body text, small text, caption
   - Button text, label text, etc.
4. Create `apps/web/src/shared/tokens/typography.ts` with **actual Figma values**

**What agent does:**
- Query each text style in Figma
- Copy exact font size, weight, line height
- No examples, all real values from Figma

**Report:** "✓ Task 2.0.3 done: Typography from Figma ([X] text styles, all values actual)"

---

### Task 2.0.4: Extract Component/Element Styles from Visual Design

**Agent should:**

1. **For each UI element type** that appears across screens (not Figma components, just visual patterns):
   - **Button:** Look at all buttons in screens → what colors, sizes, shapes?
   - **Input field:** Look at all inputs → what styling?
   - **Card:** Look at business cards/location cards → styling?
   - **Badge:** Look at category/status badges → styling?
   - **Modal/Dialog:** If exists in screens → styling?
2. Query Figma element properties for each type:
   - Background color (from visual inspection of elements)
   - Text color
   - Border radius
   - Padding/sizing
   - Shadows
   - Hover/active states (if shown in Figma as separate frames)
3. Create apps/web/src/shared/tokens/components.ts with extracted styling:
All values from actual Figma visual design
Not from component library (since there isn't one)
Based on what agent sees in screens

**What agent does:**
   - Opens each screen frame in Figma
   - Inspects styling of buttons, inputs, cards, etc.
   - Copies actual hex colors, px sizes from Figma
   - Groups by UI element type
   - Documents all variants (primary/secondary button, focus/blur input, etc.)
**Expected approach:**
Agent workflow:
1. Open "Business List" frame in Figma
2. Look at buttons → note color, size, spacing
3. Look at search input → note border, focus ring, padding
4. Look at business cards → note shadow, border-radius, padding
5. Move to next screen, check if elements have same style or different
6. Consolidate into component tokens (button, input, card, badge)
**Report:** "✓ Task 2.0.4 done: Component styles from Figma (button, input, card, badge, modal with actual values)"

---

### Task 2.0.5: Extract Spacing & Layout

**Agent should:**

1. Query Figma for **spacing/layout patterns:**
   - What gaps between elements? (8px, 16px, etc. — query Figma frames)
   - What padding inside components? (query components)
   - What margins around sections?
   - Breakpoints used (query artboards/frames for responsive designs)
   - Grid columns for different breakpoints?

2. Create `apps/web/src/shared/tokens/spacing.ts` with **actual Figma values**

**What agent does:**
- Measures/queries spacing in Figma components
- Documents breakpoints from responsive frames
- All values from Figma, not assumptions

**Report:** "✓ Task 2.0.5 done: Spacing & layout from Figma (scale, breakpoints, grid)"

---

### Task 2.0.6: Integrate Tokens into Tailwind

**Agent should:**

1. Update `apps/web/tailwind.config.ts` to use extracted token values
   - Import colors from `src/shared/tokens/colors.ts`
   - Import spacing from `src/shared/tokens/spacing.ts`
   - Map to Tailwind theme

2. Create/update `apps/web/src/app/globals.css` with CSS variables (optional):
   - For convenience when using in CSS
   - Values from token files

**Verification:**
- Tailwind config compiles
- Token values accessible in components

**Report:** "✓ Task 2.0.6 done: Tokens integrated into Tailwind + CSS variables"

---

### Task 2.0.7: Document Design System

**Agent should:**

1. Create `apps/web/src/shared/tokens/index.ts` (export all tokens)
2. Create `apps/web/src/shared/tokens/README.md`:
   - List all colors (with hex values from Figma)
   - List all typography sizes (with actual values from Figma)
   - List all components (button variants, input states, etc.)
   - List spacing scale
   - Usage examples

**Report:** "✓ Task 2.0.7 done: Design system documented"

---

### Task 2.0.8: Verification

**Agent should:**

1. Run `pnpm build` → no errors
2. Verify tokens are accessible in components
3. Create quick test: use one color from tokens in a component → render correctly

**Report:** "✓ Task 2.0.8 done: Design system verified ✅"

---

## TASK 2.1 → 2.8: Business Feature Implementation

(Identical to previous version: Zod schemas, queries, mutations, components, pages)

**Key constraint:** 
- **All colors/sizes in components must come from token files** (which were extracted from Figma)
- No hardcoded hex values or px sizes
- Use `colors.primary[500]`, `typography.heading.h1`, `spacing.md`, etc.

---

## Definition of Done
✓ Task 2.0: All token values from Figma (NOT examples)
✓ Task 2.1: Setup verified
✓ Tasks 2.2-2.8: Feature implementation complete
✓ All styling uses token values
✓ NO hardcoded colors, sizes, or spacing
✓ Design matches Figma exactly (because values are from Figma)
---

## References

- **Figma Design:** File ID `0wO1xj82IEVPuSwyLZQqQ2` (query via MCP)
- **API contracts:** `/mnt/project/API.md`

---

End of CLAUDE-PHASE-2-WEB.md — v2.2
Agent should query Figma, not use examples.
