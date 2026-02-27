export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bedrooms, bathrooms, frequency } = req.body;

  // 1. التحقق من وجود المتغيرات
  if (bedrooms === undefined || bedrooms === null || bathrooms === undefined || bathrooms === null || !frequency) {
    return res.status(400).json({ error: "Bedrooms, Bathrooms, and Frequency are required." });
  }

  const beds = Number(bedrooms);
  const baths = Number(bathrooms);

  if (isNaN(beds) || beds < 0 || isNaN(baths) || baths < 0) {
    return res.status(400).json({ error: "Bedrooms and Bathrooms must be valid numbers (0 or higher)." });
  }

  // 2. معالجة التكرار وتحديد نسبة الخصم
  const f = String(frequency).toLowerCase().replace("-", "").trim();
  let normalizedFrequency = null;
  let discountPercent = 0;

  if (["weekly", "every week", "once a week"].includes(f)) {
    normalizedFrequency = "weekly";
    discountPercent = 20;
  } else if (["biweekly", "every two weeks", "every 2 weeks", "twice a month", "bi-weekly"].includes(f)) {
    normalizedFrequency = "biweekly";
    discountPercent = 15;
  } else if (["monthly", "once a month", "every month"].includes(f)) {
    normalizedFrequency = "monthly";
    discountPercent = 10;
  }

  if (!normalizedFrequency) {
    return res.status(400).json({ error: "Invalid frequency value." });
  }

  // 3. الحسابات النهائية (بدون أي Deep Cleaning)
  const basePrice = (beds * 50) + (baths * 60); // السعر الأساسي للزيارة الواحدة (المرساة)
  const recurringPrice = basePrice * (1 - discountPercent / 100); // السعر بعد الخصم
  const estimatedDuration = (beds * 20) + (baths * 30);

  // 4. إرسال النتيجة
  return res.status(200).json({
    base_price: Number(basePrice.toFixed(2)),
    recurring_price: Number(recurringPrice.toFixed(2)),
    discount_percent: discountPercent,
    frequency_applied: normalizedFrequency,
    estimated_duration: `${estimatedDuration} minutes`
  });
}
