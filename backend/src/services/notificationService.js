const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const BookingPassenger = require('../models/BookingPassenger');
const Payment = require('../models/Payment');
const User = require('../models/User');
require('../models/Airport');
require('../models/Flight');
require('../models/FlightInstance');
require('../models/AircraftLayout');
require('../models/Offer');

let resendClient = null;
const getResendClient = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

let nodemailerTransporter = null;
const getNodemailerTransporter = () => {
  if (!nodemailerTransporter) {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS;
    if (smtpUser && smtpPass) {
      if (process.env.SMTP_HOST) {
        nodemailerTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
      } else {
        nodemailerTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
      }
    }
  }
  return nodemailerTransporter;
};

/**
 * Send an email using Nodemailer (SMTP / Gmail) or Resend API
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
const sendEmail = async (to, subject, html) => {
  // 1. Try Nodemailer transport if SMTP / Gmail credentials are configured
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
      const info = await transporter.sendMail({
        from: `Skynexa Airlines <${fromAddr}>`,
        to,
        subject,
        html
      });
      console.log(`[SMTP Email Sent] Successfully delivered "${subject}" to ${to} (MessageID: ${info.messageId})`);
      return { success: true, data: { id: info.messageId } };
    } catch (smtpErr) {
      console.error(`[SMTP Transport Error for ${to}]:`, smtpErr.message);
      // Fallback to Resend if available
    }
  }

  // 2. Resend API
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('Neither SMTP nor Resend API key is configured. Email skipped.');
      return { success: false, error: 'Email provider not configured' };
    }

    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const result = await resend.emails.send({
      from: `Skynexa Airlines <${fromAddress}>`,
      to,
      subject,
      html
    });

    if (result.error) {
      console.error(`Resend returned error for ${to}:`, result.error.message);
      return { success: false, error: result.error.message };
    }

    console.log(`[Resend Email Sent] Successfully sent "${subject}" to ${to} (ID: ${result.data?.id})`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Failed to send email via Resend:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send an email using Resend with retry functionality and exponential backoff
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {number} maxRetries
 */
