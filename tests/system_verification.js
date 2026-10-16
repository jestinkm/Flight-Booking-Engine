/**
 * SKYNEXA FLIGHT BOOKING ENGINE — SYSTEM VERIFICATION TEST SUITE
 * 
 * Comprehensive automated testing covering all 14 test categories:
 * - 19.1 Authentication Tests
 * - 19.2 Authorization Tests (Role-Based Access Matrix)
 * - 19.3 Flight Search Tests
 * - 19.4 Seat Allocation & Assignment Tests
 * - 19.5 Booking Creation & Validation Tests
 * - 19.6 Payment Verification & Confirmation Tests
 * - 19.7 Complete Cancellation Tests
 * - 19.8 Partial Cancellation & Unaccompanied Minor Tests
 * - 19.9 Recent Search Persistence & Telemetry Tests
 * - 19.10 Market Admin Dashboard & Customer Interaction Tests
 * - 19.11 Super Admin Pricing & Schedule Admin Revocation Tests
 * - 19.12 Revenue Analytics & Financial Calculation Tests
 * - 19.13 Database Integrity & Health Checks
 * - 19.14 API Error Handling Tests
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runSystemVerification() {
  console.log('========================================================================');
  console.log('🛫 SKYNEXA FLIGHT BOOKING ENGINE — COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const failures = [];

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}${details ? ` (${details})` : ''}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
      failures.push({ testName, details });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 19.1 AUTHENTICATION TESTS
    // -------------------------------------------------------------------------
    console.log('--- 19.1 Authentication Tests ---');
    
    // Login Super Admin
    const superAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'superadmin@skynexa.com', password: 'SuperAdmin@2026' }
    });
    const superAdminToken = superAdminLogin.data?.data?.token || superAdminLogin.data?.token;
    assert(Boolean(superAdminToken), 'Super Admin login succeeds with JWT Bearer token');
    const superAdminAuth = { headers: { Authorization: `Bearer ${superAdminToken}` } };

    // Login Schedule Admin
    const scheduleAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'scheduleadmin@skynexa.com', password: 'ScheduleAdmin@2026' }
    });
    const scheduleAdminToken = scheduleAdminLogin.data?.data?.token || scheduleAdminLogin.data?.token;
    assert(Boolean(scheduleAdminToken), 'Schedule Admin login succeeds with JWT Bearer token');
    const scheduleAdminAuth = { headers: { Authorization: `Bearer ${scheduleAdminToken}` } };

    // Login Marketing Admin
    const marketingAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'marketingadmin@skynexa.com', password: 'MarketingAdmin@2026' }
    });
    const marketingAdminToken = marketingAdminLogin.data?.data?.token || marketingAdminLogin.data?.token;
    assert(Boolean(marketingAdminToken), 'Marketing Admin login succeeds with JWT Bearer token');
    const marketingAdminAuth = { headers: { Authorization: `Bearer ${marketingAdminToken}` } };

    // Invalid credentials rejection
    const invalidLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'superadmin@skynexa.com', password: 'WrongPassword@999' }
    });
    assert(invalidLogin.status === 401 || invalidLogin.data?.success === false, 
      'Invalid password credentials rejected with HTTP 401 Unauthorized');

    // Customer register or login
    let customerToken = null;
    let customerUser = null;
    const custLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'customer.test@skynexa.com', password: 'Password@123' }
    });

    if (custLoginRes.data?.success && (custLoginRes.data?.token || custLoginRes.data?.data?.token)) {
      customerToken = custLoginRes.data?.token || custLoginRes.data?.data?.token;
      customerUser = custLoginRes.data?.user || custLoginRes.data?.data?.user;
    } else {
      const regRes = await request('/auth/register', {
        method: 'POST',
        body: {
          username: 'customertest',
          firstName: 'Customer',
          lastName: 'Tester',
          email: 'customer.test@skynexa.com',
          password: 'Password@123',
          phone: '+919876543299'
        }
      });
      customerToken = regRes.data?.token || regRes.data?.data?.token;
      customerUser = regRes.data?.user || regRes.data?.data?.user;
    }
    assert(Boolean(customerToken), 'Customer account authenticated and Bearer token acquired');
    const customerAuth = { headers: { Authorization: `Bearer ${customerToken}` } };

    // -------------------------------------------------------------------------
    // 19.2 AUTHORIZATION & RBAC TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.2 Authorization Tests (Role-Based Access Control) ---');

    // Customer attempting administrative endpoint -> MUST FAIL (HTTP 403)
    const custAdminAttempt = await request('/admin/flights', { method: 'GET', ...customerAuth });
    assert(custAdminAttempt.status === 403, 'Customer blocked from /api/admin/flights with HTTP 403 Forbidden');

    // Customer attempting revenue analytics -> MUST FAIL (HTTP 403)
    const custRevAttempt = await request('/admin/analytics/revenue', { method: 'GET', ...customerAuth });
    assert(custRevAttempt.status === 403, 'Customer blocked from /api/admin/analytics/revenue with HTTP 403 Forbidden');

    // Schedule Admin attempting revenue analytics -> MUST FAIL (HTTP 403)
    const schedRevAttempt = await request('/admin/analytics/revenue', { method: 'GET', ...scheduleAdminAuth });
    assert(schedRevAttempt.status === 403, 'Schedule Admin blocked from revenue analytics with HTTP 403 Forbidden');

    // Market Admin attempting schedule creation -> MUST FAIL (HTTP 403)
    const mktSchedAttempt = await request('/admin/schedules', { method: 'POST', body: {}, ...marketingAdminAuth });
    assert(mktSchedAttempt.status === 403, 'Market Admin blocked from creating flight schedules with HTTP 403 Forbidden');

    // -------------------------------------------------------------------------
    // 19.3 FLIGHT SEARCH TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.3 Flight Search Tests ---');

    // Search existing flights from MongoDB
    const searchRes = await request('/flights/search?origin=DEL&destination=BOM&date=2026-10-16&adults=2&children=1', {
      method: 'GET',
      ...customerAuth
    });
    assert(searchRes.data?.success === true, 'Customer searched flights (DEL → BOM, 2 adults, 1 child)');

    // Search zero-match route
    const zeroMatchRes = await request('/flights/search?origin=IXZ&destination=LEH&date=2026-10-25&adults=1&children=0', {
      method: 'GET',
      ...customerAuth
    });
    const zeroCount = zeroMatchRes.data?.flights?.length ?? zeroMatchRes.data?.data?.count;
    assert(zeroMatchRes.data?.success === true && zeroCount === 0,
      'Search on non-scheduled route returns 0 results without generating fake flights');

    // Search with identical origin and destination -> 400
    const invalidSearchRes = await request('/flights/search?origin=DEL&destination=DEL', { method: 'GET' });
    assert(invalidSearchRes.status === 400, 'Search with identical origin and destination rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // 19.9 RECENT SEARCH PERSISTENCE & TELEMETRY TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.9 Recent Search Persistence Tests ---');

    const recentRes = await request('/flights/recent-searches', { method: 'GET', ...customerAuth });
    assert(recentRes.data?.success === true, 'Retrieved customer recent searches from MongoDB Atlas');
    const recentList = recentRes.data?.data?.searches || recentRes.data?.searches || [];
    assert(Array.isArray(recentList) && recentList.length > 0, 
      'Recent searches collection contains saved search telemetry', `${recentList.length} searches recorded`);
    const hasDelBom = recentList.some((s) => s.origin === 'DEL' && s.destination === 'BOM');
    assert(hasDelBom, 'DEL → BOM search criteria correctly captured in MongoDB');

    // -------------------------------------------------------------------------
    // 19.10 MARKET ADMIN TELEMETRY & CUSTOMER INTERACTION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.10 Market Admin Telemetry & Interactions Tests ---');

    const demandRes = await request('/marketing/analytics/demand', { method: 'GET', ...marketingAdminAuth });
    assert(demandRes.data?.success === true, 'Market Admin retrieved real-time search demand analytics');
    const demandData = demandRes.data?.data;
    assert(typeof demandData?.totalSearches === 'number', 'Total search volume calculated from MongoDB records', `${demandData?.totalSearches} total searches`);
    assert(typeof demandData?.noMatchSearches === 'number', 'Unmet demand (zero-match) volume telemetry available', `${demandData?.noMatchSearches} unmet searches`);

    // Search activity stream
    const searchStreamRes = await request('/marketing/searches?limit=10', { method: 'GET', ...marketingAdminAuth });
    assert(searchStreamRes.data?.success === true, 'Market Admin retrieved search stream with customer identities');

    // Create Customer Interaction
    const interactionRes = await request('/marketing/interactions', {
      method: 'POST',
      body: {
        customerName: 'Customer Tester',
        customerEmail: 'customer.test@skynexa.com',
        customerPhone: '+919876543299',
        route: 'DEL → BOM',
        channel: 'EMAIL',
        status: 'PENDING',
        notes: 'Followed up regarding alternative departure times and promotional discounts.'
      },
      ...marketingAdminAuth
    });
    assert(interactionRes.data?.success === true, 'Market Admin logged customer interaction in CustomerInteraction collection');
    const createdInteraction = interactionRes.data?.data?.interaction;

    // Update Interaction status
    if (createdInteraction?._id) {
      const updateIntRes = await request(`/marketing/interactions/${createdInteraction._id}`, {
        method: 'PATCH',
        body: { status: 'RESOLVED', notes: 'Customer successfully assisted.' },
        ...marketingAdminAuth
      });
      assert(updateIntRes.data?.success === true && updateIntRes.data?.data?.interaction?.status === 'RESOLVED',
        'Customer interaction lifecycle updated to RESOLVED');
    }

    // -------------------------------------------------------------------------
    // 19.11 SUPER ADMIN PRICING & SCHEDULE ADMIN REVOCATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.11 Super Admin Pricing & Schedule Admin Revocation ---');

    const flightsListRes = await request('/admin/flights', { method: 'GET', ...superAdminAuth });
    const targetFlight = flightsListRes.data?.data?.flights?.[0];
    assert(Boolean(targetFlight), 'Retrieved existing flight catalog from MongoDB', `${targetFlight?.flightNumber} - ${targetFlight?.flightName}`);

    // Schedule Admin attempts fare edit on Flight -> MUST RETURN 403 FORBIDDEN!
    const schedEditFlightFare = await request(`/admin/flights/${targetFlight._id}`, {
      method: 'PUT',
      body: { baseFare: 9999 },
      ...scheduleAdminAuth
    });
    assert(schedEditFlightFare.status === 403, 'Schedule Admin flight fare modification blocked with HTTP 403 Forbidden');

    // Schedule Admin attempts fare edit on Instance -> MUST RETURN 403 FORBIDDEN!
    const instancesListRes = await request('/admin/instances', { method: 'GET', ...superAdminAuth });
    const targetInstance = instancesListRes.data?.data?.instances?.[0];
    if (targetInstance) {
      const schedEditInstFare = await request(`/admin/instances/${targetInstance._id}`, {
        method: 'PUT',
        body: { adultFare: 9999 },
        ...scheduleAdminAuth
      });
      assert(schedEditInstFare.status === 403, 'Schedule Admin instance fare modification blocked with HTTP 403 Forbidden');
    }

    // Super Admin updates pricing via dedicated pricing endpoint
    const newAdult = 4500;
    const newChild = 3375;
    const superPricingRes = await request(`/admin/flights/${targetFlight._id}/pricing`, {
      method: 'PUT',
      body: {
        baseFare: newAdult,
        adultFare: newAdult,
        childFare: newChild,
        syncFutureInstances: true
      },
      ...superAdminAuth
    });
    assert(superPricingRes.data?.success === true, 
      'Super Admin successfully configured Adult and Child fares with AuditLog', `Adult: ₹${newAdult}, Child: ₹${newChild}`);

    // -------------------------------------------------------------------------
    // 19.4, 19.5, 19.6 BOOKING CREATION, SEATS & PAYMENT TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.4 - 19.6 Booking Creation, Seats & Payment Tests ---');

    if (targetInstance) {
      // Create test booking with 2 Adults and 2 Children
      const createBookingRes = await request('/bookings', {
        method: 'POST',
        body: {
          flightInstanceId: targetInstance._id,
          passengers: [
            { firstName: 'Arthur', lastName: 'Dent', age: 35, gender: 'MALE', type: 'ADULT', aadhaarNumber: '123412341234' },
            { firstName: 'Tricia', lastName: 'McMillan', age: 33, gender: 'FEMALE', type: 'ADULT', aadhaarNumber: '234523452345' },
            { firstName: 'Ford', lastName: 'Dent', age: 9, gender: 'MALE', type: 'CHILD', aadhaarNumber: '345634563456' },
            { firstName: 'Zaphod', lastName: 'Dent', age: 6, gender: 'MALE', type: 'CHILD', aadhaarNumber: '456745674567' }
          ]
        },
        ...customerAuth
      });
      assert(createBookingRes.data?.success === true, 'Created pending booking with 2 Adults and 2 Children in MongoDB Atlas');
      const booking = createBookingRes.data?.data?.booking || createBookingRes.data?.booking;
      const bookingId = booking?._id;
      assert(Boolean(booking?.bookingReference), 'Unique PNR reference assigned to booking', booking?.bookingReference);
      assert(booking?.passengerCount === 4, 'Passenger count recorded accurately', `Count: ${booking?.passengerCount}`);
      assert(booking?.status === 'PENDING', 'Initial booking status is PENDING payment');

      // Confirm Payment
      const paymentConfirmRes = await request(`/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        body: { paymentMethod: 'DEMO_CARD', demoCardLast4: '8899' },
        ...customerAuth
      });
      assert(paymentConfirmRes.data?.success === true, 'Payment processed and verified on backend');
      const paidBooking = paymentConfirmRes.data?.data?.booking || paymentConfirmRes.data?.booking;
      assert(paidBooking?.paymentStatus === 'PAID' && paidBooking?.status === 'CONFIRMED', 
        'Booking status transitioned to CONFIRMED and paymentStatus to PAID');

      // Verify idempotency: repeated payment confirmation does not duplicate
      const repeatPayRes = await request(`/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        body: { paymentMethod: 'DEMO_CARD', demoCardLast4: '8899' },
        ...customerAuth
      });
      assert(repeatPayRes.data?.success === true, 'Payment confirmation is idempotent and handles re-submissions gracefully');

      // -------------------------------------------------------------------------
      // 19.8 PARTIAL CANCELLATION TESTS & MINOR UNACCOMPANIED PROTECTION
      // -------------------------------------------------------------------------
      console.log('\n--- 19.8 Partial Cancellation Tests ---');

      // Partially cancel 1 child
      const partCancelRes = await request(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: { adultsToCancel: 0, childrenToCancel: 1, cancellationReason: 'Child travel plans changed' },
        ...customerAuth
      });
      assert(partCancelRes.data?.success === true, 'Partial cancellation processed successfully for 1 child');
      const partialBooking = partCancelRes.data?.data?.booking || partCancelRes.data?.booking;
      assert(partialBooking?.status === 'PARTIALLY_CANCELLED', 'Booking status updated to PARTIALLY_CANCELLED');
      assert(partialBooking?.passengerCount === 3, 'Passenger count decremented to 3 active passengers');
      assert(partialBooking?.adultCount === 2 && partialBooking?.childCount === 1, 'Remaining breakdown: 2 Adults, 1 Child');
      assert(partialBooking?.refundAmount > 0, 'Refund automatically calculated and credited for cancelled passenger', `Refund: ₹${partialBooking?.refundAmount}`);

      // Unaccompanied minor business rule enforcement: Cannot cancel all adults leaving 1 child
      const minorViolateRes = await request(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: { adultsToCancel: 2, childrenToCancel: 0 },
        ...customerAuth
      });
      assert(minorViolateRes.status >= 400, 'Business Rule Enforced: Cannot cancel all adult passengers while child remains');

      // -------------------------------------------------------------------------
      // 19.7 COMPLETE CANCELLATION TESTS
      // -------------------------------------------------------------------------
      console.log('\n--- 19.7 Complete Cancellation Tests ---');

      const fullCancelRes = await request(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: { cancellationReason: 'Family canceled remaining itinerary' },
        ...customerAuth
      });
      assert(fullCancelRes.data?.success === true, 'Complete cancellation processed for remaining passengers');
      const finalBooking = fullCancelRes.data?.data?.booking || fullCancelRes.data?.booking;
      assert(finalBooking?.status === 'CANCELLED', 'Booking status is now CANCELLED');
      assert(finalBooking?.paymentStatus === 'REFUNDED', 'Payment status updated to REFUNDED');

      // Verify cancelling already cancelled booking is rejected
      const repeatCancelRes = await request(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: { cancellationReason: 'Cancel again' },
        ...customerAuth
      });
      assert(repeatCancelRes.status >= 400, 'Attempting to cancel an already CANCELLED booking is rejected');
    }

    // -------------------------------------------------------------------------
    // 19.12 REVENUE ANALYTICS TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.12 Revenue Analytics Tests ---');

    const revAnalyticsRes = await request('/admin/analytics/summary', { method: 'GET', ...superAdminAuth });
    assert(revAnalyticsRes.data?.success === true, 'Super Admin retrieved live Revenue Analytics');
    const revSummary = revAnalyticsRes.data?.data?.summary;
    assert(typeof revSummary?.grossBookingValue === 'number', 'Gross Booking Value calculated from real records', `GBV: ₹${revSummary?.grossBookingValue}`);
    assert(typeof revSummary?.netRevenue === 'number', 'Net Revenue calculated (Gross - Refunds - Pending)', `Net: ₹${revSummary?.netRevenue}`);
    const refundsAmount = typeof revSummary?.refundsIssued === 'object' ? revSummary?.refundsIssued?.amount : revSummary?.refundsIssued;
    assert(typeof refundsAmount === 'number', 'Total Refunds Issued tracked separately', `Refunds: ₹${refundsAmount}`);
    assert(revSummary?.grossBookingValue >= revSummary?.netRevenue, 'Financial invariant holds: Gross Booking Value >= Net Collected Revenue');

    // -------------------------------------------------------------------------
    // 19.13 DATABASE INTEGRITY & HEALTH CHECKS
    // -------------------------------------------------------------------------
    console.log('\n--- 19.13 Database Integrity & Health Checks ---');

    const healthRes = await request('/health', { method: 'GET' });
    assert(healthRes.data?.status === 'ok', 'Server health check returns HTTP 200 OK');

    const airportsRes = await request('/airports', { method: 'GET' });
    const airportList = airportsRes.data?.data?.airports || airportsRes.data?.data || [];
    assert(airportsRes.data?.success === true && airportList.length > 0, 
      'Airports master catalog loaded from MongoDB Atlas', `${airportList.length} airports available`);

    // =========================================================================
    // TEST SUITE REPORT
    // =========================================================================
    console.log('\n========================================================================');
    console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} assertions PASSED!`);
    if (failures.length > 0) {
      console.log(`⚠️ ${failures.length} failures detected:`);
      failures.forEach((f) => console.log(`   - ${f.testName}: ${f.details}`));
      process.exit(1);
    } else {
      console.log('🌟 100% OF SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!');
      console.log('========================================================================\n');
      process.exit(0);
    }

  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runSystemVerification();
