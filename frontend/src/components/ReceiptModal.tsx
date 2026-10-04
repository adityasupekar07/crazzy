import { Printer, X, MessageSquare, Send } from 'lucide-react';
import type { AdminProfile, Admin } from '../store';
import {
  sendWhatsAppMessage,
  sendSmsMessage,
  generateMilkCollectionMessage,
  generateBillSettlementMessage,
} from '../utils/whatsappHelper';

export type ReceiptType = 'milk' | 'bill' | 'feed';

export interface MilkReceiptData {
  customerCode: string | number;
  customerName: string;
  mobile?: string;
  date: string;
  shift: string;
  milkType: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  totalAmount: number;
}

export interface BillReceiptData {
  customerCode: string | number;
  customerName: string;
  mobile?: string;
  date: string;
  period: string;
  litres: number;
  grossAmount?: number;
  advanceDeducted?: number;
  netPayable: number;
}

export interface FeedReceiptData {
  customerCode?: string | number;
  customerName: string;
  mobile?: string;
  date: string;
  feedName: string;
  quantity: number;
  totalAmount: number;
  isCash: boolean;
  pendingBalance?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReceiptType;
  dairyProfile?: AdminProfile | Admin | null;
  data: MilkReceiptData | BillReceiptData | FeedReceiptData | null;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  type,
  dairyProfile,
  data,
}: ReceiptModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const dairyName = dairyProfile?.dairyName || 'LactoFlow Dairy Collection Center';
  const village = dairyProfile?.village ? `${dairyProfile.village}, ${dairyProfile.taluka || ''}` : '';
  const contact = dairyProfile?.mobile ? `Mob: +91 ${dairyProfile.mobile}` : '';
  const gstin = dairyProfile?.gstin ? `GSTIN: ${dairyProfile.gstin}` : '';

  const handleWhatsApp = () => {
    let msg = '';
    if (type === 'milk') {
      const m = data as MilkReceiptData;
      msg = generateMilkCollectionMessage({
        farmerName: m.customerName,
        mobile: m.mobile,
        dairyName,
        date: m.date,
        shift: m.shift,
        milkType: m.milkType,
        quantity: m.quantity,
        fat: m.fat,
        snf: m.snf,
        rate: m.rate,
        totalAmount: m.totalAmount,
      });
    } else if (type === 'bill') {
      const b = data as BillReceiptData;
      msg = generateBillSettlementMessage({
        farmerName: b.customerName,
        mobile: b.mobile,
        dairyName,
        period: b.period,
        litres: b.litres,
        advanceDeducted: b.advanceDeducted,
        netPayable: b.netPayable,
      });
    } else {
      const f = data as FeedReceiptData;
      msg = `🐄 *${dairyName}*\nनमस्ते *${f.customerName}*,\nपशुखाद्य खरेदी पावती: ${f.feedName}, प्रमाण: ${f.quantity} युनिट्स, एकूण बिल: ₹${f.totalAmount.toFixed(2)}. धन्यवाद!`;
    }
    sendWhatsAppMessage(data.mobile, msg);
  };

  const handleSms = () => {
    let msg = '';
    if (type === 'milk') {
      const m = data as MilkReceiptData;
      msg = `${dairyName}: Milk entry recorded on ${m.date} (${m.shift}) - ${m.quantity}L, Fat:${m.fat}%, SNF:${m.snf}%, Rate:Rs.${m.rate.toFixed(2)}, Total:Rs.${m.totalAmount.toFixed(2)}`;
    } else if (type === 'bill') {
      const b = data as BillReceiptData;
      msg = `${dairyName}: Bill settled for ${b.period} (${b.litres.toFixed(1)}L). Net Payout: Rs.${b.netPayable.toFixed(2)}.`;
    } else {
      const f = data as FeedReceiptData;
      msg = `${dairyName}: Feed sale - ${f.feedName} (${f.quantity} units). Total: Rs.${f.totalAmount.toFixed(2)}.`;
    }
    sendSmsMessage(data.mobile, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#0052cc]" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {type === 'milk' && 'Milk Collection Receipt'}
              {type === 'bill' && 'Settlement Payout Slip'}
              {type === 'feed' && 'Cattle Feed Sale Receipt'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto print:p-0 print:m-0 print:overflow-visible text-gray-900 font-mono text-xs">
          <div className="border border-dashed border-gray-300 print:border-black p-4 rounded-xl bg-gray-50/50 print:bg-white space-y-4">
            {/* Header / Dairy Info */}
            <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-0.5">
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">
                {dairyName}
              </h2>
              {village && <p className="text-[10px] text-gray-600">{village}</p>}
              {contact && <p className="text-[10px] text-gray-600">{contact}</p>}
              {gstin && <p className="text-[10px] text-gray-600">{gstin}</p>}
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase bg-gray-200 print:bg-transparent border border-gray-300 rounded text-gray-800">
                  {type === 'milk' && 'MILK DELIVERY SLIP'}
                  {type === 'bill' && 'PAYMENT SETTLEMENT RECEIPT'}
                  {type === 'feed' && 'FEED PURCHASE VOUCHER'}
                </span>
              </div>
            </div>

            {/* Milk Collection Receipt Details */}
            {type === 'milk' && (
              <div className="space-y-2.5">
                {(() => {
                  const m = data as MilkReceiptData;
                  return (
                    <>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Farmer:</span>
                        <strong className="text-gray-900">{m.customerName} (#{m.customerCode})</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                        <div>Date: <strong className="text-gray-800">{m.date}</strong></div>
                        <div className="text-right">Shift: <strong className="text-gray-800">{m.shift}</strong></div>
                        <div>Milk Type: <strong className="text-gray-800">{m.milkType}</strong></div>
                        <div className="text-right">Quantity: <strong className="text-gray-800">{m.quantity} L</strong></div>
                      </div>

                      <div className="border-t border-b border-dashed border-gray-300 py-2 grid grid-cols-3 text-center text-[10px]">
                        <div>
                          <span className="text-gray-500 block">FAT</span>
                          <strong className="text-xs">{m.fat.toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 block">SNF</span>
                          <strong className="text-xs">{m.snf.toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Rate/L</span>
                          <strong className="text-xs font-bold text-gray-900">₹{m.rate.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-bold uppercase text-gray-700">Total Amount:</span>
                        <strong className="text-base font-black text-gray-900">₹{m.totalAmount.toFixed(2)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Bill Settlement Receipt Details */}
            {type === 'bill' && (
              <div className="space-y-2.5">
                {(() => {
                  const b = data as BillReceiptData;
                  return (
                    <>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Farmer:</span>
                        <strong className="text-gray-900">{b.customerName} (#{b.customerCode})</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                        <div>Settled Date: <strong className="text-gray-800">{b.date}</strong></div>
                        <div className="text-right">Total Litres: <strong className="text-gray-800">{b.litres.toFixed(1)} L</strong></div>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        Billing Period: <strong className="text-gray-800">{b.period}</strong>
                      </div>

                      <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-[11px]">
                        {b.grossAmount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Gross Milk Value:</span>
                            <span className="font-mono">₹{b.grossAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {b.advanceDeducted !== undefined && b.advanceDeducted > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Advance Deduction:</span>
                            <span className="font-mono">- ₹{b.advanceDeducted.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-bold uppercase text-gray-800">Net Paid Payout:</span>
                        <strong className="text-base font-black text-green-700">₹{b.netPayable.toFixed(2)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Feed Sale Receipt Details */}
            {type === 'feed' && (
              <div className="space-y-2.5">
                {(() => {
                  const f = data as FeedReceiptData;
                  return (
                    <>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Customer:</span>
                        <strong className="text-gray-900">{f.customerName} {f.customerCode ? `(#${f.customerCode})` : ''}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                        <div>Date: <strong className="text-gray-800">{f.date}</strong></div>
                        <div className="text-right">Mode: <strong className="text-gray-800">{f.isCash ? 'CASH' : 'CREDIT'}</strong></div>
                      </div>

                      <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Feed Item:</span>
                          <span className="font-bold text-gray-800">{f.feedName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quantity Sold:</span>
                          <span className="font-mono">{f.quantity} units</span>
                        </div>
                        {!f.isCash && f.pendingBalance !== undefined && f.pendingBalance > 0 && (
                          <div className="flex justify-between text-amber-700 text-[10px]">
                            <span>Credit Balance:</span>
                            <span className="font-mono">₹{f.pendingBalance.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-bold uppercase text-gray-800">Total Bill:</span>
                        <strong className="text-base font-black text-gray-900">₹{f.totalAmount.toFixed(2)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Footer Sign */}
            <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[9px] text-gray-500 space-y-1">
              <p>Thank you for partnering with us!</p>
              <p className="text-[8px] text-gray-400">Powered by LactoFlow Dairy OS</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden in Print */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2.5 print:hidden">
          <button
            onClick={onClose}
            className="py-2 px-3 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={handleSms}
            className="py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> SMS
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

