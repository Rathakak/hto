import React, { useState } from 'react';
import { MenuItem, MenuOption } from '../../types/index.ts';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { formatUsd, formatKhr, usdToKhr } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import { X, Check, Plus, Minus } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedOptions: Array<{ groupName: string; name: string; extraPrice: number }>,
    notes: string
  ) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, onClose, onAddToCart }) => {
  const { language, useKhmerDigits, settings } = useRestaurant();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOpts, setSelectedOpts] = useState<Record<string, MenuOption>>({});
  const [notes, setNotes] = useState<string>('');

  const quickNotesKhmer = [
    'កុំដាក់ស្ករ',
    'មិនដាក់ប៊ីចេង',
    'ហឹរបន្តិច',
    'ហឹរខ្លាំង',
    'ដាក់ទឹកកកច្រើន',
    'បន្លែច្រើន',
    'សុំកែវបន្ថែម',
  ];

  // Group options by groupNameKh
  const groups: Record<string, MenuOption[]> = {};
  if (item.options) {
    for (const opt of item.options) {
      const g = opt.groupNameKh || 'ជម្រើស';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    }
  }

  const handleSelectOption = (groupName: string, opt: MenuOption) => {
    setSelectedOpts((prev) => {
      // Toggle if already selected or replace
      if (prev[groupName]?.id === opt.id) {
        const copy = { ...prev };
        delete copy[groupName];
        return copy;
      }
      return { ...prev, [groupName]: opt };
    });
  };

  // Calculate unit price with options
  const basePrice = Number(item.priceUsd);
  const extraTotal = (Object.values(selectedOpts) as MenuOption[]).reduce(
    (sum: number, opt: MenuOption) => sum + Number(opt.extraPriceUsd),
    0
  );
  const unitTotalUsd = basePrice + extraTotal;
  const totalPriceUsd = unitTotalUsd * quantity;
  const totalPriceKhr = usdToKhr(totalPriceUsd, settings.exchangeRate);

  const handleAdd = () => {
    const formattedOpts = (Object.entries(selectedOpts) as [string, MenuOption][]).map(([group, opt]) => ({
      groupName: group,
      name: opt.nameKh,
      extraPrice: Number(opt.extraPriceUsd),
    }));
    onAddToCart(item, quantity, formattedOpts, notes);
    onClose();
  };

  return (
    <div
      id="modifier-modal-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#F3F4F6]">
        {/* Modal Header with Item Photo or Banner */}
        <div className="relative p-5 border-b border-[#262A31] bg-[#1E222A]">
          <button
            id="close-modifier-modal"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#2A2E37] text-gray-300 hover:text-white flex items-center justify-center border border-[#383E49]"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-white pr-10">
            {language === 'km' ? item.nameKh : item.nameEn}
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
            {item.description || (language === 'km' ? 'មុខម្ហូបពិសេសរបស់ភោជនីយដ្ឋាន' : 'Restaurant specialty')}
          </p>
          <div className="mt-2 text-sm font-semibold text-[#E0913A] flex items-center gap-2">
            <span>{useKhmerDigits ? toKhmerDigits(formatUsd(basePrice)) : formatUsd(basePrice)}</span>
            <span className="text-xs text-[#9CA3AF]">
              ({useKhmerDigits ? toKhmerDigits(formatKhr(usdToKhr(basePrice, settings.exchangeRate))) : formatKhr(usdToKhr(basePrice, settings.exchangeRate))})
            </span>
          </div>
        </div>

        {/* Modal Body: Modifiers & Custom Notes */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* Groups of Options (Size, Spice, Addons) */}
          {Object.entries(groups).map(([groupName, opts]) => (
            <div key={groupName} className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {groupName}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {opts.map((opt) => {
                  const isSelected = selectedOpts[groupName]?.id === opt.id;
                  const extra = Number(opt.extraPriceUsd);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(groupName, opt)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between min-h-[48px] ${
                        isSelected
                          ? 'bg-[#E0913A]/20 border-[#E0913A] text-white'
                          : 'bg-[#20242B] border-[#262A31] text-[#9CA3AF] hover:text-white hover:border-[#383E49]'
                      }`}
                    >
                      <div className="text-xs font-medium">
                        {language === 'km' ? opt.nameKh : opt.nameEn}
                      </div>
                      <div className="text-xs font-bold text-[#E0913A]">
                        {extra > 0 ? `+${formatUsd(extra)}` : 'ឥតគិតថ្លៃ'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick preset notes for kitchen */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              {language === 'km' ? 'ចំណាំពិសេសសម្រាប់ចុងភៅ (Kitchen Notes)' : 'Quick Notes for Kitchen'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickNotesKhmer.map((preset) => {
                const isIncluded = notes.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (isIncluded) {
                        setNotes((prev) =>
                          prev
                            .split(', ')
                            .filter((n) => n !== preset)
                            .join(', ')
                        );
                      } else {
                        setNotes((prev) => (prev ? `${prev}, ${preset}` : preset));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isIncluded
                        ? 'bg-[#E0913A] text-white border-[#E0913A]'
                        : 'bg-[#20242B] text-gray-300 border-[#262A31] hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            <textarea
              id="modifier-custom-note"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'km' ? 'សរសេរចំណាំបន្ថែម (ឧ. មិនដាក់ខ្ទឹម, ហឹរបន្តិច...)' : 'Special cooking instructions...'}
              className="w-full mt-2 px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E0913A]"
            />
          </div>
        </div>

        {/* Modal Footer with Quantity Controls & Add Button */}
        <div className="p-4 border-t border-[#262A31] bg-[#1A1D24] flex items-center justify-between gap-4">
          {/* Quantity stepper */}
          <div className="flex items-center gap-3 bg-[#20242B] border border-[#262A31] rounded-xl px-2 py-1">
            <button
              id="modifier-qty-minus"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg bg-[#2A2E37] text-white flex items-center justify-center hover:bg-[#383E49] active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-white min-w-[24px] text-center tabular-nums">
              {useKhmerDigits ? toKhmerDigits(quantity) : quantity}
            </span>
            <button
              id="modifier-qty-plus"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg bg-[#2A2E37] text-white flex items-center justify-center hover:bg-[#383E49] active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            id="modifier-confirm-add"
            onClick={handleAdd}
            className="flex-1 py-3 px-4 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-amber-900/20 active:scale-98 transition-all min-h-[48px]"
          >
            <span>{language === 'km' ? 'បញ្ចូលក្នុងការកម្មង់' : 'Add to Order'}</span>
            <div className="text-right tabular-nums">
              <span className="font-bold">
                {useKhmerDigits ? toKhmerDigits(formatUsd(totalPriceUsd)) : formatUsd(totalPriceUsd)}
              </span>
              <span className="text-xs opacity-80 block">
                {useKhmerDigits ? toKhmerDigits(formatKhr(totalPriceKhr)) : formatKhr(totalPriceKhr)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
