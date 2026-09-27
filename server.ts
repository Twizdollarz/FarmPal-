import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/store';
import {
  parseFarmerMessage,
  checkDuplicateExpense,
  formatNairaNumber,
} from './server/whatsappEngine';
import {
  calculateCropFinancials,
  calculateFarmSummary,
  calculateCropComparisons,
  calculateDebtorSummary,
  calculateCashflowTimeline,
  calculateFarmFinancialHealth,
} from './src/lib/financeEngine';
import {
  calculateCropBudgets,
  calculateMarketBenchmarks,
  calculateCropCalendar,
  handleUssdSession,
  generateExpensesCsv,
  generateSalesCsv,
  generateDebtorsCsv,
} from './server/planningEngine';
import {
  calculateAgriCreditScore,
  generateAgroWeatherReport,
} from './server/phase4Engine';
import {
  generateFriendlyDailyReminder,
  FRIENDLY_REMINDER_TEMPLATES,
} from './server/reminderEngine';
import {
  Crop,
  Expense,
  ExpenseAllocation,
  HarvestRecord,
  LabourRecord,
  SaleRecord,
  CropFinancials,
  FarmInventoryItem,
  FarmerFeedback,
  FeedbackSummary,
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Farmer Profile
app.get('/api/profile', (req, res) => {
  res.json(db.profile);
});

app.put('/api/profile', (req, res) => {
  const { name, phone, location, preferredLanguage, dailyReminderEnabled, dailyReminderTime, reminderChannel } = req.body;
  if (name !== undefined) db.profile.name = name;
  if (phone !== undefined) db.profile.phone = phone;
  if (location !== undefined) db.profile.location = location;
  if (preferredLanguage !== undefined) db.profile.preferredLanguage = preferredLanguage;
  if (dailyReminderEnabled !== undefined) db.profile.dailyReminderEnabled = dailyReminderEnabled;
  if (dailyReminderTime !== undefined) db.profile.dailyReminderTime = dailyReminderTime;
  if (reminderChannel !== undefined) (db.profile as any).reminderChannel = reminderChannel;
  res.json(db.profile);
});

// Daily Friendly Reminders (WhatsApp & App Notification)
app.get('/api/reminders/daily', async (req, res) => {
  try {
    const forceNew = req.query.forceNew === 'true';
    const hour = req.query.hour as string | undefined;
    const reminder = await generateFriendlyDailyReminder(db.profile, db.crops, {
      forceNew,
      customHour: hour,
      channel: (db.profile as any).reminderChannel || 'both',
    });
    res.json(reminder);
  } catch (err) {
    console.error('Error generating daily reminder:', err);
    res.status(500).json({ error: 'Failed to generate reminder' });
  }
});

app.get('/api/reminders/templates', (req, res) => {
  res.json({
    total: FRIENDLY_REMINDER_TEMPLATES.length,
    templates: FRIENDLY_REMINDER_TEMPLATES,
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const existing = db.categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    return res.json(existing);
  }
  const newCat = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    isDefault: false,
  };
  db.categories.push(newCat);
  res.status(201).json(newCat);
});

// Crops
app.get('/api/crops', (req, res) => {
  const status = req.query.status as string;
  if (status) {
    return res.json(db.crops.filter((c) => c.status === status));
  }
  res.json(db.crops);
});

app.post('/api/crops', (req, res) => {
  const { name, variety, plantingDate, farmSizeAcres, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Crop name is required' });
  }
  const newCrop: Crop = {
    id: `crop-${Date.now()}`,
    userId: db.profile.id,
    name: name.trim(),
    variety: variety?.trim() || undefined,
    plantingDate: plantingDate || new Date().toISOString().split('T')[0],
    farmSizeAcres: Number(farmSizeAcres) || 1.0,
    status: 'active',
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.crops.push(newCrop);
  res.status(201).json(newCrop);
});

app.post('/api/crops/:id/finish', (req, res) => {
  const crop = db.crops.find((c) => c.id === req.params.id);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  crop.status = 'finished';
  crop.finishedDate = new Date().toISOString().split('T')[0];
  res.json(crop);
});

app.post('/api/crops/:id/reopen', (req, res) => {
  const crop = db.crops.find((c) => c.id === req.params.id);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  crop.status = 'active';
  crop.finishedDate = undefined;
  res.json(crop);
});

// Expenses
app.get('/api/expenses', (req, res) => {
  const cropId = req.query.cropId as string;
  if (cropId) {
    const filtered = db.expenses.filter((e) =>
      e.allocations.some((a) => a.cropId === cropId)
    );
    return res.json(filtered);
  }
  res.json(db.expenses);
});

app.post('/api/expenses', (req, res) => {
  const {
    categoryId,
    categoryName,
    totalAmount,
    expenseDate,
    description,
    isShared,
    allocations,
    source,
  } = req.body;

  const parsedAmount = Number(totalAmount);
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Valid expense amount is required' });
  }

  // Ensure category exists
  let catName = categoryName;
  if (!catName && categoryId) {
    const found = db.categories.find((c) => c.id === categoryId);
    if (found) catName = found.name;
  }
  if (!catName) catName = 'Other';

  // Build clean allocations
  let finalAllocations: ExpenseAllocation[] = [];
  if (isShared && Array.isArray(allocations) && allocations.length > 0) {
    // Reconcile shared expense percentages and exact amount
    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);
    // If not manually specified in amount, compute from percentages
    if (Math.abs(totalAllocated - parsedAmount) > 1) {
      const sumPct = allocations.reduce((sum, a) => sum + Number(a.percentage || 0), 0) || 100;
      let runningSum = 0;
      finalAllocations = allocations.map((a, idx) => {
        const pct = (Number(a.percentage) / sumPct) * 100;
        let amt = Math.round((pct / 100) * parsedAmount);
        if (idx === allocations.length - 1) {
          amt = parsedAmount - runningSum; // Remainder reconciliation ensures exact match!
        } else {
          runningSum += amt;
        }
        return {
          cropId: a.cropId,
          cropName: a.cropName || db.crops.find((c) => c.id === a.cropId)?.name || 'Unknown',
          percentage: Math.round(pct * 10) / 10,
          allocatedAmount: amt,
        };
      });
    } else {
      finalAllocations = allocations.map((a) => ({
        cropId: a.cropId,
        cropName: a.cropName || db.crops.find((c) => c.id === a.cropId)?.name || 'Unknown',
        percentage: Number(a.percentage),
        allocatedAmount: Number(a.allocatedAmount),
      }));
    }
  } else if (Array.isArray(allocations) && allocations.length > 0) {
    // Single crop allocation
    finalAllocations = [
      {
        cropId: allocations[0].cropId,
        cropName: allocations[0].cropName || db.crops.find((c) => c.id === allocations[0].cropId)?.name || 'Unknown',
        percentage: 100,
        allocatedAmount: parsedAmount,
      },
    ];
  } else {
    // Default to first active crop
    const firstCrop = db.crops.find((c) => c.status === 'active') || db.crops[0];
    finalAllocations = [
      {
        cropId: firstCrop ? firstCrop.id : 'crop-default',
        cropName: firstCrop ? firstCrop.name : 'General',
        percentage: 100,
        allocatedAmount: parsedAmount,
      },
    ];
  }

  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: db.profile.id,
    categoryId: categoryId || 'cat-other',
    categoryName: catName,
    totalAmount: parsedAmount,
    expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    description: description?.trim() || undefined,
    isShared: Boolean(isShared && finalAllocations.length > 1),
    allocations: finalAllocations,
    source: source || 'web',
    createdAt: new Date().toISOString(),
  };

  db.expenses.unshift(newExpense);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const idx = db.expenses.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  const deleted = db.expenses.splice(idx, 1)[0];
  res.json(deleted);
});

