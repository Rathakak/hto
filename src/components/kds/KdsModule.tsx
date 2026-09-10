import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Order, KitchenStatus } from '../../types/index.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  CheckCheck,
} from 'lucide-react';

export const KdsModule: React.FC = () => {
  const { kdsOrders, updateKitchenStatus, useKhmerDigits, language } = useRestaurant();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'ALL' | 'KITCHEN' | 'BAR' | 'READY'>('ALL');
  const [recentlyBumpedOrder, setRecentlyBumpedOrder] = useState<{
    orderId: number;
    prevStatus: KitchenStatus;
    timestamp: number;
  } | null>(null);

  // Synthesize pleasant kitchen chime using Web Audio API
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Listen for new orders and play sound
  useEffect(() => {
    if (kdsOrders.length > 0) {
      // sound chime
    }
  }, [kdsOrders.length]);

  // Handle Undo / Recall for 30s
  const handleUndoBump = async () => {
    if (recentlyBumpedOrder) {
      await updateKitchenStatus(recentlyBumpedOrder.orderId, recentlyBumpedOrder.prevStatus);
      setRecentlyBumpedOrder(null);
    }
  };

  // Advance Order Kitchen Status
  const handleAdvanceStatus = async (order: Order) => {
    let nextStatus: KitchenStatus = 'PREPARING';
    if (order.kitchenStatus === 'NEW') nextStatus = 'PREPARING';
    else if (order.kitchenStatus === 'PREPARING') nextStatus = 'READY';
    else if (order.kitchenStatus === 'READY') nextStatus = 'SERVED';

    // Store for 30s undo
    setRecentlyBumpedOrder({
      orderId: order.id,
      prevStatus: order.kitchenStatus,
      timestamp: Date.now(),
    });

    await updateKitchenStatus(order.id, nextStatus);
  };

  // Calculate elapsed minutes
  const getElapsedMinutes = (createdAt: string | Date): number => {
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 60000);
  };

  // Filter orders
  const filteredOrders = kdsOrders.filter((order) => {
    if (filterType === 'READY') return order.kitchenStatus === 'READY';
    if (filterType === 'BAR') {
      // Check if items contain drink tags/category
      return order.items?.some((i) => i.itemNameKh.includes('កាហ្វេ') || i.itemNameKh.includes('តែ') || i.itemNameKh.includes('ទឹក'));
    }
    return true;
  });

  return (
    <div id="kds-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-white overflow-hidden select-none">
      {/* KDS Control Header */}
      <div className="p-3 bg-[#171A1F] border-b border-[#262A31] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[#E0913A]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              {language === 'km' ? 'ផ្ទះបាយ KDS (Kitchen Display)' : 'Kitchen Display System'}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#E0913A]/20 text-[#E0913A] border border-[#E0913A]/40 font-bold tabular-nums">
            {kdsOrders.length} {language === 'km' ? 'ការកម្មង់សកម្ម' : 'Active Orders'}
          </span>
        </div>

        {/* Filter Controls & Sound Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Recall / Undo button within 30s */}
          {recentlyBumpedOrder && Date.now() - recentlyBumpedOrder.timestamp < 30000 && (
            <button
              id="kds-undo-btn"
              onClick={handleUndoBump}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ត្រឡប់ក្រោយ (Undo Recall)</span>
            </button>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center bg-[#20242B] p-1 rounded-xl border border-[#262A31]">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'ALL' ? 'bg-[#E0913A] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ទាំងអស់ ({kdsOrders.length})
            </button>
            <button
              onClick={() => setFilterType('BAR')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'BAR' ? 'bg-[#E0913A] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ភេសជ្ជៈ & Bar
            </button>
            <button
              onClick={() => setFilterType('READY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'READY' ? 'bg-[#E0913A] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              រួចរាល់ ({kdsOrders.filter((o) => o.kitchenStatus === 'READY').length})
            </button>
          </div>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNewOrderChime();
            }}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-[#20242B] text-emerald-400 border-emerald-500/30'
                : 'bg-[#20242B] text-gray-500 border-[#262A31]'
            }`}
            title={soundEnabled ? 'បិទសំឡេងកណ្ដឹង' : 'បើកសំឡេងកណ្ដឹង'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Orders Grid (Horizontal Scrollable or Multi-Column) */}
      <div className="flex-1 p-4 overflow-x-auto overflow-y-auto grid grid-flow-col auto-cols-[320px] md:auto-cols-[340px] gap-4 scrollbar-thin">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full h-full flex flex-col items-center justify-center text-center text-gray-500 min-w-[300px]">
            <ChefHat className="w-16 h-16 stroke-1 text-gray-600 mb-3" />
            <h3 className="text-base font-bold text-gray-300">
              {language === 'km' ? 'ផ្ទះបាយទំនេរ គ្មានការកម្មង់ទេ' : 'All caught up! No active orders.'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'km' ? 'រាល់ការកម្មង់ពី POS នឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ' : 'New orders will arrive here automatically'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isAlert = elapsedMins >= 15;
            const isWarning = elapsedMins >= 10 && elapsedMins < 15;

            // Timer color scheme
            let headerBg = 'bg-[#1F242D] border-[#2A303C]';
            let timerBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

            if (isAlert) {
              headerBg = 'bg-red-950/60 border-red-800 animate-pulse';
              timerBadge = 'bg-red-500 text-white font-black animate-bounce';
            } else if (isWarning) {
              headerBg = 'bg-amber-950/40 border-amber-800';
              timerBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold';
            }

            return (
              <div
                key={order.id}
                id={`kds-card-${order.id}`}
                className={`flex flex-col bg-[#171A1F] rounded-2xl border-2 overflow-hidden shadow-2xl transition-all ${
                  isAlert ? 'border-red-600 shadow-red-900/30' : 'border-[#262A31]'
                }`}
              >
                {/* Card Header: Table No, Order Number, Elapsed Timer */}
                <div className={`p-3.5 border-b ${headerBg} flex items-center justify-between`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">
                        {order.tableName || order.tableNo || order.type}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-black/40 text-gray-300 font-mono">
                        {order.orderNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      អ្នកទទួល: {order.serverName || 'Staff'}
                    </div>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs tabular-nums ${timerBadge}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {useKhmerDigits ? toKhmerDigits(elapsedMins) : elapsedMins} នាទី
                    </span>
                  </div>
                </div>

                {/* Items List (High contrast, large font for kitchen read) */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 divide-y divide-[#262A31]/80 scrollbar-thin">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="pt-2.5 first:pt-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#20242B] border border-[#262A31] text-xs font-black text-[#E0913A] flex items-center justify-center tabular-nums">
                            {useKhmerDigits ? toKhmerDigits(item.quantity) : item.quantity}
                          </span>
                          <span className="text-sm font-bold text-white leading-tight">
                            {item.itemNameKh}
                          </span>
                        </div>
                      </div>

                      {/* Modifier options / sizes */}
                      {item.selectedOptions && (
                        <div className="text-[11px] font-semibold text-amber-400/90 pl-8 mt-1">
                          {typeof item.selectedOptions === 'string'
                            ? item.selectedOptions
                            : (item.selectedOptions as any[]).map((o) => `${o.groupName}: ${o.name}`).join(' | ')}
                        </div>
                      )}

                      {/* Special Cooking Notes (highlighted in red or yellow) */}
                      {item.notes && (
                        <div className="pl-8 mt-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-bold">
                            ⚠️ {item.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom 1-Touch Status Bump Button */}
                <div className="p-3 border-t border-[#262A31] bg-[#1A1D24]">
                  {order.kitchenStatus === 'NEW' && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>ចាប់ផ្តើមធ្វើ (Start Preparing)</span>
                    </button>
                  )}

                  {order.kitchenStatus === 'PREPARING' && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className="w-full py-3 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                    >
                      <Flame className="w-4 h-4" />
                      <span>ធ្វើរួចរាល់ (Mark Ready)</span>
                    </button>
                  )}

                  {order.kitchenStatus === 'READY' && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>បានលើកជូនភ្ញៀវ (Mark Served)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
