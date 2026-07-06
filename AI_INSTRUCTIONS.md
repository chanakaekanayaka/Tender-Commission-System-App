# Project Context & AI Instructions: Tender & Commission Management System

## 1. System Overview
This is a production-grade full-stack web application designed to manage business tenders, staff job orders, calculate real-time profit margins, and manage employee commissions. The system is highly dynamic and data-driven.

## 2. Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **Backend:** Node.js, Express.js, TypeScript.
- **Database:** MongoDB (Mongoose).
- **Validation:** Zod (for API payload and form validation).
- **Integrations:** 
  - Google Gemini API (for Document Data Extraction/OCR).
  

## 3. User Roles & Access Control
The system consists of two distinct portals, but both roles have data creation capabilities:
- **Admin:** Full global access. Can configure global system settings (e.g., Global VAT status, Monthly Company Targets), manage all user accounts, view all price schedules/job orders, and manage commission payouts.
- **Staff:** Restricted view. Can CREATE Price Schedules, Job Orders, and Other Expenses. However, their Data Tables (Active, Pending, History) MUST automatically filter to display ONLY the records assigned to/created by their specific `userId`. 

## 4. Core Business Logic & Workflows
- **Workflow A: AI-Powered Price Schedules (Tender Initiation)**
  - Users upload scanned Tender Documents (PDF/Images).
  - Gemini API extracts: Procurement No, Closing Date, Entity, Title, and dynamic Item Tables (Item, Qty, Unit Price).
  - **Math Logic:** `Sub Total = Qty * Unit Price`. If the Admin's "System Config" has "VAT Registered" enabled, the system must automatically apply the VAT percentage to the Sub Total.
- **Workflow B: Job Orders & Profit Calculation**
  - Won tenders become "Job Orders". Linking a Procurement No fetches the Price Schedule data.
  - **Math Logic:** Real-time profit must be calculated as: 
    `Profit = Markup - (Sales Commission + Other Expenses)`
  - Overdue job orders trigger UI quick-actions to hit backend webhooks (n8n) for automated follow-ups.
- **Workflow C: Commissions Tracking**
  - Calculated `Sales Commission` is tracked as "Pending" for the assigned staff member.
  - Admins mark them as paid by providing a `Payment Reference No`, moving the record to the "History".

## 5. Strict Coding Standards & Best Practices (CRITICAL)
As an AI assisting in this repository, you MUST strictly adhere to the following rules:

### A. TypeScript & Type Safety
- **Strict Typing:** Absolutely NO use of `any` types. You must define explicit `Interfaces` or `Types` for all Mongoose models, API request/response payloads, and React component props.
- **Zod Validation:** All incoming API requests must be validated using Zod schemas before processing.

### B. Architecture & Clean Code
- **Single Responsibility Principle (SRP):** Keep components and functions small and focused. Extract reusable UI elements into a `components/ui` directory.
- **Backend Structure:** Use a strictly decoupled Controller-Service-Route architecture. Controllers handle HTTP (req/res), Services handle business logic and DB calls.
- **Error Handling:** Implement centralized error handling in Express. Always return standard HTTP status codes (400, 401, 403, 404, 500) with a consistent JSON error format: `{ success: false, message: string, errors?: any }`.

### C. Frontend (Next.js) & UI
- **Server vs. Client Components:** Leverage Next.js App Router properly. Use Server Components by default for data fetching. Use `"use client"` ONLY when interactivity (hooks, state) is explicitly required.
- **Responsive Design:** Build all layouts mobile-first using Tailwind CSS utility classes. Ensure tables are scrollable on smaller screens.
- **State Management:** Use standard React hooks. Use React Query (TanStack Query) or SWR for complex asynchronous state and data fetching/caching.

### D. Security & Database
- **Environment Variables:** Never hardcode secrets, API keys, or DB URIs. Always use `.env.local` / `process.env`.
- **DB Indexing:** Ensure Mongoose schemas include proper indexes for frequently queried fields (e.g., `userId`, `procurementNo`, `status`).

## 6. AI Interaction Protocol
Before generating code for any new feature or module:
1. Review these instructions to ensure architectural alignment.
2. Confirm understanding of the specific mathematical or role-based constraints related to the module.
3. Provide code that is production-ready, fully typed, and styled with Tailwind.

## 7. Design System & Color Guidelines (CRITICAL)
The UI uses a neutral, unified "Light-Dark" palette — no blue, no brand color. All tokens are defined once in `src/app/globals.css` (CSS variables in `:root`, mapped into Tailwind via `@theme inline`) and consumed everywhere as Tailwind utilities.

### Tokens (Tailwind utility → meaning)
- `bg-surface` — page background
- `bg-card` / `border-border` — card surfaces and dividers
- `text-ink` / `text-muted` — primary / secondary text
- `bg-sidebar` / `text-sidebar-ink` / `text-sidebar-muted` — sidebar surface (always dark, in both light and dark mode)
- `bg-active` / `text-active-ink` — the neutral "selected/emphasis" state (near-black on light surfaces, inverted near-white in dark mode). This replaces what used to be a blue accent.
- `bg-sidebar-active` / `text-sidebar-active-ink` — the subtle translucent-white pill used for the active item inside the (always-dark) sidebar. Do not reuse `bg-active` inside the sidebar — it won't contrast against the dark sidebar background.

### Rules
- **Never hardcode colors.** No raw hex, no `blue-*`/`gray-*`/`slate-*` Tailwind color utilities for UI chrome (backgrounds, text, borders, active/hover states, buttons, icons). Always use the tokens above.
- **Links** are indicated by an underline, not by color — use `underline` + inherited text color, not a colored `text-*` class.
- **Data visualization is the one exception.** Chart series (e.g., a secondary line/bar distinct from the primary one) may use a small, deliberate non-neutral color (e.g., amber) purely to distinguish series — this is not "UI chrome" and isn't covered by the no-color rule above.
- **Light theme only. The app does not support dark mode. Never add `dark:` variants.** `globals.css` has no `@media (prefers-color-scheme: dark)` override — if a new semantic color is needed, add a single light-mode value to the token set in `globals.css`.
- Any new component must be built from these tokens from the start, not retrofitted later.
- **Reminder:** Strictly use semantic design tokens from `globals.css` for all UI chrome. No hardcoded brand colors allowed.