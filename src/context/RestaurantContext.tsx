import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  DiningTable,
  Category,
  MenuItem,
  Order,
  Ingredient,
  RestaurantSettings,
  Role,
} from '../types/index.ts';

interface RestaurantContextType {
  // Staff & Auth
  currentStaff: User | null;
  allStaff: User[];
  loginWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  currentShiftId: number | null;

  // Navigation & View
  activeTab: 'pos' | 'kds' | 'tables' | 'menu' | 'inventory' | 'staff' | 'reports';
  setActiveTab: (tab: 'pos' | 'kds' | 'tables' | 'menu' | 'inventory' | 'staff' | 'reports') => void;

  // Settings & Localization
  language: 'km' | 'en';
  setLanguage: (lang: 'km' | 'en') => void;
  useKhmerDigits: boolean;
  setUseKhmerDigits: (val: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;

  // Data
  tables: DiningTable[];
  categories: Category[];
  menu: MenuItem[];
  activeOrders: Order[];
  kdsOrders: Order[];
  inventory: Ingredient[];
  isLoading: boolean;
  sseConnected: boolean;

  // Operations
  refreshAllData: () => Promise<void>;
  createOrder: (orderData: any) => Promise<Order | null>;
  updateKitchenStatus: (orderId: number, status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => Promise<void>;
  quickToggleMenuAvailability: (itemId: number, isAvailable: boolean) => Promise<void>;
  processPayment: (paymentData: any) => Promise<any>;
  transferTable: (fromId: number, toId: number) => Promise<boolean>;
  restockIngredient: (data: { ingredientId: number; qtyAdd: number; costUsd?: number; note?: string }) => Promise<boolean>;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Active POS State
  selectedTableForPos: DiningTable | null;
  setSelectedTableForPos: (t: DiningTable | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<User | null>(null);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [currentShiftId, setCurrentShiftId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'tables' | 'menu' | 'inventory' | 'staff' | 'reports'>('pos');
  const [language, setLanguage] = useState<'km' | 'en'>('km');
  const [useKhmerDigits, setUseKhmerDigits] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [settings, setSettings] = useState<RestaurantSettings>({
    nameKh: 'ភោជនីយដ្ឋាន រស់ជាតិខ្មែរ',
    nameEn: 'Khmer Flavors Restaurant',
    addressKh: 'ផ្ទះលេខ ៤៥ ផ្លូវ ២៤០ សង្កាត់ចតុមុខ ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
    phone: '012 345 678 / 098 765 432',
    exchangeRate: 4100,
    taxRate: 0,
    serviceChargeRate: 0,
    useKhmerDigits: false,
    receiptFooterKh: 'សូមអរគុណសម្រាប់ការអញ្ជើញមកពិសា! សូមជូនពរមានសុខភាពល្អ និងសំណាងល្អ!',
  });

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [kdsOrders, setKdsOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTableForPos, setSelectedTableForPos] = useState<DiningTable | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Update root element theme
  useEffect(() => {
    // POS and KDS default to dark as requested
    if (activeTab === 'pos' || activeTab === 'kds') {
      document.documentElement.classList.add('dark');
    } else {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [activeTab, theme]);

  // Fetch all initial data
  const refreshAllData = useCallback(async () => {
    try {
      const [staffRes, tablesRes, catsRes, menuRes, ordersRes, kdsRes, invRes] = await Promise.all([
        fetch('/api/staff').then((r) => r.json()),
        fetch('/api/tables').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/menu').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/orders/kds').then((r) => r.json()),
        fetch('/api/inventory').then((r) => r.json()),
      ]);

      if (Array.isArray(staffRes)) {
        setAllStaff(staffRes);
        // Default login as Cashier or Manager if not logged in
        if (!currentStaff && staffRes.length > 0) {
          const defaultStaff = staffRes.find((s: User) => s.role === 'CASHIER') || staffRes[0];
          setCurrentStaff(defaultStaff);
        }
      }
      if (Array.isArray(tablesRes)) setTables(tablesRes);
      if (Array.isArray(catsRes)) setCategories(catsRes);
      if (Array.isArray(menuRes)) setMenu(menuRes);
      if (Array.isArray(ordersRes)) setActiveOrders(ordersRes);
      if (Array.isArray(kdsRes)) setKdsOrders(kdsRes);
      if (Array.isArray(invRes)) setInventory(invRes);
    } catch (e) {
      console.error('Error fetching restaurant data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentStaff]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Server-Sent Events (SSE) Realtime Listener
  useEffect(() => {
    const sse = new EventSource('/api/realtime');

    sse.addEventListener('connected', () => {
      setSseConnected(true);
    });

    sse.addEventListener('order_created', () => {
      refreshAllData();
      showToast('🔔 មានការកម្មង់ថ្មីត្រូវបានទទួល និងបញ្ជូនទៅផ្ទះបាយ!');
    });

    sse.addEventListener('kitchen_status_updated', () => {
      refreshAllData();
      showToast('👨‍🍳 ស្ថានភាពម្ហូបក្នុងផ្ទះបាយបានផ្លាស់ប្តូរ!');
    });

    sse.addEventListener('payment_completed', () => {
      refreshAllData();
      showToast('💰 វិក្កយបត្រត្រូវបានគិតប្រាក់រួចរាល់!');
    });

    sse.addEventListener('tables_transferred', () => {
      refreshAllData();
      showToast('🔄 តុត្រូវបានផ្ទេរជោគជ័យ!');
    });

    sse.addEventListener('menu_item_updated', () => {
      refreshAllData();
    });

    sse.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      sse.close();
    };
  }, [refreshAllData, showToast]);

  // PIN Login
  const loginWithPin = async (pinCode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/staff/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode }),
      });
      const data = await res.json();
      if (data.success && data.staff) {
        setCurrentStaff(data.staff);
        showToast(`ស្វាគមន៍ ${data.staff.name} (${data.staff.role})`);
        return true;
      }
      showToast(data.error || 'PIN មិនត្រឹមត្រូវ');
      return false;
    } catch (e: any) {
      showToast('Login error: ' + e.message);
      return false;
    }
  };

  const logout = () => {
    setCurrentStaff(null);
    showToast('បានចាកចេញពីប្រព័ន្ធ');
  };

  const clockIn = async () => {
    if (!currentStaff) return;
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentStaff.id, notes: 'វេនពេលព្រឹក/ល្ងាច' }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShiftId(data.shift.id);
        showToast(`⏰ ${currentStaff.name} បានចូលវេនការងារម៉ោង ${new Date().toLocaleTimeString('km-KH')}`);
      }
    } catch (e: any) {
      showToast('Clock in error: ' + e.message);
    }
  };

