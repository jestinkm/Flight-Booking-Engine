# SKYNEXA FLIGHT BOOKING ENGINE — REST API SPECIFICATION

## 1. Authentication & Security Architecture

### Base URL
- Local Development: `http://localhost:5000/api`

### Authentication Mechanisms
1. **JWT Bearer Token**: Sent via `Authorization: Bearer <token>` header or HTTP-only `token` cookie.
2. **HTTP Basic Auth**: Supported for administrative scripts and direct curl tests: `Authorization: Basic <base64(email:password)>`.
3. **Optional Auth**: For public endpoints (e.g., flight search) that capture user identity if logged in while allowing anonymous guests.

### Standard Response Envelope
All API endpoints return JSON conforming to the Skynexa standard envelope:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description explaining the failure reason"
}
```

### Standard HTTP Status Codes
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated user does not possess the required role.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Concurrency conflict (e.g. seat already allocated).
- `500 Internal Server Error`: Unexpected unhandled error.

---

## 2. Authentication Routes (`/api/auth`)

### 2.1 Customer Registration
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": {
        "id": "670c39f1...",
        "username": "johndoe",
        "email": "johndoe@example.com",
        "role": "CUSTOMER"
      },
      "token": "eyJhbGciOiJIUzI1..."
    }
  }
  ```

### 2.2 User / Staff Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "superadmin@skynexa.com",
    "password": "SuperAdmin@2026"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "670c...",
        "email": "superadmin@skynexa.com",
        "role": "SUPER_ADMIN"
      },
      "token": "eyJhbGciOiJIUzI1..."
    }
  }
  ```

### 2.3 Current Session Profile
- **Method**: `GET`
- **Path**: `/api/users/me`
- **Access**: Private (Authenticated)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "670c...",
        "username": "johndoe",
        "email": "johndoe@example.com",
        "role": "CUSTOMER",
        "status": "ACTIVE"
      }
    }
  }
  ```

---

## 3. Flight Search & Catalog Routes (`/api/flights`)

### 3.1 Search Flight Departures
- **Method**: `GET`
- **Path**: `/api/flights/search`
- **Access**: Public (Optional Auth: logs search telemetry against `userId` if present)
- **Query Parameters**:
  - `origin` (required): IATA code (e.g., `DEL`)
  - `destination` (required): IATA code (e.g., `BOM`)
  - `date` (required): Departure date formatted `YYYY-MM-DD` (e.g., `2026-10-16`)
  - `adults` (optional, default: 1): Adult passenger count
  - `children` (optional, default: 0): Child passenger count
  - `fareMin`, `fareMax` (optional): Numeric price filter
  - `sortBy` (optional): `fare_asc`, `fare_desc`, `time_asc`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Flights found",
    "flights": [
      {
        "_id": "670e30...",
        "flightNumber": "SK-204",
        "flightName": "Capital Corridor",
        "departureDateTime": "2026-10-16T07:00:00.000Z",
        "arrivalDateTime": "2026-10-16T09:15:00.000Z",
        "duration": "2h 15m",
        "capacity": 180,
        "bookedCount": 42,
        "availableSeats": 138,
        "adultFare": 5800,
        "childFare": 4350,
        "taxAmount": 696,
        "flightId": {
          "flightNumber": "SK-204",
          "originAirportId": { "code": "DEL", "city": "New Delhi" },
          "destinationAirportId": { "code": "BOM", "city": "Mumbai" }
        }
      }
    ],
    "data": { "count": 1 }
  }
  ```

### 3.2 Customer Recently Searched Flights
- **Method**: `GET`
- **Path**: `/api/flights/recent-searches`
- **Access**: Private (Authenticated Customer)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "searches": [
      {
        "id": "670f5...",
        "origin": "DEL",
        "destination": "BOM",
        "originCity": "New Delhi",
        "destinationCity": "Mumbai",
        "date": "2026-10-16",
        "adults": 2,
        "children": 1,
        "searchedAt": "2026-10-15T18:00:00.000Z"
      }
    ]
  }
  ```

