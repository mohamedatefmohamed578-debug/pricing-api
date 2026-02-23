export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bedrooms, bathrooms, frequency } = req.body;

  // 1. التحقق من وجود المتغيرات (مع السماح بقيمة الصفر)
  if (bedrooms === undefined || bedrooms === null || bathrooms === undefined || bathrooms === null || !frequency) {
    return res.status(400).json({ error: "Bedrooms, Bathrooms, and Frequency are required." });
  }

  // 2. تحويل القيم إلى أرقام والتحقق من أنها ليست سالبة
  const beds = Number(bedrooms);
  const baths = Number(bathrooms);

  if (isNaN(beds) || beds < 0 || isNaN(baths) || baths < 0) {
    return res.status(400).json({ error: "Bedrooms and Bathrooms must be valid numbers (0 or higher)." });
  }

  // 3. معالجة وتوحيد التكرار مع تحديد نسبة الخصم في نفس الوقت (اختصار للحشو)
  const f = String(frequency).toLowerCase().replace("-", "").trim();
  let normalizedFrequency = null;
  let discountPercent = 0;

  if (["weekly", "every week", "once a week"].includes(f)) {
    normalizedFrequency = "weekly";
    discountPercent = 20;
  } else if (["biweekly", "every two weeks", "every 2 weeks", "twice a month"].includes(f)) {
    normalizedFrequency = "biweekly";
    discountPercent = 15;
  } else if (["monthly", "once a month", "every month"].includes(f)) {
    normalizedFrequency = "monthly";
    discountPercent = 10;
  }

  if (!normalizedFrequency) {
    return res.status(400).json({ error: "Invalid frequency value." });
  }

  // 4. الحسابات النهائية (دقيقة ومباشرة)
  const basePrice = (beds * 50) + (baths * 60);
  const firstTimePrice = basePrice * 1.30; // إضافة 30% لأول مرة
  const recurringPrice = basePrice * (1 - discountPercent / 100);
  const estimatedDuration = (beds * 20) + (baths * 30);

  // 5. إرسال النتيجة
  return res.status(200).json({
    recurring_price: Number(recurringPrice.toFixed(2)),
    first_time_price: Number(firstTimePrice.toFixed(2)),
    frequency_applied: normalizedFrequency,
    estimated_duration: `${estimatedDuration} minutes`
  });
}
