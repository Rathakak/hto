import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { formatUsd, formatKhr, usdToKhr } from '../../lib/currency.ts';
import { toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  Utensils,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ReportsModule: React.FC = () => {
  const { settings, useKhmerDigits, language, showToast } = useRestaurant();

  const [analytics, setAnalytics] = useState<any>({
    totalSalesUsd: 0,
    totalSalesKhr: 0,
    orderCount: 0,
    grossProfitUsd: 0,
    totalFoodCostUsd: 0,
    topItems: [],
    peakHours: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/analytics');
      const data = await res.json();
      if (data && !data.error) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Export clean CSV with UTF-8 BOM for Khmer text
  const exportCsv = () => {
    if (!analytics.topItems || analytics.topItems.length === 0) {
      showToast('គ្មានទិន្នន័យសម្រាប់ Export ទេ');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Khmer support
    csvContent += 'របាយការណ៍លក់ប្រចាំថ្ងៃ - ' + settings.nameKh + '\n';
    csvContent += `កាលបរិច្ឆេទ: ${new Date().toLocaleDateString('km-KH')}\n`;
    csvContent += `ការលក់សរុប USD: $${analytics.totalSalesUsd.toFixed(2)}\n`;
    csvContent += `ការលក់សរុប KHR: ${analytics.totalSalesKhr.toLocaleString()} ៛\n`;
    csvContent += `កម្រៃដុល (Gross Profit): $${analytics.grossProfitUsd.toFixed(2)}\n\n`;

    csvContent += 'មុខម្ហូប (Item),ចំនួនលក់ (Qty),ចំណូលសរុប USD (Revenue)\n';
    analytics.topItems.forEach((item: any) => {
      csvContent += `"${item.nameKh}",${item.qty},$${item.revenue.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `restaurant-sales-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 បានទាញយកឯកសារ CSV ដោយជោគជ័យ');
  };

  const totalSales = Number(analytics.totalSalesUsd || 0);
  const totalCost = Number(analytics.totalFoodCostUsd || 0);
  const grossProfit = Number(analytics.grossProfitUsd || Math.max(0, totalSales - totalCost));
  const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0';

  return (
    <div id="reports-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-[#F3F4F6] overflow-y-auto p-5 space-y-5 scrollbar-thin">
      {/* Top Header & Export Action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#E0913A]" />
          <div>
            <h2 className="text-lg font-bold text-white">
              {language === 'km' ? 'របាយការណ៍លក់ & វិភាគកម្រៃដុល' : 'Sales & Profit Analytics'}
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              គណនាកម្រៃដុលពិតប្រាកដ = តម្លៃលក់ - ថ្លៃដើមគ្រឿងផ្សំ (Recipe Food Cost)
            </p>
          </div>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20"
        >
          <Download className="w-4 h-4" />
          <span>ទាញយករបាយការណ៍ (Export CSV)</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales in USD */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm">
          <div className="text-xs font-semibold text-[#9CA3AF] uppercase">
            ការលក់សរុប (Total Sales USD)
          </div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {useKhmerDigits ? toKhmerDigits(formatUsd(totalSales)) : formatUsd(totalSales)}
          </div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 tabular-nums">
            {useKhmerDigits ? toKhmerDigits(formatKhr(analytics.totalSalesKhr)) : formatKhr(analytics.totalSalesKhr)}
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm">
          <div className="text-xs font-semibold text-[#9CA3AF] uppercase">
            ចំនួនវិក្កយបត្រ (Completed Orders)
          </div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">
            {useKhmerDigits ? toKhmerDigits(analytics.orderCount) : analytics.orderCount} វិក្កយបត្រ
          </div>
          <div className="text-xs text-gray-400 mt-1">
            អត្រាគិតជាមធ្យម {formatUsd(analytics.orderCount > 0 ? totalSales / analytics.orderCount : 0)} / តុ
          </div>
        </div>

        {/* Estimated Food Cost */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm">
          <div className="text-xs font-semibold text-[#9CA3AF] uppercase">
            ថ្លៃដើមគ្រឿងផ្សំ (Recipe Food Cost)
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums mt-1">
            {useKhmerDigits ? toKhmerDigits(formatUsd(totalCost)) : formatUsd(totalCost)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            កាត់កងតាមរូបមន្តស្តុក Recipe
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm">
          <div className="text-xs font-semibold text-[#9CA3AF] uppercase">
            កម្រៃដុល (Gross Profit)
          </div>
          <div className="text-2xl font-bold text-[#3FB68B] tabular-nums mt-1">
            {useKhmerDigits ? toKhmerDigits(formatUsd(grossProfit)) : formatUsd(grossProfit)}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">
            អត្រាចំណេញដុល: {profitMargin}%
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Hours Hourly Chart */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E0913A]" />
              <span>ម៉ោងមមាញឹកនៃការលក់ (Peak Hours)</span>
            </h3>
            <span className="text-xs text-gray-400">៨:០០ ព្រឹក ដល់ ១០:០០ យប់</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A31" />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171A1F', borderColor: '#262A31', borderRadius: 12 }}
                  itemStyle={{ color: '#E0913A' }}
                />
                <Bar dataKey="orders" fill="#E0913A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Best-Selling Dishes */}
        <div className="p-4 rounded-2xl bg-[#171A1F] border border-[#262A31] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#E0913A]" />
              <span>មុខម្ហូបលក់ដាច់បំផុតទាំង ៥ (Top 5 Best Sellers)</span>
            </h3>
          </div>

          <div className="space-y-2.5 pt-1">
            {analytics.topItems?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#20242B] border border-[#262A31] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E0913A]/20 text-[#E0913A] font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">{item.nameKh}</div>
                    <div className="text-[10px] text-gray-400">{item.nameEn}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-[#E0913A] tabular-nums">
                    {formatUsd(item.revenue)}
                  </div>
                  <div className="text-[10px] text-gray-400 tabular-nums">
                    {useKhmerDigits ? toKhmerDigits(item.qty) : item.qty} ចាន
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