### 3.3 Flight Instance Seat Map
- **Method**: `GET`
- **Path**: `/api/flights/instance/:id/seats`
- **Access**: Public
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "instanceId": "670e30...",
      "capacity": 180,
      "availableSeats": 138,
      "occupiedSeats": ["1A", "1B", "12C"],
      "seatMap": {
        "rows": 30,
        "seatsPerRow": 6,
        "letters": ["A", "B", "C", "D", "E", "F"]
      }
    }
  }
  ```

---

## 4. Customer Booking & Cancellation Routes (`/api/bookings`)

### 4.1 Create Pending Booking
- **Method**: `POST`
- **Path**: `/api/bookings`
- **Access**: Private (`CUSTOMER`, `SUPER_ADMIN`)
- **Request Body**:
  ```json
  {
    "flightInstanceId": "670e30...",
    "passengers": [
      {
        "firstName": "Arthur",
        "lastName": "Dent",
        "age": 35,
        "gender": "MALE",
        "type": "ADULT",
        "aadhaarNumber": "123412341234",
        "seatNumber": "14A"
      },
      {
        "firstName": "Charlie",
        "lastName": "Dent",
        "age": 8,
        "gender": "MALE",
        "type": "CHILD",
        "aadhaarNumber": "345634563456",
        "seatNumber": "14B"
      }
    ]
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "booking": {
      "_id": "670f80...",
      "bookingReference": "SKY-2026-A1B2C",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "passengerCount": 2,
      "adultCount": 1,
      "childCount": 1,
      "subtotal": 10150,
      "taxAmount": 1218,
      "totalAmount": 11368
    }
  }
  ```

### 4.2 Confirm Booking Payment
- **Method**: `POST`
- **Path**: `/api/bookings/:id/confirm-payment`
- **Access**: Private (Owner or Admin)
- **Request Body**:
  ```json
  {
    "paymentMethod": "DEMO_CARD",
    "demoCardLast4": "4242"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Booking and payment confirmed successfully.",
    "booking": {
      "_id": "670f80...",
      "bookingReference": "SKY-2026-A1B2C",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "totalAmount": 11368
    },
    "payment": {
      "transactionId": "TXN-172900-ABC",
      "status": "SUCCESS",
      "amount": 11368
    }
  }
  ```

### 4.3 My Bookings List
- **Method**: `GET`
- **Path**: `/api/bookings/my-bookings`
- **Access**: Private (`CUSTOMER`)
- **Query Parameters**: `status` (optional: `CONFIRMED`, `CANCELLED`, `PARTIALLY_CANCELLED`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "bookings": [
      {
        "_id": "670f80...",
        "bookingReference": "SKY-2026-A1B2C",
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "passengers": [ ... ],
        "seats": ["14A", "14B"]
      }
    ]
  }
  ```

