import { db } from './index.ts';
import {
  categories,
  diningTables,
  ingredients,
  menuItems,
  menuOptions,
  recipeItems,
  users,
} from './schema.ts';

export async function seedDatabase() {
  console.log('Seeding Cambodian Restaurant data...');

  // 1. Check if categories already exist
  const existingCats = await db.select().from(categories);
  if (existingCats.length > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  // 2. Insert Staff
  const staffMembers = [
    {
      uid: 'staff-owner-1',
      email: 'owner@khmerflavors.com',
      name: 'សុខ វាសនា (Owner)',
      pinCode: '1111',
      role: 'OWNER',
    },
    {
      uid: 'staff-manager-1',
      email: 'manager@khmerflavors.com',
      name: 'ចាន់ ពិសិដ្ឋ (Manager)',
      pinCode: '2222',
      role: 'MANAGER',
    },
    {
      uid: 'staff-cashier-1',
      email: 'cashier@khmerflavors.com',
      name: 'ស៊ិន ស្រីពៅ (Cashier)',
      pinCode: '3333',
      role: 'CASHIER',
    },
    {
      uid: 'staff-waiter-1',
      email: 'waiter1@khmerflavors.com',
      name: 'ហេង សុភ័ក្រ (Waiter)',
      pinCode: '4444',
      role: 'WAITER',
    },
    {
      uid: 'staff-kitchen-1',
      email: 'chef@khmerflavors.com',
      name: 'មេចុងភៅ បូផា (Head Chef)',
      pinCode: '5555',
      role: 'KITCHEN',
    },
  ];
  await db.insert(users).values(staffMembers);

  // 3. Insert Dining Tables (Floor Plan)
  const tablesList = [
    { tableNo: 'T-01', nameKh: 'តុលេខ ០១', capacity: 2, status: 'AVAILABLE', posX: 1, posY: 1, zone: 'Main Hall' },
    { tableNo: 'T-02', nameKh: 'តុលេខ ០២', capacity: 4, status: 'AVAILABLE', posX: 2, posY: 1, zone: 'Main Hall' },
    { tableNo: 'T-03', nameKh: 'តុលេខ ០៣', capacity: 4, status: 'AVAILABLE', posX: 3, posY: 1, zone: 'Main Hall' },
    { tableNo: 'T-04', nameKh: 'តុលេខ ០៤', capacity: 6, status: 'AVAILABLE', posX: 4, posY: 1, zone: 'Main Hall' },
    { tableNo: 'T-05', nameKh: 'តុលេខ ០៥', capacity: 2, status: 'AVAILABLE', posX: 1, posY: 2, zone: 'Main Hall' },
    { tableNo: 'T-06', nameKh: 'តុលេខ ០៦', capacity: 4, status: 'AVAILABLE', posX: 2, posY: 2, zone: 'Main Hall' },
    { tableNo: 'VIP-01', nameKh: 'បន្ទប់ពិសេស VIP ១', capacity: 10, status: 'AVAILABLE', posX: 1, posY: 3, zone: 'VIP Lounge' },
    { tableNo: 'VIP-02', nameKh: 'បន្ទប់ពិសេស VIP ២', capacity: 8, status: 'AVAILABLE', posX: 2, posY: 3, zone: 'VIP Lounge' },
    { tableNo: 'OD-01', nameKh: 'តុក្រៅ Terrace ១', capacity: 4, status: 'AVAILABLE', posX: 3, posY: 3, zone: 'Terrace' },
    { tableNo: 'OD-02', nameKh: 'តុក្រៅ Terrace ២', capacity: 4, status: 'AVAILABLE', posX: 4, posY: 3, zone: 'Terrace' },
  ];
  await db.insert(diningTables).values(tablesList);

  // 4. Insert Categories
  const categoryData = [
    { nameKh: 'ម្ហូបពិសេសប្រចាំហាង', nameEn: "Chef's Signature Dishes", sortOrder: 1, icon: 'Award' },
    { nameKh: 'ស៊ុប & សម្លខ្មែរ', nameEn: 'Traditional Soups & Curries', sortOrder: 2, icon: 'Soup' },
    { nameKh: 'ឆា & ចៀន', nameEn: 'Wok Stir-fry & Crispy Bites', sortOrder: 3, icon: 'Flame' },
    { nameKh: 'គុយទាវ & បាយ', nameEn: 'Noodles & Fragrant Rice', sortOrder: 4, icon: 'Utensils' },
    { nameKh: 'ភេសជ្ជៈ & បង្អែម', nameEn: 'Beverages & Desserts', sortOrder: 5, icon: 'Coffee' },
  ];
  const insertedCats = await db.insert(categories).values(categoryData).returning();

  // 5. Insert Ingredients (Inventory)
  const ingredientData = [
    { nameKh: 'សាច់គោផុយ (Lok Lak Beef)', nameEn: 'Tenderloin Beef', unit: 'kg', costPerUnit: '8.50', currentQty: '25.000', alertQty: '5.000' },
    { nameKh: 'ត្រីរ៉ស់បឹងទន្លេសាប', nameEn: 'Tonle Sap Snakehead Fish', unit: 'kg', costPerUnit: '6.00', currentQty: '18.000', alertQty: '4.000' },
    { nameKh: 'គ្រឿងបុកខ្មែរ (Kroeung Paste)', nameEn: 'Khmer Herb Paste', unit: 'kg', costPerUnit: '3.00', currentQty: '12.000', alertQty: '3.000' },
    { nameKh: 'ម្រេចកំពតខ្មៅ (Kampot Pepper)', nameEn: 'Kampot Black Pepper', unit: 'kg', costPerUnit: '15.00', currentQty: '5.000', alertQty: '1.000' },
    { nameKh: 'ខ្ទិះដូងស្រស់', nameEn: 'Fresh Coconut Cream', unit: 'liter', costPerUnit: '1.80', currentQty: '20.000', alertQty: '4.000' },
    { nameKh: 'អង្ករផ្ការំដួលកម្ពុជា', nameEn: 'Phka Rumduol Jasmine Rice', unit: 'kg', costPerUnit: '1.20', currentQty: '60.000', alertQty: '10.000' },
    { nameKh: 'សាច់ក្តាមសេះកំពត', nameEn: 'Fresh Kampot Crab Meat', unit: 'kg', costPerUnit: '16.00', currentQty: '8.000', alertQty: '2.000' },
    { nameKh: 'សរសៃគុយទាវស្រស់', nameEn: 'Fresh Rice Noodles', unit: 'kg', costPerUnit: '1.00', currentQty: '30.000', alertQty: '5.000' },
    { nameKh: 'កាហ្វេគ្រាប់ខ្មែរ', nameEn: 'Khmer Roasted Coffee', unit: 'kg', costPerUnit: '9.00', currentQty: '10.000', alertQty: '2.000' },
    { nameKh: 'ទឹកដោះគោខាប់', nameEn: 'Condensed Milk', unit: 'can', costPerUnit: '0.90', currentQty: '45.000', alertQty: '10.000' },
  ];
  const insertedIngredients = await db.insert(ingredients).values(ingredientData).returning();

  // 6. Insert Menu Items
  const menuItemsData = [
    // Category 1: Specialties
    {
      categoryId: insertedCats[0].id,
      nameKh: 'អាម៉ុកត្រីបឹងទន្លេសាប',
      nameEn: 'Tonle Sap Steamed Fish Amok',
      description: 'សាច់ត្រីរ៉ស់ស្រស់ ចំហុយជាមួយគ្រឿងបុកខ្មែរ ខ្ទិះដូងស្លឹកញ និងស៊ុត ក្នុងកន្ទោងស្លឹកចេកបែបប្រពៃណី',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      priceUsd: '6.50',
      isAvailable: true,
      tags: 'Signature,Tradition',
    },
    {
      categoryId: insertedCats[0].id,
      nameKh: 'ឡុកឡាក់សាច់គោខ្មែរម្រេចកំពត',
      nameEn: 'Khmer Beef Lok Lak with Kampot Pepper',
      description: 'សាច់គោផុយឆាក្តៅៗជាមួយទឹកជ្រលក់ពិសេស អមដោយបន្លែស្រស់ និងទឹកម្រេចក្រូចឆ្មាកំពតដ៏ល្បីល្បាញ',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      priceUsd: '7.00',
      isAvailable: true,
      tags: 'Popular,BestSeller',
    },
    {
      categoryId: insertedCats[0].id,
      nameKh: 'មាន់ដុតស្រុកស្រែទឹកត្រីកោះកុង',
      nameEn: 'Grilled Free-range Chicken with Koh Kong Sauce',
      description: 'មាន់ស្រែដុតក្រៀមក្រៅទន់ក្នុង ជ្រលក់ទឹកត្រីអំពិលកោះកុងរសជាតិហឹរជូរផ្អែម',
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
      priceUsd: '8.50',
      isAvailable: true,
      tags: 'Sharing,Signature',
    },

    // Category 2: Soups & Curries
    {
      categoryId: insertedCats[1].id,
      nameKh: 'សម្លម្ជូរគ្រឿងសាច់គោត្រកួន',
      nameEn: 'Beef Somlor Machu Kroeung',
      description: 'សម្លម្ជូរគ្រឿងសាច់គោរសជាតិដិត ជាមួយស្លឹកក្រូចសើច គល់ស្លឹកគ្រៃ និងត្រកួនស្រួយស្រស់',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      priceUsd: '5.50',
      isAvailable: true,
      tags: 'Soup,Traditional',
    },
    {
      categoryId: insertedCats[1].id,
      nameKh: 'ការីសាច់មាន់ស្រែខ្ទិះដូង',
      nameEn: 'Khmer Chicken Red Curry',
      description: 'ការីសាច់មាន់ជាមួយដំឡូងផ្អែម ខ្ទិះដូងឈ្ងុយឆ្ងាញ់ ទទួលទានជាមួយនំបុ័ង ឬនំបញ្ចុក',
      imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80',
      priceUsd: '6.00',
      isAvailable: true,
      tags: 'Curry',
    },

    // Category 3: Stir-fry & Bites
    {
      categoryId: insertedCats[2].id,
      nameKh: 'បាយឆាក្តាមខេត្តកំពត',
      nameEn: 'Kampot Crab Fried Rice',
      description: 'បាយឆាអង្ករផ្ការំដួល ជាមួយសាច់ក្តាមសេះស្រស់ពីឆ្នេរកំពត និងពងមាន់ក្រអូបឈ្ងុយ',
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
      priceUsd: '6.00',
      isAvailable: true,
      tags: 'Seafood,Rice',
    },
    {
      categoryId: insertedCats[2].id,
      nameKh: 'ប្រហិតត្រីឆ្លាតបំពងស្លឹកក្រូច',
      nameEn: 'Crispy Featherback Fish Cakes',
      description: 'ប្រហិតត្រីឆ្លាតបុកស្វិតបំពងជាមួយស្លឹកក្រូចសើច ជ្រលក់ទឹកត្រីកោះកុង',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      priceUsd: '4.50',
      isAvailable: true,
      tags: 'Appetizer',
    },

    // Category 4: Noodles & Rice
    {
      categoryId: insertedCats[3].id,
      nameKh: 'គុយទាវភ្នំពេញពិសេស',
      nameEn: 'Special Phnom Penh Kuy Teav',
      description: 'គុយទាវទឹកស៊ុបឆ្អឹងជ្រូកផ្អែមថ្លា ជាមួយប្រហិត សាច់ជ្រូកចិញ្ច្រាំ និងបង្គាស្រស់',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      priceUsd: '4.00',
      isAvailable: true,
      tags: 'Noodle,Breakfast',
    },

    // Category 5: Drinks & Desserts
    {
      categoryId: insertedCats[4].id,
      nameKh: 'កាហ្វេទឹកដោះគោទឹកកកខ្មែរ',
      nameEn: 'Traditional Khmer Iced Milk Coffee',
      description: 'កាហ្វេស្រក់ឈ្ងុយដិតបែបខ្មែរ បន្ថែមទឹកដោះគោខាប់ និងដុំទឹកកកត្រជាក់ស្រស់ស្រាយ',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      priceUsd: '1.75',
      isAvailable: true,
      tags: 'Drink,BestSeller',
    },
    {
      categoryId: insertedCats[4].id,
      nameKh: 'បង្អែមចេកខ្ទិះដូងក្រអូប',
      nameEn: 'Warm Banana in Sweet Coconut Milk',
      description: 'ចេកណាំវ៉ាស្ងោរក្នុងខ្ទិះដូងផ្អែមស្រទន់ រោយល្ងសលីងក្រអូប',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      priceUsd: '2.00',
      isAvailable: true,
      tags: 'Dessert',
    },
  ];

  const insertedItems = await db.insert(menuItems).values(menuItemsData).returning();

  // 7. Insert Modifiers for Lok Lak (item 1)
  const loklakOptions = [
    { menuItemId: insertedItems[1].id, groupNameKh: 'ទំហំចាន', groupNameEn: 'Size', nameKh: 'ធម្មតា (Standard)', nameEn: 'Standard', extraPriceUsd: '0.00' },
    { menuItemId: insertedItems[1].id, groupNameKh: 'ទំហំចាន', groupNameEn: 'Size', nameKh: 'ចានធំ (Large)', nameEn: 'Large', extraPriceUsd: '2.00' },
    { menuItemId: insertedItems[1].id, groupNameKh: 'ពងមាន់ចៀន', groupNameEn: 'Fried Egg', nameKh: 'បន្ថែមពងមាន់ចៀន', nameEn: 'Add Fried Egg', extraPriceUsd: '0.50' },
    { menuItemId: insertedItems[1].id, groupNameKh: 'កម្រិតហឹរ', groupNameEn: 'Spice', nameKh: 'ហឹរតិច', nameEn: 'Mild', extraPriceUsd: '0.00' },
    { menuItemId: insertedItems[1].id, groupNameKh: 'កម្រិតហឹរ', groupNameEn: 'Spice', nameKh: 'ហឹរខ្លាំង', nameEn: 'Extra Spicy', extraPriceUsd: '0.00' },
  ];
  await db.insert(menuOptions).values(loklakOptions);

  // 8. Insert Modifiers for Fish Amok (item 0)
  const amokOptions = [
    { menuItemId: insertedItems[0].id, groupNameKh: 'ទំហំ', groupNameEn: 'Portion', nameKh: 'កន្ទោងធម្មតា', nameEn: 'Regular', extraPriceUsd: '0.00' },
    { menuItemId: insertedItems[0].id, groupNameKh: 'ទំហំ', groupNameEn: 'Portion', nameKh: 'កន្ទោងធំពិសេស', nameEn: 'Large Bowl', extraPriceUsd: '2.50' },
    { menuItemId: insertedItems[0].id, groupNameKh: 'បន្ថែមបាយ', groupNameEn: 'Side', nameKh: 'ថែមបាយស ១ ចាន', nameEn: 'Extra Rice', extraPriceUsd: '0.75' },
  ];
  await db.insert(menuOptions).values(amokOptions);

  // 9. Link Recipes to Ingredients for auto inventory deduction
  // Lok Lak -> Beef 0.25kg, Kampot Pepper 0.01kg
  await db.insert(recipeItems).values([
    { menuItemId: insertedItems[1].id, ingredientId: insertedIngredients[0].id, quantityUsed: '0.250' },
    { menuItemId: insertedItems[1].id, ingredientId: insertedIngredients[3].id, quantityUsed: '0.010' },
    // Amok -> Fish 0.20kg, Kroeung 0.05kg, Coconut cream 0.1 liter
    { menuItemId: insertedItems[0].id, ingredientId: insertedIngredients[1].id, quantityUsed: '0.200' },
    { menuItemId: insertedItems[0].id, ingredientId: insertedIngredients[2].id, quantityUsed: '0.050' },
    { menuItemId: insertedItems[0].id, ingredientId: insertedIngredients[4].id, quantityUsed: '0.100' },
    // Coffee -> Coffee 0.03kg, Condensed milk 0.1 can
    { menuItemId: insertedItems[7].id, ingredientId: insertedIngredients[8].id, quantityUsed: '0.030' },
    { menuItemId: insertedItems[7].id, ingredientId: insertedIngredients[9].id, quantityUsed: '0.100' },
  ]);

  console.log('Seed completed successfully!');
}
