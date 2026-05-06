# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**NoOwe** — a React Native/Expo mobile app for tracking shared bills and expenses. Users scan receipts or manually enter bills, assign items to people, and track who owes what.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server (interactive: press a/i/w for platform)
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
npm run lint         # Run expo lint (ESLint)
```

No test framework is configured.

## Architecture

### Navigation
File-based routing via **Expo Router** (`/src/app/`). Route files map directly to screens:

- `index.tsx` — Login/onboarding; redirects to `/dashboard` if `NoOwe/settings.json` exists
- `dashboard.tsx` — Bill list
- `scan.tsx` — Camera capture and OCR (OCR currently returns mock data from `src/utils/billParser.js`)
- `manual.tsx` — Manual bill entry: add people → add items → assign people to items → submit
- `settings.tsx` — Profile and payment method management

`_layout.tsx` wraps everything in React Native Paper's `PaperProvider` with a custom dark green theme.

### State Management
Local `useState`/`useEffect` only — no global state library. Data flows within screens; cross-screen sharing happens via Expo Router params or re-reading from file on focus.

### Persistence
`expo-file-system` writes to `<documentDirectory>/NoOwe/settings.json`. This is the only persisted data; bills are currently in-memory/mock.

### UI
- **React Native Paper** (Material Design 3) for all UI components
- **NativeWind** (Tailwind CSS) for additional styling — use className props, not StyleSheet where possible
- Dark mode enabled by default; use `useTheme()` for color tokens

### Validation
Custom helpers live in `/validation/helpers.ts`. Call these before allowing form submission; use `HelperText` from React Native Paper to surface errors.

## Key Conventions

- Types are defined inline per-screen (no shared types file yet) — `Bill`, `Person`, `Item`, `PaymentMethod`
- Payment method service names stored lowercase: `venmo`, `paypal`, `zelle`, `cashapp`
- Zelle username is validated as a 10–11 digit phone number
- Disabled/greyed-out button state is computed as a derived boolean (e.g., `submitGreyedOut`) rather than imperative logic
- Settings screen compares JSON snapshots to detect unsaved changes before navigating away
- Camera and contacts permissions are requested lazily via `useCameraPermissions()` and `expo-contacts` — check permission state before calling APIs

## Path Alias

`@/*` resolves to the repo root (configured in `tsconfig.json` and `babel.config.js`).