### 4.4 Cancel Booking (Full or Partial)
- **Method**: `POST`
- **Path**: `/api/bookings/:id/cancel`
- **Access**: Private (Owner or Admin)
- **Request Body (Partial Cancellation)**:
  ```json
  {
    "adultsToCancel": 0,
    "childrenToCancel": 1,
    "cancellationReason": "Child could not travel"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Booking updated to PARTIALLY_CANCELLED",
    "booking": {
      "_id": "670f80...",
      "status": "PARTIALLY_CANCELLED",
      "passengerCount": 1,
      "adultCount": 1,
      "childCount": 0,
      "subtotal": 5800,
      "taxAmount": 696,
      "totalAmount": 6496,
      "refundAmount": 4872
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If an attempt is made to cancel all adults while leaving child passengers without an adult guardian:
    ```json
    {
      "success": false,
      "message": "Cannot cancel all adult passengers while child passengers remain. An adult must accompany child passengers."
    }
    ```

---

## 5. Super Admin Pricing & Fares Routes

### 5.1 Update Flight Pricing (Super Admin Only)
- **Method**: `PUT`
- **Path**: `/api/admin/flights/:id/pricing`
- **Access**: Private (`SUPER_ADMIN` strictly required)
- **Request Body**:
  ```json
  {
    "baseFare": 4500,
    "adultFare": 4500,
    "childFare": 3375,
    "syncFutureInstances": true
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Flight pricing updated successfully. Synchronized 14 future departures.",
    "data": {
      "flight": {
        "flightNumber": "SK-101",
        "baseFare": 4500,
        "adultFare": 4500,
        "childFare": 3375
      }
    }
  }
  ```
- **Unauthorized Role Rejection (403 Forbidden)**:
  Attempting this endpoint or modifying `baseFare`/`adultFare`/`childFare` as `SCHEDULE_ADMIN`:
  ```json
  {
    "success": false,
    "message": "Access Denied: Only Super Admin is authorized to modify flight fares or pricing policies. Schedule Admin pricing permissions have been revoked."
  }
  ```

---

## 6. Super Admin Revenue & Analytics Routes (`/api/admin/analytics`)

### 6.1 Revenue Analytics Summary
- **Method**: `GET`
- **Path**: `/api/admin/analytics/summary`
- **Access**: Private (`SUPER_ADMIN` only)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalFlights": 6,
        "totalFlightInstances": 84,
        "totalBookings": 15,
        "confirmedBookings": 12,
        "cancelledBookings": 3,
        "totalPassengers": 32,
        "confirmedPassengers": 26,
        "grossBookingValue": 128500,
        "netRevenue": 96200,
        "successfulPayments": { "count": 12, "amount": 96200 },
        "refundsIssued": { "count": 3, "amount": 32300 },
        "pendingPayments": { "count": 0, "amount": 0 },
        "failedPayments": { "count": 0, "amount": 0 },
        "overallOccupancyPct": 17.5
      }
    }
  }
  ```

### 6.2 CSV Data Export
- **Flight Revenue CSV**: `GET /api/admin/analytics/export/flights`
- **Customer Manifest CSV**: `GET /api/admin/analytics/export/customers`
- **Access**: Private (`SUPER_ADMIN` only)
- **Response**: Sanitized CSV stream with formula injection escaping.

---

## 7. Market Admin Demand & Interaction Routes (`/api/marketing`)

### 7.1 Search Demand Telemetry
- **Method**: `GET`
- **Path**: `/api/marketing/analytics/demand`
- **Access**: Private (`MARKETING_ADMIN`, `SUPER_ADMIN`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalSearches": 61,
      "todaySearches": 61,
      "weekSearches": 61,
      "uniqueSearchingCustomers": 3,
      "matchingSearches": 19,
      "noMatchSearches": 42,
      "matchRate": 31,
      "topRoutes": [
        { "route": "DEL → BOM", "searches": 18, "matching": 18, "zeroMatch": 0 },
        { "route": "CCU → TRV", "searches": 12, "matching": 0, "zeroMatch": 12 }
      ]
    }
  }
  ```

### 7.2 Log Customer Outreach Interaction
- **Method**: `POST`
- **Path**: `/api/marketing/interactions`
- **Access**: Private (`MARKETING_ADMIN`, `SUPER_ADMIN`)
- **Request Body**:
  ```json
  {
    "searchEventId": "670f5...",
    "customerName": "Skynexa Customer",
    "customerEmail": "customer@example.com",
    "customerPhone": "+919876543210",
    "route": "CCU → TRV",
    "channel": "EMAIL",
    "status": "PENDING",
    "notes": "Offered connecting flight via BLR with 10% coupon code."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Customer interaction logged successfully",
    "data": { "interaction": { "_id": "670f9...", "status": "PENDING" } }
  }
  ```
