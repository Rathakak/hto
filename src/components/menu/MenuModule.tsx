import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { MenuItem } from '../../types/index.ts';
import { formatUsd, formatKhr, usdToKhr } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
} from 'lucide-react';

export const MenuModule: React.FC = () => {
  const {
    menu,
    categories,
    quickToggleMenuAvailability,
    refreshAllData,
    settings,
    useKhmerDigits,
    language,
    showToast,
  } = useRestaurant();

  const [selectedCat, setSelectedCat] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New item form state
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [priceUsd, setPriceUsd] = useState('4.50');
  const [description, setDescription] = useState('');

  const filtered = menu.filter((item) => {
    const matchCat = selectedCat === 'ALL' || item.categoryId === selectedCat;
    const matchSearch =
      search.trim() === '' ||
      item.nameKh.toLowerCase().includes(search.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          nameKh,
          nameEn,
          priceUsd,
          description,
        }),
      });
      if (res.ok) {
        showToast('✅ បានបង្កើតមុខម្ហូបថ្មីដោយជោគជ័យ');
        setShowAddModal(false);
        setNameKh('');
        setNameEn('');
        setDescription('');
        await refreshAllData();
      }
    } catch (e: any) {
      showToast('Error: ' + e.message);
    }
  };

  return (
    <div id="menu-management-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-[#F3F4F6] overflow-hidden">
      {/* Header with Search & Add Dish Button */}
      <div className="p-4 bg-[#171A1F] border-b border-[#262A31] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#E0913A]" />
          <h2 className="text-base font-bold text-white">
            {language === 'km' ? 'គ្រប់គ្រងមុខម្ហូប & បញ្ជី 86' : 'Menu Management'}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកមុខម្ហូប..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#20242B] border border-[#262A31] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E0913A]"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមម្ហូប</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 bg-[#171A1F]/60 border-b border-[#262A31] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedCat('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            selectedCat === 'ALL'
              ? 'bg-[#E0913A] text-white border-[#E0913A]'
              : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
          }`}
        >
          ទាំងអស់ ({menu.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedCat === c.id
                ? 'bg-[#E0913A] text-white border-[#E0913A]'
                : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
            }`}
          >
            {c.nameKh}
          </button>
        ))}
      </div>

      {/* Menu Table */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E222A] text-[#9CA3AF] border-b border-[#262A31]">
              <tr>
                <th className="p-3">មុខម្ហូប (Khmer / English)</th>
                <th className="p-3">ប្រភេទ (Category)</th>
                <th className="p-3">តម្លៃលក់ ($ / ៛)</th>
                <th className="p-3 text-center">ស្ថានភាពលក់ (Availability)</th>
                <th className="p-3 text-right">កែប្រែ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A31]/70">
              {filtered.map((item) => {
                const priceUsd = Number(item.priceUsd);
                const priceKhr = usdToKhr(priceUsd, settings.exchangeRate);
                return (
                  <tr key={item.id} className="hover:bg-[#1E222A]/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{item.nameKh}</div>
                      <div className="text-[11px] text-gray-400">{item.nameEn}</div>
                    </td>
                    <td className="p-3 text-[#9CA3AF]">
                      {categories.find((c) => c.id === item.categoryId)?.nameKh || 'ទូទៅ'}
                    </td>
                    <td className="p-3 tabular-nums">
                      <div className="font-bold text-[#E0913A]">{formatUsd(priceUsd)}</div>
                      <div className="text-[10px] text-emerald-400">{formatKhr(priceKhr)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => quickToggleMenuAvailability(item.id, !item.isAvailable)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${
                          item.isAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>បើកលក់</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>អស់ស្តុក (86)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => quickToggleMenuAvailability(item.id, !item.isAvailable)}
                        className="p-1.5 rounded-lg bg-[#20242B] text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-lg p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262A31] pb-3">
              <h3 className="text-base font-bold">បង្កើតមុខម្ហូបថ្មី</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#2A2E37] text-gray-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">ឈ្មោះមុខម្ហូបជាភាសាខ្មែរ *</label>
                <input
                  type="text"
                  required
                  value={nameKh}
                  onChange={(e) => setNameKh(e.target.value)}
                  placeholder="ឧ. ត្រីអាម៉ុកពិសេស"
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">ឈ្មោះជាភាសាអង់គ្លេស</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Special Fish Amok"
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">ប្រភេទម្ហូប (Category)</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameKh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">តម្លៃលក់ ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">ការពិពណ៌នាម្ហូប</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="គ្រឿងផ្សំសំខាន់ៗ រសជាតិ..."
                  className="w-full px-3 py-2 bg-[#20242B] border border-[#262A31] rounded-xl text-white focus:outline-none focus:border-[#E0913A]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#20242B] text-[#9CA3AF] font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
