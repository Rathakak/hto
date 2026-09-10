import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { MenuItem, DiningTable, OrderType, Order } from '../../types/index.ts';
import { formatUsd, formatKhr, usdToKhr, roundKhrTo100 } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import { ModifierModal } from './ModifierModal.tsx';
import { PaymentModal } from '../payments/PaymentModal.tsx';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Banknote,
  Percent,
  Layers,
  Utensils,
  Coffee,
  ShoppingBag,
  Bike,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface CartItem {
  id: string;
  menuItemId: number;
  itemNameKh: string;
  itemNameEn: string;
  unitPriceUsd: number;
  quantity: number;
  selectedOptions?: Array<{ groupName: string; name: string; extraPrice: number }>;
  notes?: string;
}

export const PosModule: React.FC = () => {
  const {
    menu,
    categories,
    tables,
    settings,
    useKhmerDigits,
    language,
    selectedTableForPos,
    setSelectedTableForPos,
    createOrder,
    quickToggleMenuAvailability,
    activeOrders,
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeModifierItem, setActiveModifierItem] = useState<MenuItem | null>(null);

  // Discounts and charges
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED' | undefined>(undefined);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  // Active payment modal
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);

  // If a table is passed in or selected, check if it already has an active order
  useEffect(() => {
    if (selectedTableForPos) {
      const existing = activeOrders.find(
        (o) => o.tableId === selectedTableForPos.id && (o.status === 'PENDING' || o.status === 'SENT')
      );
      if (existing && existing.items) {
        // Load existing order items into cart for adding more or viewing
        const loaded: CartItem[] = existing.items.map((i, idx) => ({
          id: `loaded-${idx}-${Date.now()}`,
          menuItemId: i.menuItemId,
          itemNameKh: i.itemNameKh,
          itemNameEn: i.itemNameEn,
          unitPriceUsd: Number(i.unitPriceUsd),
          quantity: i.quantity,
          notes: i.notes || undefined,
        }));
        setCart(loaded);
      }
    }
  }, [selectedTableForPos, activeOrders]);

  // Keyboard shortcut listener: numbers 1-9 for category tabs, Enter for pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is not inside an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= categories.length) {
        setSelectedCategory(categories[num - 1].id);
      } else if (e.key === '0') {
        setSelectedCategory('ALL');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categories]);

  // Filtered menu items
  const filteredMenu = menu.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.nameKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add item to cart
  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    if (item.options && item.options.length > 0) {
      setActiveModifierItem(item);
    } else {
      addToCartDirect(item, 1, [], '');
    }
  };

  const addToCartDirect = (
    item: MenuItem,
    quantity: number,
    selectedOptions: Array<{ groupName: string; name: string; extraPrice: number }>,
    notes: string
  ) => {
    const extraTotal = selectedOptions.reduce((sum, opt) => sum + opt.extraPrice, 0);
    const unitPrice = Number(item.priceUsd) + extraTotal;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItemId === item.id && ci.notes === notes && JSON.stringify(ci.selectedOptions) === JSON.stringify(selectedOptions)
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menuItemId: item.id,
          itemNameKh: item.nameKh,
          itemNameEn: item.nameEn,
          unitPriceUsd: unitPrice,
          quantity,
          selectedOptions,
          notes,
        },
      ];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Pricing calculations
  const subtotalUsd = cart.reduce((sum, item) => sum + item.unitPriceUsd * item.quantity, 0);
  let discountAmountUsd = 0;
  if (discountType === 'PERCENT') {
    discountAmountUsd = (subtotalUsd * discountValue) / 100;
  } else if (discountType === 'FIXED') {
    discountAmountUsd = discountValue;
  }

  const serviceChargeUsd = ((subtotalUsd - discountAmountUsd) * serviceChargeRate) / 100;
  const taxableBase = Math.max(0, subtotalUsd - discountAmountUsd + serviceChargeUsd);
  const taxAmountUsd = (taxableBase * taxRate) / 100;
  const grandTotalUsd = taxableBase + taxAmountUsd;
  const grandTotalKhr = roundKhrTo100(grandTotalUsd * settings.exchangeRate);

  // Submit order to kitchen (KDS)
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    const orderData = {
      tableId: orderType === 'DINE_IN' ? selectedTableForPos?.id || null : null,
      type: orderType,
      items: cart,
      discountType,
      discountValue,
      serviceChargeUsd,
      taxRate,
      exchangeRate: settings.exchangeRate,
    };

    const created = await createOrder(orderData);
    if (created) {
      setCart([]);
    }
  };

  // Pay directly
  const handleOpenPayment = async () => {
    if (cart.length === 0) return;
    // If order not yet created, create first or use transient order
    const orderData = {
      tableId: orderType === 'DINE_IN' ? selectedTableForPos?.id || null : null,
      type: orderType,
      items: cart,
      discountType,
      discountValue,
      serviceChargeUsd,
      taxRate,
      exchangeRate: settings.exchangeRate,
    };

    const created = await createOrder(orderData);
    if (created) {
      setCart([]);
      setActivePaymentOrder(created);
    }
  };

  return (
    <div id="pos-screen" className="flex flex-col lg:flex-row h-[calc(100vh-100px)] overflow-hidden bg-[#0E1013] text-[#F3F4F6]">
      {/* LEFT: Menu catalog, search, categories */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#262A31] overflow-hidden">
        {/* Top Control Bar: Search & Table indicator */}
        <div className="p-3 border-b border-[#262A31] bg-[#171A1F] flex items-center justify-between gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'km' ? 'ស្វែងរកមុខម្ហូប (Search Menu)...' : 'Search dishes...'}
              className="w-full pl-9 pr-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E0913A]"
            />
          </div>

          {/* Table quick selector */}
          <div className="flex items-center gap-2">
            <select
              id="pos-table-select"
              value={selectedTableForPos?.id || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const matched = tables.find((t) => t.id === id);
                setSelectedTableForPos(matched || null);
              }}
              className="px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-xs font-semibold text-[#E0913A] focus:outline-none focus:border-[#E0913A]"
            >
              <option value="">-- ជ្រើសរើសតុ (Select Table) --</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameKh} ({t.status === 'AVAILABLE' ? 'ទំនេរ' : 'មានភ្ញៀវ'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Bar (with 1-9 shortcuts) */}
        <div className="px-3 py-2 bg-[#171A1F]/60 border-b border-[#262A31] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            id="cat-tab-all"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap min-h-[40px] flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-[#E0913A] text-white border-[#E0913A]'
                : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
            }`}
          >
            <span>ទាំងអស់</span>
            <span className="text-[10px] opacity-70">(0)</span>
          </button>

          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap min-h-[40px] flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#E0913A] text-white border-[#E0913A]'
                    : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
                }`}
              >
                <span>{language === 'km' ? cat.nameKh : cat.nameEn}</span>
                {idx < 9 && <span className="text-[10px] opacity-70">({idx + 1})</span>}
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid (Touch Friendly Cards) */}
        <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5 auto-rows-max scrollbar-thin">
          {filteredMenu.map((item) => {
            const priceUsd = Number(item.priceUsd);
            const priceKhr = usdToKhr(priceUsd, settings.exchangeRate);
            const is86 = !item.isAvailable;

            return (
              <div
                key={item.id}
                id={`menu-card-${item.id}`}
                onClick={() => handleItemClick(item)}
                className={`relative p-3 rounded-2xl border transition-all select-none flex flex-col justify-between min-h-[120px] ${
                  is86
                    ? 'bg-[#171A1F]/50 border-red-900/30 opacity-60 cursor-not-allowed'
                    : 'bg-[#171A1F] border-[#262A31] hover:border-[#E0913A]/60 hover:bg-[#1C2027] active:scale-97 cursor-pointer shadow-sm'
                }`}
              >
                {/* 86 Quick Toggle Button */}
                <button
                  type="button"
                  title="បិទ/បើកលក់ (Toggle 86)"
                  onClick={(e) => {
                    e.stopPropagation();
                    quickToggleMenuAvailability(item.id, !item.isAvailable);
                  }}
                  className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    is86
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-red-500/20 hover:text-red-400'
                  }`}
                >
                  {is86 ? 'អស់ (86)' : 'លក់'}
                </button>

                {/* Dish Name in Khmer + English */}
                <div className="pr-12">
                  <div className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {language === 'km' ? item.nameKh : item.nameEn}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] line-clamp-1 mt-0.5">
                    {language === 'km' ? item.nameEn : item.nameKh}
                  </div>
                </div>

                {/* Pricing in Dual Currency */}
                <div className="mt-2 pt-2 border-t border-[#262A31] flex items-baseline justify-between">
                  <div className="text-sm font-black text-[#E0913A] tabular-nums">
                    {useKhmerDigits ? toKhmerDigits(formatUsd(priceUsd)) : formatUsd(priceUsd)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400/90 tabular-nums">
                    {useKhmerDigits ? toKhmerDigits(formatKhr(priceKhr)) : formatKhr(priceKhr)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Order Cart & Bill Ticket Panel */}
      <div className="w-full lg:w-[400px] xl:w-[440px] bg-[#171A1F] flex flex-col justify-between border-t lg:border-t-0 border-[#262A31] shadow-2xl">
        {/* Cart Header */}
        <div className="p-3 border-b border-[#262A31] bg-[#1A1D24] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {selectedTableForPos ? selectedTableForPos.nameKh : 'មិនទាន់ជ្រើសតុ'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0913A]/20 text-[#E0913A] border border-[#E0913A]/30">
                {orderType}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-red-400 hover:underline"
              >
                លុបទាំងអស់ (Clear)
              </button>
            )}
          </div>

          {/* Order Type Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0E1013] p-1 rounded-xl">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                orderType === 'DINE_IN'
                  ? 'bg-[#E0913A] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>ញ៉ាំនៅហាង</span>
            </button>
            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-[#E0913A] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ខ្ចប់ទៅផ្ទះ</span>
            </button>
            <button
              onClick={() => setOrderType('DELIVERY')}
              className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-[#E0913A] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>ដឹកជញ្ជូន</span>
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 divide-y divide-[#262A31]/60 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-gray-600" />
              <p className="text-xs font-medium">មិនទាន់មានការកម្មង់ទេ</p>
              <p className="text-[11px] text-gray-600 mt-1">
                សូមចុចលើមុខម្ហូបខាងឆ្វេងដើម្បីបញ្ចូលក្នុងវិក្កយបត្រ
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotalUsd = item.unitPriceUsd * item.quantity;
              return (
                <div key={item.id} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {language === 'km' ? item.itemNameKh : item.itemNameEn}
                      </div>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[10px] text-[#E0913A] mt-0.5">
                          {item.selectedOptions.map((o) => `${o.groupName}: ${o.name}`).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-gray-400 italic">
                          * {item.notes}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-400 tabular-nums">
                        {formatUsd(item.unitPriceUsd)} × {item.quantity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#E0913A] tabular-nums">
                        {formatUsd(lineTotalUsd)}
                      </div>
                      <div className="text-[10px] text-emerald-400 tabular-nums">
                        {formatKhr(usdToKhr(lineTotalUsd, settings.exchangeRate))}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between mt-1.5">
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="text-red-400/80 hover:text-red-400 p-1 text-xs"
                      title="លុបមុខម្ហូប"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 bg-[#20242B] border border-[#262A31] rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-[#2A2E37] text-white flex items-center justify-center hover:bg-[#383E49]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white min-w-[16px] text-center tabular-nums">
                        {useKhmerDigits ? toKhmerDigits(item.quantity) : item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-6 h-6 rounded bg-[#2A2E37] text-white flex items-center justify-center hover:bg-[#383E49]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Totals & Action Buttons Footer */}
        <div className="p-3 border-t border-[#262A31] bg-[#1A1D24] space-y-2">
          {/* Quick discounts and rates */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                if (discountValue > 0) {
                  setDiscountValue(0);
                  setDiscountType(undefined);
                } else {
                  setDiscountType('PERCENT');
                  setDiscountValue(10);
                }
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                discountValue > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31]'
              }`}
            >
              {discountValue > 0 ? `បញ្ចុះតម្លៃ ${discountValue}%` : '+ បញ្ចុះតម្លៃ (Discount)'}
            </button>

            <button
              onClick={() => setTaxRate((t) => (t > 0 ? 0 : 10))}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                taxRate > 0
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31]'
              }`}
            >
              {taxRate > 0 ? 'ពន្ធ VAT 10%' : '+ ពន្ធ VAT'}
            </button>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1 text-xs pt-1 border-t border-[#262A31]">
            <div className="flex justify-between text-gray-400">
              <span>តម្លៃសរុប (Subtotal):</span>
              <span className="tabular-nums font-semibold">{formatUsd(subtotalUsd)}</span>
            </div>

            {discountAmountUsd > 0 && (
              <div className="flex justify-between text-red-400">
                <span>បញ្ចុះតម្លៃ:</span>
                <span className="tabular-nums">-{formatUsd(discountAmountUsd)}</span>
              </div>
            )}

            {taxAmountUsd > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>ពន្ធអាករ (VAT 10%):</span>
                <span className="tabular-nums">+{formatUsd(taxAmountUsd)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-1 border-t border-[#262A31] text-sm font-bold text-white">
              <span>សរុបត្រូវបង់:</span>
              <div className="text-right">
                <span className="text-base text-[#E0913A] tabular-nums">
                  {useKhmerDigits ? toKhmerDigits(formatUsd(grandTotalUsd)) : formatUsd(grandTotalUsd)}
                </span>
                <span className="text-xs text-emerald-400 block tabular-nums">
                  ({useKhmerDigits ? toKhmerDigits(formatKhr(grandTotalKhr)) : formatKhr(grandTotalKhr)})
                </span>
              </div>
            </div>
          </div>

          {/* POS Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="send-to-kitchen-btn"
              onClick={handleSendToKitchen}
              disabled={cart.length === 0}
              className="py-3 px-3 rounded-xl bg-[#20242B] hover:bg-[#2A2E37] text-white text-xs font-bold border border-[#262A31] flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all min-h-[44px]"
            >
              <ChefHat className="w-4 h-4 text-[#E0913A]" />
              <span>បញ្ជូនទៅផ្ទះបាយ (Kitchen)</span>
            </button>

            <button
              id="pay-bill-btn"
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="py-3 px-3 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all min-h-[44px]"
            >
              <Banknote className="w-4 h-4" />
              <span>គិតលុយ (Pay Bill)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modifier Modal */}
      {activeModifierItem && (
        <ModifierModal
          item={activeModifierItem}
          onClose={() => setActiveModifierItem(null)}
          onAddToCart={addToCartDirect}
        />
      )}

      {/* Payment Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onSuccess={() => {
            // Success callback handled in PaymentModal
          }}
        />
      )}
    </div>
  );
};
