export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { text, voice_id } = req.query;

  if (!text || !voice_id) {
    return res.status(400).json({ error: "Missing text or voice_id" });
  }

  // حط الـ API Key الجديد بتاعك هنا بين علامات التنصيص
  const apiKey = "sk_ede5bbd6a821291c851cbfef4155f66380c1b9f444422f51"; 
  const modelId = "eleven_v3";

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_32`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    // هنا التعديل اللي هيفضح المشكلة:
    if (!response.ok) {
      const errorData = await response.text(); // هنجيب رسالة الخطأ الأصلية من 11Labs
      return res.status(response.status).json({ 
        error: "11Labs is rejecting the request", 
        status: response.status,
        details: errorData 
      });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
