export default function handler(req, res) {
  // Retell بتبعت البيانات عن طريق POST Request
  if (req.method === 'POST') {
    
    // بنسحب رقم المتصل من البيانات اللي Retell بعتتها
    const incomingNumber = req.body.from_number; 
    
    let cleanNumber = incomingNumber;

    // بنقول للكود: لو الرقم موجود وبيبدأ بـ +1، شيل أول حرفين
    if (incomingNumber && incomingNumber.startsWith('+1')) {
      cleanNumber = incomingNumber.substring(2); 
    }

    // هنا بنرد على Retell بالمتغير الجديد النضيف
    res.status(200).json({
      dynamic_variables: {
        caller_phone: cleanNumber
      }
    });

  } else {
    // لو حد حاول يفتح الرابط من المتصفح العادي
    res.status(405).send('Method Not Allowed');
  }
}
