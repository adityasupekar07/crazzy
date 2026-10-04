# Project Changes Log

This document tracks all modifications, newly created files, architectural decisions, and endpoint integrations made to the LactoFlow platform.

---

## [Phase 1] — Critical Fixes & Missing API Wiring

**Date:** 2026-10-04  
**Status:** Completed

### 1. Backend Changes

#### Milk Entry Module (`GET /milk/history`)
- **[backend/src/modules/milkEntry/milkEntry.service.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/milkEntry/milkEntry.service.ts)**
  - Added `getMilkHistory(adminId: string, startDate?: string, endDate?: string, customerId?: string)` method.
  - Queries `prisma.milkEntry.findMany` filtering by `customer.adminId`, optional date range bounds (`gte`, `lte`), and optional `customerId`.
  - Includes related `customer` and `rateChart` data, ordered by date descending.
  - Exported `getMilkHistory` in `milkEntryService`.
- **[backend/src/modules/milkEntry/milkEntry.controller.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/milkEntry/milkEntry.controller.ts)**
  - Added `getMilkHistory` request handler wrapping `milkEntryService.getMilkHistory` with `asyncHandler` and standardized `ApiResponse`.
- **[backend/src/modules/milkEntry/milkEntry.route.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/milkEntry/milkEntry.route.ts)**
  - Registered `router.get("/history", authMiddleware, getMilkHistory)`.
  - Re-ordered routes so `/history` and `/milk-entry/by-date` are defined **before** `/:id` to prevent Express route shadowing.

#### Admin Profile Module (`PATCH /admin/profile`)
- **[backend/src/modules/Admin/admin.schema.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/Admin/admin.schema.ts)**
  - Extended `updateProfileSchema` so that all Admin profile fields are accepted optionally: `ownerName`, `mobile`, `dairyName`, `village`, `taluka`, `district`, `state`, `collectionType`, `milkType`, `collectionShift`, `paymentPeriod`.
- **[backend/src/modules/Admin/admin.service.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/Admin/admin.service.ts)**
  - Updated `updateProfile` method to dynamically construct update payload.
  - Added duplicate mobile verification check only if mobile number is modified.
  - Returns the comprehensive updated admin record.

#### Billing Module (`POST /billing/settle` & `GET /billing/history`)
- **[backend/src/modules/billing/billing.service.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/billing/billing.service.ts)** *(NEW FILE)*
  - Implemented `createSettlement` and `getBillingHistory`.
  - Validates input, checks customer ownership under admin, and provides persistent storage across sessions.
- **[backend/src/modules/billing/billing.controller.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/billing/billing.controller.ts)** *(NEW FILE)*
  - Added `createSettlement` (HTTP 201) and `getBillingHistory` (HTTP 200) controller handlers.
- **[backend/src/modules/billing/billing.routes.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/billing/billing.routes.ts)** *(NEW FILE)*
  - Created router with authentication middleware on `/settle` and `/history`.
- **[backend/src/routes/index.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/routes/index.ts)**
  - Imported `billingRoutes` and registered router at `/billing`.

---

### 2. Frontend Changes

#### Milk Store (`useMilkCollectionStore.ts`)
- **[frontend/src/store/collection/useMilkCollectionStore.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/collection/useMilkCollectionStore.ts)**
  - Added `history: MilkEntry[]` state field and initial value.
  - Added `fetchHistory: (startDate?: string, endDate?: string, customerId?: string) => Promise<void>`.
  - Created reusable `mapRawMilkEntry` mapper function shared between today's entries and historical entries.

#### Profile Store (`useProfileStore.ts`)
- **[frontend/src/store/profile/useProfileStore.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/profile/useProfileStore.ts)**
  - Added `gstin?: string` and `logoUrl?: string` to `AdminProfile` interface.
  - Added `updateProfile: (payload: Partial<AdminProfile>) => Promise<boolean>` action calling `PATCH /admin/profile`.
  - Automatically updates local store, synchronizes `useAuthStore.getState().user`, and updates `localStorage.setItem('user', ...)`.
- **[frontend/src/store/index.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/index.ts)**
  - Exposed `updateProfile` in backward-compatibility wrapper `useAdminStore`.

