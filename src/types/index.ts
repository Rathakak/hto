export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED';
export type KitchenStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'ORDERED' | 'BILL_REQUEST' | 'RESERVED' | 'BILL_REQUESTED';
export type PaymentMethod = 'CASH' | 'KHQR_ABA' | 'BANK_TRANSFER' | 'CARD';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  pinCode?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Shift {
  id: number;
  userId: number;
  userName?: string;
  clockIn: string;
  clockOut?: string | null;
  notes?: string | null;
}

export interface DiningTable {
  id: number;
  tableNo: string;
  nameKh: string;
  capacity: number;
  status: TableStatus;
  posX: number;
  posY: number;
  zone?: string;
  zoneKh?: string;
  activeOrder?: Order | null;
}

export interface Category {
  id: number;
  nameKh: string;
  nameEn: string;
  sortOrder: number;
  icon?: string | null;
}

export interface MenuOption {
  id: number;
  menuItemId: number;
  groupNameKh: string;
  groupNameEn: string;
  nameKh: string;
  nameEn: string;
  extraPriceUsd: string | number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  nameKh: string;
  nameEn: string;
  description?: string | null;
  imageUrl?: string | null;
  priceUsd: string | number;
  isAvailable: boolean;
  tags?: string | null;
  options?: MenuOption[];
  category?: Category;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  menuItemId: number;
  itemNameKh: string;
  itemNameEn: string;
  quantity: number;
  unitPriceUsd: number;
  selectedOptions?: Array<{ groupName: string; name: string; extraPrice: number }> | string;
  notes?: string;
  kitchenStatus?: KitchenStatus;
}

export interface Order {
  id: number;
  orderNumber: string;
  tableId?: number | null;
  tableName?: string;
  tableNo?: string;
  type: OrderType;
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  serverId?: number | null;
  serverName?: string | null;
  subtotalUsd: number;
  discountType?: 'PERCENT' | 'FIXED' | null;
  discountValue?: number;
  discountAmountUsd: number;
  serviceChargeUsd: number;
  taxRate: number;
  taxAmountUsd: number;
  totalUsd: number;
  exchangeRate: number;
  notes?: string | null;
  items: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  totalUsd: number;
  totalKhr: number;
  amountUsdPaid: number;
  amountKhrPaid: number;
  exchangeRate: number;
  changeUsd: number;
  changeKhr: number;
  khqrRefNumber?: string | null;
  createdAt: string;
}

export interface Ingredient {
  id: number;
  nameKh: string;
  nameEn: string;
  unit?: string;
  unitKh?: string;
  unitEn?: string;
  costPerUnit: number;
  currentQty: number;
  alertQty: number;
  isLowStock?: boolean;
}

export interface RecipeItem {
  id: number;
  menuItemId: number;
  ingredientId: number;
  quantityUsed: number;
  ingredientName?: string;
  unit?: string;
}

export interface StockLog {
  id: number;
  ingredientId: number;
  ingredientName?: string;
  type: 'PURCHASE' | 'SALE_USAGE' | 'WASTE' | 'ADJUSTMENT';
  qtyChange: number;
  costUsd?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface RestaurantSettings {
  nameKh: string;
  nameEn: string;
  addressKh: string;
  phone: string;
  exchangeRate: number;
  taxRate: number;
  serviceChargeRate: number;
  useKhmerDigits: boolean;
  receiptFooterKh: string;
}
