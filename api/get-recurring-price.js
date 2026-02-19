export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { frequency, bedrooms, bathrooms, company_id } = req.body;

  // تأكد إن الأرقام أرقام فعلًا
  const beds = Number(bedrooms);
  const baths = Number(bathrooms);

  let basePrice = 50;
  let bedroomPrice = beds * 20;
  let bathroomPrice = baths * 15;

  let frequencyMultiplier = 1;

  if (frequency === "weekly") frequencyMultiplier = 0.9;
  if (frequency === "biweekly") frequencyMultiplier = 1;
  if (frequency === "monthly") frequencyMultiplier = 1.2;

  const quoted_price = Math.round(
    (basePrice + bedroomPrice + bathroomPrice) * frequencyMultiplier
  );

  return res.status(200).json({ quoted_price });
}