// Labour
app.get('/api/labour', (req, res) => {
  res.json(db.labourRecords);
});

app.post('/api/labour', (req, res) => {
  const { cropId, cropName, labourDate, workType, workerCount, amountPaid, description } = req.body;
  const amount = Number(amountPaid);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount paid is required' });
  }
  const crop = db.crops.find((c) => c.id === cropId);
  const matchedCropName = cropName || crop?.name || 'Farm Plot';

  // Automatically create linked financial expense for Labour
  const linkedExp: Expense = {
    id: `exp-${Date.now()}`,
    userId: db.profile.id,
    categoryId: 'cat-labour',
    categoryName: 'Labour',
    totalAmount: amount,
    expenseDate: labourDate || new Date().toISOString().split('T')[0],
    description: description || `${workerCount || 1} workers for ${workType || 'Labour'}`,
    isShared: false,
    allocations: [
      {
        cropId: cropId || (crop ? crop.id : 'crop-default'),
        cropName: matchedCropName,
        percentage: 100,
        allocatedAmount: amount,
      },
    ],
    source: 'web',
    createdAt: new Date().toISOString(),
  };
  db.expenses.unshift(linkedExp);

  const newLabour: LabourRecord = {
    id: `lab-${Date.now()}`,
    userId: db.profile.id,
    cropId: cropId || (crop ? crop.id : 'crop-default'),
    cropName: matchedCropName,
    labourDate: labourDate || new Date().toISOString().split('T')[0],
    workType: workType || 'Field labour',
    workerCount: Number(workerCount) || 1,
    amountPaid: amount,
    description: description?.trim() || undefined,
    linkedExpenseId: linkedExp.id,
    createdAt: new Date().toISOString(),
  };
  db.labourRecords.unshift(newLabour);
  res.status(201).json({ labour: newLabour, expense: linkedExp });
});

// Harvest
app.get('/api/harvest', (req, res) => {
  res.json(db.harvests);
});

