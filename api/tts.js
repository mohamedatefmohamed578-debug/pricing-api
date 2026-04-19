export default async function handler(req, res) {
  // 1. السماح بطلبات من أي مكان عشان Botpress مايعملش بلوك
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 2. استلام النص والـ Voice ID من الرابط
  const { text, voice_id } = req.query;

  if (!text || !voice_id) {
    return res.status(400).json({ error: "Missing text or voice_id" });
  }

  // 3. مفتاح 11Labs بتاعك
  const apiKey = "sk_0762b1449a9e629a3a652dcde9f33e37becda8bd6b15ddfe";
  const modelId = "eleven_multilingual_v2";

  try {
    // 4. الاتصال بـ 11Labs
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

    if (!response.ok) {
      return res.status(response.status).json({ error: "خطأ من 11Labs" });
    }

    // 5. استلام الصوت وإرساله كـ "رابط صوتي مباشر" (Streaming)
    const audioBuffer = await response.arrayBuffer();
    
    // إخبار المتصفح إن ده ملف صوتي MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    // إرسال الصوت
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
