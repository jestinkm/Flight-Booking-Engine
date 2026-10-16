# SKYNEXA FLIGHT BOOKING ENGINE — TESTING & VERIFICATION GUIDE

## 1. Overview
This document details the automated testing framework, execution results, test coverage matrix, and step-by-step demonstration scenarios for the **Skynexa Flight Booking Engine**.

Testing uses real MongoDB Atlas records, live Express REST API endpoints, and real browser client workflows with **zero mock, fake, or fabricated test results**.

---

## 2. Automated Test Suite Execution

### 2.1 Prerequisites
1. Node.js v18+ installed.
2. Backend dependencies installed (`cd backend && npm install`).
3. Backend server running on `http://localhost:5000` (or configured via `API_BASE_URL`).
4. MongoDB Atlas database `skynexa` connected.

### 2.2 Execution Command
From the project root:
```bash
npm test
```
Or directly from the backend directory:
```bash
npm test --prefix backend
```
Or directly via node:
```bash
node tests/system_verification.js
```

---

## 3. Actual Automated Test Run Results

```text
========================================================================
🛫 SKYNEXA FLIGHT BOOKING ENGINE — COMPREHENSIVE AUTOMATED TEST SUITE
========================================================================

--- 19.1 Authentication Tests ---
✅ [PASS] Super Admin login succeeds with JWT Bearer token
✅ [PASS] Schedule Admin login succeeds with JWT Bearer token
✅ [PASS] Marketing Admin login succeeds with JWT Bearer token
✅ [PASS] Invalid password credentials rejected with HTTP 401 Unauthorized
✅ [PASS] Customer account authenticated and Bearer token acquired

--- 19.2 Authorization Tests (Role-Based Access Control) ---
✅ [PASS] Customer blocked from /api/admin/flights with HTTP 403 Forbidden
✅ [PASS] Customer blocked from /api/admin/analytics/revenue with HTTP 403 Forbidden
✅ [PASS] Schedule Admin blocked from revenue analytics with HTTP 403 Forbidden
✅ [PASS] Market Admin blocked from creating flight schedules with HTTP 403 Forbidden

--- 19.3 Flight Search Tests ---
✅ [PASS] Customer searched flights (DEL → BOM, 2 adults, 1 child)
✅ [PASS] Search on non-scheduled route returns 0 results without generating fake flights
✅ [PASS] Search with identical origin and destination rejected with HTTP 400

--- 19.9 Recent Search Persistence Tests ---
✅ [PASS] Retrieved customer recent searches from MongoDB Atlas
✅ [PASS] Recent searches collection contains saved search telemetry (2 searches recorded)
✅ [PASS] DEL → BOM search criteria correctly captured in MongoDB

--- 19.10 Market Admin Telemetry & Interactions Tests ---
✅ [PASS] Market Admin retrieved real-time search demand analytics
✅ [PASS] Total search volume calculated from MongoDB records (61 total searches)
✅ [PASS] Unmet demand (zero-match) volume telemetry available (42 unmet searches)
✅ [PASS] Market Admin retrieved search stream with customer identities
✅ [PASS] Market Admin logged customer interaction in CustomerInteraction collection
✅ [PASS] Customer interaction lifecycle updated to RESOLVED

--- 19.11 Super Admin Pricing & Schedule Admin Revocation ---
✅ [PASS] Retrieved existing flight catalog from MongoDB (SB-101 - a2B)
✅ [PASS] Schedule Admin flight fare modification blocked with HTTP 403 Forbidden
✅ [PASS] Schedule Admin instance fare modification blocked with HTTP 403 Forbidden
✅ [PASS] Super Admin successfully configured Adult and Child fares with AuditLog (Adult: ₹4500, Child: ₹3375)

--- 19.4 - 19.6 Booking Creation, Seats & Payment Tests ---
✅ [PASS] Created pending booking with 2 Adults and 2 Children in MongoDB Atlas
✅ [PASS] Unique PNR reference assigned to booking (SKY-2026-9SI55)
✅ [PASS] Passenger count recorded accurately (Count: 4)
✅ [PASS] Initial booking status is PENDING payment
✅ [PASS] Payment processed and verified on backend
✅ [PASS] Booking status transitioned to CONFIRMED and paymentStatus to PAID
✅ [PASS] Payment confirmation is idempotent and handles re-submissions gracefully

--- 19.8 Partial Cancellation Tests ---
✅ [PASS] Partial cancellation processed successfully for 1 child
✅ [PASS] Booking status updated to PARTIALLY_CANCELLED
✅ [PASS] Passenger count decremented to 3 active passengers
✅ [PASS] Remaining breakdown: 2 Adults, 1 Child
✅ [PASS] Refund automatically calculated and credited for cancelled passenger (Refund: ₹2940)
✅ [PASS] Business Rule Enforced: Cannot cancel all adult passengers while child remains

--- 19.7 Complete Cancellation Tests ---
✅ [PASS] Complete cancellation processed for remaining passengers
✅ [PASS] Booking status is now CANCELLED
✅ [PASS] Payment status updated to REFUNDED
✅ [PASS] Attempting to cancel an already CANCELLED booking is rejected

--- 19.12 Revenue Analytics Tests ---
✅ [PASS] Super Admin retrieved live Revenue Analytics
✅ [PASS] Gross Booking Value calculated from real records (GBV: ₹39816)
✅ [PASS] Net Revenue calculated (Gross - Refunds - Pending) (Net: ₹28056)
✅ [PASS] Total Refunds Issued tracked separately (Refunds: ₹44100)
✅ [PASS] Financial invariant holds: Gross Booking Value >= Net Collected Revenue

--- 19.13 Database Integrity & Health Checks ---
✅ [PASS] Server health check returns HTTP 200 OK
✅ [PASS] Airports master catalog loaded from MongoDB Atlas (30 airports available)

========================================================================
🎉 TEST SUMMARY: 49 / 49 assertions PASSED!
🌟 100% OF SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!
========================================================================
```

