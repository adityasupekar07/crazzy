# LactoFlow — Full-Stack Integration Blueprint & Implementation Plan

> **Scope:** Complete, phase-wise roadmap to make every backend API endpoint fully wired to the frontend, eliminate all mock/local-only workflows, and deliver a production-ready dairy management system.

---

## Executive Summary

The codebase is a **multi-tenant dairy management platform** (called "LactoFlow" in the UI) built with:

- **Backend:** Node.js + Express + Prisma + PostgreSQL + Redis caching + Firebase Phone Auth + JWT
- **Frontend:** React + Zustand state stores + Vite + Vanilla CSS
- **Auth:** Firebase OTP → backend `tempToken` → JWT exchange

### Integration Status at a Glance

| Module | Backend | Frontend Store | UI Integration | Gap Level |
|---|---|---|---|---|
| Auth (Login/Register) | ✅ Complete | ✅ Complete | ✅ Complete | **None** |
| Customer (CRUD) | ✅ Complete | ⚠️ Read + Create only | ⚠️ Read + Create only | **High** |
| Milk Entry | ✅ Complete (Redis cached) | ⚠️ Create + Delete + Today-only | ⚠️ Partial date range | **Medium** |
| Rate Chart | ✅ Complex module (POINT/EXCEL) | ✅ Full module | ✅ RateChartModule embedded | **Low** |
| Admin Profile | ✅ `GET /admin/profile` | ✅ `useProfileStore` | ❌ No UI panel exists | **Critical** (Fixed in Phase 1) |
| Dashboard Stats | ✅ `GET /admin/dashboard` | ✅ `useDashboardStore` | ✅ Connected | **None** |
| Advances | ✅ Full CRUD + Repayments | ✅ Full store | ✅ Full UI (table + modals) | **Low** |
| Food Dealers | ✅ Full CRUD | ✅ Store (Create + Fetch) | ⚠️ No edit/delete/toggle | **Medium** |
| Food Purchases | ✅ Full CRUD + stock query | ✅ Store (Create + Fetch) | ⚠️ No edit/out-of-stock view | **Medium** |
| Food Sales | ✅ Full CRUD | ✅ Store (Create + Fetch) | ⚠️ No edit/delete | **Medium** |
| Billing/Settlement | ❌ No backend endpoint | ❌ Local session-only | ❌ Alert-based, non-persistent | **Critical** (Fixed in Phase 1) |
| Milk History (date range) | ✅ `/milk/history` exists | ❌ Not fetched | ❌ Billing uses today-only data | **Critical** (Fixed in Phase 1) |
| Admin Update Profile | ✅ `PATCH /admin/profile` | ❌ Not in any store | ❌ No UI | **Critical** (Fixed in Phase 1) |

---

## Phase 1 — Critical Fixes: Missing API Wiring (Status: COMPLETED)

### 1.1 Milk History Endpoint Integration (Billing Blocker)
- **Problem:** The billing tab calculated farmer payouts using only the `collections` array (`/milk/today`). Choosing a past date range produced empty collections.
- **Backend Fix:** Implemented `GET /milk/history?startDate=&endDate=&customerId=` in `milkEntry.route.ts`, `milkEntry.controller.ts`, and `milkEntry.service.ts`.
- **Frontend Store Fix:** Added `history: MilkEntry[]` and `fetchHistory(startDate?, endDate?, customerId?)` to `useMilkCollectionStore.ts`.
- **UI Fix:** Wired `Dashboard.tsx` to automatically trigger `fetchHistory` and use historical data for period billing calculation.

### 1.2 Admin Profile — Settings & Profile Management UI
- **Problem:** `GET /admin/profile` existed, but there was no settings/profile page in the dashboard.
- **Backend Fix:** Upgraded `updateProfileSchema` and `updateProfile` in `admin.service.ts` to support updating personal details, dairy location/registry, and collection/shift/payment preferences.
- **Frontend Store Fix:** Added `updateProfile(data: Partial<AdminProfile>)` in `useProfileStore.ts` that persists to backend and synchronizes with `useAuthStore` and `localStorage`.
- **UI Fix:** Added `'settings'` tab, navigation item in English, Hindi, and Marathi, and a comprehensive 3-card settings form (Owner info, Dairy registry, Collection rules) with feedback toasts.

### 1.3 Billing/Settlement — Backend Persistence
- **Track A:** Connected date-range milk calculations to use live history data.
- **Track B:**
  - Implemented backend billing module: `POST /api/v1/billing/settle` and `GET /api/v1/billing/history` in `backend/src/modules/billing/`.
  - Created `useBillingStore.ts` with `settlements`, `fetchSettlements`, and `createSettlement`.
  - Replaced the local in-memory alert-based settlement in `Dashboard.tsx` with live backend settlement and a persistent history table.

