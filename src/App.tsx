import React from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext.tsx';
import { Header } from './components/common/Header.tsx';
import { PosModule } from './components/pos/PosModule.tsx';
import { KdsModule } from './components/kds/KdsModule.tsx';
import { TableModule } from './components/tables/TableModule.tsx';
import { MenuModule } from './components/menu/MenuModule.tsx';
import { InventoryModule } from './components/inventory/InventoryModule.tsx';
import { StaffModule } from './components/staff/StaffModule.tsx';
import { ReportsModule } from './components/reports/ReportsModule.tsx';

const AppContent: React.FC = () => {
  const { activeTab, isLoading } = useRestaurant();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0E1013] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E0913A]/20 border border-[#E0913A]/50 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full bg-[#E0913A]" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-moul text-lg text-[#E0913A]">ភោជនីយដ្ឋាន រស់ជាតិខ្មែរ</h2>
          <p className="text-xs text-gray-400">កំពុងតភ្ជាប់ទិន្នន័យភោជនីយដ្ឋាន...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F3F4F6] flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'pos' && <PosModule />}
        {activeTab === 'kds' && <KdsModule />}
        {activeTab === 'tables' && <TableModule />}
        {activeTab === 'menu' && <MenuModule />}
        {activeTab === 'inventory' && <InventoryModule />}
        {activeTab === 'staff' && <StaffModule />}
        {activeTab === 'reports' && <ReportsModule />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <AppContent />
    </RestaurantProvider>
  );
}