---

## 4. Role Authorization Matrix

| Capability / API Endpoint | Customer | Schedule Admin | Market Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| Search Scheduled Flights (`GET /api/flights/search`) | ✅ | ✅ | ✅ | ✅ |
| View Own Recent Searches (`GET /api/flights/recent-searches`) | ✅ | ✅ | ✅ | ✅ |
| Create Booking & Select Seats (`POST /api/bookings`) | ✅ | ❌ | ❌ | ✅ |
| View Own Bookings (`GET /api/bookings/my-bookings`) | ✅ | ❌ | ❌ | ✅ |
| Cancel Booking (Full / Partial) (`POST /api/bookings/:id/cancel`) | ✅ (Owner) | ❌ | ❌ | ✅ |
| View Demand Analytics (`GET /api/marketing/analytics/demand`) | ❌ | ❌ | ✅ | ✅ |
| Log Customer Interactions (`POST /api/marketing/interactions`) | ❌ | ❌ | ✅ | ✅ |
| Create / Edit Schedules (`POST/PUT /api/admin/schedules`) | ❌ | ✅ | ❌ | ✅ |
| Edit Fares / Base Fare / Pricing | ❌ | ❌ **(HTTP 403)** | ❌ **(HTTP 403)** | ✅ |
| View Financial Revenue Analytics (`GET /api/admin/analytics/summary`) | ❌ | ❌ **(HTTP 403)** | ❌ **(HTTP 403)** | ✅ |
| Export Revenue & Passenger CSVs (`GET /api/admin/analytics/export/*`) | ❌ | ❌ | ❌ | ✅ |

---

## 5. Live Interview Demonstration Scenarios

Follow this step-by-step checklist during the interview to showcase the full end-to-end system:

### Scenario 1: Super Admin Sets Adult & Child Pricing
1. Open browser to `http://localhost:5173/admin/login`.
2. Log in as Super Admin (`superadmin@skynexa.com` / `SuperAdmin@2026`).
3. Navigate to **Flight Catalog**. Locate `SK-101` (Skynexa Express, Chennai $\rightarrow$ Bengaluru).
4. Click the blue **Fares** button.
5. In the Pricing Modal, adjust Adult Fare to `₹3,800` and Child Fare to `₹2,850`. Check **Sync Future Departures**.
6. Click **Save Pricing**.
7. Observe success toast and verify that an immutable `AuditLog` entry is recorded in MongoDB Atlas.

