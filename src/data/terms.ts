import type { Terms } from "../types";

/** Điều khoản mặc định (theo Tour_Itinerary_Template.docx). Mỗi package có bản sao riêng để sửa. */
export const DEFAULT_TERMS: Terms = {
  inclusions: [
    "Meals as indicated: L-Lunch, D-Dinner, B-Breakfast (if we book hotels)",
    "Hotel in double/twin/triple sharing room basis with daily breakfast (check-in 14:00 / check-out 12:00)",
    "All transfers and sightseeing tours on private basis with A/C unless specified SIC/Group tour",
    "Complimentary Mineral Water on tour (01-02 bottles of 500ml / guest / day)",
    "Entrance fees, boat trips, and excursions as per itinerary",
    "Experienced local English-speaking guide as per itinerary",
    "24/7 hotline support",
  ],
  exclusions: [
    "International / domestic flights",
    "Visa fees (if required)",
    "Personal expenses, tips, drinks, laundry",
    "Travel insurance",
    "Early check-in / late check-out",
    "Any services not mentioned in Inclusions",
    "Compulsory Gala Dinner (if applicable on Christmas / New Year Eve)",
  ],
  rates: [
    "This is only a standard itinerary and quote; the final itinerary and price are subject to change based on availability at booking time.",
    "Compulsory Gala Dinner will be applied on Christmas Eve and New Year's Eve.",
    "Supplementary charges apply during peak periods or special events (Xmas, New Year, Lunar New Year, National Holidays, Firework Festival...).",
  ],
  payment: [
    "Payment by cash, credit card or bank transfer. Customer bears all bank / transaction fees.",
    "Credit card surcharge: +3% (Visa/Mastercard/Debit) or +4% (American Express).",
    "Deposit: 30% of total price after confirmation.",
    "50% of deposit to be settled 30 days before arrival.",
    "Balance to be settled before arrival.",
  ],
  cancelFit: [
    "60 days or more: No fee (100% refund, excl. non-refundable flights)",
    "59–30 days: 10% fee",
    "29–15 days: 20% fee",
    "14–8 days: 50% fee",
    "7 days or less / No-show: 100% fee",
  ],
  cancelGit: [
    "60 days or more: No fee",
    "59–30 days: 30% fee",
    "29–15 days: 75% fee",
    "14 days or less / No-show: 100% fee",
  ],
  cancelNote: "Cancellation charge is calculated based on the total amount of the tour package stated in the invoice.",
};

export const cloneTerms = (): Terms => JSON.parse(JSON.stringify(DEFAULT_TERMS)) as Terms;
