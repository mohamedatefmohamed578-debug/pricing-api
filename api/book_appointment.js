const axios = require('axios');
const chrono = require('chrono-node');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. استلام كل المتغيرات الجديدة من Retell AI
  const { 
    preferred_day, 
    preferred_time, 
    estimated_duration,
    first_name,
    last_name,
    street_address,
    zip_code,
    caller_phone,
    new_phone_number,
    access_instructions,
    pets_info,
    last_cleaning_timeframe
  } = req.body;

  try {
    // 2. تحويل وقت البداية والنهاية
    const rawDateTime = `${preferred_day} ${preferred_time}`;
    const parsedDate = chrono.parseDate(rawDateTime);
    
    if (!parsedDate) {
      return res.status(200).json({
        booking_success: false,
        agent_instruction: "There was an issue parsing the exact time. Please ask the caller to clarify their preferred time once more."
      });
    }

    const startTime = parsedDate;
    const durationMinutes = parseInt(estimated_duration) || 120;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const CAL_API_KEY = process.env.CAL_API_KEY;
    const EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID;

    // 3. تجهيز بيانات العميل بذكاء (باللغة الإنجليزية)
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'New Client';
    const dummyEmail = `${fullName.replace(/\s+/g, '') || 'client'}@cleaning-booking.com`;
    
    // منطق رقم التليفون (لو العميل ادى رقم جديد ناخده، لو لأ ناخد رقم المتصل)
    const finalPhone = new_phone_number || caller_phone || 'Not Provided';
    
    // العنوان بالكامل
    const fullAddress = `${street_address || ''}, ${zip_code || ''}`.trim();

    // 4. تنسيق الملاحظات التشغيلية لفريق التنظيف (عشان تظهر في جوجل كاليندر بالإنجليزي الاحترافي)
    const teamNotes = `
🧹 Cleaning Operation Details:
-------------------------
🔑 Access Instructions: ${access_instructions || 'Not Specified'}
🐶 Pets in Home: ${pets_info || 'None'}
📅 Last Professional Cleaning: ${last_cleaning_timeframe || 'Unknown'}
    `.trim();

    // 5. إرسال الحجز الفعلي لـ Cal.com
    const bookingResponse = await axios.post(`https://api.cal.com/v1/bookings`, {
      eventTypeId: parseInt(EVENT_TYPE_ID),
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      responses: {
        name: fullName,
        email: dummyEmail,
        phone: finalPhone,
        location: fullAddress,
        notes: teamNotes // هنا بنبعت الملاحظات النظيفة بالإنجليزي
      },
      timeZone: 'America/Los_Angeles', // ⚠️ تأكد من التايم زون للولاية اللي شغال فيها
      metadata: {
        source: "Voice AI Agent"
      }
    }, {
      params: {
        apiKey: CAL_API_KEY
      }
    });

    // 6. الرد على الوكيل بالنجاح (تعليمات إنجليزية احترافية للوكيل)
    if (bookingResponse.data && bookingResponse.data.booking) {
      return res.status(200).json({
        booking_success: true,
        booking_id: bookingResponse.data.booking.id,
        agent_instruction: "The appointment has been successfully booked in the system. Enthusiastically thank the customer for choosing us and warmly end the call."
      });
    } else {
      throw new Error("Did not receive booking confirmation from the calendar.");
    }

  } catch (error) {
    console.error("Error booking appointment:", error?.response?.data || error.message);
    // الرد في حالة وجود خطأ (عشان الوكيل يتصرف بشياكة)
    return res.status(200).json({ 
      booking_success: false,
      agent_instruction: "Politely apologize to the caller. Inform them that there is a slight system delay in locking the calendar, but assure them a manager will call them right back to fully confirm their slot. Then politely end the call."
    });
  }
}
