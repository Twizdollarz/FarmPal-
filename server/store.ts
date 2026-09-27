import {
  Crop,
  Expense,
  ExpenseCategory,
  FarmerProfile,
  HarvestRecord,
  LabourRecord,
  SaleRecord,
  AgronomicTask,
  CooperativeGroup,
  BulkInputPool,
  ProduceAggregationPool,
  FarmInventoryItem,
  FarmerFeedback,
} from '../src/types';
import {
  defaultBudgetConfigs,
  defaultAgronomicTasks,
  RawCropBudgetConfig,
} from './planningEngine';
import {
  defaultCooperative,
  defaultBulkInputPools,
  defaultAggregationPools,
  defaultInventoryItems,
} from './phase4Engine';

export const defaultCategories: ExpenseCategory[] = [
  { id: 'cat-seeds', name: 'Seeds', isDefault: true },
  { id: 'cat-seedlings', name: 'Seedlings', isDefault: true },
  { id: 'cat-land', name: 'Land', isDefault: true },
  { id: 'cat-labour', name: 'Labour', isDefault: true },
  { id: 'cat-fertilizer', name: 'Fertilizer', isDefault: true },
  { id: 'cat-chemicals', name: 'Chemicals', isDefault: true },
  { id: 'cat-irrigation', name: 'Irrigation', isDefault: true },
  { id: 'cat-fuel', name: 'Fuel', isDefault: true },
  { id: 'cat-transport', name: 'Transport', isDefault: true },
  { id: 'cat-machinery', name: 'Machinery/equipment', isDefault: true },
  { id: 'cat-packaging', name: 'Packaging', isDefault: true },
  { id: 'cat-harvesting', name: 'Harvesting', isDefault: true },
  { id: 'cat-other', name: 'Other', isDefault: true },
];

