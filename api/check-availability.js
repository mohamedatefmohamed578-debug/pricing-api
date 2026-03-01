export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { preferred_day, preferred_time, estimated_duration } = req.body;

    if (!preferred_day || !preferred_time || !estimated_duration) {
      return res.status(400).json({
        error: "preferred_day, preferred_time, and estimated_duration are required"
      });
    }

    return res.status(200).json({
      status: "ok",
      received: {
        preferred_day,
        preferred_time,
        estimated_duration
      }
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