  const clockOut = async () => {
    if (!currentShiftId) {
      showToast('អ្នកមិនទាន់បានចូលវេនទេ');
      return;
    }
    try {
      const res = await fetch('/api/staff/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: currentShiftId }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShiftId(null);
        showToast('🏁 បានបញ្ចប់វេនការងារដោយជោគជ័យ');
      }
    } catch (e: any) {
      showToast('Clock out error: ' + e.message);
    }
  };

  const createOrder = async (orderData: any): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          serverId: currentStaff?.id || null,
          serverName: currentStaff?.name || 'Cashier',
          exchangeRate: settings.exchangeRate,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        showToast(`✅ បញ្ជូន Order ${data.order.orderNumber} ទៅផ្ទះបាយរួចរាល់!`);
        await refreshAllData();
        return data.order;
      }
      showToast(data.error || 'បរាជ័យក្នុងការបញ្ជូនការកម្មង់');
      return null;
    } catch (e: any) {
      showToast('Error creating order: ' + e.message);
      return null;
    }
  };

  const updateKitchenStatus = async (
    orderId: number,
    status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/kitchen-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenStatus: status }),
      });
      if (res.ok) {
        showToast(`👨‍🍳 បានផ្លាស់ប្តូរស្ថានភាពទៅ: ${status}`);
        await refreshAllData();
      }
    } catch (e: any) {
      showToast('Error updating kitchen status: ' + e.message);
    }
  };

  const quickToggleMenuAvailability = async (itemId: number, isAvailable: boolean) => {
    try {
      const res = await fetch(`/api/menu/${itemId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      if (res.ok) {
        showToast(isAvailable ? '✅ មុខម្ហូបត្រូវបានបើកលក់ឡើងវិញ' : '⛔ មុខម្ហូបត្រូវបានបិទ (អស់ស្តុក 86)');
        await refreshAllData();
      }
    } catch (e: any) {
      showToast('Error toggling availability: ' + e.message);
    }
  };

  const processPayment = async (paymentData: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          exchangeRate: settings.exchangeRate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 ទូទាត់ប្រាក់ជោគជ័យ និងចេញវិក្កយបត្រ!');
        await refreshAllData();
        return data;
      }
      showToast(data.error || 'បរាជ័យក្នុងការទូទាត់');
      return null;
    } catch (e: any) {
      showToast('Payment error: ' + e.message);
      return null;
    }
  };

  const transferTable = async (fromId: number, toId: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/tables/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromTableId: fromId, toTableId: toId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🔄 បានផ្ទេរតុជោគជ័យ!');
        await refreshAllData();
        return true;
      }
      showToast(data.error || 'មិនអាចផ្ទេរតុបានទេ');
      return false;
    } catch (e: any) {
      showToast('Error transferring table: ' + e.message);
      return false;
    }
  };

  const restockIngredient = async (data: {
    ingredientId: number;
    qtyAdd: number;
    costUsd?: number;
    note?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('📦 បន្ថែមស្តុកគ្រឿងផ្សំរួចរាល់!');
        await refreshAllData();
        return true;
      }
      return false;
    } catch (e: any) {
      showToast('Restock error: ' + e.message);
      return false;
    }
  };

  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('⚙️ បានរក្សាទុកការកំណត់');
  };

  return (
    <RestaurantContext.Provider
      value={{
        currentStaff,
        allStaff,
        loginWithPin,
        logout,
        clockIn,
        clockOut,
        currentShiftId,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        useKhmerDigits,
        setUseKhmerDigits,
        theme,
        setTheme,
        settings,
        updateSettings,
        tables,
        categories,
        menu,
        activeOrders,
        kdsOrders,
        inventory,
        isLoading,
        sseConnected,
        refreshAllData,
        createOrder,
        updateKitchenStatus,
        quickToggleMenuAvailability,
        processPayment,
        transferTable,
        restockIngredient,
        toastMessage,
        showToast,
        selectedTableForPos,
        setSelectedTableForPos,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