---

## Phase 2 — Customer Module Completion

### 2.1 Missing Customer CRUD Operations
- **Backend Endpoints Available (not wired):**
  - `PATCH /customer/:id` — update customer fields
  - `DELETE /customer/:id` or soft-deactivation — toggle `isActive`
  - `GET /customer/:id` — single customer fetch
- **Frontend Gap:** `useCustomerStore` only has `fetchFarmers` and `createFarmer`. The Farmers tab only shows a static table without Edit or Deactivate actions.
- **Fix Required:**
  - Add `updateFarmer(id, data)` and `toggleFarmerStatus(id)` to `useCustomerStore.ts`.
  - In Farmers tab, add an Actions column with Edit (modal with pre-filled inputs) and Deactivate (toggle) buttons.
  - Expose bank details (`bankName`, `accountNo`, `ifscCode`) in the Edit modal.

### 2.2 Customer Advance Balance Display
- **Problem:** `Customer` interface contains `advanceBalance`, but the Farmers Directory table does not display it.
- **Fix:** Add an Advance Balance column to the Farmers table, highlighted in amber/red when `> 0`.

---

## Phase 3 — Milk Collection Module Completion

### 3.1 Milk Entry History View
- **Problem:** The Milk Registry tab only shows today's entries (`/milk/today`).
- **Fix Required:**
  - Add date filters above the collections table in the Milk tab.
  - When non-today dates are chosen, query `fetchHistory(startDate, endDate)`.
  - Display period summaries (total litres, average fat/snf, total valuation).

### 3.2 Milk Entry Edit
- **Backend Available:** `PATCH /milk/:id`
- **Problem:** Only delete is implemented in the frontend. If a operator enters incorrect FAT/SNF, they cannot edit it.
- **Fix:** Add an Edit modal pre-filled with entry details. On submit, invoke `PATCH /milk/:id` and refresh the collection list.

---

## Phase 4 — Rate Chart Module Audit

### 4.1 Dual API Client Inconsistency
- **Problem:** `rateChart.service.ts` creates its own Axios instance while other stores use the shared `request()` utility.
- **Fix:** Provide consistent environment fallback and 401 handling across both clients.

### 4.2 Rate Chart Activate/Clone UI Verification
- Verify `POST /rate-chart/:id/activate` and `POST /rate-chart/:id/clone` are properly hooked in the UI with active/draft indicators.

---

## Phase 5 — Feed Management Completion

### 5.1 Dealer Edit & Deactivation
- **Backend Available:** `PATCH /food-dealers/:id`, `DELETE /food-dealers/:id`.
- **Fix:** Add dealer management sub-view in the Feed tab with edit and deactivation capabilities.

### 5.2 Available Stock vs. Out-of-Stock Views
- **Backend Available:** `GET /food-purchases/available-stock`, `GET /food-purchases/out-of-stock`.
- **Fix:** Ensure feed sale dropdown only offers batches with remaining inventory (`> 0`), and display out-of-stock batches in a designated inventory section.

### 5.3 Food Sale Pending Credit Recovery
- Display credit pending status clearly in sales logs.

---

## Phase 6 — Advance Module Improvements

### 6.1 Transaction History Refresh
- Ensure fresh transaction records are fetched on modal open via `getAdvanceById`.

### 6.2 Advance Auto-Deduction in Billing
- Allow optional advance deduction amount when settling farmer bills, automatically creating a repayment transaction.

---

## Phase 7 — Authentication & Session Hardening

### 7.1 Token Expiry Handling
- Add a 401 response interceptor in `utils/api.ts` that triggers `logout()` and returns user to login screen gracefully.

### 7.2 Firebase Recaptcha Cleanup
- Ensure `clearRecaptchaVerifier()` runs on completion to avoid lingering DOM elements.

---

## Phase 8 — Data Integrity & Validation

### 8.1 Friendly Duplicate Constraint Error Surfacing
- Handle Prisma `P2002` duplicate unique constraints gracefully in user-facing toasts for both milk shifts and customer codes.

---

## Phase 9 — Performance & Operational Readiness

### 9.1 Targeted Data Refetching
- Refetch specific resources on tab switch rather than polling all data at once.

### 9.2 UI Skeleton Loaders
- Provide distinct loading skeleton states for tables so empty databases and active network loads are clearly differentiated.

### 9.3 Environment Configuration
- Support configurable `VITE_API_BASE_URL` with `.env.development` and `.env.production`.
