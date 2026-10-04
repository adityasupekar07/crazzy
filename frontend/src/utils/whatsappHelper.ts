/**
 * WhatsApp & SMS Dispatch Utility for LactoFlow
 */

function formatMobile(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export interface MilkMessagePayload {
  farmerName: string;
  mobile?: string;
  dairyName: string;
  date: string;
  shift: string;
  milkType: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  totalAmount: number;
}

export interface BillMessagePayload {
  farmerName: string;
  mobile?: string;
  dairyName: string;
  period: string;
  litres: number;
  advanceDeducted?: number;
  netPayable: number;
}

export function generateMilkCollectionMessage(data: MilkMessagePayload): string {
  const shiftText = data.shift === 'MORNING' ? 'सकाळ (Morning)' : 'संध्याकाळ (Evening)';
  return `🥛 *${data.dairyName}*
-----------------------------
नमस्ते *${data.farmerName}*,
तुमची दूध नोंदणी यशस्वी झाली आहे:

📅 *दिनांक:* ${data.date}
⏰ *शिफ्ट:* ${shiftText}
🐄 *प्रकार:* ${data.milkType}
⚖️ *प्रमाण:* ${data.quantity} L
🧪 *FAT:* ${data.fat.toFixed(1)}% | *SNF:* ${data.snf.toFixed(1)}%
💰 *दर:* ₹${data.rate.toFixed(2)}/L
💵 *एकूण रक्कम:* ₹${data.totalAmount.toFixed(2)}

_LactoFlow Dairy OS द्वारे पाठवले._`;
}

export function generateBillSettlementMessage(data: BillMessagePayload): string {
  return `📜 *${data.dairyName} — बिल पावती*
-----------------------------
नमस्ते *${data.farmerName}*,
तुमचे दूध बिल पेमेंट सेटल झाले आहे:

🗓️ *कालावधी:* ${data.period}
⚖️ *एकूण दूध:* ${data.litres.toFixed(1)} L
${data.advanceDeducted && data.advanceDeducted > 0 ? `🔻 *अॅडव्हान्स वजावट:* ₹${data.advanceDeducted.toFixed(2)}\n` : ''}💰 *निव्वळ देय रक्कम:* ₹${data.netPayable.toFixed(2)}

_LactoFlow Dairy OS द्वारे पाठवले._`;
}

export function sendWhatsAppMessage(mobile: string | undefined, message: string) {
  const formattedPhone = formatMobile(mobile);
  const encodedText = encodeURIComponent(message);
  const url = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank');
}

export function sendSmsMessage(mobile: string | undefined, message: string) {
  const formattedPhone = mobile ? mobile.replace(/\D/g, '') : '';
  const encodedText = encodeURIComponent(message);
  const url = `sms:${formattedPhone}?body=${encodedText}`;
  window.open(url, '_blank');
}
