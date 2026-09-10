import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Staff and Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal ID
  email: text('email').notNull(),
  name: text('name').notNull(),
  pinCode: text('pin_code'), // 4-digit quick POS PIN
  role: text('role').notNull().default('WAITER'), // 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Staff Shift Clock-in / Clock-out
export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clockIn: timestamp('clock_in').defaultNow().notNull(),
  clockOut: timestamp('clock_out'),
  notes: text('notes'),
});

// 3. Dining Tables (Floor Plan)
export const diningTables = pgTable('dining_tables', {
  id: serial('id').primaryKey(),
  tableNo: text('table_no').notNull().unique(), // e.g. "T-01", "T-02", "VIP-1"
  nameKh: text('name_kh').notNull(), // "តុលេខ ០១"
  capacity: integer('capacity').notNull().default(4),
  status: text('status').notNull().default('AVAILABLE'), // 'AVAILABLE' | 'OCCUPIED' | 'ORDERED' | 'BILL_REQUEST'
  posX: integer('pos_x').default(0),
  posY: integer('pos_y').default(0),
  zone: text('zone').default('Main Hall'), // 'Main Hall', 'VIP', 'Terrace'
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Menu Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nameKh: text('name_kh').notNull(), // "ម្ហូបពិសេសប្រចាំហាង", "ស៊ុប & សម្ល"
  nameEn: text('name_en').notNull(), // "Chef Specialties", "Soups & Curries"
  sortOrder: integer('sort_order').notNull().default(0),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Menu Items (with Khmer, English, photo, 86'd status)
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  nameKh: text('name_kh').notNull(),
  nameEn: text('name_en').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').notNull().default(true), // 86'd toggle
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Menu Modifiers / Options (Size S/M/L, Spice level, Add-ons)
export const menuOptions = pgTable('menu_options', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id, { onDelete: 'cascade' })
    .notNull(),
  groupNameKh: text('group_name_kh').notNull(), // "ទំហំចាន", "កម្រិតហឹរ"
  groupNameEn: text('group_name_en').notNull(), // "Portion Size", "Spice Level"
  nameKh: text('name_kh').notNull(), // "តូច", "មធ្យម", "ធំ", "ហឹរតិច"
  nameEn: text('name_en').notNull(),
  extraPriceUsd: numeric('extra_price_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
});

// 7. Inventory Ingredients & Costs
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  nameKh: text('name_kh').notNull(), // "សាច់គោស្រស់", "ត្រីរ៉ស់", "ខ្ទិះដូង", "ម្រេចកំពត"
  nameEn: text('name_en').notNull(),
  unit: text('unit').notNull(), // "kg", "g", "bottle", "can", "liter"
  costPerUnit: numeric('cost_per_unit', { precision: 10, scale: 2 }).notNull(),
  currentQty: numeric('current_qty', { precision: 10, scale: 3 }).notNull(),
  alertQty: numeric('alert_qty', { precision: 10, scale: 3 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Recipe Items (Ingredient linkage for auto-deduction)
export const recipeItems = pgTable('recipe_items', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id, { onDelete: 'cascade' })
    .notNull(),
  ingredientId: integer('ingredient_id')
    .references(() => ingredients.id)
    .notNull(),
  quantityUsed: numeric('quantity_used', { precision: 10, scale: 3 }).notNull(),
});

// 9. Stock Adjustment & Restock Logs
export const stockLogs = pgTable('stock_logs', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id')
    .references(() => ingredients.id)
    .notNull(),
  type: text('type').notNull(), // 'PURCHASE' | 'SALE_USAGE' | 'WASTE' | 'ADJUSTMENT'
  qtyChange: numeric('qty_change', { precision: 10, scale: 3 }).notNull(),
  costUsd: numeric('cost_usd', { precision: 10, scale: 2 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // "ORD-2026-001"
  tableId: integer('table_id').references(() => diningTables.id),
  type: text('type').notNull().default('DINE_IN'), // 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED'
  kitchenStatus: text('kitchen_status').notNull().default('NEW'), // 'NEW' | 'PREPARING' | 'READY' | 'SERVED'
  serverId: integer('server_id').references(() => users.id),
  serverName: text('server_name'),
  subtotalUsd: numeric('subtotal_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discountType: text('discount_type'), // 'PERCENT' | 'FIXED'
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0.00'),
  discountAmountUsd: numeric('discount_amount_usd', { precision: 10, scale: 2 }).default('0.00'),
  serviceChargeUsd: numeric('service_charge_usd', { precision: 10, scale: 2 }).default('0.00'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
  taxAmountUsd: numeric('tax_amount_usd', { precision: 10, scale: 2 }).default('0.00'),
  totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 2 }).notNull().default('4100.00'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Order Items with notes & individual kitchen status
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id)
    .notNull(),
  itemNameKh: text('item_name_kh').notNull(),
  itemNameEn: text('item_name_en').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPriceUsd: numeric('unit_price_usd', { precision: 10, scale: 2 }).notNull(),
  selectedOptions: text('selected_options'), // JSON string
  notes: text('notes'), // e.g. "កុំដាក់ស្ករ", "ហឹរបន្តិច"
  kitchenStatus: text('kitchen_status').notNull().default('NEW'), // 'NEW' | 'PREPARING' | 'READY' | 'SERVED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Payments (Dual currency USD + KHR, Rounding rule 100៛, KHQR)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  method: text('method').notNull().default('CASH'), // 'CASH' | 'KHQR_ABA' | 'BANK_TRANSFER' | 'CARD'
  totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
  totalKhr: numeric('total_khr', { precision: 14, scale: 2 }).notNull(),
  amountUsdPaid: numeric('amount_usd_paid', { precision: 10, scale: 2 }).notNull().default('0.00'),
  amountKhrPaid: numeric('amount_khr_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 2 }).notNull(),
  changeUsd: numeric('change_usd', { precision: 10, scale: 2 }).notNull().default('0.00'),
  changeKhr: numeric('change_khr', { precision: 14, scale: 2 }).notNull().default('0.00'), // rounded to nearest 100៛
  khqrRefNumber: text('khqr_ref_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
  orders: many(orders),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  user: one(users, {
    fields: [shifts.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  options: many(menuOptions),
  recipeItems: many(recipeItems),
  orderItems: many(orderItems),
}));

export const menuOptionsRelations = relations(menuOptions, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuOptions.menuItemId],
    references: [menuItems.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipes: many(recipeItems),
  logs: many(stockLogs),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [recipeItems.menuItemId],
    references: [menuItems.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeItems.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(diningTables, {
    fields: [orders.tableId],
    references: [diningTables.id],
  }),
  server: one(users, {
    fields: [orders.serverId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
