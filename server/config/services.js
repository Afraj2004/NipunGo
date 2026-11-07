// Single source of truth for service pricing (server-side).
// Keep in sync with servicePrices in client/src/pages/Booking.jsx.
const SERVICE_PRICES = {
  'Plumber': 200,
  'Electrician': 250,
  'Carpenter': 300,
  'Painter': 350,
  'AC Mechanic': 400,
  'Cleaner': 150,
  'Locksmith': 200,
  'Gardener': 180,
  'IT Support': 300,
  'Laundry': 100,
  'Pest Control': 500,
  'Bathroom Fitter': 200,
};

const PLATFORM_FEE = 50;

// Total the customer pays, or null for an unknown service
const getBookingTotal = (service) =>
  Object.prototype.hasOwnProperty.call(SERVICE_PRICES, service)
    ? SERVICE_PRICES[service] + PLATFORM_FEE
    : null;

module.exports = { SERVICE_PRICES, PLATFORM_FEE, getBookingTotal };