const sendEmailWithRetry = async (to, subject, html, maxRetries = 3) => {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await sendEmail(to, subject, html);
      if (res.success) {
        return { success: true, data: res.data, attempts: attempt };
      }
      lastError = new Error(res.error || 'Resend delivery failed');
      console.warn(`[Resend Attempt ${attempt}/${maxRetries} Failed] Recipient: ${to}, Error: ${lastError.message}`);

      // If sandbox domain restriction or validation error, retrying the exact same address won't succeed
      if (res.error && (res.error.includes('only send testing emails') || res.error.includes('validation_error'))) {
        const match = res.error.match(/own email address \(([^)]+)\)/i);
        const testOwnerEmail = (match ? match[1] : null) || process.env.RESEND_TEST_EMAIL || 'kmjestin25@gmail.com';

        if (testOwnerEmail && testOwnerEmail.toLowerCase() !== to.toLowerCase()) {
          console.log(`[Resend Sandbox Gateway] Intended recipient "${to}" is not a verified Resend domain. Forwarding dispatch to verified owner inbox "${testOwnerEmail}"...`);
          const sandboxSubject = `✈️ [Passenger: ${to}] ${subject}`;
          const sandboxBanner = `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px; margin-bottom:20px; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
              <div style="font-weight:bold; color:#1e40af; font-size:14px; margin-bottom:4px;">
                ✈️ SKYNEXA Sandbox Mode Dispatch
              </div>
              <p style="color:#1e3a8a; font-size:12px; margin:0; line-height:1.5;">
                This official E-Ticket was generated for passenger contact: <strong>${to}</strong>.<br/>
                Delivered to verified account inbox (<strong>${testOwnerEmail}</strong>) in compliance with Resend sandbox testing rules.
              </p>
            </div>
          `;
          const sandboxHtml = html.includes('<body>')
            ? html.replace(/<body[^>]*>/i, `$&${sandboxBanner}`)
            : `${sandboxBanner}${html}`;

          try {
            const fallbackRes = await sendEmail(testOwnerEmail, sandboxSubject, sandboxHtml);
            if (fallbackRes.success) {
              console.log(`[Resend Sandbox Gateway] ✅ E-Ticket delivered to ${testOwnerEmail} for passenger ${to} (ID: ${fallbackRes.data?.id})`);
              return {
                success: true,
                data: fallbackRes.data,
                isSandboxDelivered: true,
                targetEmail: to,
                deliveredTo: testOwnerEmail,
                attempts: attempt
              };
            }
          } catch (fbErr) {
            console.warn('[Resend Sandbox Fallback Exception]:', fbErr.message);
          }
        }

        return {
          success: false,
          error: res.error,
          isSandboxRestriction: res.error.includes('only send testing emails'),
          attempts: attempt
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Resend Attempt ${attempt}/${maxRetries} Exception] Recipient: ${to}, Error: ${err.message}`);
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  return { success: false, error: lastError?.message || 'Failed after maximum retry attempts' };
};

/**
 * Create an in-app notification
 */
const createNotification = async (userId, type, title, message) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message
    });
    return notification;
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
};

/**
 * Generate a luxury airline e-ticket HTML template
 */
const generateETicketHtml = ({ booking, passengers, payment }) => {
  const flightInstance = booking.flightInstanceId || {};
  const flight = flightInstance.flightId || booking.flightId || {};
  const origin = flight.originAirportId || flightInstance.originAirportId || {};
  const dest = flight.destinationAirportId || flightInstance.destinationAirportId || {};

  const flightCode = flight.flightNumber || flight.flightCode || booking.flightNumber || 'SK-101';
  const flightName = flight.flightName || booking.flightName || 'Skynexa Airways';
  const aircraft = flight.aircraftLayoutId?.name || flight.aircraft || 'Airbus A320neo';

  const originCode = origin.code || flight.origin || 'DEL';
  const originCity = origin.city || origin.name || originCode;
  const originName = origin.name || `${originCity} International Airport`;

  const destCode = dest.code || flight.destination || 'BOM';
  const destCity = dest.city || dest.name || destCode;
  const destName = dest.name || `${destCity} International Airport`;

  const rawDate = flightInstance.travelDate || flightInstance.departureDateTime || booking.departureDateTime;
  const travelDateStr = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

  let depTimeStr = '08:30 AM';
  if (flightInstance.departureDateTime) {
    depTimeStr = new Date(flightInstance.departureDateTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } else if (flightInstance.scheduleId?.departureTime) {
    depTimeStr = flightInstance.scheduleId.departureTime;
  }

  let arrTimeStr = '11:45 AM';
  if (flightInstance.arrivalDateTime) {
    arrTimeStr = new Date(flightInstance.arrivalDateTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } else if (flightInstance.scheduleId?.arrivalTime) {
    arrTimeStr = flightInstance.scheduleId.arrivalTime;
  }

  const passengerList = Array.isArray(passengers) && passengers.length > 0
    ? passengers
    : (booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0
        ? booking.passengers
        : [{ firstName: 'Valued', lastName: 'Passenger', type: 'ADULT', seatNumber: '1A' }]);

  const passengerRowsHtml = passengerList
    .map(
      (p, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 12px 14px; font-weight: bold; color: #0f172a; font-size: 13px;">
          ${p.firstName || ''} ${p.lastName || ''}
        </td>
        <td style="padding: 12px 14px; color: #475569; font-size: 12px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600;">
            ${p.type || 'ADULT'}
          </span>
        </td>
        <td style="padding: 12px 14px; font-weight: 800; color: #0284c7; font-size: 14px; font-family: monospace;">
          ${p.seatNumber || 'Assigned at Check-in'}
        </td>
        <td style="padding: 12px 14px; color: #64748b; font-size: 12px;">
          15 kg Checked + 7 kg Cabin
        </td>
      </tr>
    `
    )
    .join('');

  const subtotal = booking.subtotal ? `₹${booking.subtotal.toLocaleString('en-IN')}` : `₹${booking.totalAmount.toLocaleString('en-IN')}`;
  const discount = booking.discountAmount > 0 ? `-₹${booking.discountAmount.toLocaleString('en-IN')}` : null;
  const total = `₹${booking.totalAmount.toLocaleString('en-IN')}`;

  const paymentMethod = payment?.method === 'DEMO_UPI' ? 'Demo UPI' : `Demo Card (ending ${payment?.demoCardLast4 || '4242'})`;
  const txnRef = payment?.transactionReference || `TXN-${booking.bookingReference}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official E-Ticket - Skynexa Airlines</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">

        <!-- Top Airlines Brand Banner -->
        <div style="background: linear-gradient(135deg, #071527 0%, #0B1F3A 50%, #0c2e56 100%); padding: 26px 28px; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">✈ SKYNEXA</span>
                  <span style="font-size: 11px; background: #2496ED; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; margin-left: 8px;">Airlines</span>
                </div>
                <div style="color: #94a3b8; font-size: 11px; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase;">
                  Smarter Flights. Simpler Journeys.
                </div>
              </td>
              <td align="right">
                <span style="display: inline-block; background: rgba(36, 150, 237, 0.2); border: 1px solid rgba(36, 150, 237, 0.4); color: #38bdf8; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                  Confirmed E-Ticket
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Booking Reference Barcode Header -->
        <div style="background: #f8fafc; border-bottom: 2px dashed #cbd5e1; padding: 18px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Booking Reference / PNR</div>
                <div style="font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; font-family: monospace; margin-top: 2px;">
                  ${booking.bookingReference}
                </div>
              </td>
              <td align="right">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Status</div>
                <div style="font-size: 14px; font-weight: bold; color: #16a34a; margin-top: 2px;">
                  ● CONFIRMED & PAID
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Flight Corridor Display -->
        <div style="padding: 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="38%" style="vertical-align: top;">
                <div style="font-size: 32px; font-weight: 900; color: #0B1F3A; font-family: monospace; line-height: 1;">
                  ${originCode}
                </div>
                <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 4px;">
                  ${originCity}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  ${originName}
                </div>
                <div style="font-size: 18px; font-weight: 800; color: #0284c7; margin-top: 10px; font-family: monospace;">
                  ${depTimeStr}
                </div>
                <div style="font-size: 12px; color: #475569; font-weight: 500;">
                  ${travelDateStr}
                </div>
              </td>

              <td width="24%" align="center" style="vertical-align: middle;">
                <div style="font-size: 11px; font-weight: bold; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${flightCode}
                </div>
                <div style="color: #2496ED; font-size: 22px; margin: 4px 0;">
                  ✈ ─── ✈
                </div>
                <div style="font-size: 11px; color: #64748b;">
                  Non-Stop
                </div>
              </td>

              <td width="38%" align="right" style="vertical-align: top;">
                <div style="font-size: 32px; font-weight: 900; color: #0B1F3A; font-family: monospace; line-height: 1;">
                  ${destCode}
                </div>
                <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 4px;">
                  ${destCity}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  ${destName}
                </div>
                <div style="font-size: 18px; font-weight: 800; color: #0284c7; margin-top: 10px; font-family: monospace;">
                  ${arrTimeStr}
                </div>
                <div style="font-size: 12px; color: #475569; font-weight: 500;">
                  ${travelDateStr}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Passengers & Allocated Seats Table -->
        <div style="padding: 0 28px 20px 28px;">
          <div style="font-size: 13px; font-weight: 800; color: #0B1F3A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
            Passenger Manifest &amp; Assigned Seats
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 10px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Passenger Name</th>
                <th style="padding: 10px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Type</th>
                <th style="padding: 10px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Seat Number</th>
                <th style="padding: 10px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Baggage</th>
              </tr>
            </thead>
            <tbody>
              ${passengerRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Payment Receipt Section -->
        <div style="margin: 0 28px 24px 28px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size: 12px; font-weight: bold; color: #334155; text-transform: uppercase;">Payment Summary</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                  Payment Method: <strong>${paymentMethod}</strong>
                </div>
                <div style="font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 2px;">
                  Ref: ${txnRef}
                </div>
              </td>
              <td align="right">
                <div style="font-size: 12px; color: #64748b;">Subtotal: ${subtotal}</div>
                ${discount ? `<div style="font-size: 12px; color: #16a34a; font-weight: bold;">Promo Discount (${booking.offerCode || 'CODE'}): ${discount}</div>` : ''}
                <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                  Total Paid: <span style="color: #16a34a;">${total}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Important Travel Advisory -->
        <div style="padding: 0 28px 24px 28px;">
          <div style="background-color: #eff6ff; border-left: 4px solid #2496ED; padding: 14px 16px; border-radius: 0 8px 8px 0;">
            <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 6px;">
              ✈ Important Travel &amp; Check-In Guidelines:
            </div>
            <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #334155; line-height: 1.6;">
              <li><strong>Web Check-In:</strong> Opens 24 hours prior to scheduled departure.</li>
              <li><strong>Airport Reporting:</strong> Please report at airport check-in counter at least 60 minutes before domestic departure.</li>
              <li><strong>Photo ID:</strong> Valid government-issued photo ID (Aadhaar, Passport, Voter ID) is mandatory for airport entry.</li>
              <li><strong>Baggage:</strong> 15 kg check-in baggage + 7 kg hand cabin luggage per passenger.</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #071527; padding: 20px 28px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #1e293b;">
          <div style="font-weight: bold; color: #ffffff; margin-bottom: 4px;">
            Thank you for choosing Skynexa Airlines!
          </div>
          <div>24/7 Priority Support: +91 (044) 2256-SKYN &bull; support@skynexa.com</div>
          <div style="margin-top: 8px; color: #64748b; font-size: 10px;">
            &copy; 2026 Skynexa Aviation Technologies Inc. All rights reserved.
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Send official E-Ticket confirmation email to customer
 * Automatically queries MongoDB Atlas for customer email and booking details
 * Enforces duplicate prevention, retries, and comprehensive error logging
 */
const sendBookingConfirmationEmail = async (targetOrBooking, bookingArg = null, passengersArg = null, paymentArg = null, optionsArg = {}) => {
  let targetEmail = null;
  let bookingId = null;
  let passedBooking = null;
  let options = {};

  if (typeof targetOrBooking === 'string' && targetOrBooking.includes('@')) {
    targetEmail = targetOrBooking.toLowerCase().trim();
    passedBooking = bookingArg;
    bookingId = bookingArg?._id || bookingArg?.id;
    options = optionsArg || {};
  } else {
    passedBooking = targetOrBooking;
    bookingId = targetOrBooking?._id || targetOrBooking?.id || targetOrBooking;
    options = bookingArg || optionsArg || {};
    if (options.customEmail) {
      targetEmail = options.customEmail.toLowerCase().trim();
    }
  }

  try {
    if (!bookingId) {
      console.error('[Email Service] Error: bookingId is required to send confirmation email');
      return { success: false, error: 'Booking ID is required' };
    }

    // 1. Fetch fully populated booking from MongoDB Atlas
    let booking = await Booking.findById(bookingId)
      .populate({
        path: 'flightInstanceId',
        populate: {
          path: 'flightId',
          populate: [
            { path: 'originAirportId', model: 'Airport' },
            { path: 'destinationAirportId', model: 'Airport' },
            { path: 'aircraftLayoutId', model: 'AircraftLayout' }
          ]
        }
      })
      .populate('offerId');

    if (!booking) {
      if (passedBooking && typeof passedBooking === 'object') {
        booking = passedBooking;
      } else {
        console.error(`[Email Service] Booking ${bookingId} not found in MongoDB Atlas`);
        return { success: false, error: 'Booking not found' };
      }
    }

    // 2. Prevent Duplicate Emails (Requirement 5)
    if (booking.emailSent && !options.forceResend) {
      console.log(`[Email Service] ℹ️ Duplicate prevented: Confirmation email already sent for PNR ${booking.bookingReference} on ${booking.emailSentAt}.`);
      return {
        success: true,
        duplicatePrevented: true,
        message: 'Confirmation email already sent for this booking',
        bookingReference: booking.bookingReference
      };
    }

    // 3. Resolve recipient email address directly from booking form (contactEmail) or MongoDB User
    const bookingContactEmail = booking.contactEmail ? booking.contactEmail.toLowerCase().trim() : null;

    let customer = null;
    if (booking.userId) {
      customer = await User.findById(booking.userId);
    }
    const registeredEmail = customer?.email ? customer.email.toLowerCase().trim() : null;

    // Highest priority: Explicit target / custom email requested -> Email filled on the booking form -> Registered user email
    const resolvedEmail = targetEmail || bookingContactEmail || registeredEmail;
    console.log(`[Email Service] Target recipient determined for booking ${booking.bookingReference}: "${resolvedEmail || 'NONE'}" (Form contactEmail: "${bookingContactEmail || 'N/A'}", User email: "${registeredEmail || 'N/A'}")`);

    if (!resolvedEmail) {
      console.error(`[Email Service] Error: No recipient email address found for booking PNR ${booking.bookingReference}`);
      return { success: false, error: 'Recipient email address is required' };
    }

    // 4. Fetch passengers and payment details from MongoDB Atlas if not supplied
    let passengers = passengersArg;
    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      if (booking._id) {
        passengers = await BookingPassenger.find({ bookingId: booking._id, status: { $ne: 'CANCELLED' } });
      }
    }

    let payment = paymentArg;
    if (!payment && booking._id) {
      payment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });
    }

    // 5. Generate Email Subject & HTML (Requirement 2)
    const flightInstance = booking.flightInstanceId || {};
    const flight = flightInstance.flightId || booking.flightId || {};
    const flightNumber = flight.flightNumber || flight.flightCode || booking.flightNumber || 'SK-101';
    const originCode = flight.originAirportId?.code || flight.origin || 'DEL';
    const destCode = flight.destinationAirportId?.code || flight.destination || 'BOM';

    const subject = `✈️ Your Skynexa E-Ticket: ${booking.bookingReference} (${flightNumber}: ${originCode} → ${destCode})`;
    const html = generateETicketHtml({ booking, passengers, payment });

    // 6. Send via Resend API directly to the user's email address
    console.log(`[Email Service] Dispatching E-Ticket via Resend API directly to ${resolvedEmail} for PNR ${booking.bookingReference}...`);
    const sendResult = await sendEmailWithRetry(resolvedEmail, subject, html, 3);

    // 7. Update booking document in MongoDB Atlas with delivery outcome
    if (booking._id) {
      if (sendResult.success) {
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            emailSent: true,
            emailSentAt: new Date(),
            emailDeliveredTo: sendResult.deliveredTo || resolvedEmail,
            emailDeliveryId: sendResult.data?.id || (sendResult.isSandboxDelivered ? 'sandbox-delivered' : 'resend-delivered'),
            emailDeliveryError: null,
            lastEmailAttemptAt: new Date()
          },
          $inc: { emailAttempts: 1 }
        });
        console.log(`[Email Service] ✅ E-Ticket dispatched successfully to ${sendResult.deliveredTo || resolvedEmail} for PNR ${booking.bookingReference} (Delivery ID: ${sendResult.data?.id})`);
      } else {
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            emailSent: false,
            emailDeliveryError: sendResult.error,
            lastEmailAttemptAt: new Date()
          },
          $inc: { emailAttempts: 1 }
        });
        console.error(`[Email Service] ❌ E-Ticket delivery failed to ${resolvedEmail} for PNR ${booking.bookingReference}: ${sendResult.error}`);
      }
    }

    return {
      success: sendResult.success,
      deliveryId: sendResult.data?.id || null,
      isSandboxDelivered: Boolean(sendResult.isSandboxDelivered),
      deliveredTo: sendResult.deliveredTo || resolvedEmail,
      error: sendResult.error || null,
      targetEmail: resolvedEmail,
      bookingReference: booking.bookingReference
    };
  } catch (err) {
    console.error('[Email Service] Unexpected error in confirmation email workflow:', err.message);
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          emailSent: false,
          emailDeliveryError: err.message,
          lastEmailAttemptAt: new Date()
        },
        $inc: { emailAttempts: 1 }
      }).catch(() => {});
    }
    // Requirement 7: Ensure temporary email failure never cancels a confirmed booking
    return { success: false, error: err.message };
  }
};

/**
 * Helper to send password reset OTP email
 */
const sendOtpEmail = async (userEmail, otp) => {
  const subject = `🔐 ${otp} is your Skynexa verification OTP`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:24px; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width:540px; margin:0 auto; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #071527 0%, #0B1F3A 100%); padding:24px 28px; color:#ffffff;">
          <h2 style="margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">✈ SKYNEXA AIRLINES</h2>
          <p style="margin:4px 0 0; font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Account Security &amp; Verification</p>
        </div>
        <div style="padding:28px;">
          <h3 style="margin-top:0; color:#0f172a; font-size:18px;">Password Reset Verification Code</h3>
          <p style="color:#475569; font-size:13px; line-height:1.6;">
            We received a request to reset your Skynexa account password. Use the single-use 6-digit OTP below to verify your identity and set a new password:
          </p>
          <div style="text-align:center; margin:26px 0;">
            <div style="display:inline-block; letter-spacing:8px; font-size:32px; font-weight:900; color:#0284c7; background:#f0f9ff; padding:16px 28px; border-radius:12px; border:2px dashed #38bdf8; font-family:monospace;">
              ${otp}
            </div>
            <p style="color:#64748b; font-size:11px; margin-top:8px;">Valid for <strong>10 minutes</strong> only</p>
          </div>
          <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:10px 14px; border-radius:0 8px 8px 0; font-size:11px; color:#92400e;">
            <strong>Security Notice:</strong> Never share this code with anyone. Skynexa staff will never ask for your OTP.
          </div>
        </div>
        <div style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px 28px; text-align:center; font-size:11px; color:#94a3b8;">
          If you did not request this code, you can safely ignore this email. Your password will remain unchanged.
        </div>
      </div>
    </body>
    </html>
  `;

  // Deliver directly to userEmail
  if (userEmail) {
    await sendEmail(userEmail, subject, html);
  }

  return { success: true };
};

/**
 * Helper to send password reset email
 */
const sendPasswordResetEmail = async (userEmail, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #0284c7;">Skynexa Password Reset</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="font-size: 0.85em; color: #64748b;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail(userEmail, 'Skynexa Password Reset Request', html);
};

module.exports = {
  sendEmail,
  sendEmailWithRetry,
  createNotification,
  sendBookingConfirmationEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
  generateETicketHtml
};