#### Billing Store (`useBillingStore.ts`)
- **[frontend/src/store/billing/useBillingStore.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/billing/useBillingStore.ts)** *(NEW FILE)*
  - Created store holding `settlements: SettlementRecord[]`, `status`, `error`.
  - Added `fetchSettlements(customerId?)` calling `GET /billing/history`.
  - Added `createSettlement(payload)` calling `POST /billing/settle` and prepending new record to state.
- **[frontend/src/store/index.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/index.ts)**
  - Re-exported all exports from `./billing/useBillingStore`.

#### Translations (`translations.ts`)
- **[frontend/src/i18n/translations.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/i18n/translations.ts)**
  - Added `navSettings: string;` in `Translations['dashboard']` interface.
  - Added translations in English (`'Settings & Profile'`), Hindi (`'सेटिंग्स और प्रोफ़ाइल'`), and Marathi (`'सेटिंग्ज आणि प्रोफाइल'`).

#### Dashboard Component (`Dashboard.tsx`)
- **[frontend/src/components/Dashboard.tsx](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/components/Dashboard.tsx)**
  - Connected `history` and `fetchHistory` from `useMilkStore`.
  - Connected `profile`, `fetchProfile`, `updateProfile` from `useProfileStore`.
  - Connected `settlements`, `fetchSettlements`, `createSettlement` from `useBillingStore`.
  - Added `fetchProfile()` and `fetchSettlements()` on initial authentication mount.
  - Added reactive `useEffect` to call `fetchHistory(billingStartDate, billingEndDate, billingFarmerId)` on date/farmer change.
  - Calculated `billingCollections` from `history` instead of today-only `collections`.
  - Replaced local temporary array and alert with `useBillingStore.createSettlement()` in `handleBillSettlement()`.
  - Rendered settlements directly from `settlements` store state in the Settled Bills History table.
  - Extended `dbTab` union to include `'settings'`.
  - Added Settings tab to navigation menu (`navItems`) with `Settings` icon.
  - Built comprehensive **Dairy & Profile Settings Panel** (Tab 8) with forms for:
    - Owner & Account Details (Owner name, mobile number).
    - Dairy Location & Registry (Dairy name, GSTIN, village, taluka, district, state).
    - Collection Rules & Business Defaults (Calculation method, milk type, shifts, payment frequency).
    - Asynchronous submit handler with feedback toasts and error alerts.

---

## [Phase 2] — Customer Module Completion

**Date:** 2026-10-04  
**Status:** Completed

### 1. Backend Changes

#### Customer Module (`PATCH /customer/:id`, `DELETE /customer/:id`, `GET /customer/:id`)
- **[backend/src/modules/customer/customer.schema.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/customer/customer.schema.ts)**
  - Added `updateCustomerSchema` with optional fields, including bank details (`bankName`, `accountNo`, `ifscCode`).
- **[backend/src/modules/customer/customer.service.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/customer/customer.service.ts)**
  - Implemented `updateCustomer` for partial updates with duplicate mobile number checking.
  - Implemented `toggleCustomerStatus` to flip the `isActive` boolean.
  - Implemented `getCustomerById` for single customer retrieval.
- **[backend/src/modules/customer/customer.controller.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/customer/customer.controller.ts)**
  - Created `updateCustomer`, `toggleCustomerStatus`, and `getCustomerById` request handlers.