app.post('/api/harvest', (req, res) => {
  const { cropId, cropName, harvestDate, quantity, unit, qualityGrade, notes } = req.body;
  const parsedQty = Number(quantity);
  if (!parsedQty || parsedQty <= 0) {
    return res.status(400).json({ error: 'Quantity harvested is required' });
  }
  const crop = db.crops.find((c) => c.id === cropId);
  const newHarvest: HarvestRecord = {
    id: `harv-${Date.now()}`,
    userId: db.profile.id,
    cropId: cropId || (crop ? crop.id : 'crop-default'),
    cropName: cropName || crop?.name || 'Crop Produce',
    harvestDate: harvestDate || new Date().toISOString().split('T')[0],
    quantity: parsedQty,
    unit: unit || 'crates',
    qualityGrade: qualityGrade?.trim() || 'Standard',
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.harvests.unshift(newHarvest);
  res.status(201).json(newHarvest);
});

// Sales
app.get('/api/sales', (req, res) => {
  res.json(db.sales);
});

app.post('/api/sales', (req, res) => {
  const {
    cropId,
    cropName,
    saleDate,
    quantitySold,
    unit,
    pricePerUnit,
    buyerName,
    paymentStatus,
    amountPaid,
    amountDue,
    dueDate,
    notes,
  } = req.body;
  const qty = Number(quantitySold);
  const price = Number(pricePerUnit);
  if (!qty || qty <= 0 || !price || price <= 0) {
    return res.status(400).json({ error: 'Quantity and Price per unit are required' });
  }
  const totalRevenue = Math.round(qty * price * 100) / 100;
  const crop = db.crops.find((c) => c.id === cropId);

  const status = paymentStatus || 'paid';
  let finalPaid = 0;
  let finalDue = 0;
  if (status === 'paid') {
    finalPaid = totalRevenue;
    finalDue = 0;
  } else if (status === 'credit') {
    finalPaid = 0;
    finalDue = totalRevenue;
  } else {
    finalPaid = Number(amountPaid) || 0;
    finalDue = Math.max(0, totalRevenue - finalPaid);
  }

  const newSale: SaleRecord = {
    id: `sale-${Date.now()}`,
    userId: db.profile.id,
    cropId: cropId || (crop ? crop.id : 'crop-default'),
    cropName: cropName || crop?.name || 'Crop Produce',
    saleDate: saleDate || new Date().toISOString().split('T')[0],
    quantitySold: qty,
    unit: unit || 'crates',
    pricePerUnit: price,
    totalRevenue,
    buyerName: buyerName?.trim() || undefined,
    paymentStatus: status,
    amountPaid: finalPaid,
    amountDue: finalDue,
    dueDate: dueDate?.trim() || undefined,
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.sales.unshift(newSale);
  res.status(201).json(newSale);
});

// Collect payment from debtor
app.post('/api/sales/:id/collect-payment', (req, res) => {
  const { amountCollected, notes } = req.body;
  const collected = Number(amountCollected);
  if (!collected || collected <= 0) {
    return res.status(400).json({ error: 'Valid amount collected is required' });
  }

  const sale = db.sales.find((s) => s.id === req.params.id);
  if (!sale) {
    return res.status(404).json({ error: 'Sale record not found' });
  }

  sale.amountPaid = (sale.amountPaid || 0) + collected;
  sale.amountDue = Math.max(0, sale.totalRevenue - sale.amountPaid);
  sale.paymentStatus = sale.amountDue <= 0 ? 'paid' : 'partial';
  if (notes) {
    sale.notes = sale.notes ? `${sale.notes} | Paid ₦${collected.toLocaleString()}: ${notes}` : `Paid ₦${collected.toLocaleString()}: ${notes}`;
  }

  res.json({ message: `Received ₦${collected.toLocaleString('en-NG')} from ${sale.buyerName || 'buyer'}`, sale });
});

// Financial Intelligence & Analytics (Deterministic Phase 2 Engine)
app.get('/api/financials', (req, res) => {
  const financialsMap: Record<string, CropFinancials> = {};
  for (const crop of db.crops) {
    financialsMap[crop.id] = calculateCropFinancials(crop, db.expenses, db.harvests, db.sales);
  }
  const farmSummary = calculateFarmSummary(db.crops, db.expenses, db.sales);
  res.json({
    farmSummary,
    cropFinancials: financialsMap,
  });
});

app.get('/api/analytics', (req, res) => {
  const financialsMap: Record<string, CropFinancials> = {};
  for (const crop of db.crops) {
    financialsMap[crop.id] = calculateCropFinancials(crop, db.expenses, db.harvests, db.sales);
  }

  const farmSummary = calculateFarmSummary(db.crops, db.expenses, db.sales);
  const cropComparisons = calculateCropComparisons(db.crops, financialsMap);
  const debtorSummary = calculateDebtorSummary(db.sales);
  const cashflowTimeline = calculateCashflowTimeline(db.expenses, db.sales);
  const financialHealth = calculateFarmFinancialHealth(farmSummary, debtorSummary, cropComparisons);

  res.json({
    farmSummary,
    cropComparisons,
    debtorSummary,
    cashflowTimeline,
    financialHealth,
  });
});

app.get('/api/intelligence/summary', (req, res) => {
  const summary = calculateFarmSummary(db.crops, db.expenses, db.sales);
  res.json(summary);
});

app.get('/api/intelligence/crops/:id', (req, res) => {
  const crop = db.crops.find((c) => c.id === req.params.id);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  const financials = calculateCropFinancials(crop, db.expenses, db.harvests, db.sales);
  res.json(financials);
});

// ======================== PHASE 3 API ENDPOINTS ========================

// Crop Seasonal Budgets
app.get('/api/planning/budgets', (req, res) => {
  const budgets = calculateCropBudgets(db.crops, db.expenses, db.budgetConfigs);
  res.json(budgets);
});

app.put('/api/planning/budgets/:cropId', (req, res) => {
  const { cropId } = req.params;
  const { targetYieldQuantity, targetYieldUnit, targetSellingPricePerUnit, categoryAllocations } = req.body;

  if (!db.budgetConfigs[cropId]) {
    db.budgetConfigs[cropId] = {
      cropId,
      targetYieldQuantity: targetYieldQuantity || 100,
      targetYieldUnit: targetYieldUnit || 'units',
      targetSellingPricePerUnit: targetSellingPricePerUnit || 5000,
      categoryAllocations: categoryAllocations || {},
    };
  } else {
    if (targetYieldQuantity !== undefined) db.budgetConfigs[cropId].targetYieldQuantity = targetYieldQuantity;
    if (targetYieldUnit !== undefined) db.budgetConfigs[cropId].targetYieldUnit = targetYieldUnit;
    if (targetSellingPricePerUnit !== undefined) db.budgetConfigs[cropId].targetSellingPricePerUnit = targetSellingPricePerUnit;
    if (categoryAllocations !== undefined) db.budgetConfigs[cropId].categoryAllocations = categoryAllocations;
  }

  const budgets = calculateCropBudgets(db.crops, db.expenses, db.budgetConfigs);
  const updated = budgets.find((b) => b.cropId === cropId);
  res.json({ message: 'Budget updated successfully', budget: updated });
});

// Market Price Benchmarks & Fair Value Engine
app.get('/api/market/benchmarks', (req, res) => {
  const marketData = calculateMarketBenchmarks(db.sales);
  res.json(marketData);
});

// Crop Growth Calendar & Agronomic Tasks
app.get('/api/planning/calendar', (req, res) => {
  const calendar = calculateCropCalendar(db.crops, db.tasks);
  res.json({ calendar, tasks: db.tasks });
});

app.post('/api/planning/tasks', (req, res) => {
  const { cropId, title, category, dueDate, estimatedCost, notes } = req.body;
  if (!cropId || !title) {
    return res.status(400).json({ error: 'Crop and task title are required' });
  }
  const crop = db.crops.find((c) => c.id === cropId);
  const newTask = {
    id: `task-${Date.now()}`,
    cropId,
    cropName: crop?.name || 'Farm Task',
    title: title.trim(),
    category: category || 'Labour',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    completed: false,
    estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    notes: notes?.trim() || undefined,
  };
  db.tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.post('/api/planning/tasks/:id/toggle', (req, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  task.completed = !task.completed;
  task.completedDate = task.completed ? new Date().toISOString().split('T')[0] : undefined;
  res.json(task);
});

app.delete('/api/planning/tasks/:id', (req, res) => {
  const index = db.tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.tasks.splice(index, 1);
  res.json({ message: 'Task deleted successfully' });
});

// Interactive USSD Simulator (Simulating *384*24#)
app.post('/api/ussd', (req, res) => {
  const { text = '' } = req.body;
  const result = handleUssdSession(text, db.crops, db.expenses, db.sales);
  res.json(result);
});

// CSV Ledger Export for Co-operatives, Banks & Extension Workers
app.get('/api/export/csv/:type', (req, res) => {
  const { type } = req.params;
  let csv = '';
  let filename = 'farmpal-export.csv';

  if (type === 'expenses') {
    csv = generateExpensesCsv(db.expenses);
    filename = `farmpal-expenses-${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'sales') {
    csv = generateSalesCsv(db.sales);
    filename = `farmpal-sales-${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'debtors') {
    csv = generateDebtorsCsv(db.sales);
    filename = `farmpal-debtors-${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    return res.status(400).json({ error: 'Invalid export type. Use expenses, sales, or debtors.' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ======================== PHASE 4 API ROUTES ========================

// 1. Cooperative & Aggregation Hub
app.get('/api/cooperative', (req, res) => {
  res.json({
    cooperative: db.cooperative,
    bulkPools: db.bulkInputPools,
    aggregationPools: db.aggregationPools,
  });
});

app.post('/api/cooperative/bulk-pools/:id/pledge', (req, res) => {
  const { quantity } = req.body;
  const pool = db.bulkInputPools.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'Bulk input pool not found' });
  const qty = Math.max(0, Number(quantity) || 0);
  const diff = qty - pool.userPledgedQuantity;
  pool.userPledgedQuantity = qty;
  pool.pledgedQuantity = Math.max(0, pool.pledgedQuantity + diff);
  res.json({ success: true, pool });
});

app.post('/api/cooperative/aggregation-pools/:id/commit', (req, res) => {
  const { volume } = req.body;
  const pool = db.aggregationPools.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'Aggregation pool not found' });
  const vol = Math.max(0, Number(volume) || 0);
  const diff = vol - pool.userCommittedVolume;
  pool.userCommittedVolume = vol;
  pool.currentAggregatedVolume = Math.max(0, pool.currentAggregatedVolume + diff);
  res.json({ success: true, pool });
});

// 2. Agri-Credit Scoring & Seasonal Loan Eligibility
app.get('/api/loans/credit-score', (req, res) => {
  const farmSummary = calculateFarmSummary(db.crops, db.expenses, db.sales);
  const debtorSummary = calculateDebtorSummary(db.sales);
  const creditReport = calculateAgriCreditScore(db.crops, db.expenses, db.sales, farmSummary, debtorSummary);
  res.json(creditReport);
});

app.post('/api/loans/apply', (req, res) => {
  const { productId, requestedAmount, purpose } = req.body;
  const applicationId = `FP-AGRI-${Date.now().toString().slice(-6)}`;
  res.status(201).json({
    success: true,
    applicationId,
    status: 'Pre-Approved Underwriter Verification',
    message: `Application ${applicationId} for ${formatNairaNumber(Number(requestedAmount) || 0)} submitted. Your FarmPal certified financial dossier has been forwarded to the agri-desk underwriter.`,
  });
});

// 3. Hyperlocal Agro-Weather Telemetry & Climate Advisory
app.get('/api/weather', (req, res) => {
  const location = db.profile.location || 'Kano, Nigeria';
  const report = generateAgroWeatherReport(location, db.crops);
  res.json(report);
});

// 4. Farm Store Inventory & Depot
app.get('/api/inventory', (req, res) => {
  res.json(db.inventoryItems);
});

app.post('/api/inventory', (req, res) => {
  const { name, category, currentQuantity, unit, reorderThreshold, estimatedUnitValue, storageLocation } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Item name is required' });
  }
  const qty = Number(currentQuantity) || 0;
  const threshold = Number(reorderThreshold) || 2;
  const newItem: FarmInventoryItem = {
    id: `inv-${Date.now()}`,
    name: name.trim(),
    category: category || 'Fertilizer',
    currentQuantity: qty,
    unit: unit || 'units',
    reorderThreshold: threshold,
    estimatedUnitValue: Number(estimatedUnitValue) || 0,
    storageLocation: storageLocation?.trim() || 'Main Farm Storehouse',
    lastRestocked: new Date().toISOString().split('T')[0],
    status: qty === 0 ? 'out_of_stock' : qty <= threshold ? 'low_stock' : 'sufficient',
  };
  db.inventoryItems.unshift(newItem);
  res.status(201).json(newItem);
});

app.post('/api/inventory/:id/adjust', (req, res) => {
  const item = db.inventoryItems.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  const { delta, newQuantity } = req.body;
  if (newQuantity !== undefined) {
    item.currentQuantity = Math.max(0, Number(newQuantity));
  } else if (delta !== undefined) {
    item.currentQuantity = Math.max(0, item.currentQuantity + Number(delta));
    if (Number(delta) > 0) {
      item.lastRestocked = new Date().toISOString().split('T')[0];
    }
  }
  item.status = item.currentQuantity === 0 ? 'out_of_stock' : item.currentQuantity <= item.reorderThreshold ? 'low_stock' : 'sufficient';
  res.json(item);
});

app.delete('/api/inventory/:id', (req, res) => {
  const idx = db.inventoryItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Inventory item not found' });
  db.inventoryItems.splice(idx, 1);
  res.json({ message: 'Item deleted' });
});

// ======================== FARMER TESTER FEEDBACK & PILOT API ========================

// 1. Get all farmer feedback submissions & analytics summary
app.get('/api/feedback', (req, res) => {
  const feedbacks = db.feedbacks || [];
  const totalCount = feedbacks.length;
  const averageRating = totalCount > 0
    ? Number((feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalCount).toFixed(1))
    : 5.0;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const featureCount: Record<string, number> = {};
  const easeOfUseBreakdown: Record<string, number> = { very_easy: 0, easy: 0, moderate: 0, difficult: 0 };

  for (const f of feedbacks) {
    if (f.rating >= 1 && f.rating <= 5) {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    }
    if (f.easeOfUseRating) {
      easeOfUseBreakdown[f.easeOfUseRating] = (easeOfUseBreakdown[f.easeOfUseRating] || 0) + 1;
    }
    if (Array.isArray(f.testedFeatures)) {
      for (const feat of f.testedFeatures) {
        featureCount[feat] = (featureCount[feat] || 0) + 1;
      }
    }
  }

  const topTestedFeatures = Object.entries(featureCount)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);

  const summary: FeedbackSummary = {
    totalCount,
    averageRating,
    ratingDistribution,
    topTestedFeatures,
    easeOfUseBreakdown,
  };

  res.json({ feedbacks, summary });
});

// 2. Submit new farmer feedback
app.post('/api/feedback', (req, res) => {
  const {
    farmerName,
    phoneOrEmail,
    farmLocation,
    primaryCrops,
    rating,
    testedFeatures,
    easeOfUseRating,
    clarityOfLanguage,
    nairaAndUnitsMatch,
    whatWorkedWell,
    whatWasConfusing,
    desiredNextFeature,
    deviceType,
    audioNoteTranscript,
  } = req.body;

  if (!whatWorkedWell && !whatWasConfusing && !desiredNextFeature && !rating) {
    return res.status(400).json({ error: 'Please provide feedback comments or a star rating' });
  }

  const newFeedback: FarmerFeedback = {
    id: `fb-${Date.now()}`,
    farmerName: (farmerName || db.profile.name || 'Anonymous Farmer').trim(),
    phoneOrEmail: (phoneOrEmail || db.profile.phone || '').trim(),
    farmLocation: (farmLocation || db.profile.location || 'Nigeria').trim(),
    primaryCrops: primaryCrops || db.crops.map((c) => c.name).join(', '),
    rating: Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
    testedFeatures: Array.isArray(testedFeatures) && testedFeatures.length > 0
      ? testedFeatures
      : ['whatsapp', 'general'],
    easeOfUseRating: easeOfUseRating || 'very_easy',
    clarityOfLanguage: clarityOfLanguage || 'clear',
    nairaAndUnitsMatch: nairaAndUnitsMatch || 'yes',
    whatWorkedWell: (whatWorkedWell || '').trim(),
    whatWasConfusing: (whatWasConfusing || '').trim(),
    desiredNextFeature: (desiredNextFeature || '').trim(),
    deviceType: deviceType || 'Android Phone',
    audioNoteTranscript: (audioNoteTranscript || '').trim(),
    createdAt: new Date().toISOString(),
  };

  db.feedbacks.unshift(newFeedback);
  res.status(201).json({
    success: true,
    message: 'Nagode! / Daalu! / Ese pupo! Your feedback has been received and will help improve FarmPal for Nigerian farmers.',
    feedback: newFeedback,
  });
});

// 3. Delete feedback entry
app.delete('/api/feedback/:id', (req, res) => {
  const idx = db.feedbacks.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Feedback entry not found' });
  db.feedbacks.splice(idx, 1);
  res.json({ message: 'Feedback entry deleted successfully' });
});

// 4. Test Mode: Reset to a Clean Farm Slate (so a tester can enter their own real farm data)
app.post('/api/test-mode/clean-slate', (req, res) => {
  const { testerName, testerLocation, testerPhone, testerLanguage } = req.body;
  db.crops = [];
  db.expenses = [];
  db.sales = [];
  db.labourRecords = [];
  db.harvests = [];
  db.budgetConfigs = {};
  db.tasks = [];
  db.profile.name = testerName || 'Farmer Tester';
  db.profile.location = testerLocation || 'Nigeria';
  db.profile.phone = testerPhone || '';
  if (testerLanguage) db.profile.preferredLanguage = testerLanguage;

  res.json({
    success: true,
    message: 'Clean farm slate ready! You can now test adding your own crops, expenses, and harvests.',
    profile: db.profile,
  });
});

// 5. Test Mode: Reload Demo Farm with full mock data
app.post('/api/test-mode/reload-demo', (req, res) => {
  const fresh = new (db.constructor as any)();
  // Preserve any real submitted feedbacks
  const savedFeedbacks = [...db.feedbacks];
  Object.assign(db, fresh);
  if (savedFeedbacks.length > 0) {
    db.feedbacks = savedFeedbacks;
  }
  res.json({
    success: true,
    message: 'Demo farm loaded with Tomato, Cucumber, Sweetcorn, expenses, market benchmarks, and cooperative data.',
  });
});

// WhatsApp Conversational Engine
app.post('/api/whatsapp/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const activeCrops = db.crops.filter((c) => c.status === 'active');
    const parsed = await parseFarmerMessage(message, activeCrops);

    // 0a. Handle Market Price Inquiries (Phase 3)
    if (parsed.intent === 'market_price') {
      const cropName = parsed.cropQuery || 'Tomato';
      const marketInfo = calculateMarketBenchmarks(db.sales);
      const matches = marketInfo.benchmarks.filter((b) => b.cropName.toLowerCase() === cropName.toLowerCase());

      if (matches.length > 0) {
        const topMarket = [...matches].sort((a, b) => b.wholesaleAvg - a.wholesaleAvg)[0];
        const localKano = matches.find((b) => b.state.toLowerCase() === 'kano') || matches[0];
        const lagosMile12 = matches.find((b) => b.marketName.toLowerCase().includes('mile 12'));

        let priceText = `📊 Market Price Report for *${cropName}* (${matches[0].unit}):\n\n`;
        priceText += `• *${localKano.marketName} (${localKano.state})*: ${formatNairaNumber(localKano.wholesaleAvg)} / ${localKano.unit} (${localKano.trend === 'rising' ? '📈 Rising' : '⚖️ Stable'})\n`;
        if (lagosMile12) {
          priceText += `• *${lagosMile12.marketName} (${lagosMile12.state})*: ${formatNairaNumber(lagosMile12.wholesaleAvg)} / ${lagosMile12.unit} (📈 +${lagosMile12.changePercent7d}% this week)\n`;
        }
        if (topMarket && topMarket.id !== localKano.id && topMarket.id !== lagosMile12?.id) {
          priceText += `• *${topMarket.marketName} (${topMarket.state})*: ${formatNairaNumber(topMarket.wholesaleAvg)} / ${topMarket.unit}\n`;
        }

        if (matches[0].farmerRealizedAvgPrice) {
          const diff = matches[0].farmerRealizedAvgPrice - localKano.wholesaleAvg;
          priceText += `\n🔍 *Your Farm Comparison*:\nYour recent average selling price was ${formatNairaNumber(matches[0].farmerRealizedAvgPrice)} (${diff >= 0 ? '+' : ''}${formatNairaNumber(diff)} vs local wholesale).\n`;
        }

        priceText += `\n💡 *Trading Tip*: ${lagosMile12 ? `Lagos Mile 12 buyers are paying up to ${formatNairaNumber(lagosMile12.wholesaleMax)} for fresh quality stock. Haulage freight from Kano/Kaduna is ~₦2,500/crate (or ~₦5,500/bag). Group with neighboring farms to share transit costs.` : 'Demand remains strong across major urban wholesale centers.'}`;
        priceText += `\n\n📌 *Bulletin*: Updated weekly across northern assembly hubs and southern terminal markets.`;

        return res.json({
          reply: priceText,
          parsedAction: null,
        });
      }
    }

  // 0b. Handle Budget & Cost Burn Inquiries (Phase 3)
  if (parsed.intent === 'budget') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const budgets = calculateCropBudgets(db.crops, db.expenses, db.budgetConfigs);
    const budget = budgets.find((b) => b.cropName.toLowerCase() === cropName.toLowerCase()) || budgets[0];

    if (budget) {
      const warningCats = budget.categoryBudgets.filter((c) => c.status === 'warning' || c.status === 'exceeded');
      let budgetText = `💰 Seasonal Budget Report for *${budget.cropName}* (${budget.farmSizeAcres} Acres):\n\n`;
      budgetText += `• Total Budget: ${formatNairaNumber(budget.totalBudget)}\n`;
      budgetText += `• Total Spent: ${formatNairaNumber(budget.totalSpent)} (${budget.overallBurnPercent}% burn rate)\n`;
      budgetText += `• Remaining Balance: ${formatNairaNumber(Math.max(0, budget.remainingBudget))}\n`;
      budgetText += `• Status: ${budget.overallBurnPercent > 100 ? '⚠️ OVER BUDGET' : budget.overallBurnPercent >= 85 ? '⚡ NEAR LIMIT' : '✅ ON TRACK'}\n`;

      if (warningCats.length > 0) {
        budgetText += `\n⚠️ *Alert Categories*:\n`;
        warningCats.slice(0, 3).forEach((c) => {
          budgetText += `• ${c.categoryName}: ${formatNairaNumber(c.spentAmount)} of ${formatNairaNumber(c.allocatedBudget)} (${c.burnPercent}% spent)\n`;
        });
      }

      budgetText += `\n📈 Target Yield: ${budget.targetYieldQuantity} ${budget.targetYieldUnit} @ ${formatNairaNumber(budget.targetSellingPricePerUnit)} = Projected Revenue ${formatNairaNumber(budget.projectedRevenue)}.`;

      return res.json({
        reply: budgetText,
        parsedAction: null,
      });
    }
  }

  // 0c. Handle Crop Calendar & Growth Stage Inquiries (Phase 3)
  if (parsed.intent === 'calendar') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const calData = calculateCropCalendar(db.crops, db.tasks);
    const schedule = calData.find((c) => c.cropName.toLowerCase() === cropName.toLowerCase()) || calData[0];

    if (schedule) {
      let calText = `🌱 Crop Calendar for *${schedule.cropName}* (${schedule.variety || 'Active'}):\n\n`;
      calText += `• Planted: ${schedule.plantingDate} (Day ${schedule.daysAfterPlanting} of ${schedule.totalDaysToMaturity})\n`;
      calText += `• Current Stage: *${schedule.currentStage.stageName}* (${schedule.currentStage.progressPercent}%)\n`;
      calText += `• Key Action: ${schedule.currentStage.keyAction}\n`;
      calText += `• Agronomic Tip: ${schedule.currentStage.advisoryNotes}\n`;

      if (schedule.upcomingTasks.length > 0) {
        const pending = schedule.upcomingTasks.filter((t) => !t.completed);
        if (pending.length > 0) {
          calText += `\n📋 *Upcoming Farm Task*:\n• ${pending[0].title} (Due: ${pending[0].dueDate})${pending[0].estimatedCost ? ` ~ ${formatNairaNumber(pending[0].estimatedCost)}` : ''}`;
        }
      }

      return res.json({
        reply: calText,
        parsedAction: null,
      });
    }
  }

  // 0d. Handle Weather & Agro-Climate Inquiries (Phase 4)
  if (parsed.intent === 'weather') {
    const weather = generateAgroWeatherReport(db.profile.location || 'Kano, Nigeria', db.crops);
    let text = `🌦️ *Agro-Weather Advisory for ${weather.location}*:\n\n`;
    text += `• *Current*: ${weather.temperatureC}°C, ${weather.condition}\n`;
    text += `• *Rain Risk*: ${weather.rainfallProbability}% (Humidity: ${weather.humidityPercent}%, Wind: ${weather.windSpeedKmh} km/h)\n`;
    text += `• *Spray Suitability*: *${weather.spraySuitability}*\n`;
    text += `  _${weather.sprayAdvisory}_\n\n`;
    text += `💧 *Irrigation Recommendation*: ${weather.irrigationRecommendation}\n\n`;
    if (weather.cropThreatAlerts.length > 0) {
      const topAlert = weather.cropThreatAlerts[0];
      text += `⚠️ *Alert (${topAlert.cropName})*: ${topAlert.threatType}\n`;
      text += `Action: ${topAlert.preventativeAction}\n`;
    }
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0e. Handle Agri-Credit & Loan Inquiries (Phase 4)
  if (parsed.intent === 'loan') {
    const farmSummary = calculateFarmSummary(db.crops, db.expenses, db.sales);
    const debtorSummary = calculateDebtorSummary(db.sales);
    const credit = calculateAgriCreditScore(db.crops, db.expenses, db.sales, farmSummary, debtorSummary);
    let text = `🏦 *Farm Credit & Loan Pre-Qualification*:\n\n`;
    text += `• *Agri-Credit Score*: *${credit.score} / ${credit.maxScore}* (${credit.ratingTier})\n`;
    text += `• *Approval Probability*: ${credit.approvalProbabilityPercent}%\n`;
    text += `• *Pre-Qualified Borrowing Limit*: *${formatNairaNumber(credit.maxEligibleBorrowing)}*\n\n`;
    text += `📋 *Pre-Qualified Financing Facilities*:\n`;
    credit.availableLoanProducts.slice(0, 2).forEach((prod) => {
      text += `• *${prod.productTitle}* (${prod.institutionName})\n  Up to ${formatNairaNumber(prod.maxAmount)} @ ${prod.interestRatePerAnnum}% p.a. (${prod.repaymentStructure})\n`;
    });
    text += `\n💡 Your FarmPal cashflow statement is certified and ready for bank underwriter submission.`;
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0f. Handle Farm Store Inventory Inquiries (Phase 4)
  if (parsed.intent === 'inventory') {
    const items = db.inventoryItems;
    let text = `📦 *Farm Store Inventory Report*:\n\n`;
    items.forEach((item) => {
      const statusIcon = item.status === 'out_of_stock' ? '❌' : item.status === 'low_stock' ? '⚠️' : '✅';
      text += `${statusIcon} *${item.name}*: ${item.currentQuantity} ${item.unit}\n`;
    });
    const lowStock = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
    if (lowStock.length > 0) {
      text += `\n⚠️ *Low Stock Alert*: ${lowStock.map((i) => `${i.name} (${i.currentQuantity} ${i.unit})`).join(', ')}. Restock before weekend field tasks!`;
    }
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0g. Handle Cooperative & Aggregation Inquiries (Phase 4)
  if (parsed.intent === 'cooperative') {
    const coop = db.cooperative;
    const pools = db.bulkInputPools;
    const aggPools = db.aggregationPools;
    let text = `🤝 *${coop.name}* (${coop.totalMembers} Members):\n\n`;
    text += `🛒 *Active Bulk Buying Orders*:\n`;
    pools.slice(0, 2).forEach((p) => {
      text += `• *${p.inputName}*: ${formatNairaNumber(p.coopBulkPrice)} / ${p.unit} (Save ${p.discountPercent}% vs retail)\n  Pledged: ${p.pledgedQuantity}/${p.targetQuantity} ${p.unit}\n`;
    });
    text += `\n🚛 *Produce Aggregation Contracts*:\n`;
    aggPools.slice(0, 2).forEach((a) => {
      text += `• *${a.cropName} -> ${a.offtakerName}*: Floor price ${formatNairaNumber(a.agreedFloorPricePerUnit)} / ${a.unit}\n  Progress: ${a.currentAggregatedVolume}/${a.minimumVolumeRequired} ${a.unit}\n`;
    });
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0h. Handle Daily Reminder Acknowledgement ("nothing today", "no expenses today", "quiet day")
  if (parsed.intent === 'reminder_ack') {
    const firstName = db.profile.name ? db.profile.name.split(' ')[0] : 'Farmer';
    const ackReplies = [
      `Understood ${firstName}! 🙏 No expenses or sales recorded for today. Resting well is an essential part of good farming. Have a peaceful evening, and tomorrow we push again! 🌿💤`,
      `Noted with thanks, Chief ${firstName}! 🌾 Glad today was quiet and peaceful on the farm. Rest well tonight—tomorrow is another blessed and fruitful day! 🌙`,
      `Acknowledged ${firstName}! ✨ Your notebook is up to date with zero expenses or sales today. Enjoy your evening and rest your body well! 👨‍🌾💤`,
      `Great! Rest well tonight, ${firstName}. 🚜 Farming has busy days and quiet days. Tomorrow we move again with fresh energy! 🌅`,
    ];
    const chosenAck = ackReplies[Math.floor(Math.random() * ackReplies.length)];
    return res.json({
      reply: chosenAck,
      parsedAction: null,
    });
  }

  // 1. Handle Expenses
  if (parsed.intent === 'expense' && parsed.expenses && parsed.expenses.length > 0) {
    // Check if clarification prompt needed
    if (parsed.clarificationPrompt && parsed.confidence < 0.7) {
      return res.json({
        reply: parsed.clarificationPrompt,
        parsedAction: null,
      });
    }

    // Check duplicate guard
    if (parsed.expenses.length === 1) {
      const single = parsed.expenses[0];
      const dup = checkDuplicateExpense(single.category, single.amount);
      if (dup) {
        return res.json({
          reply: `It looks like you may have already recorded this ${formatNairaNumber(single.amount)} ${single.category} expense today (${dup.expenseDate}).\n\nDo you want to save it anyway or cancel?`,
          parsedAction: {
            type: 'confirm_duplicate',
            data: {
              expenses: parsed.expenses,
              activeCrops,
            },
          },
        });
      }
    }

    // Shared expense across multiple crops
    if (parsed.sharedCropNames && parsed.sharedCropNames.length > 1) {
      const matchedCrops = activeCrops.filter((c) =>
        parsed.sharedCropNames?.some((name) => name.toLowerCase() === c.name.toLowerCase())
      );
      const total = parsed.expenses.reduce((sum, e) => sum + e.amount, 0);
      const cat = parsed.expenses[0]?.category || 'General';

      const reply = `Got it 🌱\n\nShared Expense: ${cat} — ${formatNairaNumber(total)}\nApplies to:\n${matchedCrops.map((c) => `✓ ${c.name}`).join('\n')}\n\nHow would you like to split this?\n1. Split equally (${Math.round(100 / matchedCrops.length)}% each)\n2. Split by farm size\n3. Save with custom split`;

      return res.json({
        reply,
        parsedAction: {
          type: 'split_expense',
          data: {
            categoryName: cat,
            totalAmount: total,
            crops: matchedCrops,
          },
        },
      });
    }

    // Multiple expenses in one message (Specification Section 8)
    if (parsed.expenses.length > 1) {
      const totalAmount = parsed.expenses.reduce((acc, e) => acc + e.amount, 0);
      const summaryLines = parsed.expenses
        .map((e) => `• ${e.category} — ${formatNairaNumber(e.amount)}`)
        .join('\n');

      const reply = `I found ${parsed.expenses.length} expenses:\n\n${summaryLines}\n\nTotal: ${formatNairaNumber(totalAmount)}\n\nShould I save them?`;

      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_expenses',
          data: {
            expenses: parsed.expenses,
            totalAmount,
          },
        },
      });
    }

    // Single expense handling:
    const single = parsed.expenses[0];
    const explicitCrop = single.cropName
      ? db.crops.find((c) => c.name.toLowerCase() === single.cropName?.toLowerCase())
      : undefined;

    const targetCrop = explicitCrop || (activeCrops.length === 1 ? activeCrops[0] : (activeCrops.length === 0 ? db.crops[0] : undefined));

    // If target crop is determined (explicitly mentioned, or only 1 crop, or fallback to first crop):
    if (targetCrop) {
      // Auto-save
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        userId: db.profile.id,
        categoryId: `cat-${single.category.toLowerCase()}`,
        categoryName: single.category,
        totalAmount: single.amount,
        expenseDate: new Date().toISOString().split('T')[0],
        description: single.description || `Recorded via WhatsApp`,
        isShared: false,
        allocations: [
          {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            percentage: 100,
            allocatedAmount: single.amount,
          },
        ],
        source: 'whatsapp',
        createdAt: new Date().toISOString(),
      };
      db.expenses.unshift(newExp);

      // Compute new crop total
      const updatedTotalSpent = db.expenses.reduce((sum, e) => {
        const match = e.allocations.find((a) => a.cropId === targetCrop.id);
        return sum + (match ? match.allocatedAmount : 0);
      }, 0);

      const reply = `Got it 🌱\n\n${formatNairaNumber(single.amount)} added to ${single.category} for ${targetCrop.name}.\n\nTotal spent on ${targetCrop.name}: ${formatNairaNumber(updatedTotalSpent)}.`;

      return res.json({
        reply,
        parsedAction: null,
      });
    }

    // Single expense with multiple active crops and no crop specified: Ask which crop
    if (activeCrops.length > 1) {
      const cropOptions = activeCrops.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      const reply = `Got it 🌱\n\n${single.category} — ${formatNairaNumber(single.amount)}\nWhich crop was this for?\n\n${cropOptions}\n${activeCrops.length + 1}. Shared across multiple crops`;

      return res.json({
        reply,
        parsedAction: {
          type: 'disambiguate_crop',
          data: {
            expense: single,
            crops: activeCrops,
          },
        },
      });
    }
  }

  // 2. Handle Sales
  if (parsed.intent === 'sale' && parsed.sale) {
    const sale = parsed.sale;
    let targetCrop = activeCrops.find(
      (c) => sale.cropName && c.name.toLowerCase() === sale.cropName.toLowerCase()
    );
    if (!targetCrop && activeCrops.length === 1) {
      targetCrop = activeCrops[0];
    }

    if (targetCrop) {
      const total = sale.totalAmount || sale.quantity * sale.pricePerUnit;
      const isCredit = Boolean(sale.isCredit);
      const buyerText = sale.buyer ? `\n• Buyer: ${sale.buyer}` : '';
      const paymentTermText = isCredit ? '\n• Payment Terms: On Credit (Unpaid)' : '\n• Payment Terms: Cash Paid';

      const reply = `Got it 🌱\n\nSale Recorded:\n• Crop: ${targetCrop.name}\n• Quantity: ${sale.quantity} ${sale.unit}\n• Price: ${formatNairaNumber(sale.pricePerUnit)} / ${sale.unit}\n• Total Revenue: ${formatNairaNumber(total)}${buyerText}${paymentTermText}\n\nConfirm to record?`;
      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_sale',
          data: {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            quantitySold: sale.quantity,
            unit: sale.unit,
            pricePerUnit: sale.pricePerUnit,
            totalRevenue: total,
            buyerName: sale.buyer,
            isCredit,
            paymentStatus: isCredit ? 'credit' : 'paid',
          },
        },
      });
    }
  }

  // 2.5. Handle Debtor payment collection
  if (parsed.intent === 'debt_payment' && parsed.debtPayment) {
    const { buyerName, amountPaid } = parsed.debtPayment;
    const matchingSales = db.sales.filter(
      (s) =>
        (s.paymentStatus === 'credit' || s.paymentStatus === 'partial' || (s.amountDue && s.amountDue > 0)) &&
        s.buyerName &&
        s.buyerName.toLowerCase().includes(buyerName.toLowerCase())
    );

    const totalOwed = matchingSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
    const saleToApply = matchingSales[0];

    const reply = `Got it 🌱\n\nPayment Received from ${buyerName}:\n• Amount Collected: ${formatNairaNumber(amountPaid)}\n• Total Currently Owed: ${formatNairaNumber(totalOwed)}\n\nRecord this payment and update your Debtor records?`;

    return res.json({
      reply,
      parsedAction: {
        type: 'confirm_debt_payment',
        data: {
          saleId: saleToApply?.id,
          buyerName,
          amountPaid,
          totalOwed,
        },
      },
    });
  }

  // 3. Handle Harvest
  if (parsed.intent === 'harvest' && parsed.harvest) {
    const h = parsed.harvest;
    let targetCrop = activeCrops.find(
      (c) => h.cropName && c.name.toLowerCase() === h.cropName.toLowerCase()
    );
    if (!targetCrop && activeCrops.length === 1) {
      targetCrop = activeCrops[0];
    }
    if (targetCrop) {
      const reply = `Got it 🌱\n\nHarvest Recorded:\n• Crop: ${targetCrop.name}\n• Quantity: ${h.quantity} ${h.unit}\n\nConfirm to record?`;
      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_harvest',
          data: {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            quantity: h.quantity,
            unit: h.unit,
          },
        },
      });
    }
  }

  // Default fallback
    res.json({
      reply:
        parsed.clarificationPrompt ||
        `Good day! I am FarmPal, your farm notebook.\n\nYou can tell me what you spent or earned:\n• "I spent 20k on labour today"\n• "I spent 15k on fertilizer and 5k on fuel"\n• "Sold 20 crates of tomato at 8k each"\n• "Harvested 40 bags of cucumber"`,
      parsedAction: null,
    });
  } catch (err) {
    console.error('Error in WhatsApp conversational engine:', err);
    res.json({
      reply: `I received your message 🌱. To ensure your farm records stay accurate, could you please specify what you spent or sold? For example:\n• "Spent 20k on labour"\n• "Bought fertilizer for 35k"`,
      parsedAction: null,
    });
  }
});

// Execute confirmed WhatsApp action
app.post('/api/whatsapp/execute-action', (req, res) => {
  try {
    const { actionType, data } = req.body;

    if (actionType === 'confirm_expenses') {
      const expenses = data.expenses || [];
      const activeCrops = db.crops.filter((c) => c.status === 'active');
      const defaultCrop = activeCrops[0] || db.crops[0];

      for (const item of expenses) {
        // Look up assigned crop if specified
        let targetCrop = defaultCrop;
        if (item.cropId) {
          const matched = db.crops.find((c) => c.id === item.cropId);
          if (matched) targetCrop = matched;
        } else if (item.cropName) {
          const matched = db.crops.find((c) => c.name.toLowerCase() === item.cropName.toLowerCase());
          if (matched) targetCrop = matched;
        }

        const newExp: Expense = {
          id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: db.profile.id,
          categoryId: `cat-${(item.category || 'other').toLowerCase()}`,
          categoryName: item.category || 'Other',
          totalAmount: Number(item.amount),
          expenseDate: new Date().toISOString().split('T')[0],
          description: item.description || 'Recorded via WhatsApp',
          isShared: false,
          allocations: [
            {
              cropId: targetCrop.id,
              cropName: targetCrop.name,
              percentage: 100,
              allocatedAmount: Number(item.amount),
            },
          ],
          source: 'whatsapp',
          createdAt: new Date().toISOString(),
        };
        db.expenses.unshift(newExp);
      }
      return res.json({
        success: true,
        message: `Saved ${expenses.length} expense${expenses.length > 1 ? 's' : ''} successfully! Your farm records have been updated 🌱`,
      });
    }

  if (actionType === 'confirm_sale') {
    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      userId: db.profile.id,
      cropId: data.cropId,
      cropName: data.cropName,
      saleDate: new Date().toISOString().split('T')[0],
      quantitySold: Number(data.quantitySold),
      unit: data.unit || 'crates',
      pricePerUnit: Number(data.pricePerUnit),
      totalRevenue: Number(data.totalRevenue),
      buyerName: data.buyerName,
      paymentStatus: data.isCredit ? 'credit' : (data.paymentStatus || 'paid'),
      amountPaid: data.isCredit ? 0 : Number(data.totalRevenue),
      amountDue: data.isCredit ? Number(data.totalRevenue) : 0,
      createdAt: new Date().toISOString(),
    };
    db.sales.unshift(newSale);
    const creditMsg = data.isCredit ? ' (Recorded as Unpaid Credit in Debtors Book)' : '';
    return res.json({
      success: true,
      message: `Sale recorded for ${data.cropName}: ${data.quantitySold} ${data.unit} for ${formatNairaNumber(data.totalRevenue)}${creditMsg}! 🌱`,
    });
  }

  if (actionType === 'confirm_debt_payment') {
    const { saleId, buyerName, amountPaid } = data;
    let sale = saleId ? db.sales.find((s) => s.id === saleId) : undefined;
    if (!sale) {
      // Find latest unpaid sale for this buyer
      sale = db.sales.find(
        (s) =>
          (s.paymentStatus === 'credit' || s.paymentStatus === 'partial' || (s.amountDue && s.amountDue > 0)) &&
          s.buyerName &&
          s.buyerName.toLowerCase().includes(buyerName.toLowerCase())
      );
    }

    if (sale) {
      sale.amountPaid = (sale.amountPaid || 0) + Number(amountPaid);
      sale.amountDue = Math.max(0, sale.totalRevenue - sale.amountPaid);
      sale.paymentStatus = sale.amountDue <= 0 ? 'paid' : 'partial';
      sale.notes = sale.notes
        ? `${sale.notes} | Paid ₦${amountPaid.toLocaleString()} via WhatsApp`
        : `Paid ₦${amountPaid.toLocaleString()} via WhatsApp`;
    }

    return res.json({
      success: true,
      message: `Payment of ${formatNairaNumber(amountPaid)} recorded from ${buyerName}! Your Debtor balance has been updated 🌱`,
    });
  }

  if (actionType === 'confirm_harvest') {
    const newHarvest: HarvestRecord = {
      id: `harv-${Date.now()}`,
      userId: db.profile.id,
      cropId: data.cropId,
      cropName: data.cropName,
      harvestDate: new Date().toISOString().split('T')[0],
      quantity: Number(data.quantity),
      unit: data.unit,
      qualityGrade: 'Standard',
      createdAt: new Date().toISOString(),
    };
    db.harvests.unshift(newHarvest);
    return res.json({
      success: true,
      message: `Harvest recorded for ${data.cropName}: ${data.quantity} ${data.unit} added to your record! 🌱`,
    });
  }

  if (actionType === 'split_expense') {
    const { categoryName, totalAmount, allocations } = data;
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      userId: db.profile.id,
      categoryId: `cat-${categoryName.toLowerCase()}`,
      categoryName,
      totalAmount: Number(totalAmount),
      expenseDate: new Date().toISOString().split('T')[0],
      description: 'Shared expense split across multiple crops',
      isShared: true,
      allocations,
      source: 'whatsapp',
      createdAt: new Date().toISOString(),
    };
    db.expenses.unshift(newExp);
    return res.json({
      success: true,
      message: `Shared expense ${formatNairaNumber(totalAmount)} on ${categoryName} allocated successfully across ${allocations.length} crops 🌱`,
    });
  }

    res.status(400).json({ error: 'Unknown action type' });
  } catch (err) {
    console.error('Error executing WhatsApp action:', err);
    res.status(500).json({ error: 'Failed to execute action', message: 'Something went wrong saving to farm records.' });
  }
});

// Reset seed data
app.post(['/api/reset', '/api/reset-seed'], (req, res) => {
  // Re-instantiate
  const fresh = new (db.constructor as any)();
  Object.assign(db, fresh);
  res.json({ message: 'Reset to seed data complete' });
});

// ======================== GITHUB & EXPORT ENDPOINTS ========================

// Get Git repository status
app.get('/api/github/status', (req, res) => {
  try {
    const isGit = fs.existsSync(path.join(process.cwd(), '.git'));
    if (!isGit) {
      return res.json({
        initialized: false,
        message: 'Git repository not initialized',
      });
    }

    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const lastCommitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const lastCommitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --pretty=%cd --date=relative', { encoding: 'utf8' }).trim();
    const totalCommits = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();

    let remoteOrigin = '';
    try {
      remoteOrigin = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    } catch {
      remoteOrigin = '';
    }

    res.json({
      initialized: true,
      branch,
      lastCommitHash,
      lastCommitMsg,
      lastCommitDate,
      totalCommits: parseInt(totalCommits, 10) || 1,
      remoteOrigin: remoteOrigin ? remoteOrigin.replace(/\/\/[^@]+@/, '//***@') : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query git status', details: err?.message || String(err) });
  }
});

// Download full project source zip (ready for GitHub or offline development)
app.get('/api/github/export-zip', (req, res) => {
  try {
    const zipPath = path.join('/tmp', `farmpal-source-${Date.now()}.zip`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'export-zip.py');
    const includeGit = req.query.git === 'true' ? ' --include-git' : '';

    execSync(`python3 "${scriptPath}" "${zipPath}"${includeGit}`);

    if (!fs.existsSync(zipPath)) {
      return res.status(500).json({ error: 'Zip file generation failed' });
    }

    res.download(zipPath, 'farmpal-source.zip', () => {
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch (_) {}
    });
  } catch (err: any) {
    console.error('Error generating export zip:', err);
    res.status(500).json({ error: 'Failed to generate project zip archive' });
  }
});

// Push directly to remote GitHub repository
app.post('/api/github/push', (req, res) => {
  const { repoUrl, token, branch = 'main' } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository.git)' });
  }

  // Clean and sanitize repository URL
  let cleanUrl = repoUrl.trim();
  if (!cleanUrl.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Repository URL must start with https://github.com/' });
  }
  if (!cleanUrl.endsWith('.git')) {
    cleanUrl += '.git';
  }

  try {
    // Check if git is initialized
    if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
      execSync('git init -b main');
      execSync('git config user.name "Temple Nwobodo"');
      execSync('git config user.email "nwobodotemple2002@gmail.com"');
      execSync('git add .');
      execSync('git commit -m "feat: initial commit of FarmPal"');
    } else {
      // Stage any new uncommitted changes
      execSync('git add -A');
      try {
        execSync('git commit -m "chore: sync farm records and updates"');
      } catch (_) {
        // No changes to commit is fine
      }
    }

    // Prepare authenticated URL if token provided
    let pushUrl = cleanUrl;
    if (token && typeof token === 'string' && token.trim()) {
      const sanitizedToken = token.trim();
      const stripped = cleanUrl.replace('https://', '');
      pushUrl = `https://${encodeURIComponent(sanitizedToken)}@${stripped}`;
    }

    // Set or replace remote origin
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch (_) {}

    execSync(`git remote add origin "${pushUrl}"`);

    // Ensure branch is named properly
    execSync(`git branch -M "${branch}"`);

    // Push to GitHub
    execSync(`git push -u origin "${branch}" --force`, {
      timeout: 30000,
      stdio: 'pipe',
    });

    // Reset origin to clean URL without token so credentials are never saved in git config
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
      execSync(`git remote add origin "${cleanUrl}"`);
    } catch (_) {}

    res.json({
      success: true,
      message: `Successfully pushed FarmPal codebase to ${cleanUrl} on branch '${branch}'! 🚀`,
      repoUrl: cleanUrl,
      branch,
    });
  } catch (err: any) {
    const rawError = err?.stderr?.toString() || err?.message || 'Push command failed';
    // Sanitize any token from error message
    const sanitizedError = rawError.replace(/https:\/\/[^@]+@/g, 'https://***@');
    console.error('Git push error:', sanitizedError);

    res.status(500).json({
      error: 'Failed to push to GitHub',
      details: sanitizedError,
      suggestion: sanitizedError.includes('Authentication failed') || sanitizedError.includes('could not read Username')
        ? 'Please check your GitHub Personal Access Token (PAT). Make sure it has "repo" scope permissions.'
        : sanitizedError.includes('Repository not found')
        ? 'Repository was not found. Please ensure the repository exists on GitHub and that your token has access to it.'
        : 'Ensure your GitHub token and repository URL are correct, or download the project ZIP to push manually.',
    });
  }
});

// ======================== VITE / PRODUCTION ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const rootDist = path.join(process.cwd(), 'dist');
    const localDist = path.resolve(__dirname, '..', 'dist');
    const distPath = fs.existsSync(rootDist) ? rootDist : (fs.existsSync(localDist) ? localDist : __dirname);

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle is starting up. Please refresh in a few seconds.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FarmPal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
