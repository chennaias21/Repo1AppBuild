/**
 * Business details shown on the policy and contact pages.
 *
 * ▶ ACTION REQUIRED before going live: replace every value marked TO BE FILLED.
 * Razorpay checks these pages during account activation, and the details here
 * must match what you register with them.
 */
export const BUSINESS = {
  /** Trading name shown across the site. */
  name: "Excel Mastery",

  /** Registered legal entity name, if different from the trading name. */
  legalName: "TO BE FILLED — your registered business or proprietor name",

  /** Full registered address including city, state and PIN code. */
  address: "TO BE FILLED — your registered business address, city, state, PIN",

  /** Support email address customers can actually reach you on. */
  supportEmail: "Excelmastery26@gmail.com",

  /** Support phone number including country code. */
  supportPhone: "TO BE FILLED — e.g. +91 98765 43210",

  /** Hours during which you respond to support requests. */
  supportHours: "Monday to Friday, 10:00 AM – 6:00 PM IST",

  /** How many hours you commit to responding within. */
  responseTimeHours: 48,

  /** Refund window in days from purchase. Keep this consistent with what you tell Razorpay. */
  refundWindowDays: 7,

  /** Date the policies were last reviewed. Update when you edit them. */
  policiesLastUpdated: "9 September 2026",
} as const;
