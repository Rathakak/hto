import React from 'react';
import { Order, Payment, RestaurantSettings } from '../../types/index.ts';
import { formatUsd, formatKhr, roundKhrTo100 } from '../../lib/currency.ts';
import { formatKhmerDate, toKhmerDigits } from '../../lib/khmer-date.ts';

interface ReceiptPrintProps {
  order: Order;
  payment?: Payment | null;
  settings: RestaurantSettings;
  useKhmerDigits?: boolean;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  order,
  payment,
  settings,
  useKhmerDigits = false,
}) => {
  const exchangeRate = order.exchangeRate || settings.exchangeRate || 4100;
  const totalUsd = Number(order.totalUsd);
  const totalKhr = roundKhrTo100(totalUsd * exchangeRate);

  const subtotalUsd = Number(order.subtotalUsd);
  const subtotalKhr = roundKhrTo100(subtotalUsd * exchangeRate);

  const discountUsd = Number(order.discountAmountUsd || 0);
  const serviceUsd = Number(order.serviceChargeUsd || 0);
  const taxUsd = Number(order.taxAmountUsd || 0);

  const paidUsd = payment ? Number(payment.amountUsdPaid) : totalUsd;
  const paidKhr = payment ? Number(payment.amountKhrPaid) : 0;
  const changeUsd = payment ? Number(payment.changeUsd) : 0;
  const changeKhr = payment ? Number(payment.changeKhr) : 0;

  const fmtUsd = (val: number) => (useKhmerDigits ? toKhmerDigits(formatUsd(val)) : formatUsd(val));
  const fmtKhr = (val: number) => (useKhmerDigits ? toKhmerDigits(formatKhr(val)) : formatKhr(val));

  return (
    <div id="thermal-receipt-container" className="p-4 text-black bg-white font-kantumruy text-xs leading-relaxed max-w-[80mm] mx-auto">
      {/* Header with Restaurant Name in Moul font */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h2 className="font-moul text-base font-bold tracking-tight">
          {settings.nameKh}
        </h2>
        <div className="text-[11px] font-semibold tracking-wider text-gray-700">
          {settings.nameEn}
        </div>
        <p className="text-[10px] mt-1 text-gray-600 leading-tight">
          {settings.addressKh}
        </p>
        <p className="text-[10px] text-gray-600">
          ទូរស័ព្ទ: {useKhmerDigits ? toKhmerDigits(settings.phone) : settings.phone}
        </p>
        <div className="text-[11px] font-bold mt-1.5 uppercase tracking-widest bg-gray-100 py-0.5 border border-gray-300">
          វិក្កយបត្រ / OFFICIAL RECEIPT
        </div>
      </div>

      {/* Meta Information: Order #, Table, Date, Cashier */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-600">លេខវិក្កយបត្រ:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">តុ / Table:</span>
          <span className="font-bold">{order.tableName || order.tableNo || order.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">អ្នកទទួល / Server:</span>
          <span>{order.serverName || 'Cashier'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">កាលបរិច្ឆេទ:</span>
          <span>{formatKhmerDate(order.createdAt || new Date(), { includeTime: true, useKhmerDigits })}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>អត្រាប្តូរប្រាក់:</span>
          <span>1$ = {useKhmerDigits ? toKhmerDigits(exchangeRate) : exchangeRate} ៛</span>
        </div>
      </div>

      {/* Items List */}
      <div className="py-2 border-b border-dashed border-gray-400">
        <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-gray-200">
          <span className="w-1/2">មុខម្ហូប (Item)</span>
          <span className="w-1/6 text-center">ចំនួន</span>
          <span className="w-1/3 text-right">សរុប ($)</span>
        </div>

        <div className="divide-y divide-gray-100 py-1 space-y-1">
          {order.items?.map((item, idx) => {
            const lineTotal = Number(item.unitPriceUsd) * item.quantity;
            return (
              <div key={idx} className="pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="w-1/2 font-medium">{item.itemNameKh}</span>
                  <span className="w-1/6 text-center tabular-nums">
                    {useKhmerDigits ? toKhmerDigits(item.quantity) : item.quantity}
                  </span>
                  <span className="w-1/3 text-right font-semibold tabular-nums">
                    {fmtUsd(lineTotal)}
                  </span>
                </div>
                {item.notes && (
                  <div className="text-[10px] text-gray-500 italic pl-1">
                    * {item.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals Calculation */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>តម្លៃសរុប (Subtotal):</span>
          <span className="tabular-nums font-semibold">{fmtUsd(subtotalUsd)}</span>
        </div>

        {discountUsd > 0 && (
          <div className="flex justify-between text-red-600">
            <span>បញ្ចុះតម្លៃ (Discount):</span>
            <span className="tabular-nums">-{fmtUsd(discountUsd)}</span>
          </div>
        )}

        {serviceUsd > 0 && (
          <div className="flex justify-between">
            <span>សេវាកម្ម (Service):</span>
            <span className="tabular-nums">+{fmtUsd(serviceUsd)}</span>
          </div>
        )}

        {taxUsd > 0 && (
          <div className="flex justify-between">
            <span>ពន្ធអាករ (VAT {order.taxRate}%):</span>
            <span className="tabular-nums">+{fmtUsd(taxUsd)}</span>
          </div>
        )}

        {/* Grand Total Highlight */}
        <div className="pt-1.5 border-t border-gray-300">
          <div className="flex justify-between text-sm font-bold">
            <span>សរុបជាដុល្លារ (TOTAL USD):</span>
            <span className="tabular-nums">{fmtUsd(totalUsd)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-emerald-700">
            <span>សរុបជារៀល (TOTAL KHR):</span>
            <span className="tabular-nums">{fmtKhr(totalKhr)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details & Cambodian Rounding Rule */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>វិធីទូទាត់ (Method):</span>
          <span className="font-bold">
            {payment?.method === 'KHQR_ABA'
              ? 'ABA KHQR'
              : payment?.method === 'CARD'
              ? 'កាតធនាគារ (Card)'
              : 'សាច់ប្រាក់ (Cash)'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>ប្រាក់ទទួល USD:</span>
          <span className="tabular-nums">{fmtUsd(paidUsd)}</span>
        </div>
        {paidKhr > 0 && (
          <div className="flex justify-between">
            <span>ប្រាក់ទទួល KHR:</span>
            <span className="tabular-nums">{fmtKhr(paidKhr)}</span>
          </div>
        )}

        {/* Change Returned with Cambodia 100 Riel Rounding note */}
        <div className="pt-1 border-t border-gray-200">
          <div className="flex justify-between font-bold text-gray-900">
            <span>ប្រាក់អាប់ KHR (បង្គត់ ១០០៛):</span>
            <span className="tabular-nums text-emerald-800">{fmtKhr(changeKhr)}</span>
          </div>
          {changeUsd > 0 && (
            <div className="flex justify-between font-bold text-gray-900">
              <span>ប្រាក់អាប់ USD:</span>
              <span className="tabular-nums">{fmtUsd(changeUsd)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Blessing */}
      <div className="pt-3 text-center space-y-1">
        <p className="font-semibold text-[11px] text-gray-800">
          {settings.receiptFooterKh}
        </p>
        <p className="text-[10px] text-gray-500">
          THANK YOU FOR DINING WITH US!
        </p>
        <p className="text-[9px] text-gray-400 mt-1">
          ប្រព័ន្ធគ្រប់គ្រងភោជនីយដ្ឋានកម្ពុជា • Powered by AIC-Web
        </p>
      </div>
    </div>
  );
};