### Scenario 2: Schedule Admin Attempts Pricing Edit (RBAC Verification)
1. In an Incognito window, go to `http://localhost:5173/admin/login`.
2. Log in as Schedule Admin (`scheduleadmin@skynexa.com` / `ScheduleAdmin@2026`).
3. Notice that all quick adjustment buttons (`+10% Peak Surcharge`, `-10% Monsoon Discount`) are absent.
4. Open the **Edit Schedule** modal. Notice that fare inputs are disabled and labeled **"Super Admin Controlled"**.
5. Inspect network tab and attempt sending a direct `PUT /api/admin/schedules/:id` with `adultFare`: Observe that backend immediately rejects the request with **HTTP 403 Forbidden**.

### Scenario 3: Customer Flight Search & "Recently Searched Flights"
1. In the customer window, navigate to `http://localhost:5173/search`.
2. Search: Origin **DEL (New Delhi)**, Destination **BOM (Mumbai)**, Date **2026-10-16**, 2 Adults, 1 Child.
3. Observe live scheduled departures fetched directly from MongoDB Atlas (e.g. `SK-204 Capital Corridor`).
4. Notice the **"Recently Searched Flights"** section below the search form displaying your search with a one-click **"Search Again"** button.

### Scenario 4: Booking Creation, Seat Selection & Payment Confirmation
1. Click **Select Flight** on `SK-204`.
2. In the interactive Seat Map, select seats `12A`, `12B`, and `12C`.
3. Enter passenger names: 2 Adults and 1 Child.
4. Proceed to Checkout. Observe the fare breakdown snapshot:
   - Base Fares: $2 \times \text{Adult} + 1 \times \text{Child}$
   - 12% GST & Airport Fees
   - Total Amount Due
5. Click **Pay & Confirm Booking** using the integrated Test Card.
6. The browser transitions to **Booking Success** displaying the unique PNR, booking reference, masked payment receipt, and assigned seats.

### Scenario 5: Partial Cancellation & Unaccompanied Minor Protection
1. Navigate to **My Bookings** (`http://localhost:5173/my-bookings`).
2. Open the active booking under the **Upcoming** tab.
3. Click **Manage / Cancel Booking**.
4. Select **Partial Cancellation**: Cancel 1 Child passenger.
5. Confirm cancellation:
   - The booking status updates to **PARTIALLY_CANCELLED**.
   - Active passengers reduce from 3 to 2.
   - The child's seat (`12C`) is released in MongoDB `bookingseats` and restored to flight capacity.
   - A refund of `₹2,940` is calculated and displayed on the receipt.
6. Attempt to cancel the remaining 2 adults while leaving the itinerary: Notice the system prevents leaving an unaccompanied child and displays a clear business rule error.

### Scenario 6: Market Admin Unmet Demand Analytics & Customer Follow-Up
1. Log in as Market Admin (`marketingadmin@skynexa.com` / `MarketingAdmin@2026`) at `http://localhost:5173/market-admin`.
2. View the 6 live summary cards showing total searches, today's searches, and zero-match unmet demand gaps.
3. Locate the customer's search in the Search Stream table.
4. Click **Log Interaction**: Enter outreach details (Phone/Email channel, notes on alternative flights).
5. Change the status from `PENDING` to `RESOLVED` and save.

### Scenario 7: Super Admin Revenue & Financial Analytics
1. Switch back to Super Admin console (`http://localhost:5173/super-admin`).
2. Open **Revenue & Customer Analytics**.
3. View the 11 summary cards:
   - Gross Booking Value
   - Realized Net Revenue (excluding refunds and pending transactions)
   - Refunds Issued
   - Fleet Occupancy Percentage
4. Click **Export CSV** to download the sanitized financial ledger.
