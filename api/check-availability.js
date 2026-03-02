const axios = require('axios');
const chrono = require('chrono-node');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { preferred_day, preferred_time, estimated_duration } = req.body;

  try {
    const rawDateTime = `${preferred_day} ${preferred_time}`;
    const parsedDate = chrono.parseDate(rawDateTime);
    
    if (!parsedDate) {
      return res.status(200).json({
        is_available: false,
        next_available_slots: [],
        agent_instruction: "لم أتمكن من تحديد الوقت بدقة."
      });
    }

    const startTime = parsedDate;
    const durationMinutes = parseInt(estimated_duration) || 120;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const CAL_API_KEY = process.env.CAL_API_KEY;
    const EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID;

    // 1. التحقق من الموعد المطلوب تحديداً
    const calResponse = await axios.get(`https://api.cal.com/v1/slots`, {
      params: {
        apiKey: CAL_API_KEY,
        eventTypeId: EVENT_TYPE_ID,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }
    });

    const slots = calResponse.data.slots || {};
    let isAvailable = false;
    const dateString = startTime.toISOString().split('T')[0];
    
    // التحقق هل الوقت ده متاح في نفس اليوم
    if (slots[dateString]) {
        const exactSlot = slots[dateString].find(s => new Date(s.time).getTime() === startTime.getTime());
        if (exactSlot) isAvailable = true;
    }

    if (isAvailable) {
      return res.status(200).json({
        is_available: true,
        confirmed_start: startTime.toISOString(),
        confirmed_end: endTime.toISOString(),
        next_available_slots: []
      });
    } else {
      // 2. الموعد غير متاح -> جلب أقرب مواعيد (نبحث في الـ 7 أيام القادمة)
      const futureEnd = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const futureResponse = await axios.get(`https://api.cal.com/v1/slots`, {
        params: {
          apiKey: CAL_API_KEY,
          eventTypeId: EVENT_TYPE_ID,
          startTime: startTime.toISOString(),
          endTime: futureEnd.toISOString(),
        }
      });

      const futureSlots = futureResponse.data.slots || {};
      let availableSlotsList = [];

      // تجميع كل المواعيد المتاحة
      for (const day in futureSlots) {
          for (const slot of futureSlots[day]) {
              const slotTime = new Date(slot.time);
              if (slotTime > startTime) {
                  availableSlotsList.push(slot.time);
              }
          }
      }

      // ترتيب المواعيد تصاعدياً وأخذ أقرب 2 مواعيد فقط
      availableSlotsList.sort((a, b) => new Date(a) - new Date(b));
      const next_available_slots = availableSlotsList.slice(0, 2);

      // تحويل التواريخ لصيغة بشرية جاهزة للوكيل (يوم وساعة)
      const next_available_slots_readable = next_available_slots.map(isoString => {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleString('en-US', { 
          weekday: 'long', 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true,
          timeZone: 'America/Los_Angeles' // تقدر تغير التايم زون حسب مكان شركتك
        });
      });

      return res.status(200).json({
        is_available: false,
        next_available_slots: next_available_slots,
        next_available_slots_readable: next_available_slots_readable
      });
    }

  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
