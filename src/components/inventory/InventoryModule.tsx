import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Ingredient } from '../../types/index.ts';
import { formatUsd, formatKhr, usdToKhr } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  PackageCheck,
} from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const {
    inventory,
    restockIngredient,
    refreshAllData,
    settings,
    useKhmerDigits,
    language,
    showToast,
  } = useRestaurant();

  const [search, setSearch] = useState<string>('');
  const [restockItem, setRestockItem] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState<string>('5');
  const [restockCost, setRestockCost] = useState<string>('');
  const [restockNote, setRestockNote] = useState<string>('');

  const filtered = inventory.filter(
    (i) =>
      search.trim() === '' ||
      i.nameKh.toLowerCase().includes(search.toLowerCase()) ||
      i.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter(
    (i) => Number(i.currentQty) <= Number(i.alertQty)
  ).length;

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockItem) {
      const ok = await restockIngredient({
        ingredientId: restockItem.id,
        qtyAdd: Number(restockQty),
        costUsd: restockCost ? Number(restockCost) : undefined,
        note: restockNote || 'នាំចូលស្តុកបន្ថែម',
      });
      if (ok) {
        setRestockItem(null);
        setRestockQty('5');
        setRestockCost('');
        setRestockNote('');
      }
    }
  };

  return (
    <div id="inventory-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-[#F3F4F6] overflow-hidden">
      {/* Header & Low Stock Alert Strip */}
      <div className="p-4 bg-[#171A1F] border-b border-[#262A31] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#E0913A]" />
            <h2 className="text-base font-bold text-white">
              {language === 'km' ? 'គ្រប់គ្រងស្តុក & គ្រឿងផ្សំ (Inventory & Recipes)' : 'Inventory Management'}
            </h2>
          </div>
          {lowStockCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockCount} មុខជិតអស់ស្តុក!</span>
            </span>
          )}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកគ្រឿងផ្សំ..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#20242B] border border-[#262A31] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E0913A]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E222A] text-[#9CA3AF] border-b border-[#262A31]">
              <tr>
                <th className="p-3">ឈ្មោះគ្រឿងផ្សំ (Khmer / English)</th>
                <th className="p-3">ឯកតា (Unit)</th>
                <th className="p-3">ថ្លៃដើម / ឯកតា (Cost / Unit)</th>
                <th className="p-3">ស្តុកបច្ចុប្បន្ន (Current Stock)</th>
                <th className="p-3">កម្រិតប្រកាសអាសន្ន (Alert Level)</th>
                <th className="p-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A31]/70">
              {filtered.map((item) => {
                const current = Number(item.currentQty);
                const alertLimit = Number(item.alertQty);
                const isLow = current <= alertLimit;
                const costUsd = Number(item.costPerUnit);

                return (
                  <tr key={item.id} className="hover:bg-[#1E222A]/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{item.nameKh}</span>
                        {isLow && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30">
                            LOW
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">{item.nameEn}</div>
                    </td>
                    <td className="p-3 text-[#9CA3AF]">{item.unitKh} ({item.unitEn})</td>
                    <td className="p-3 tabular-nums font-semibold text-gray-300">
                      {formatUsd(costUsd)}
                    </td>
                    <td className="p-3 tabular-nums">
                      <span
                        className={`text-sm font-bold ${
                          isLow ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {useKhmerDigits ? toKhmerDigits(current) : current} {item.unitKh}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums text-gray-400">
                      {useKhmerDigits ? toKhmerDigits(alertLimit) : alertLimit} {item.unitKh}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setRestockItem(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white text-xs font-bold flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ទិញថែម</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-md p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262A31] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#E0913A]" />
                <span>បញ្ចូលស្តុកបន្ថែម (Restock)</span>
              </h3>
              <button
                onClick={() => setRestockItem(null)}
                className="w-8 h-8 rounded-full bg-[#2A2E37] text-gray-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#20242B] border border-[#262A31]">
              <div className="text-sm font-bold text-white">{restockItem.nameKh}</div>
              <div className="text-xs text-gray-400">
                ស្តុកបច្ចុប្បន្ន: {restockItem.currentQty} {restockItem.unitKh}
              </div>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">
                  ចំនួនដែលត្រូវបន្ថែម ({restockItem.unitKh}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white text-base font-bold focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">ចំណាយសរុបនៃការទិញ ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">ចំណាំ (Note / អ្នកផ្គត់ផ្គង់)</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="ទិញពីផ្សារថ្មី ឬអ្នកផ្គត់ផ្គង់..."
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#20242B] text-[#9CA3AF] font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold"
                >
                  បញ្ជាក់ការបញ្ចូល
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
