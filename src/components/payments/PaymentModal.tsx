import React, { useState } from 'react';
import { Order, PaymentMethod, Payment } from '../../types/index.ts';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import {
  formatUsd,
  formatKhr,
  usdToKhr,
  calculatePaymentChange,
  roundKhrTo100,
} from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import { ReceiptPrint } from './ReceiptPrint.tsx';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  Split,
  Percent,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onSuccess }) => {
  const { settings, useKhmerDigits, language, processPayment } = useRestaurant();

  const exchangeRate = order.exchangeRate || settings.exchangeRate || 4100;
  const totalUsd = Number(order.totalUsd);
  const totalKhr = roundKhrTo100(totalUsd * exchangeRate);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidUsdInput, setPaidUsdInput] = useState<string>('');
  const [paidKhrInput, setPaidKhrInput] = useState<string>('');
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  // Quick cash presets
  const quickUsdPresets = [5, 10, 20, 50, 100];
  const quickKhrPresets = [10000, 20000, 50000, 100000, 200000];

  const paidUsdNum = parseFloat(paidUsdInput) || 0;
  const paidKhrNum = parseFloat(paidKhrInput) || 0;

  // Calculate live change with Cambodia's nearest 100៛ rounding rule
  const changeResult = calculatePaymentChange({
    totalUsd: splitCount > 1 ? totalUsd / splitCount : totalUsd,
    paidUsd: paidUsdNum,
    paidKhr: paidKhrNum,
    exchangeRate,
  });

  const handlePayFullCash = (method: 'USD' | 'KHR') => {
    if (method === 'USD') {
      setPaidUsdInput(totalUsd.toFixed(2));
      setPaidKhrInput('');
    } else {
      setPaidKhrInput(String(totalKhr));
      setPaidUsdInput('');
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        orderId: order.id,
        method: paymentMethod,
        amountUsdPaid: paymentMethod === 'CASH' ? paidUsdNum : totalUsd,
        amountKhrPaid: paymentMethod === 'CASH' ? paidKhrNum : 0,
        exchangeRate,
        khqrRefNumber: paymentMethod === 'KHQR_ABA' ? `ABA-${Date.now().toString().slice(-6)}` : null,
      };

      const result = await processPayment(payload);
      if (result && result.payment) {
        setCompletedPayment(result.payment);
        onSuccess(result.payment);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-[#F3F4F6]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#262A31] flex items-center justify-between bg-[#1E222A]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#E0913A]" />
              <span>{language === 'km' ? 'ទូទាត់ប្រាក់ និងវិក្កយបត្រ' : 'Billing & Payment'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#E0913A]/20 text-[#E0913A] border border-[#E0913A]/30">
                {order.orderNumber}
              </span>
            </h3>
            <div className="text-xs text-[#9CA3AF] mt-0.5">
              {order.tableName || order.tableNo || order.type} • {order.serverName || 'Cashier'}
            </div>
          </div>
          <button
            id="close-payment-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#2A2E37] text-gray-300 hover:text-white flex items-center justify-center border border-[#383E49]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {completedPayment ? (
            /* Payment Completed View with Thermal 80mm Print Trigger */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">ទូទាត់ប្រាក់ជោគជ័យ!</h4>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  វិក្កយបត្រត្រូវបានកត់ត្រាក្នុងប្រព័ន្ធ និងតុត្រូវបានដោះលែងរួចរាល់
                </p>
              </div>

              {/* Printable Receipt Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner max-h-[360px] overflow-y-auto bg-white p-2">
                <ReceiptPrint
                  order={order}
                  payment={completedPayment}
                  settings={settings}
                  useKhmerDigits={useKhmerDigits}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  id="print-receipt-btn"
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ពវិក្កយបត្រ 80mm (Print Thermal Receipt)</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-6 rounded-xl bg-[#20242B] hover:bg-[#2A2E37] text-white font-semibold text-sm border border-[#262A31]"
                >
                  បិទ (Close)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dual-Currency Total Banner */}
              <div className="p-4 rounded-2xl bg-[#20242B] border border-[#262A31] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    ទឹកប្រាក់សរុប (Grand Total)
                  </div>
                  <div className="text-2xl font-bold text-white tabular-nums flex items-baseline gap-2 mt-0.5">
                    <span>
                      {useKhmerDigits ? toKhmerDigits(formatUsd(totalUsd)) : formatUsd(totalUsd)}
                    </span>
                    <span className="text-lg font-semibold text-emerald-400">
                      ({useKhmerDigits ? toKhmerDigits(formatKhr(totalKhr)) : formatKhr(totalKhr)})
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-[#9CA3AF] bg-[#171A1F] px-3 py-2 rounded-xl border border-[#262A31]">
                  <div>អត្រាប្តូរប្រាក់ផ្លូវការ:</div>
                  <div className="font-bold text-[#E0913A]">
                    1$ = {useKhmerDigits ? toKhmerDigits(exchangeRate) : exchangeRate} ៛
                  </div>
                </div>
              </div>

              {/* Split Bill Option */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1B1E25] border border-[#262A31]">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                  <Split className="w-4 h-4 text-[#E0913A]" />
                  <span>បំបែកវិក្កយបត្រ (Split Bill):</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSplitCount(count)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        splitCount === count
                          ? 'bg-[#E0913A] text-white border-[#E0913A]'
                          : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
                      }`}
                    >
                      {count === 1 ? 'វិក្កយបត្រតែមួយ' : `ចែក ${count} នាក់ (${formatUsd(totalUsd / count)})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'CASH'
                      ? 'bg-[#E0913A]/20 border-[#E0913A] text-white font-bold'
                      : 'bg-[#20242B] border-[#262A31] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#E0913A]" />
                  <span className="text-xs">សាច់ប្រាក់ (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('KHQR_ABA')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'KHQR_ABA'
                      ? 'bg-[#E0913A]/20 border-[#E0913A] text-white font-bold'
                      : 'bg-[#20242B] border-[#262A31] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-red-400" />
                  <span className="text-xs">ABA KHQR (Bakong)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'CARD'
                      ? 'bg-[#E0913A]/20 border-[#E0913A] text-white font-bold'
                      : 'bg-[#20242B] border-[#262A31] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span className="text-xs">កាត / ផ្ទេរប្រាក់</span>
                </button>
              </div>

              {/* Method 1: Cash Payment with Cambodian Mixed Currency & Rounding */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-4 p-4 rounded-xl bg-[#20242B] border border-[#262A31]">
                  {/* Currency inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Paid USD */}
                    <div>
                      <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                        <span>ប្រាក់ទទួលជាដុល្លារ ($ USD):</span>
                        <button
                          type="button"
                          onClick={() => handlePayFullCash('USD')}
                          className="text-[#E0913A] hover:underline"
                        >
                          ទទួលគ្រប់ ($)
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          id="paid-usd-input"
                          type="number"
                          step="0.01"
                          value={paidUsdInput}
                          onChange={(e) => setPaidUsdInput(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2.5 bg-[#171A1F] border border-[#262A31] rounded-xl text-base font-bold text-white tabular-nums focus:outline-none focus:border-[#E0913A]"
                        />
                      </div>
                      {/* USD quick presets */}
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {quickUsdPresets.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setPaidUsdInput(String(amt))}
                            className="px-2 py-0.5 rounded bg-[#2A2E37] hover:bg-[#383E49] text-[11px] font-semibold text-gray-300"
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paid KHR */}
                    <div>
                      <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                        <span>ប្រាក់ទទួលជារៀល (៛ KHR):</span>
                        <button
                          type="button"
                          onClick={() => handlePayFullCash('KHR')}
                          className="text-[#E0913A] hover:underline"
                        >
                          ទទួលគ្រប់ (៛)
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">៛</span>
                        <input
                          id="paid-khr-input"
                          type="number"
                          step="100"
                          value={paidKhrInput}
                          onChange={(e) => setPaidKhrInput(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2.5 bg-[#171A1F] border border-[#262A31] rounded-xl text-base font-bold text-emerald-400 tabular-nums focus:outline-none focus:border-[#E0913A]"
                        />
                      </div>
                      {/* KHR quick presets */}
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {quickKhrPresets.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setPaidKhrInput(String(amt))}
                            className="px-2 py-0.5 rounded bg-[#2A2E37] hover:bg-[#383E49] text-[11px] font-semibold text-gray-300"
                          >
                            {amt.toLocaleString()}៛
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Change Breakdown Box */}
                  <div className="p-3 rounded-xl bg-[#171A1F] border border-[#262A31] space-y-2">
                    <div className="flex justify-between text-xs text-[#9CA3AF]">
                      <span>ទឹកប្រាក់ទទួលសរុប:</span>
                      <span className="text-white font-bold tabular-nums">
                        {formatUsd(changeResult.totalPaidInUsd)} ({formatKhr(changeResult.totalPaidInKhr)})
                      </span>
                    </div>

                    {changeResult.isPaidInFull ? (
                      <div className="pt-2 border-t border-[#262A31] space-y-1">
                        <div className="flex justify-between items-center text-sm font-bold text-emerald-400">
                          <span>ប្រាក់អាប់ជូនភ្ញៀវ (Change):</span>
                          <span className="text-base tabular-nums">
                            {formatKhr(changeResult.totalChangeKhrAll)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] flex justify-between">
                          <span>* យោងតាមច្បាប់បង្គត់សាច់ប្រាក់កម្ពុជា:</span>
                          <span className="italic text-emerald-500">បង្គត់ឡើង ១០០៛ ជិតបំផុត</span>
                        </div>
                        {changeResult.changeUsd > 0 && (
                          <div className="flex justify-between text-xs text-gray-300 pt-1">
                            <span>ជម្រើសអាប់ជាដុល្លារ + រៀល:</span>
                            <span className="font-semibold">
                              ${changeResult.changeUsd} + {formatKhr(changeResult.changeKhr)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[#262A31] flex justify-between text-xs font-semibold text-amber-400">
                        <span>នៅខ្វះប្រាក់ (Remaining Due):</span>
                        <span className="tabular-nums">
                          {formatUsd(changeResult.remainingUsd)} ({formatKhr(changeResult.remainingKhr)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Method 2: ABA KHQR Bakong */}
              {paymentMethod === 'KHQR_ABA' && (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-[#A51C24] to-[#7B1218] text-white flex flex-col items-center justify-center text-center shadow-xl border border-red-800">
                  <div className="flex items-center gap-2 mb-2 bg-white px-3 py-1 rounded-full text-[#A51C24] text-xs font-black tracking-widest uppercase">
                    <span>KHQR</span>
                    <span className="text-gray-400">|</span>
                    <span>BAKONG</span>
                  </div>

                  <p className="text-xs text-red-100 mb-4">
                    ស្កេនទូទាត់តាមកម្មវិធីធនាគារណាមួយ (ABA, ACLEDA, Canadia, Wing, etc.)
                  </p>

                  {/* QR Graphic box */}
                  <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-white mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KHQR_BAKONG_ABA_${order.orderNumber}_USD_${totalUsd}`}
                      alt="KHQR Code"
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  <div className="text-xl font-black text-white tabular-nums tracking-wide">
                    {formatUsd(totalUsd)}
                    <span className="text-sm font-semibold opacity-90 block">
                      {formatKhr(totalKhr)}
                    </span>
                  </div>

                  <div className="text-[11px] text-red-200 mt-2 bg-black/30 px-3 py-1 rounded-lg">
                    Merchant: BOPHA ANGKOR RESTAURANT • Ref: {order.orderNumber}
                  </div>
                </div>
              )}

              {/* Method 3: Card or Bank Transfer */}
              {paymentMethod === 'CARD' && (
                <div className="p-5 rounded-xl bg-[#20242B] border border-[#262A31] text-center space-y-3">
                  <CreditCard className="w-10 h-10 text-blue-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">ទូទាត់តាមម៉ាស៊ីន POS ឬ កាតធនាគារ</h4>
                  <p className="text-xs text-[#9CA3AF]">
                    សូមអូសកាត ឬប៉ះកាត (Visa / Mastercard / UnionPay) លើម៉ាស៊ីនទូទាត់
                  </p>
                  <div className="text-lg font-bold text-white">{formatUsd(totalUsd)}</div>
                </div>
              )}

              {/* Confirm Payment Action Button */}
              <div className="pt-3">
                <button
                  id="confirm-payment-btn"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || (paymentMethod === 'CASH' && !changeResult.isPaidInFull)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {isProcessing
                      ? 'កំពុងដំណើរការ...'
                      : paymentMethod === 'KHQR_ABA'
                      ? 'បញ្ជាក់ការស្កេន KHQR ជោគជ័យ'
                      : 'បញ្ចប់ការទូទាត់ (Complete & Generate Receipt)'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
