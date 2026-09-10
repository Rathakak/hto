import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { DiningTable, TableStatus } from '../../types/index.ts';
import { formatUsd, formatKhr, usdToKhr } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  LayoutGrid,
  Users,
  ArrowRightLeft,
  Utensils,
  Clock,
  Banknote,
  CheckCircle2,
  X,
} from 'lucide-react';

export const TableModule: React.FC = () => {
  const {
    tables,
    activeOrders,
    setActiveTab,
    setSelectedTableForPos,
    transferTable,
    settings,
    useKhmerDigits,
    language,
  } = useRestaurant();

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [transferFromTable, setTransferFromTable] = useState<DiningTable | null>(null);
  const [transferToTableId, setTransferToTableId] = useState<number | null>(null);

  // Extract unique zones
  const zones = Array.from(new Set(tables.map((t) => t.zoneKh)));

  const filteredTables = tables.filter(
    (t) => selectedZone === 'ALL' || t.zoneKh === selectedZone
  );

  const handleOpenPosForTable = (table: DiningTable) => {
    setSelectedTableForPos(table);
    setActiveTab('pos');
  };

  const handleConfirmTransfer = async () => {
    if (transferFromTable && transferToTableId) {
      const ok = await transferTable(transferFromTable.id, transferToTableId);
      if (ok) {
        setTransferFromTable(null);
        setTransferToTableId(null);
      }
    }
  };

  // Status badge helper
  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'ទំនេរ',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'OCCUPIED':
        return {
          label: 'កំពុងញ៉ាំ',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'RESERVED':
        return {
          label: 'កក់ទុក',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'BILL_REQUESTED':
        return {
          label: 'រង់ចាំគិតលុយ',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
          dot: 'bg-gray-400',
        };
    }
  };

  return (
    <div id="floor-plan-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-[#F3F4F6] overflow-hidden">
      {/* Floor Plan Header & Zone Selector */}
      <div className="p-4 bg-[#171A1F] border-b border-[#262A31] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-[#E0913A]" />
          <h2 className="text-base font-bold text-white">
            {language === 'km' ? 'ប្លង់គ្រប់គ្រងតុ (Floor Plan & Zones)' : 'Dining Floor Plan'}
          </h2>
        </div>

        {/* Zone Filters */}
        <div className="flex items-center gap-1.5 bg-[#20242B] p-1 rounded-xl border border-[#262A31]">
          <button
            onClick={() => setSelectedZone('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedZone === 'ALL'
                ? 'bg-[#E0913A] text-white'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            តុទាំងអស់ ({tables.length})
          </button>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedZone === zone
                  ? 'bg-[#E0913A] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max scrollbar-thin">
        {filteredTables.map((table) => {
          const statusInfo = getStatusBadge(table.status);
          const activeOrder = activeOrders.find(
            (o) => o.tableId === table.id && (o.status === 'PENDING' || o.status === 'SENT')
          );
          const orderTotalUsd = activeOrder ? Number(activeOrder.totalUsd) : 0;
          const orderTotalKhr = usdToKhr(orderTotalUsd, settings.exchangeRate);

          return (
            <div
              key={table.id}
              id={`table-card-${table.id}`}
              className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] hover:border-[#E0913A]/60 flex flex-col justify-between min-h-[170px] shadow-sm transition-all"
            >
              {/* Card Header: Table Name & Status */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{table.nameKh}</h3>
                    <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5 mt-0.5">
                      <span>{table.zoneKh}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-3 h-3" />
                        {useKhmerDigits ? toKhmerDigits(table.capacity) : table.capacity} កៅអី
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${statusInfo.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Active Order Info if occupied */}
                {activeOrder ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#20242B] border border-[#262A31] space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>វិក្កយបត្រ:</span>
                      <span className="text-[#E0913A] tabular-nums">{formatUsd(orderTotalUsd)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>ប្រាក់រៀល:</span>
                      <span className="text-emerald-400 tabular-nums">{formatKhr(orderTotalKhr)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-[11px] text-gray-500 italic text-center py-2">
                    តុទំនេរ រួចរាល់សម្រាប់ទទួលភ្ញៀវ
                  </div>
                )}
              </div>

              {/* Table Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-[#262A31] flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenPosForTable(table)}
                  className="flex-1 py-2 px-2 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>បើក POS</span>
                </button>

                {activeOrder && (
                  <button
                    onClick={() => setTransferFromTable(table)}
                    title="ផ្ទេរទៅតុផ្សេង"
                    className="p-2 rounded-xl bg-[#20242B] hover:bg-[#2A2E37] text-gray-300 hover:text-white border border-[#262A31]"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#E0913A]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Table Modal */}
      {transferFromTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-md p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#E0913A]" />
                <span>ផ្ទេរតុ (Transfer Table)</span>
              </h3>
              <button
                onClick={() => setTransferFromTable(null)}
                className="w-8 h-8 rounded-full bg-[#2A2E37] text-gray-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#9CA3AF]">
              ផ្ទេរការកម្មង់ពី <strong className="text-white">{transferFromTable.nameKh}</strong> ទៅកាន់តុ៖
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {tables
                .filter((t) => t.id !== transferFromTable.id && t.status === 'AVAILABLE')
                .map((target) => (
                  <button
                    key={target.id}
                    onClick={() => setTransferToTableId(target.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      transferToTableId === target.id
                        ? 'bg-[#E0913A]/20 border-[#E0913A] text-white'
                        : 'bg-[#20242B] border-[#262A31] text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{target.nameKh}</div>
                    <div className="text-[10px] text-gray-400">{target.zoneKh}</div>
                  </button>
                ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTransferFromTable(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#20242B] text-xs font-semibold text-[#9CA3AF]"
              >
                បោះបង់
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={!transferToTableId}
                className="flex-1 py-2.5 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-xs font-bold text-white disabled:opacity-50"
              >
                បញ្ជាក់ការផ្ទេរ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
