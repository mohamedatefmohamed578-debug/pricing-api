export default function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bedrooms, bathrooms, frequency } = req.body;

  if (!bedrooms || !bathrooms || !frequency) {
    return res.status(400).json({
      error: "Bedrooms, Bathrooms, and Frequency are required."
    });
  }

  /* =========================
     🔧 PRICING VARIABLES
  ========================= */

  const PRICE_PER_BEDROOM = 50;
  const PRICE_PER_BATHROOM = 60;

  const WEEKLY_DISCOUNT = 20;
  const BIWEEKLY_DISCOUNT = 15;
  const MONTHLY_DISCOUNT = 10;

  const FIRST_TIME_SURCHARGE = 30;

  const MINUTES_PER_BEDROOM = 20;
  const MINUTES_PER_BATHROOM = 30;

  /* =========================
     🧠 Normalize Frequency
  ========================= */

  function normalizeFrequency(input) {
    const f = input.toLowerCase().replace("-", "").trim();

    if (
      f === "weekly" ||
      f === "every week" ||
      f === "once a week"
    ) return "weekly";

    if (
      f === "biweekly" ||
      f === "every two weeks" ||
      f === "every 2 weeks" ||
      f === "twice a month"
    ) return "biweekly";

    if (
      f === "monthly" ||
      f === "once a month" ||
      f === "every month"
    ) return "monthly";

    return null;
  }

  const normalizedFrequency = normalizeFrequency(frequency);

  if (!normalizedFrequency) {
    return res.status(400).json({
      error: "Invalid frequency value."
    });
  }

  /* =========================
     🧮 Convert to Numbers
  ========================= */

  const beds = Number(bedrooms);
  const baths = Number(bathrooms);

  const basePrice =
    beds * PRICE_PER_BEDROOM +
    baths * PRICE_PER_BATHROOM;

  /* =========================
     🏠 Deep Clean
  ========================= */

  const firstTimePrice =
    basePrice +
    (basePrice * FIRST_TIME_SURCHARGE) / 100;

  /* =========================
     🔁 Discount Logic
  ========================= */

  let discountPercent = 0;

  if (normalizedFrequency === "weekly")
    discountPercent = WEEKLY_DISCOUNT;

  if (normalizedFrequency === "biweekly")
    discountPercent = BIWEEKLY_DISCOUNT;

  if (normalizedFrequency === "monthly")
    discountPercent = MONTHLY_DISCOUNT;

  const recurringPrice =
    basePrice -
    (basePrice * discountPercent) / 100;

  /* =========================
     ⏱ Duration
  ========================= */

  const estimatedDuration =
    beds * MINUTES_PER_BEDROOM +
    baths * MINUTES_PER_BATHROOM;

  /* =========================
     📤 Response
  ========================= */

  return res.status(200).json({
    recurring_price: Number(recurringPrice.toFixed(2)),
    first_time_price: Number(firstTimePrice.toFixed(2)),
    frequency_applied: normalizedFrequency,
    estimated_duration: `${estimatedDuration} minutes`
  });
}