- **[backend/src/modules/customer/customer.route.ts](file:///Users/adityasupekar/Desktop/crazzy/backend/src/modules/customer/customer.route.ts)**
  - Registered `router.patch('/:id')`, `router.delete('/:id')`, and `router.get('/:id')` endpoints.

### 2. Frontend Changes

#### Customer Store (`useCustomerStore.ts`)
- **[frontend/src/store/customer/useCustomerStore.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/customer/useCustomerStore.ts)**
  - Added `updateFarmer` action wrapping the `PATCH /customer/:id` endpoint.
  - Added `toggleFarmerStatus` action wrapping the `DELETE /customer/:id` endpoint.
  - Added interfaces for `UpdateFarmerInput` with optional bank details.

#### Dashboard Component (`Dashboard.tsx`)
- **[frontend/src/components/Dashboard.tsx](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/components/Dashboard.tsx)**
  - **State & Handlers:**
    - Expanded `handleAddFarmerSubmit` to dynamically route logic to `updateFarmer` when `editFarmerId` is populated.
    - Added `handleEditFarmerClick` to pre-fill the modal with farmer details (including bank information).
    - Added `handleToggleFarmer` to activate/deactivate a customer.
  - **Farmers Directory UI:**
    - Appended `Advance Bal` and `Actions` headers to the table.
    - Added cell displaying formatted `advanceBalance` highlighting active balances in amber.
    - Row fades (`opacity-50`) if `!isActive` with a red "Inactive" pill.
    - Rendered action buttons (Edit, Activate/Deactivate) directly within the table row.
  - **Register/Edit Modal:**
    - Added dynamic modal title "Edit Farmer Details".
    - Locked the `customerCode` field in edit mode.
    - Added expandable **Bank Details** section containing Bank Name, Account No, and IFSC Code.

---

## [Phase 3] — Milk Collection Module Completion

**Date:** 2026-10-04  
**Status:** Completed

### 1. Frontend Changes

#### Milk Store (`useMilkCollectionStore.ts`)
- **[frontend/src/store/collection/useMilkCollectionStore.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/store/collection/useMilkCollectionStore.ts)**
  - Implemented `updateCollectionEntry` action wrapper for the `PATCH /milk/:id` endpoint.
  - Automatically updates both `collections` and `history` state arrays to keep UI synchronized across dates.

#### Dashboard Component (`Dashboard.tsx`)
- **[frontend/src/components/Dashboard.tsx](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/components/Dashboard.tsx)**
  - **Milk Tab Date Filters & Statistics:**
    - Added state tracking for `milkStartDate` and `milkEndDate`.
    - Added `useEffect` hook to dynamically fetch milk history if dates shift away from today.
    - Built derived state array `displayCollections` representing the currently selected temporal view.
    - Added real-time computed period summaries: Total Litres, Avg FAT / SNF, and Total Valuation.
  - **Milk Entry Edit Workflow:**
    - Modified the "Record Delivery Entry" form to act dynamically based on `editMilkId` state.
    - Added an `EDIT` button to the log table executing `handleEditMilkClick` which populates the left panel.
    - Modified `handleMilkEntrySubmit` to bypass duplicate validations on edit and execute `updateCollectionEntry(id, payload)` instead of creating a new entry.
    - Re-used `liveCalc` system to effortlessly allow automatic rate recalculations for edited milk FAT/SNF adjustments before pushing to the server.

---

## [Phase 4] — Rate Chart Module Audit

**Date:** 2026-10-04  
**Status:** Completed

### 1. Dual API Client Inconsistency Fixed
- **[frontend/src/utils/api.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/utils/api.ts)**:
  - Ensured the base API endpoint uses standard environment variables via `import.meta.env.VITE_API_BASE_URL` with a standard localhost fallback.
  - Added global response interception to capture HTTP 401 Unauthorized errors, actively purge `token` and `user` from `localStorage`, and broadcast an `auth-error` window event.
- **[frontend/src/App.tsx](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/App.tsx)**:
  - Added event listener capturing `auth-error` dispatched from `api.ts` or external Axios instances.
  - Gracefully redirects unauthenticated users back to the `LandingPage` and displays the `AuthModal` login form.
- **[frontend/src/modules/rateChart/services/rateChart.service.ts](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/modules/rateChart/services/rateChart.service.ts)**:
  - Configured response interceptor inside the specific `apiClient` Axios instance mapping HTTP 401 triggers to the global `auth-error` channel in line with standard store routines.

### 2. Rate Chart Clone/Activate Verification
- **[frontend/src/modules/rateChart/pages/RateChartListPage.tsx](file:///Users/adityasupekar/Desktop/crazzy/frontend/src/modules/rateChart/pages/RateChartListPage.tsx)**:
  - Verified and confirmed that the complex nested module has accurately wired `activateChart` and `cloneChart` handlers driving endpoints `POST /rate-chart/:id/activate` and `POST /rate-chart/:id/clone`.
