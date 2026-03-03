const axios = require('axios');
const chrono = require('chrono-node');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. استلام كل المتغيرات اللي الوكيل جمعها من العميل
  const { 
    preferred_day, 
    preferred_time, 
    estimated_duration,
    first_name,
    last_name,
    phone_number,
    street_address,
    zip_code
  } = req.body;

  try {
    // 2. تحويل وتجهيز وقت البداية والنهاية زي ما عملنا في الفحص
    const rawDateTime = `${preferred_day} ${preferred_time}`;
    const parsedDate = chrono.parseDate(rawDateTime);
    
    if (!parsedDate) {
      return res.status(200).json({
        booking_success: false,
        agent_instruction: "حدث خطأ في قراءة الوقت، يرجى سؤال العميل عن توضيح الوقت مرة أخرى."
      });
    }

    const startTime = parsedDate;
    const durationMinutes = parseInt(estimated_duration) || 120;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const CAL_API_KEY = process.env.CAL_API_KEY;
    const EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID;

    // 3. تجهيز بيانات العميل (بما فيها الإيميل الوهمي عشان Cal.com)
    const fullName = `${first_name} ${last_name}`;
    const dummyEmail = `${first_name.replace(/\s+/g, '') || 'client'}@cleaning-booking.com`;

    // 4. ضرب الـ API بتاع Cal.com لتأكيد الحجز الفعلي
    const bookingResponse = await axios.post(`https://api.cal.com/v1/bookings`, {
      eventTypeId: parseInt(EVENT_TYPE_ID),
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      responses: {
        name: fullName,
        email: dummyEmail,
        phone: phone_number,
        location: `${street_address} - ${zip_code}`
      },
      timeZone: 'America/Los_Angeles', // ⚠️ متنساش تعدل التايم زون ده لبتوع منطقتك
      metadata: {
        source: "Voice AI Agent"
      }
    }, {
      params: {
        apiKey: CAL_API_KEY
      }
    });

    // 5. الرد على Retell AI بالنجاح
    if (bookingResponse.data && bookingResponse.data.booking) {
      return res.status(200).json({
        booking_success: true,
        booking_id: bookingResponse.data.booking.id,
        agent_instruction: "تم تأكيد الحجز بنجاح في النظام. اشكر العميل وأنهي المكالمة بحماس."
      });
    } else {
      throw new Error("لم يرجع تأكيد الحجز من التقويم.");
    }

  } catch (error) {
    console.error("Error booking appointment:", error?.response?.data || error.message);
    return res.status(200).json({ 
      booking_success: false,
      agent_instruction: "اعتذر للعميل بلطف، وأخبره أن هناك عطل تقني بسيط في النظام يمنع تثبيت الحجز الآن، وسيقوم فريق الدعم بالاتصال به فوراً لتأكيد الموعد."
    });
  }
}
