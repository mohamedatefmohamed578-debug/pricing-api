const axios = require('axios');
const chrono = require('chrono-node');

export default async function handler(req, res) {
  // التأكد إن الطلب جاي من Retell AI بصيغة POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { preferred_day, preferred_time, estimated_duration } = req.body;

  try {
    // 1. دمج اليوم والوقت زي ما العميل قالهم بالظبط
    const rawDateTime = `${preferred_day} ${preferred_time}`;
    
    // 2. ترجمة الكلام البشري لتاريخ دقيق
    const parsedDate = chrono.parseDate(rawDateTime);
    
    if (!parsedDate) {
      return res.status(200).json({
        is_available: false,
        agent_instruction: "لم أتمكن من تحديد الوقت بدقة. يرجى سؤال العميل عن توضيح الوقت والتاريخ بشكل أدق."
      });
    }

    // 3. حساب وقت البداية والنهاية بناءً على المدة الديناميكية
    const startTime = parsedDate;
    
    // استخراج الدقائق من المدة (نفترض إن الـ API بتاعك بيبعت المدة زي "120 mins" أو بنحولها لرقم)
    // هنفترض هنا إن المدة بتتبعت بالدقائق كرقم، لو بتبعت كنص زي "2 hours" هنحتاج نظبطها
    const durationMinutes = parseInt(estimated_duration) || 120; // افتراضي ساعتين لو مفيش مدة
    
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // 4. الاتصال بـ Cal.com للتأكد من التوافر
    // هنستخدم الـ API Key والـ Event Type ID بتوعك هنا
    const CAL_API_KEY = process.env.CAL_API_KEY; // هنحط المفتاح في Vercel عشان الأمان
    const EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID;

    // استدعاء API تقويم Cal.com (v1/slots)
    const calResponse = await axios.get(`https://api.cal.com/v1/slots`, {
      params: {
        apiKey: CAL_API_KEY,
        eventTypeId: EVENT_TYPE_ID,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }
    });

    // 5. تحليل رد الكالندر
    const slots = calResponse.data.slots || {};
    const isAvailable = Object.keys(slots).length > 0; // لو في خانات فاضية يبقى متاح

    if (isAvailable) {
      return res.status(200).json({
        is_available: true,
        confirmed_start: startTime.toISOString(),
        confirmed_end: endTime.toISOString(),
        agent_instruction: "أخبر العميل أن الموعد متاح، وانتقل لخطوة تأكيد الحجز."
      });
    } else {
      return res.status(200).json({
        is_available: false,
        agent_instruction: "اعتذر للعميل بلطف وأخبره أن هذا الوقت غير متاح، واطلب منه اقتراح وقت آخر."
      });
    }

  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({ error: "حدث خطأ داخلي أثناء فحص التقويم." });
  }
}
