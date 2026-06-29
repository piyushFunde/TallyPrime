# SmartERP MVP — Task Tracker

## Phase 1 — Backend (Spring Boot)

- [x] Step 1: Create Spring Boot project (pom.xml, application.properties)
- [x] Step 2: Create entity classes (Ledger, StockItem, Voucher, VoucherLineItem)
- [x] Step 3: Create JPA repositories
- [x] Step 4: Create DTOs
- [x] Step 5: Create services (business logic + stock management)
- [x] Step 6: Create REST controllers
- [x] Step 7: Create exception handling
- [x] Step 8: Create CORS config
- [x] Step 9: Verify backend compiles and runs (requires Java/Maven install)

## Phase 2 — Frontend (Next.js + TypeScript)

- [x] Step 10: Initialize Next.js project with Tailwind + Shadcn
- [x] Step 11: Build TallyPrime-inspired layout (sidebar, status bar)
- [x] Step 12: Create Ledger module (list + form)
- [x] Step 13: Create Stock Item module (list + form)
- [x] Step 14: Create Voucher module (Sales + Purchase)
- [x] Step 15: Implement keyboard shortcuts
- [x] Step 16: Connect frontend to backend APIs
- [x] ✅ Build verification — PASSED (0 TypeScript errors)

## Phase 3 — Integration & Polish

- [x] Step 17: Install Java/Maven, create PostgreSQL database, run backend
- [x] Step 18: End-to-end testing
- [x] Step 19: Final walkthrough

## Phase 4 — Right Shortcut Panel (TallyPrime UI Style)

- [x] Step 20: Add CSS style definitions for the right panel in `globals.css`
- [x] Step 21: Implement RightShortcutPanel component (collapsible, dynamic labels)
- [x] Step 22: Integrate RightShortcutPanel in Root Layout
- [x] Step 23: Implement functional dialogs (F1 Help, F2 Period, F3 Company, F12 Configure)
- [x] Step 24: Verify and test shortcut panel

## Phase 5 — User Authentication & Login Page

- [x] Step 25: Implement Backend Auth (User, Repository, Service, HashUtils, Controller, DTOs)
- [x] Step 26: Update Frontend API calls & Add Auth Interceptor
- [x] Step 27: Implement Frontend AuthContext & AuthWrapper
- [x] Step 28: Create TallyPrime-style Login Page
- [x] Step 29: Integrate Auth context & wrapper in root layout & add Logout button to Sidebar
- [x] Step 30: Implement public `/register` page and update AuthWrapper routing logic
- [x] Step 31: Add Registration links to Login page
- [x] Step 32: Verify and test registration flow

## Phase 6 — Global Keyboard Shortcuts Expansion

- [x] Step 33: Update RightShortcutPanel.tsx (F1-F12 key mapping, dynamic buttons)
- [x] Step 34: Implement F4 Floating Calculator widget
- [x] Step 35: Implement Ctrl+K Command Palette Search widget
- [x] Step 36: Create new Voucher page views (Payment, Receipt, Journal, Credit/Debit Notes)
- [x] Step 37: Create dynamic Reports module page templates (Balance Sheet, P&L, GST, etc.)
- [x] Step 38: Verify and test all shortcut actions
