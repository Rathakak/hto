import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  categories,
  diningTables,
  ingredients,
  menuItems,
  menuOptions,
  orderItems,
  orders,
  payments,
  recipeItems,
  shifts,
  stockLogs,
  users,
} from './src/db/schema.ts';
import { eq, desc, sql, and } from 'drizzle-orm';
import { seedDatabase } from './src/db/seed.ts';
import { roundKhrTo100 } from './src/lib/currency.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-Sent Events (SSE) Client Connections
type SseClient = {
  id: number;
  res: express.Response;
};
let sseClients: SseClient[] = [];
let nextClientId = 1;

export function broadcastSse(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// -------------------------------------------------------------
// REALTIME SSE ENDPOINT
// -------------------------------------------------------------
app.get('/api/realtime', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  const newClient: SseClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// -------------------------------------------------------------
// HEALTH & AUTO-SEED
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// STAFF & AUTH (PIN, ROLES, CLOCK IN/OUT)
// -------------------------------------------------------------
app.get('/api/staff', async (req, res) => {
  try {
    const allStaff = await db.select().from(users).where(eq(users.isActive, true));
    res.json(allStaff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff/pin-login', async (req, res) => {
  try {
    const { pinCode } = req.body;
    if (!pinCode) return res.status(400).json({ error: 'PIN is required' });

    const matched = await db
      .select()
      .from(users)
      .where(and(eq(users.pinCode, pinCode), eq(users.isActive, true)))
      .limit(1);

    if (matched.length === 0) {
      return res.status(401).json({ error: 'លេខសម្ងាត់ PIN មិនត្រឹមត្រូវ' });
    }

    const staff = matched[0];
    res.json({ success: true, staff });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff/clock-in', async (req, res) => {
  try {
    const { userId, notes } = req.body;
    const [shift] = await db
      .insert(shifts)
      .values({ userId, notes })
      .returning();
    res.json({ success: true, shift });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff/clock-out', async (req, res) => {
  try {
    const { shiftId } = req.body;
    const [shift] = await db
      .update(shifts)
      .set({ clockOut: new Date() })
      .where(eq(shifts.id, shiftId))
      .returning();
    res.json({ success: true, shift });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DINING TABLES (FLOOR PLAN)
// -------------------------------------------------------------
app.get('/api/tables', async (req, res) => {
  try {
    const allTables = await db.select().from(diningTables).orderBy(diningTables.id);

    // Attach current active order to occupied/ordered tables
    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(sql`${orders.status} IN ('PENDING', 'SENT')`, sql`${orders.tableId} IS NOT NULL`));

    const enriched = allTables.map((t) => {
      const active = activeOrders.find((o) => o.tableId === t.id);
      return {
        ...t,
        activeOrder: active || null,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tables/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const [updated] = await db
      .update(diningTables)
      .set({ status })
      .where(eq(diningTables.id, id))
      .returning();

    broadcastSse('table_updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tables/transfer', async (req, res) => {
  try {
    const { fromTableId, toTableId } = req.body;
    // Find active order on fromTable
    const [activeOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tableId, fromTableId), sql`${orders.status} IN ('PENDING', 'SENT')`));

    if (!activeOrder) {
      return res.status(400).json({ error: 'គ្មាន Order នៅលើតុនេះទេ' });
    }

    // Move order to new table
    await db.update(orders).set({ tableId: toTableId }).where(eq(orders.id, activeOrder.id));

    // Update table statuses
    await db.update(diningTables).set({ status: 'AVAILABLE' }).where(eq(diningTables.id, fromTableId));
    await db.update(diningTables).set({ status: 'OCCUPIED' }).where(eq(diningTables.id, toTableId));

    broadcastSse('tables_transferred', { fromTableId, toTableId, orderId: activeOrder.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MENU & CATEGORIES
// -------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await db.select().from(categories).orderBy(categories.sortOrder);
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/menu', async (req, res) => {
  try {
    const items = await db.select().from(menuItems).orderBy(menuItems.id);
    const options = await db.select().from(menuOptions);

    const enriched = items.map((item) => ({
      ...item,
      options: options.filter((o) => o.menuItemId === item.id),
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Quick 86'd toggle from POS
app.put('/api/menu/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isAvailable } = req.body;
    const [updated] = await db
      .update(menuItems)
      .set({ isAvailable: Boolean(isAvailable) })
      .where(eq(menuItems.id, id))
      .returning();

    broadcastSse('menu_item_updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { categoryId, nameKh, nameEn, description, imageUrl, priceUsd, tags, options } = req.body;
    const [created] = await db
      .insert(menuItems)
      .values({
        categoryId,
        nameKh,
        nameEn,
        description,
        imageUrl,
        priceUsd: String(priceUsd),
        isAvailable: true,
        tags,
      })
      .returning();

    if (options && Array.isArray(options) && options.length > 0) {
      const optsToInsert = options.map((opt: any) => ({
        menuItemId: created.id,
        groupNameKh: opt.groupNameKh || 'ជម្រើស',
        groupNameEn: opt.groupNameEn || 'Option',
        nameKh: opt.nameKh,
        nameEn: opt.nameEn || opt.nameKh,
        extraPriceUsd: String(opt.extraPriceUsd || 0),
      }));
      await db.insert(menuOptions).values(optsToInsert);
    }

    broadcastSse('menu_created', created);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ORDERS & POS (RECEIVE, DISPATCH KITCHEN, AUTO DEDUCT INVENTORY)
// -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = db.select().from(orders).orderBy(desc(orders.createdAt)).limit(Number(limit));
    const allOrders = await query;
    const allOrderItems = await db.select().from(orderItems);
    const tables = await db.select().from(diningTables);

    const enriched = allOrders.map((o) => {
      const table = tables.find((t) => t.id === o.tableId);
      return {
        ...o,
        tableName: table ? table.nameKh : o.type,
        tableNo: table ? table.tableNo : '',
        items: allOrderItems.filter((i) => i.orderId === o.id),
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/kds', async (req, res) => {
  try {
    // Only fetch orders that are not fully served/completed
    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.status, 'SENT'), sql`${orders.kitchenStatus} != 'SERVED'`))
      .orderBy(orders.createdAt);

    const allItems = await db.select().from(orderItems);
    const tables = await db.select().from(diningTables);

    const enriched = activeOrders.map((o) => {
      const table = tables.find((t) => t.id === o.tableId);
      return {
        ...o,
        tableName: table ? table.nameKh : o.type,
        tableNo: table ? table.tableNo : '',
        items: allItems.filter((i) => i.orderId === o.id),
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      tableId,
      type = 'DINE_IN',
      serverId,
      serverName,
      items = [],
      discountType,
      discountValue = 0,
      serviceChargeUsd = 0,
      taxRate = 0,
      notes,
      exchangeRate = 4100,
    } = req.body;

    // Generate readable order number: ORD-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

    // Calculate subtotal
    let subtotalUsd = 0;
    for (const item of items) {
      subtotalUsd += Number(item.unitPriceUsd) * Number(item.quantity);
    }

    let discountAmountUsd = 0;
    if (discountType === 'PERCENT') {
      discountAmountUsd = (subtotalUsd * Number(discountValue)) / 100;
    } else if (discountType === 'FIXED') {
      discountAmountUsd = Number(discountValue);
    }

    const taxableAmount = Math.max(0, subtotalUsd - discountAmountUsd + Number(serviceChargeUsd));
    const taxAmountUsd = (taxableAmount * Number(taxRate)) / 100;
    const totalUsd = taxableAmount + taxAmountUsd;

    // Create Order Record
    const [createdOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        tableId: tableId || null,
        type,
        status: 'SENT',
        kitchenStatus: 'NEW',
        serverId: serverId || null,
        serverName: serverName || null,
        subtotalUsd: subtotalUsd.toFixed(2),
        discountType,
        discountValue: String(discountValue),
        discountAmountUsd: discountAmountUsd.toFixed(2),
        serviceChargeUsd: Number(serviceChargeUsd).toFixed(2),
        taxRate: String(taxRate),
        taxAmountUsd: taxAmountUsd.toFixed(2),
        totalUsd: totalUsd.toFixed(2),
        exchangeRate: String(exchangeRate),
        notes,
      })
      .returning();

    // Create Order Items
    if (items.length > 0) {
      const itemsToInsert = items.map((i: any) => ({
        orderId: createdOrder.id,
        menuItemId: i.menuItemId,
        itemNameKh: i.itemNameKh,
        itemNameEn: i.itemNameEn,
        quantity: i.quantity,
        unitPriceUsd: String(i.unitPriceUsd),
        selectedOptions: i.selectedOptions ? JSON.stringify(i.selectedOptions) : null,
        notes: i.notes || null,
        kitchenStatus: 'NEW',
      }));
      await db.insert(orderItems).values(itemsToInsert);

      // Auto-deduct inventory based on recipes
      for (const it of items) {
        const recipes = await db
          .select()
          .from(recipeItems)
          .where(eq(recipeItems.menuItemId, it.menuItemId));

        for (const r of recipes) {
          const deduction = Number(r.quantityUsed) * Number(it.quantity);
          await db
            .update(ingredients)
            .set({
              currentQty: sql`${ingredients.currentQty} - ${deduction}`,
              updatedAt: new Date(),
            })
            .where(eq(ingredients.id, r.ingredientId));

          await db.insert(stockLogs).values({
            ingredientId: r.ingredientId,
            type: 'SALE_USAGE',
            qtyChange: `-${deduction}`,
            note: `Auto-deducted for Order ${orderNumber}`,
          });
        }
      }
    }

    // Update table status if DINE_IN
    if (tableId) {
      await db.update(diningTables).set({ status: 'OCCUPIED' }).where(eq(diningTables.id, tableId));
    }

    // Broadcast to KDS and POS
    broadcastSse('order_created', {
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      tableId,
      status: createdOrder.status,
    });

    res.json({ success: true, order: createdOrder });
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Kitchen Display Status Update
app.put('/api/orders/:id/kitchen-status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { kitchenStatus } = req.body; // 'NEW' | 'PREPARING' | 'READY' | 'SERVED'

    const [updated] = await db
      .update(orders)
      .set({ kitchenStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    await db
      .update(orderItems)
      .set({ kitchenStatus })
      .where(eq(orderItems.orderId, id));

    broadcastSse('kitchen_status_updated', { orderId: id, kitchenStatus });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PAYMENTS & INVOICING (DUAL CURRENCY, 100៛ ROUNDING, KHQR)
// -------------------------------------------------------------
app.post('/api/payments', async (req, res) => {
  try {
    const {
      orderId,
      method = 'CASH',
      amountUsdPaid = 0,
      amountKhrPaid = 0,
      exchangeRate = 4100,
      khqrRefNumber,
    } = req.body;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const totalUsd = Number(order.totalUsd);
    const totalKhr = roundKhrTo100(totalUsd * exchangeRate);

    const paidInUsd = Number(amountUsdPaid) + (Number(amountKhrPaid) / exchangeRate);
    const rawChangeUsd = Math.max(0, paidInUsd - totalUsd);

    const changeUsd = Math.floor(rawChangeUsd);
    const remainderUsd = rawChangeUsd - changeUsd;
    const changeKhr = roundKhrTo100(remainderUsd * exchangeRate);

    // Save payment record
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        orderId,
        method,
        totalUsd: totalUsd.toFixed(2),
        totalKhr: totalKhr.toFixed(2),
        amountUsdPaid: Number(amountUsdPaid).toFixed(2),
        amountKhrPaid: Number(amountKhrPaid).toFixed(2),
        exchangeRate: String(exchangeRate),
        changeUsd: changeUsd.toFixed(2),
        changeKhr: changeKhr.toFixed(2),
        khqrRefNumber: khqrRefNumber || null,
      })
      .returning();

    // Mark Order as COMPLETED
    await db
      .update(orders)
      .set({ status: 'COMPLETED', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Release table if dine-in
    if (order.tableId) {
      await db
        .update(diningTables)
        .set({ status: 'AVAILABLE' })
        .where(eq(diningTables.id, order.tableId));
    }

    broadcastSse('payment_completed', { orderId, paymentId: paymentRecord.id });

    res.json({
      success: true,
      payment: paymentRecord,
      orderSummary: {
        totalUsd,
        totalKhr,
        changeUsd,
        changeKhr,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// INVENTORY & STOCK ALERTS
// -------------------------------------------------------------
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await db.select().from(ingredients).orderBy(ingredients.id);
    const enriched = items.map((i) => ({
      ...i,
      isLowStock: Number(i.currentQty) <= Number(i.alertQty),
    }));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/restock', async (req, res) => {
  try {
    const { ingredientId, qtyAdd, costUsd, note } = req.body;
    const [updated] = await db
      .update(ingredients)
      .set({
        currentQty: sql`${ingredients.currentQty} + ${Number(qtyAdd)}`,
        updatedAt: new Date(),
      })
      .where(eq(ingredients.id, ingredientId))
      .returning();

    await db.insert(stockLogs).values({
      ingredientId,
      type: 'PURCHASE',
      qtyChange: String(qtyAdd),
      costUsd: costUsd ? String(costUsd) : null,
      note: note || 'Restocked via Inventory Management',
    });

    res.json({ success: true, ingredient: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// REPORTS & ANALYTICS (SALES, TOP ITEMS, PEAK HOURS, GROSS PROFIT)
// -------------------------------------------------------------
app.get('/api/reports/analytics', async (req, res) => {
  try {
    const allCompletedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'COMPLETED'));

    const allItems = await db.select().from(orderItems);
    const allRecipes = await db.select().from(recipeItems);
    const allIngredients = await db.select().from(ingredients);

    // Calculate total revenue
    const totalSalesUsd = allCompletedOrders.reduce((sum, o) => sum + Number(o.totalUsd), 0);
    const totalSalesKhr = allCompletedOrders.reduce(
      (sum, o) => sum + roundKhrTo100(Number(o.totalUsd) * Number(o.exchangeRate)),
      0
    );

    // Top selling items count & revenue
    const itemMap: Record<string, { nameKh: string; nameEn: string; qty: number; revenue: number }> = {};
    for (const item of allItems) {
      if (!itemMap[item.itemNameKh]) {
        itemMap[item.itemNameKh] = {
          nameKh: item.itemNameKh,
          nameEn: item.itemNameEn,
          qty: 0,
          revenue: 0,
        };
      }
      itemMap[item.itemNameKh].qty += item.quantity;
      itemMap[item.itemNameKh].revenue += Number(item.unitPriceUsd) * item.quantity;
    }

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Calculate estimated gross profit: Selling Price - Food Cost
    let totalFoodCostUsd = 0;
    for (const item of allItems) {
      const recipes = allRecipes.filter((r) => r.menuItemId === item.menuItemId);
      let unitCost = 0;
      for (const r of recipes) {
        const ing = allIngredients.find((i) => i.id === r.ingredientId);
        if (ing) {
          unitCost += Number(r.quantityUsed) * Number(ing.costPerUnit);
        }
      }
      totalFoodCostUsd += unitCost * item.quantity;
    }
    const grossProfitUsd = Math.max(0, totalSalesUsd - totalFoodCostUsd);

    // Peak hours calculation (0 - 23)
    const hoursData: Record<number, number> = {};
    for (let h = 8; h <= 22; h++) hoursData[h] = 0;
    for (const o of allCompletedOrders) {
      const hour = new Date(o.createdAt).getHours();
      if (hoursData[hour] !== undefined) {
        hoursData[hour]++;
      }
    }
    const peakHours = Object.keys(hoursData).map((h) => ({
      hour: `${h}:00`,
      orders: hoursData[Number(h)],
    }));

    res.json({
      totalSalesUsd,
      totalSalesKhr,
      orderCount: allCompletedOrders.length,
      grossProfitUsd,
      totalFoodCostUsd,
      topItems,
      peakHours,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    // Auto-seed on first start if needed
    try {
      await seedDatabase();
    } catch (e) {
      console.log('Auto seed check passed or already initialized');
    }
  });
}

start();
