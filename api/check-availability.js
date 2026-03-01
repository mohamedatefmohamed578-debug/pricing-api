export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { preferred_day } = req.body;

    if (!preferred_day) {
      return res.status(400).json({
        error: "preferred_day is required"
      });
    }

    // Call Cal.com availability endpoint
    const response = await fetch(
      "https://api.cal.com/v1/availability",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    return res.status(200).json({
      status: "cal_response",
      data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Cal API error",
      details: error.message
    });
  }
}