export class FarmPalDatabase {
  profile: FarmerProfile;
  crops: Crop[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  labourRecords: LabourRecord[];
  harvests: HarvestRecord[];
  sales: SaleRecord[];
  budgetConfigs: Record<string, RawCropBudgetConfig>;
  tasks: AgronomicTask[];
  cooperative: CooperativeGroup;
  bulkInputPools: BulkInputPool[];
  aggregationPools: ProduceAggregationPool[];
  inventoryItems: FarmInventoryItem[];
  feedbacks: FarmerFeedback[];

  constructor() {
    this.budgetConfigs = JSON.parse(JSON.stringify(defaultBudgetConfigs));
    this.tasks = JSON.parse(JSON.stringify(defaultAgronomicTasks));
    this.cooperative = JSON.parse(JSON.stringify(defaultCooperative));
    this.bulkInputPools = JSON.parse(JSON.stringify(defaultBulkInputPools));
    this.aggregationPools = JSON.parse(JSON.stringify(defaultAggregationPools));
    this.inventoryItems = JSON.parse(JSON.stringify(defaultInventoryItems));
    this.profile = {
      id: 'farmer-1',
      name: 'Musa Ibrahim',
      phone: '+234 803 123 4567',
      location: 'Kano, Nigeria',
      preferredLanguage: 'en',
      dailyReminderEnabled: true,
      dailyReminderTime: '19:00',
      tier: 'pro',
      createdAt: '2026-01-01T08:00:00.000Z',
    };

    this.crops = [
      {
        id: 'crop-tomato',
        userId: 'farmer-1',
        name: 'Tomato',
        variety: 'Cobra F1',
        plantingDate: '2026-01-05',
        farmSizeAcres: 2.0,
        status: 'active',
        createdAt: '2026-01-05T08:00:00.000Z',
      },
      {
        id: 'crop-cucumber',
        userId: 'farmer-1',
        name: 'Cucumber',
        variety: 'Darina F1',
        plantingDate: '2026-01-15',
        farmSizeAcres: 1.0,
        status: 'active',
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'crop-sweetcorn',
        userId: 'farmer-1',
        name: 'Sweetcorn',
        variety: 'Golden Bantam',
        plantingDate: '2026-02-01',
        farmSizeAcres: 1.5,
        status: 'active',
        createdAt: '2026-02-01T08:00:00.000Z',
      },
    ];

    this.categories = [...defaultCategories];

    // Initialize with realistic dated data matching the specification
    this.expenses = [
      {
        id: 'exp-1',
        userId: 'farmer-1',
        categoryId: 'cat-seeds',
        categoryName: 'Seeds',
        totalAmount: 50000,
        expenseDate: '2026-01-05',
        description: 'Tomato Cobra F1 seed tins',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 50000 },
        ],
        source: 'web',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'exp-2',
        userId: 'farmer-1',
        categoryId: 'cat-labour',
        categoryName: 'Labour',
        totalAmount: 60000,
        expenseDate: '2026-01-07',
        description: '12 workers cleared the tomato field',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 60000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-07T14:30:00.000Z',
      },
      {
        id: 'exp-3',
        userId: 'farmer-1',
        categoryId: 'cat-fertilizer',
        categoryName: 'Fertilizer',
        totalAmount: 70000,
        expenseDate: '2026-01-10',
        description: 'NPK 15-15-15 2 bags',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 70000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-10T09:15:00.000Z',
      },
      // Shared expense specification example: ₦30,000 on Fuel split 60% Tomato (₦18,000) and 40% Cucumber (₦12,000)
      {
        id: 'exp-4',
        userId: 'farmer-1',
        categoryId: 'cat-fuel',
        categoryName: 'Fuel',
        totalAmount: 30000,
        expenseDate: '2026-01-20',
        description: 'Water pumping generator fuel for irrigation',
        isShared: true,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 60, allocatedAmount: 18000 },
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 40, allocatedAmount: 12000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-20T11:00:00.000Z',
      },
      {
        id: 'exp-5',
        userId: 'farmer-1',
        categoryId: 'cat-seeds',
        categoryName: 'Seeds',
        totalAmount: 35000,
        expenseDate: '2026-01-15',
        description: 'Cucumber Darina seeds',
        isShared: false,
        allocations: [
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 100, allocatedAmount: 35000 },
        ],
        source: 'web',
        createdAt: '2026-01-15T09:00:00.000Z',
      },
      {
        id: 'exp-6',
        userId: 'farmer-1',
        categoryId: 'cat-labour',
        categoryName: 'Labour',
        totalAmount: 25000,
        expenseDate: '2026-01-18',
        description: 'Weeding cucumber plots',
        isShared: false,
        allocations: [
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 100, allocatedAmount: 25000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-18T16:00:00.000Z',
      },
    ];

    this.labourRecords = [
      {
        id: 'lab-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        labourDate: '2026-01-07',
        workType: 'Land clearing & ridging',
        workerCount: 12,
        amountPaid: 60000,
        description: '12 workers cleared the tomato field for ₦60,000',
        linkedExpenseId: 'exp-2',
        createdAt: '2026-01-07T14:30:00.000Z',
      },
      {
        id: 'lab-2',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        labourDate: '2026-01-18',
        workType: 'Manual weeding & trellising',
        workerCount: 5,
        amountPaid: 25000,
        description: '5 workers weeded cucumber section',
        linkedExpenseId: 'exp-6',
        createdAt: '2026-01-18T16:00:00.000Z',
      },
    ];

    this.harvests = [
      {
        id: 'harv-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        harvestDate: '2026-02-18',
        quantity: 50,
        unit: 'crates',
        qualityGrade: 'Grade A',
        notes: 'First major harvest flush, firm fruit',
        createdAt: '2026-02-18T11:00:00.000Z',
      },
      {
        id: 'harv-2',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        harvestDate: '2026-02-24',
        quantity: 65,
        unit: 'crates',
        qualityGrade: 'Standard',
        notes: 'Mid harvest flush',
        createdAt: '2026-02-24T10:00:00.000Z',
      },
      {
        id: 'harv-3',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        harvestDate: '2026-02-20',
        quantity: 40,
        unit: 'bags',
        qualityGrade: 'Grade A',
        notes: 'Green, crisp cucumbers',
        createdAt: '2026-02-20T08:30:00.000Z',
      },
    ];

    // Sales demonstrating variable selling prices and weighted average computation:
    // Sale 1: 50 crates @ ₦28,000 = ₦1,400,000
    // Sale 2: 40 crates @ ₦29,000 = ₦1,160,000
    // Total sold: 90 crates, Total revenue: ₦2,560,000
    // Weighted average price: ₦2,560,000 / 90 = ₦28,444.44
    this.sales = [
      {
        id: 'sale-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-20',
        quantitySold: 50,
        unit: 'crates',
        pricePerUnit: 28000,
        totalRevenue: 1400000,
        amountPaid: 1400000,
        amountDue: 0,
        buyerName: 'Alhaji Danladi (Mile 12 Market)',
        paymentStatus: 'paid',
        notes: 'Direct cash bank transfer',
        createdAt: '2026-02-20T15:00:00.000Z',
      },
      {
        id: 'sale-2',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-25',
        quantitySold: 40,
        unit: 'crates',
        pricePerUnit: 29000,
        totalRevenue: 1160000,
        amountPaid: 1160000,
        amountDue: 0,
        buyerName: 'Madam Grace',
        paymentStatus: 'paid',
        notes: 'Premium grade price',
        createdAt: '2026-02-25T14:00:00.000Z',
      },
      {
        id: 'sale-3',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        saleDate: '2026-02-21',
        quantitySold: 35,
        unit: 'bags',
        pricePerUnit: 19500,
        totalRevenue: 682500,
        amountPaid: 682500,
        amountDue: 0,
        buyerName: 'Kano Central Market Traders',
        paymentStatus: 'paid',
        notes: 'Wholesale batch',
        createdAt: '2026-02-21T12:00:00.000Z',
      },
      {
        id: 'sale-4',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-26',
        quantitySold: 20,
        unit: 'crates',
        pricePerUnit: 27500,
        totalRevenue: 550000,
        amountPaid: 0,
        amountDue: 550000,
        buyerName: 'Mama Chidi (Yankaba Market)',
        paymentStatus: 'credit',
        dueDate: '2026-03-05',
        notes: 'Taken on credit; promise to pay next market day',
        createdAt: '2026-02-26T16:30:00.000Z',
      },
      {
        id: 'sale-5',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        saleDate: '2026-02-27',
        quantitySold: 15,
        unit: 'bags',
        pricePerUnit: 19000,
        totalRevenue: 285000,
        amountPaid: 185000,
        amountDue: 100000,
        buyerName: 'Mallam Garba',
        paymentStatus: 'partial',
        dueDate: '2026-03-03',
        notes: 'Paid ₦185,000 cash advance, balance ₦100,000 outstanding',
        createdAt: '2026-02-27T10:15:00.000Z',
      },
    ];

    this.feedbacks = [
      {
        id: 'fb-1',
        farmerName: 'Mallam Garba Sanusi',
        phoneOrEmail: '+234 802 334 8812',
        farmLocation: 'Kano (Bunkure LGA)',
        primaryCrops: 'Tomato & Pepper',
        rating: 5,
        testedFeatures: ['whatsapp', 'market', 'reminders'],
        easeOfUseRating: 'very_easy',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'The WhatsApp bot understands Nigerian Pidgin and agricultural terms like poultry manure and crates without any struggle.',
        whatWasConfusing: 'Ensure crate pricing notes differentiate plastic standard crates from woven palm raffia baskets.',
        desiredNextFeature: 'Audio voice note recording in Hausa so I can talk while walking on my farm.',
        deviceType: 'Android Phone',
        createdAt: '2026-03-01T14:20:00.000Z',
      },
      {
        id: 'fb-2',
        farmerName: 'Folashade Adeyemi',
        phoneOrEmail: '+234 803 912 4471',
        farmLocation: 'Ogun State (Sagamu)',
        primaryCrops: 'Cucumber & Sweetcorn',
        rating: 5,
        testedFeatures: ['cooperative', 'credit', 'planning'],
        easeOfUseRating: 'easy',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'Comparing our local farmgate prices with Mile 12 wholesale prices opened my eyes to how much margin we lose to middlemen.',
        whatWasConfusing: 'Clarify whether the generated Agri-Credit report can be submitted directly to Sterling Bank or Bank of Agriculture.',
        desiredNextFeature: 'Direct SMS alert whenever a cooperative truck aggregation pool is 80% filled.',
        deviceType: 'Android Phone',
        createdAt: '2026-03-03T18:45:00.000Z',
      },
      {
        id: 'fb-3',
        farmerName: 'Emeka Okonkwo',
        phoneOrEmail: '+234 818 765 2209',
        farmLocation: 'Plateau State (Mangu)',
        primaryCrops: 'Irish Potato & Maize',
        rating: 4,
        testedFeatures: ['ussd', 'planning'],
        easeOfUseRating: 'moderate',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'USSD code *384*24# is very good when out in rural fields where Airtel 4G network drops.',
        whatWasConfusing: 'The prompt format for quantity vs price was slightly fast on the 2nd screen.',
        desiredNextFeature: 'SMS receipt sent immediately after logging via USSD.',
        deviceType: 'Feature Phone (USSD)',
        createdAt: '2026-03-05T09:10:00.000Z',
      },
    ];
  }
}

export const db = new FarmPalDatabase();
