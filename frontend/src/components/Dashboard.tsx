import { useState, useEffect } from 'react';
import {
  useUIStore,
  useAuthStore,
  useDashboardStore,
  useFarmerStore,
  useRateChartStore,
  useMilkStore,
  useFeedStore,
  useAdvanceStore,
  useProfileStore,
  useBillingStore,
  useTranslation,
} from '../store';
import type { Advance } from '../store';
import type { MilkEntry } from '../store/collection/useMilkCollectionStore';
import LanguageSelector from './LanguageSelector';
import TableSkeleton from './TableSkeleton';
import ReceiptModal, { type ReceiptType } from './ReceiptModal';
import BulkImportModal from './BulkImportModal';
import { exportMilkCollectionsCsv, exportFarmersCsv, exportSettlementsCsv } from '../utils/csvExport';
import { RateChartModule } from '../modules/rateChart/RateChartModule';
import { rateChartService, type CalculateLiveRateResponse } from '../modules/rateChart/services/rateChart.service';
import {
  Milk,
  Users,
  FileSpreadsheet,
  ShoppingBag,
  Coins,
  LayoutDashboard,
  LogOut,
  Home,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  UserPlus,
  Calculator,
  Info,
  HandCoins,
  History as HistoryIcon,
  Menu,
  X,
  Search,
  Settings,
  Building2,
  Save,
  Printer,
  Upload,
  Download,
} from 'lucide-react';

export default function Dashboard() {
  const setView = useUIStore((state) => state.setView);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();

  const dashboardStats = useDashboardStore((state) => state.dashboardStats);
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);
  const adminError = useDashboardStore((state) => state.error);

  const farmers = useFarmerStore((state) => state.farmers);
  const fetchFarmers = useFarmerStore((state) => state.fetchFarmers);
  const addFarmer = useFarmerStore((state) => state.createFarmer);
  const updateFarmer = useFarmerStore((state) => state.updateFarmer);
  const toggleFarmerStatus = useFarmerStore((state) => state.toggleFarmerStatus);
  const farmerStatus = useFarmerStore((state) => state.status);
  const farmerError = useFarmerStore((state) => state.error);

  const rateCharts = useRateChartStore((state) => state.rateCharts);
  const fetchRateCharts = useRateChartStore((state) => state.fetchRateCharts);
  const rateError = useRateChartStore((state) => state.error);

  const collections = useMilkStore((state) => state.collections);
  const history = useMilkStore((state) => state.history);
  const fetchCollections = useMilkStore((state) => state.fetchCollections);
  const fetchHistory = useMilkStore((state) => state.fetchHistory);
  const addCollectionEntry = useMilkStore((state) => state.createCollectionEntry);
  const deleteCollectionEntry = useMilkStore((state) => state.deleteCollectionEntry);
  const updateCollectionEntry = useMilkStore((state) => state.updateCollectionEntry);
  const milkStatus = useMilkStore((state) => state.status);
  const milkError = useMilkStore((state) => state.error);

  const dealers = useFeedStore((state) => state.dealers);
  const purchases = useFeedStore((state) => state.purchases);
  const sales = useFeedStore((state) => state.sales);
  const fetchDealers = useFeedStore((state) => state.fetchDealers);
  const fetchPurchases = useFeedStore((state) => state.fetchPurchases);
  const fetchSales = useFeedStore((state) => state.fetchSales);
  const addDealer = useFeedStore((state) => state.createDealer);
  const updateDealer = useFeedStore((state) => state.updateDealer);
  const toggleDealerStatus = useFeedStore((state) => state.toggleDealerStatus);
  const recordPurchase = useFeedStore((state) => state.createPurchase);
  const recordSale = useFeedStore((state) => state.createSale);
  const feedStatus = useFeedStore((state) => state.status);
  const feedError = useFeedStore((state) => state.error);

  const advances = useAdvanceStore((state) => state.advances);
  const fetchAdvances = useAdvanceStore((state) => state.fetchAdvances);
  const createAdvance = useAdvanceStore((state) => state.createAdvance);
  const addRepayment = useAdvanceStore((state) => state.createRepayment);
  const getAdvanceById = useAdvanceStore((state) => state.getAdvanceById);
  const fetchCustomerAdvances = useAdvanceStore((state) => state.fetchCustomerAdvances);
  const customerSummary = useAdvanceStore((state) => state.customerSummary);
  const advStatus = useAdvanceStore((state) => state.status);
  const advLoading = advStatus === 'loading';
  const advError = useAdvanceStore((state) => state.error);

  const profile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const isUpdatingProfile = useProfileStore((state) => state.status === 'loading');
  const profileError = useProfileStore((state) => state.error);

  const settlements = useBillingStore((state) => state.settlements);
  const fetchSettlements = useBillingStore((state) => state.fetchSettlements);
  const createSettlement = useBillingStore((state) => state.createSettlement);
  const billingStatus = useBillingStore((state) => state.status);
  const isSettlingBill = billingStatus === 'loading';
  const billingError = useBillingStore((state) => state.error);

  const fetchError = adminError || farmerError || rateError || milkError || feedError || advError || profileError || billingError;

  // Responsive sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Internal routing in Dashboard
  const [dbTab, setDbTab] = useState<'overview' | 'milk' | 'farmers' | 'rates' | 'feed' | 'billing' | 'advances' | 'settings'>('overview');

  // Initial core bootstrap
  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchFarmers();
      fetchProfile();
      fetchCollections();
    }
  }, [token]);

  // Refresh dashboard stats every 60 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchDashboard(), 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Targeted Data Refetching on Tab Switch
  useEffect(() => {
    if (!token) return;
    switch (dbTab) {
      case 'overview':
        fetchDashboard();
        fetchFarmers();
        fetchCollections();
        break;
      case 'milk':
        fetchFarmers();
        fetchRateCharts();
        fetchCollections();
        break;
      case 'farmers':
        fetchFarmers();
        break;
      case 'rates':
        fetchRateCharts();
        break;
      case 'feed':
        fetchDealers();
        fetchPurchases();
        fetchSales();
        fetchFarmers();
        break;
      case 'billing':
        fetchSettlements();
        fetchFarmers();
        break;
      case 'advances':
        fetchAdvances();
        fetchFarmers();
        break;
      case 'settings':
        fetchProfile();
        break;
    }
  }, [dbTab, token]);

  // Modal control states
  const [farmerModalOpen, setFarmerModalOpen] = useState(false);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<ReceiptType>('milk');
  const [receiptData, setReceiptData] = useState<any>(null);

  const openMilkReceipt = (entry: MilkEntry) => {
    const farmer = farmers.find((f) => f.id === entry.customerId || f.code === entry.customerCode);
    setReceiptType('milk');
    setReceiptData({
      customerCode: entry.customerCode,
      customerName: entry.customerName,
      mobile: farmer?.mobile,
      date: entry.date,
      shift: entry.shift,
      milkType: entry.milkType,
      quantity: entry.quantity,
      fat: entry.fat,
      snf: entry.snf,
      rate: entry.rate,
      totalAmount: entry.totalAmount,
    });
    setReceiptModalOpen(true);
  };

  const openBillReceipt = (bill: any) => {
    const farmer = farmers.find((f) => f.id === bill.customerId || f.code === bill.customerCode);
    setReceiptType('bill');
    setReceiptData({
      customerCode: bill.customerCode,
      customerName: bill.customerName,
      mobile: farmer?.mobile,
      date: bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      period: bill.period,
      litres: bill.litres,
      grossAmount: bill.grossAmount,
      advanceDeducted: bill.advanceDeducted,
      netPayable: bill.netPayable,
    });
    setReceiptModalOpen(true);
  };

  const openFeedReceipt = (sale: any) => {
    const farmer = farmers.find((f) => f.id === sale.customerId || f.code === sale.customer?.code);
    setReceiptType('feed');
    setReceiptData({
      customerCode: sale.customer?.code,
      customerName: sale.customer?.name || 'Customer',
      mobile: farmer?.mobile || sale.customer?.mobile,
      date: sale.saleDate ? sale.saleDate.split('T')[0] : new Date().toLocaleDateString(),
      feedName: sale.foodPurchase?.foodName || 'Cattle Feed',
      quantity: sale.quantity,
      totalAmount: sale.totalAmount,
      isCash: sale.isCashPayment,
      pendingBalance: sale.pendingAmount,
    });
    setReceiptModalOpen(true);
  };
  // Bulk Import Modal State
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  // 1. ADD FARMER FORM STATE
  const [fCode, setFCode] = useState('');
  const [fName, setFName] = useState('');
  const [fMobile, setFMobile] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fMilkType, setFMilkType] = useState<'COW' | 'BUFFALO' | 'MIX'>('COW');
  const [fBankName, setFBankName] = useState('');
  const [fAccountNo, setFAccountNo] = useState('');
  const [fIfscCode, setFIfscCode] = useState('');
  const [farmerSuccessMsg, setFarmerSuccessMsg] = useState('');
  const [farmerErrorMsg, setFarmerErrorMsg] = useState('');
  const [isSubmittingFarmer, setIsSubmittingFarmer] = useState(false);
  const [editFarmerId, setEditFarmerId] = useState<string | null>(null);
  const [isSubmittingMilk, setIsSubmittingMilk] = useState(false);

  // 2. ADD DEALER STATE
  const [dName, setDName] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dAddress, setDAddress] = useState('');
  const [dCode, setDCode] = useState('');
  const [editDealerId, setEditDealerId] = useState<string | null>(null);

  // 3. RECORD BULK PURCHASE STATE
  const [pDealerId, setPDealerId] = useState('');
  const [pFoodName, setPFoodName] = useState('');
  const [pQty, setPQty] = useState('');
  const [pBuyRate, setPBuyRate] = useState('');
  const [pSellRate, setPSellRate] = useState('');
  const [pPaid, setPPaid] = useState('');
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);

  // 4. MILK ENTRY FORM STATE
  const [selectedFarmerCode, setSelectedFarmerCode] = useState('');
  const [milkQty, setMilkQty] = useState('');
  const [milkFat, setMilkFat] = useState('');
  const [milkSnf, setMilkSnf] = useState('');
  const [milkShift, setMilkShift] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [milkSuccessMsg, setMilkSuccessMsg] = useState('');
  const [milkErrorMsg, setMilkErrorMsg] = useState('');
  const [milkStartDate, setMilkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [milkEndDate, setMilkEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [editMilkId, setEditMilkId] = useState<string | null>(null);

  // 5. FEED SALE FORM STATE
  const [saleFarmerId, setSaleFarmerId] = useState('');
  const [salePurchaseId, setSalePurchaseId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [salePaidAmount, setSalePaidAmount] = useState('0');
  const [saleCredit, setSaleCredit] = useState(true);

  // 6. BILLING (persisted via billing store)
  const [billingFarmerId, setBillingFarmerId] = useState('');
  const [billingAdvanceDeduction, setBillingAdvanceDeduction] = useState('');
  const [billingStartDate, setBillingStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [billingEndDate, setBillingEndDate] = useState(new Date().toISOString().split('T')[0]);

  // 7. SETTINGS / PROFILE FORM STATE
  const [profOwnerName, setProfOwnerName] = useState(user?.ownerName || '');
  const [profMobile, setProfMobile] = useState(user?.mobile || '');
  const [profDairyName, setProfDairyName] = useState(user?.dairyName || '');
  const [profVillage, setProfVillage] = useState(user?.village || '');
  const [profTaluka, setProfTaluka] = useState(user?.taluka || '');
  const [profDistrict, setProfDistrict] = useState(user?.district || '');
  const [profState, setProfState] = useState(user?.state || '');
  const [profCollectionType, setProfCollectionType] = useState<'FIXED_RATE' | 'FAT_BASED' | 'FAT_SNF_BASED'>(user?.collectionType || 'FAT_SNF_BASED');
  const [profMilkType, setProfMilkType] = useState<'COW' | 'BUFFALO' | 'MIX'>(user?.milkType || 'COW');
  const [profCollectionShift, setProfCollectionShift] = useState<'MORNING' | 'EVENING' | 'BOTH'>(user?.collectionShift || 'BOTH');
  const [profPaymentPeriod, setProfPaymentPeriod] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>(user?.paymentPeriod || 'WEEKLY');
  const [profGstin, setProfGstin] = useState(user?.gstin || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileFormError, setProfileFormError] = useState('');

  // Sync profile form when profile/user loads or changes
  useEffect(() => {
    const src = profile || user;
    if (src) {
      if (src.ownerName) setProfOwnerName(src.ownerName);
      if (src.mobile) setProfMobile(src.mobile);
      if (src.dairyName) setProfDairyName(src.dairyName);
      if (src.village) setProfVillage(src.village);
      if (src.taluka) setProfTaluka(src.taluka);
      if (src.district) setProfDistrict(src.district);
      if (src.state) setProfState(src.state);
      if (src.collectionType) setProfCollectionType(src.collectionType);
      if (src.milkType) setProfMilkType(src.milkType);
      if (src.collectionShift) setProfCollectionShift(src.collectionShift);
      if (src.paymentPeriod) setProfPaymentPeriod(src.paymentPeriod);
      if ((src as any).gstin) setProfGstin((src as any).gstin);
    }
  }, [profile, user]);

  // Fetch milk history whenever date range, farmer, or token changes
  useEffect(() => {
    if (token) {
      fetchHistory(billingStartDate, billingEndDate, billingFarmerId || undefined);
      if (billingFarmerId) {
        fetchCustomerAdvances(billingFarmerId);
      }
    }
  }, [token, billingStartDate, billingEndDate, billingFarmerId]);

  // Auto-dismiss profile notification toasts after 4 seconds
  useEffect(() => {
    if (!profileSuccessMsg) return;
    const timer = setTimeout(() => setProfileSuccessMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [profileSuccessMsg]);

  // 8. ADVANCE FORM & FILTER STATES
  const [advSearchQuery, setAdvSearchQuery] = useState('');
  const [advStatusFilter, setAdvStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PARTIALLY_RECOVERED' | 'CLOSED'>('ALL');
  const [advCustomerId, setAdvCustomerId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advNotes, setAdvNotes] = useState('');

  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  // Search farmers filter
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-dismiss notification toasts after 4-5 seconds
  useEffect(() => {
    if (!milkSuccessMsg) return;
    const timer = setTimeout(() => setMilkSuccessMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [milkSuccessMsg]);

  useEffect(() => {
    if (!milkErrorMsg) return;
    const timer = setTimeout(() => setMilkErrorMsg(''), 5000);
    return () => clearTimeout(timer);
  }, [milkErrorMsg]);

  useEffect(() => {
    if (!farmerSuccessMsg) return;
    const timer = setTimeout(() => setFarmerSuccessMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [farmerSuccessMsg]);

  useEffect(() => {
    if (!farmerErrorMsg) return;
    const timer = setTimeout(() => setFarmerErrorMsg(''), 5000);
    return () => clearTimeout(timer);
  }, [farmerErrorMsg]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredAdvances = advances.filter(a => {
    const matchesSearch = !advSearchQuery ||
      a.advanceNumber.toLowerCase().includes(advSearchQuery.toLowerCase()) ||
      a.customer?.name.toLowerCase().includes(advSearchQuery.toLowerCase()) ||
      a.customer?.mobile.includes(advSearchQuery);
    const matchesStatus = advStatusFilter === 'ALL' || a.status === advStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAdvanceIssued = advances.reduce((sum, a) => sum + Number(a.originalAmount), 0);
  const totalRecoveredAmt = advances.reduce((sum, a) => sum + Number(a.recoveredAmount), 0);
  const totalPendingBal = advances.reduce((sum, a) => sum + Number(a.pendingAmount), 0);

  const foundFarmer = farmers.find(f => f.code === Number(selectedFarmerCode));

  const [liveCalc, setLiveCalc] = useState<CalculateLiveRateResponse | null>(null);
  const [isCalculatingRate, setIsCalculatingRate] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    if (!foundFarmer) {
      setLiveCalc(null);
      setCalcError(null);
      return;
    }
    const qty = Number(milkQty) || 1;
    const fat = Number(milkFat) || 0;
    const snf = Number(milkSnf) || 0;

    let isMounted = true;
    setIsCalculatingRate(true);

    rateChartService
      .calculateRate({
        milkType: foundFarmer.milkType,
        fat,
        snf,
        quantity: qty,
      })
      .then((res) => {
        if (isMounted) {
          setLiveCalc(res);
          setCalcError(null);
          setIsCalculatingRate(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCalcError(err.response?.data?.message || `No active rate chart configured for ${foundFarmer.milkType}`);
          setLiveCalc(null);
          setIsCalculatingRate(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [foundFarmer?.milkType, selectedFarmerCode, milkFat, milkSnf, milkQty]);

  // Overview metrics — from DB dashboard endpoint
  const todayLiters = dashboardStats?.todayMilkCollection ?? 0;
  const todayValue = dashboardStats?.todayAmount ?? 0;
  const totalCustomers = dashboardStats?.totalCustomers ?? farmers.length;

  // Today's collections list (for overview table)
  // Backend `/milk/today` already filters for today's entries
  const todayCollections = collections;

  // Billing (calculated from fetched history entries)
  const targetBillingFarmer = farmers.find(f => f.id === billingFarmerId);
  const billingCollections = history.filter(c =>
    (!billingFarmerId || c.customerId === billingFarmerId) &&
    (!billingStartDate || c.date >= billingStartDate) &&
    (!billingEndDate || c.date <= billingEndDate)
  );
  const billingTotalQty = billingCollections.reduce((sum, c) => sum + c.quantity, 0);
  const billingTotalGross = billingCollections.reduce((sum, c) => sum + c.totalAmount, 0);
  const avgFat = billingCollections.length
    ? Number((billingCollections.reduce((sum, c) => sum + c.fat, 0) / billingCollections.length).toFixed(2))
    : 0;
  const avgSnf = billingCollections.length
    ? Number((billingCollections.reduce((sum, c) => sum + c.snf, 0) / billingCollections.length).toFixed(2))
    : 0;
  const billingDeductionAmt = Number(billingAdvanceDeduction) || 0;
  const billingNetPayable = Number((billingTotalGross - billingDeductionAmt).toFixed(2));

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toString().includes(searchQuery) ||
    f.mobile.includes(searchQuery)
  );

  const todayDateStr = new Date().toISOString().split('T')[0];
  const displayCollections = (milkStartDate === todayDateStr && milkEndDate === todayDateStr) ? collections : history;

  const milkTotalLitres = displayCollections.reduce((sum, c) => sum + c.quantity, 0);
  const milkTotalAmount = displayCollections.reduce((sum, c) => sum + c.totalAmount, 0);
  const milkAvgFat = displayCollections.length ? (displayCollections.reduce((sum, c) => sum + c.fat, 0) / displayCollections.length).toFixed(1) : '0.0';
  const milkAvgSnf = displayCollections.length ? (displayCollections.reduce((sum, c) => sum + c.snf, 0) / displayCollections.length).toFixed(1) : '0.0';

  const availablePurchases = purchases.filter(p => p.remainingQuantity > 0);
  const outOfStockPurchases = purchases.filter(p => p.remainingQuantity <= 0);

  const navItems = [
    { id: 'overview', label: t('dashboard', 'navOverview'), icon: LayoutDashboard },
    { id: 'milk', label: t('dashboard', 'navMilkRegistry'), icon: Milk },
    { id: 'farmers', label: t('dashboard', 'navFarmers'), icon: Users },
    { id: 'rates', label: t('dashboard', 'navRates'), icon: FileSpreadsheet },
    { id: 'feed', label: t('dashboard', 'navFeeds'), icon: ShoppingBag },
    { id: 'advances', label: t('dashboard', 'navAdvances'), icon: HandCoins },
    { id: 'billing', label: t('dashboard', 'navBilling'), icon: Coins },
    { id: 'settings', label: t('dashboard', 'navSettings'), icon: Settings },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingFarmer) return;

    setFarmerErrorMsg('');
    setFarmerSuccessMsg('');

    const trimmedCode = fCode.trim();
    const trimmedName = fName.trim();
    const trimmedMobile = fMobile.replace(/\D/g, '');

    if (!trimmedCode) {
      setFarmerErrorMsg(t('customer', 'codeRequired'));
      return;
    }
    if (trimmedCode.length < 1 || trimmedCode.length > 20) {
      setFarmerErrorMsg(t('customer', 'codeMin'));
      return;
    }

    if (!editFarmerId) {
      const codeNum = parseInt(trimmedCode, 10);
      const codeExists = farmers.some(
        (f) => String(f.code) === trimmedCode || (!isNaN(codeNum) && f.code === codeNum)
      );

      if (codeExists) {
        setFarmerErrorMsg(t('customer', 'duplicateCodeToast'));
        return;
      }
    }

    if (!trimmedName) {
      setFarmerErrorMsg(t('customer', 'nameRequired'));
      return;
    }

    // 2. Mobile field MUST always have exactly 10 digits
    if (!trimmedMobile || trimmedMobile.length !== 10) {
      setFarmerErrorMsg(t('customer', 'mobileInvalid'));
      return;
    }

    setIsSubmittingFarmer(true);
    try {
      let res;
      if (editFarmerId) {
        res = await updateFarmer(editFarmerId, {
          fullName: trimmedName,
          mobile: trimmedMobile,
          address: fAddress.trim(),
          milkType: fMilkType,
          bankName: fBankName.trim(),
          accountNo: fAccountNo.trim(),
          ifscCode: fIfscCode.trim(),
        });
      } else {
        res = await addFarmer({
          customerCode: trimmedCode,
          fullName: trimmedName,
          mobile: trimmedMobile,
          address: fAddress.trim(),
          milkType: fMilkType,
        });
      }

      if (res.success) {
        setFarmerModalOpen(false);
        setEditFarmerId(null);
        setFCode(''); setFName(''); setFMobile(''); setFAddress('');
        setFBankName(''); setFAccountNo(''); setFIfscCode('');
        setFarmerErrorMsg('');
        setFarmerSuccessMsg(t('customer', 'successToast'));
        fetchDashboard();
      } else {
        setFarmerSuccessMsg('');
        if (res.error?.toLowerCase().includes('already exists') || res.error?.toLowerCase().includes('code')) {
          setFarmerErrorMsg(t('customer', 'duplicateCodeToast'));
        } else {
          setFarmerErrorMsg(res.error || t('customer', 'errorToast'));
        }
      }
    } finally {
      setIsSubmittingFarmer(false);
    }
  };

  const handleEditFarmerClick = (farmer: any) => {
    setEditFarmerId(farmer.id);
    setFCode(String(farmer.code));
    setFName(farmer.name);
    setFMobile(farmer.mobile);
    setFAddress(farmer.address || '');
    setFMilkType(farmer.milkType);
    setFBankName(farmer.bankName || '');
    setFAccountNo(farmer.accountNo || '');
    setFIfscCode(farmer.ifscCode || '');
    setFarmerErrorMsg('');
    setFarmerSuccessMsg('');
    setFarmerModalOpen(true);
  };

  const handleToggleFarmer = async (id: string, currentStatus: boolean) => {
    const success = await toggleFarmerStatus(id);
    if (success) {
      setFarmerSuccessMsg(`Farmer ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
    } else {
      setFarmerErrorMsg(`Failed to ${currentStatus ? 'deactivate' : 'activate'} farmer.`);
    }
  };

  const handleAddDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName || !dCode) { alert('Dealer Name and Code are required'); return; }
    let success;
    if (editDealerId) {
      success = await updateDealer(editDealerId, { name: dName, phone: dPhone, address: dAddress, code: dCode });
    } else {
      success = await addDealer({ name: dName, phone: dPhone, address: dAddress, code: dCode });
    }
    if (success) {
      setDealerModalOpen(false);
      setEditDealerId(null);
      setDName(''); setDPhone(''); setDAddress(''); setDCode('');
    } else {
      const err = useFeedStore.getState().error;
      alert(err || `Failed to ${editDealerId ? 'update' : 'create'} dealer.`);
    }
  };

  const handleEditDealerClick = (dealer: any) => {
    setEditDealerId(dealer.id);
    setDCode(dealer.code);
    setDName(dealer.name);
    setDPhone(dealer.phone);
    setDAddress(dealer.address || '');
    setDealerModalOpen(true);
  };

  const handleToggleDealer = async (id: string) => {
    const success = await toggleDealerStatus(id);
    if (!success) {
      const err = useFeedStore.getState().error;
      alert(err || 'Failed to toggle dealer status.');
    }
  };

  const handleRecordPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pDealerId) { alert('Please select a wholesale dealer'); return; }
    const success = await recordPurchase({
      dealerId: pDealerId,
      foodName: pFoodName,
      quantity: Number(pQty),
      buyRate: Number(pBuyRate),
      sellRate: Number(pSellRate),
      amountPaid: Number(pPaid),
      purchaseDate: new Date(pDate).toISOString(),
    });
    if (success) {
      setPurchaseModalOpen(false);
      setPDealerId(''); setPFoodName(''); setPQty(''); setPBuyRate(''); setPSellRate(''); setPPaid('');
    } else {
      const err = useFeedStore.getState().error;
      alert(err || 'Failed to record purchase.');
    }
  };

  const handleMilkEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingMilk) return;

    setMilkSuccessMsg('');
    setMilkErrorMsg('');
    if (!foundFarmer) { setMilkErrorMsg(t('dashboard', 'selectFarmer')); return; }

    const qty = Number(milkQty);
    const fat = Number(milkFat);
    const snf = Number(milkSnf);

    if (isNaN(qty) || qty <= 0) {
      setMilkErrorMsg(t('dashboard', 'invalidPositiveQty'));
      return;
    }
    if (isNaN(fat) || fat < 0) {
      setMilkErrorMsg(t('dashboard', 'invalidPositiveFat'));
      return;
    }
    if (isNaN(snf) || snf < 0) {
      setMilkErrorMsg(t('dashboard', 'invalidPositiveSnf'));
      return;
    }

    // Local check against existing collections in memory before triggering API (ONLY IF CREATING)
    if (!editMilkId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const shiftExists = collections.some(
        (c) => c.customerId === foundFarmer.id && c.shift === milkShift && (c.date === todayStr || !c.date)
      );

      if (shiftExists) {
        setMilkSuccessMsg('');
        setMilkErrorMsg(`Entry for ${milkShift} shift already exists on this date for ${foundFarmer.name}.`);
        return;
      }
    }

    setIsSubmittingMilk(true);
    try {
      const finalRate = liveCalc?.rate ?? 0;
      const finalTotal = liveCalc ? liveCalc.amount : Number((qty * finalRate).toFixed(2));

      const payload = {
        customerCode: foundFarmer.code,
        customerName: foundFarmer.name,
        customerId: foundFarmer.id,
        milkType: foundFarmer.milkType,
        quantity: qty,
        fat: fat || 0,
        snf: snf || 0,
        shift: milkShift,
        rate: finalRate,
        totalAmount: finalTotal,
        rateChartId: liveCalc?.chartId,
      };

      let success;
      if (editMilkId) {
        success = await updateCollectionEntry(editMilkId, payload);
      } else {
        success = await addCollectionEntry(payload);
      }

      if (success) {
        setMilkErrorMsg('');
        setMilkSuccessMsg(`Entry ${editMilkId ? 'updated' : 'saved'} for ${foundFarmer.name}! Rate: ₹${finalRate.toFixed(2)}/L, Total: ₹${finalTotal.toFixed(2)}`);
        setMilkQty(''); setMilkFat(''); setMilkSnf('');
        if (editMilkId) setEditMilkId(null);
        fetchDashboard();
      } else {
        const storeErr = useMilkStore.getState().error;
        setMilkSuccessMsg('');
        setMilkErrorMsg(storeErr || `Error ${editMilkId ? 'updating' : 'saving'} entry.`);
      }
    } finally {
      setIsSubmittingMilk(false);
    }
  };

  const handleEditMilkClick = (c: MilkEntry) => {
    setEditMilkId(c.id);
    setSelectedFarmerCode(c.customerCode.toString());
    setMilkQty(c.quantity.toString());
    setMilkFat(c.fat.toString());
    setMilkSnf(c.snf.toString());
    setMilkShift(c.shift);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeedSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find(f => f.id === saleFarmerId);
    if (!farmer) { alert('Select a farmer'); return; }
    if (!salePurchaseId) { alert('Select a feed batch to sell from'); return; }
    const success = await recordSale({
      customerId: farmer.id,
      foodPurchaseId: salePurchaseId,
      quantity: Number(saleQty),
      amountPaid: saleCredit ? 0 : Number(salePaidAmount),
      isCashPayment: !saleCredit,
      saleDate: new Date().toISOString(),
    });
    if (success) {
      setSaleFarmerId(''); setSalePurchaseId(''); setSaleQty('1');
    }
  };

  const handleBillDelete = async (id: string) => {
    await deleteCollectionEntry(id);
    fetchDashboard();
  };

  const handleBillSettlement = async () => {
    if (!targetBillingFarmer || billingCollections.length === 0) {
      alert('No collections to settle for this period.');
      return;
    }
    const success = await createSettlement({
      customerId: targetBillingFarmer.id,
      startDate: billingStartDate,
      endDate: billingEndDate,
      totalAmount: billingTotalGross,
      netPayable: billingNetPayable,
      advanceDeductionAmount: Number(billingAdvanceDeduction) || 0,
      litres: billingTotalQty,
      avgFat,
      avgSnf,
      milkEntryIds: billingCollections.map((c) => c.id),
      remarks: `Settlement for ${targetBillingFarmer.name} (${billingStartDate} to ${billingEndDate})`,
    });

    if (success) {
      alert(`Bill settled successfully for ₹${billingNetPayable}!`);
      setBillingFarmerId('');
      setBillingAdvanceDeduction('');
      fetchSettlements();
    } else {
      alert(billingError || 'Failed to settle bill');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFormError('');
    setProfileSuccessMsg('');

    if (!profOwnerName.trim() || !profMobile.trim() || !profDairyName.trim()) {
      setProfileFormError('Owner name, mobile number, and dairy name are required.');
      return;
    }

    const ok = await updateProfile({
      ownerName: profOwnerName.trim(),
      mobile: profMobile.trim(),
      dairyName: profDairyName.trim(),
      village: profVillage.trim(),
      taluka: profTaluka.trim(),
      district: profDistrict.trim(),
      state: profState.trim(),
      collectionType: profCollectionType,
      milkType: profMilkType,
      collectionShift: profCollectionShift,
      paymentPeriod: profPaymentPeriod,
      gstin: profGstin.trim() || undefined,
    });

    if (ok) {
      setProfileSuccessMsg('Profile and dairy settings updated successfully!');
      fetchDashboard();
    } else {
      setProfileFormError(profileError || 'Failed to update profile.');
    }
  };

  const handleCreateAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advCustomerId || !advAmount || Number(advAmount) <= 0) {
      alert('Please select a farmer and enter a valid positive amount.');
      return;
    }
    const success = await createAdvance({
      customerId: advCustomerId,
      amount: Number(advAmount),
      givenDate: advDate,
      notes: advNotes,
    });
    if (success) {
      setAdvanceModalOpen(false);
      setAdvCustomerId(''); setAdvAmount(''); setAdvNotes('');
      fetchFarmers();
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance) return;
    const amountNum = Number(repayAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }
    if (amountNum > selectedAdvance.pendingAmount) {
      alert(`Repayment amount cannot exceed pending balance of ₹${selectedAdvance.pendingAmount.toFixed(2)}`);
      return;
    }
    const success = await addRepayment(selectedAdvance.id, {
      amount: amountNum,
      notes: repayNotes,
    });
    if (success) {
      setRepaymentModalOpen(false);
      setSelectedAdvance(null);
      setRepayAmount(''); setRepayNotes('');
      fetchFarmers();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fafbfc] text-[#091e42] relative">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 h-full bg-[#091e42] flex-col justify-between p-4 shrink-0 text-white shadow-xl z-20">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-2 font-display text-lg font-bold px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
              <Milk className="w-4 h-4 text-white" />
            </div>
            <span>Lacto<span className="text-blue-300">Flow</span></span>
          </div>

          {/* Dairy info */}
          <div className="bg-[#172b4d] rounded-xl p-3 border border-blue-900/30">
            <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">{t('dashboard', 'activeDairyHub')}</span>
            <span className="text-sm font-bold block mt-0.5">{user?.dairyName || '—'}</span>
            <span className="text-xs text-blue-200 block">{user?.village || '—'}, {user?.district || '—'}</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = dbTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setDbTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${isActive ? 'bg-[#0052cc] text-white shadow-md' : 'text-blue-100 hover:text-white hover:bg-[#172b4d]'
                    }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="space-y-2 pt-4 border-t border-[#172b4d]">
          <button onClick={() => setView('landing')} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-blue-200 hover:text-white rounded-lg transition cursor-pointer">
            <Home className="w-4 h-4" /> {t('dashboard', 'landingView')}
          </button>
          <button onClick={() => { logout(); setView('landing'); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/20 rounded-lg transition cursor-pointer">
            <LogOut className="w-4 h-4" /> {t('dashboard', 'logOut')}
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-[#091e42]/70 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-72 h-full bg-[#091e42] flex-col justify-between p-5 text-white shadow-2xl z-10 flex">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#172b4d]">
                <div className="flex items-center gap-2 font-display text-lg font-bold">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                    <Milk className="w-4 h-4 text-white" />
                  </div>
                  <span>Lacto<span className="text-blue-300">Flow</span></span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dairy info */}
              <div className="bg-[#172b4d] rounded-xl p-3 border border-blue-900/30">
                <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">{t('dashboard', 'activeDairyHub')}</span>
                <span className="text-sm font-bold block mt-0.5">{user?.dairyName || '—'}</span>
                <span className="text-xs text-blue-200 block">{user?.village || '—'}, {user?.district || '—'}</span>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = dbTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDbTab(item.id as any);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${isActive ? 'bg-[#0052cc] text-white shadow-md' : 'text-blue-100 hover:text-white hover:bg-[#172b4d]'
                        }`}
                    >
                      <Icon className="w-4 h-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="space-y-2 pt-4 border-t border-[#172b4d]">
              <button onClick={() => { setIsSidebarOpen(false); setView('landing'); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-blue-200 hover:text-white rounded-lg transition cursor-pointer">
                <Home className="w-4 h-4" /> {t('dashboard', 'landingView')}
              </button>
              <button onClick={() => { setIsSidebarOpen(false); logout(); setView('landing'); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/20 rounded-lg transition cursor-pointer">
                <LogOut className="w-4 h-4" /> {t('dashboard', 'logOut')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── RIGHT MAIN COLUMN (HEADER + DEDICATED SCROLLABLE CONTENT) ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

        {/* TOP FIXED HEADER */}
        <header className="shrink-0 bg-[#fafbfc] border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#091e42] transition cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[#091e42]">
                {dbTab === 'overview' && t('dashboard', 'navOverview')}
                {dbTab === 'milk' && t('dashboard', 'navMilkRegistry')}
                {dbTab === 'farmers' && t('dashboard', 'navFarmers')}
                {dbTab === 'rates' && t('dashboard', 'navRates')}
                {dbTab === 'feed' && t('dashboard', 'navFeeds')}
                {dbTab === 'advances' && t('dashboard', 'navAdvances')}
                {dbTab === 'billing' && t('dashboard', 'navBilling')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('dashboard', 'loggedInAs')} <span className="font-semibold text-[#0052cc]">{user?.ownerName}</span> ({user?.mobile})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <LanguageSelector variant="light" />
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{t('dashboard', 'pricingMode')}</span>
              <span className="text-xs font-bold text-[#0052cc] bg-[#deebff] px-2.5 py-1 rounded">
                {user?.collectionType?.replace(/_/g, ' ') || '—'}
              </span>
            </div>
          </div>
        </header>

        {/* DEDICATED SCROLLABLE CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Failed to retrieve data from server</h4>
              <p className="text-xs mt-1">{fetchError}</p>
              {fetchError.includes('token') || fetchError.includes('401') ? (
                <button onClick={() => { logout(); setView('landing'); }} className="mt-2 text-xs font-bold bg-red-100 px-3 py-1.5 rounded hover:bg-red-200 transition">
                  Click here to Log Out and Log In again
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            1. OVERVIEW PANEL
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'overview' && (
          <div className="space-y-8">

            {/* Metrics Grid — sourced from GET /admin/dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'litersToday')}</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{todayLiters.toFixed(1)} L</span>
                  <span className="text-[10px] text-gray-400">{t('dashboard', 'liveFromDb')}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#deebff] flex items-center justify-center text-[#0052cc]">
                  <Milk className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'intakeValue')}</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">₹{todayValue.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">{t('dashboard', 'liveFromDb')}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'activeFarmers')}</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{totalCustomers}</span>
                  <span className="text-[10px] text-gray-400">{t('dashboard', 'liveFromDb')}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'rateChartsCount')}</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{rateCharts.filter(r => r.isActive).length} {t('dashboard', 'active')}</span>
                  <span className="text-[10px] text-gray-400">{rateCharts.length} total in DB</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Today's Collections + Stock status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              <div className="lg:col-span-8 light-panel rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">
                  {t('dashboard', 'todaysMilkCollections')} ({todayCollections.length})
                </h3>

                {milkStatus === 'loading' && todayCollections.length === 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5">{t('dashboard', 'code')}</th>
                          <th className="py-2.5">{t('dashboard', 'name')}</th>
                          <th className="py-2.5">{t('dashboard', 'shift')}</th>
                          <th className="py-2.5">{t('dashboard', 'qtyL')}</th>
                          <th className="py-2.5">{t('dashboard', 'fatSnf')}</th>
                          <th className="py-2.5 text-right">{t('dashboard', 'rate')}</th>
                          <th className="py-2.5 text-right">{t('dashboard', 'total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        <TableSkeleton rows={4} cols={7} />
                      </tbody>
                    </table>
                  </div>
                ) : todayCollections.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 bg-[#fafbfc] rounded-lg border border-dashed border-gray-300">
                    {t('dashboard', 'noCollectionsToday')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5">{t('dashboard', 'code')}</th>
                          <th className="py-2.5">{t('dashboard', 'name')}</th>
                          <th className="py-2.5">{t('dashboard', 'shift')}</th>
                          <th className="py-2.5">{t('dashboard', 'qtyL')}</th>
                          <th className="py-2.5">{t('dashboard', 'fatSnf')}</th>
                          <th className="py-2.5 text-right">{t('dashboard', 'rate')}</th>
                          <th className="py-2.5 text-right">{t('dashboard', 'total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        {todayCollections.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="py-2.5 font-bold text-[#0052cc]">{c.customerCode}</td>
                            <td className="py-2.5 font-semibold text-[#091e42]">{c.customerName}</td>
                            <td className="py-2.5">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${c.shift === 'MORNING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {c.shift === 'MORNING' ? t('dashboard', 'morning') : t('dashboard', 'evening')}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono">{c.quantity}</td>
                            <td className="py-2.5 font-mono text-gray-500">{c.fat}% / {c.snf}%</td>
                            <td className="py-2.5 text-right font-mono font-medium">₹{c.rate.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-[#091e42]">₹{c.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Stock sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="light-panel rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">
                    {t('dashboard', 'cattleFeedStock')}
                  </h3>
                  {purchases.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4 bg-[#fafbfc] rounded border">
                      {t('dashboard', 'noStockRecorded')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchases.map(p => (
                        <div key={p.id}>
                          <div className="flex justify-between text-xs font-semibold mb-1 text-gray-700">
                            <span>{p.foodName}</span>
                            <span className="text-[#0052cc]">{p.remainingQuantity} remaining</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0052cc] transition-all"
                              style={{ width: `${Math.min(100, (p.remainingQuantity / p.quantity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#deebff] border border-blue-200 rounded-xl p-5 text-xs text-[#0747a6] space-y-2.5">
                  <h4 className="font-bold flex items-center gap-1.5 text-[#091e42]">
                    <Info className="w-4 h-4 text-[#0052cc]" /> Live Database Sync
                  </h4>
                  <p className="leading-relaxed">
                    All statistics are fetched live from the PostgreSQL database via the backend API. Stats auto-refresh every 60 seconds.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. MILK ENTRY PANEL
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'milk' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Add Collection Form */}
            <div className="lg:col-span-4 light-panel rounded-xl p-6 self-start">
              <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">
                {t('dashboard', 'recordDeliveryEntry')}
              </h3>

              {milkSuccessMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-medium mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" /> {milkSuccessMsg}
                  </div>
                  <button onClick={() => setMilkSuccessMsg('')} className="text-green-700 font-bold hover:text-green-900 cursor-pointer">×</button>
                </div>
              )}
              {milkErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {milkErrorMsg}
                  </div>
                  <button onClick={() => setMilkErrorMsg('')} className="text-red-700 font-bold hover:text-red-900 cursor-pointer">×</button>
                </div>
              )}

              <form onSubmit={handleMilkEntrySubmit} className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'shift')}</label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setMilkShift('MORNING')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${milkShift === 'MORNING' ? 'bg-[#091e42] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {t('dashboard', 'morning')}
                    </button>
                    <button type="button" onClick={() => setMilkShift('EVENING')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${milkShift === 'EVENING' ? 'bg-[#091e42] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {t('dashboard', 'evening')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'farmerLabel')}</label>
                  <select
                    value={selectedFarmerCode}
                    onChange={(e) => setSelectedFarmerCode(e.target.value)}
                    className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    required
                  >
                    <option value="">{t('dashboard', 'selectFarmer')}</option>
                    {farmers.map(f => (
                      <option key={f.id} value={f.code}>
                        {f.code} - {f.name} ({f.milkType})
                      </option>
                    ))}
                  </select>
                </div>

                {foundFarmer && (
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[10px] text-gray-500 flex items-center justify-between font-semibold">
                    <span>{t('dashboard', 'farmerLabel')}: <strong className="text-[#091e42]">{foundFarmer.name}</strong></span>
                    <span>{t('dashboard', 'milkLabel')}: <strong className="text-[#091e42]">{foundFarmer.milkType}</strong></span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('dashboard', 'qtyLabel'), val: milkQty, set: setMilkQty, ph: '0.0', step: '0.1' },
                    { label: t('dashboard', 'fatLabel'), val: milkFat, set: setMilkFat, ph: '0.0', step: '0.1' },
                    { label: t('dashboard', 'snfLabel'), val: milkSnf, set: setMilkSnf, ph: '0.0', step: '0.1' },
                  ].map(({ label, val, set: setter, ph, step }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-600">{label}</label>
                      <input
                        type="number" step={step} min="0" value={val}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={ph}
                        className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2 text-center"
                        required
                      />
                    </div>
                  ))}
                </div>

                {foundFarmer && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#091e42]">
                        <Calculator className="w-4 h-4 text-[#0052cc]" />
                        <span>{liveCalc?.chartName || 'Active Rate Chart'}</span>
                      </div>
                      {isCalculatingRate && (
                        <span className="animate-spin w-3.5 h-3.5 border-2 border-[#0052cc] border-t-transparent rounded-full" />
                      )}
                    </div>

                    {calcError ? (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        {calcError}
                      </div>
                    ) : liveCalc ? (
                      <div className="space-y-2 text-xs">
                        <div className="bg-[#deebff] border border-blue-200 rounded-lg p-3 text-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                            Calculated Rate / Litre
                          </span>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-2xl font-black text-[#0052cc]">
                              ₹{liveCalc.rate.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-600 font-medium">/ L</span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-blue-200/80 flex justify-between items-center text-xs">
                            <span className="text-gray-600">Total Payout ({milkQty || 1} L):</span>
                            <span className="font-extrabold text-[#091e42] text-sm">
                              ₹{liveCalc.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown Rows */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1.5 text-[11px] text-gray-600">
                          <div className="flex justify-between">
                            <span>Base Rate:</span>
                            <span className="font-semibold text-gray-800">₹{liveCalc.baseRate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FAT Adjustment:</span>
                            <span className={`font-semibold ${liveCalc.fatAdjustment > 0 ? 'text-green-700' : liveCalc.fatAdjustment < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              {liveCalc.fatAdjustment >= 0 ? '+' : ''}₹{liveCalc.fatAdjustment.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>SNF Adjustment:</span>
                            <span className={`font-semibold ${liveCalc.snfAdjustment > 0 ? 'text-blue-700' : liveCalc.snfAdjustment < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              {liveCalc.snfAdjustment >= 0 ? '+' : ''}₹{liveCalc.snfAdjustment.toFixed(2)}
                            </span>
                          </div>
                          {liveCalc.bonus > 0 && (
                            <div className="flex justify-between text-green-700 font-bold">
                              <span>Bonus Premium:</span>
                              <span>+₹{liveCalc.bonus.toFixed(2)}</span>
                            </div>
                          )}
                          {liveCalc.penalty > 0 && (
                            <div className="flex justify-between text-red-600 font-bold">
                              <span>Penalty Deduction:</span>
                              <span>-₹{liveCalc.penalty.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingMilk}
                    className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingMilk ? 'Saving Entry...' : (editMilkId ? 'Update Entry' : t('dashboard', 'saveMilkCollection'))}
                  </button>
                  {editMilkId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMilkId(null);
                        setMilkQty(''); setMilkFat(''); setMilkSnf('');
                      }}
                      className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Today's log */}
            <div className="lg:col-span-8 light-panel rounded-xl p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4 pb-2 border-b">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">
                  {t('dashboard', 'todaysMilkLog')}
                </h3>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">From</label>
                    <input 
                      type="date" 
                      value={milkStartDate} 
                      onChange={(e) => setMilkStartDate(e.target.value)}
                      className="light-input text-xs py-1 px-2 rounded w-28"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">To</label>
                    <input 
                      type="date" 
                      value={milkEndDate} 
                      onChange={(e) => setMilkEndDate(e.target.value)}
                      className="light-input text-xs py-1 px-2 rounded w-28"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkImportOpen(true)}
                    className="px-2.5 py-1.5 bg-[#deebff] hover:bg-[#b3d4ff] text-[#0052cc] text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Bulk CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportMilkCollectionsCsv(displayCollections, `milk_collections_${milkStartDate}_to_${milkEndDate}.csv`)}
                    disabled={displayCollections.length === 0}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Total Litres</p>
                  <p className="text-lg font-black text-blue-700">{milkTotalLitres.toFixed(1)} L</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Avg FAT / SNF</p>
                  <p className="text-lg font-black text-amber-700">{milkAvgFat}% / {milkAvgSnf}%</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center md:col-span-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Total Valuation</p>
                  <p className="text-lg font-black text-green-700">₹{milkTotalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">{t('dashboard', 'code')}</th>
                      <th className="py-2.5">{t('dashboard', 'name')}</th>
                      <th className="py-2.5">{t('dashboard', 'shift')}</th>
                      <th className="py-2.5">{t('dashboard', 'qtyL')}</th>
                      <th className="py-2.5">{t('dashboard', 'fatSnf')}</th>
                      <th className="py-2.5 text-right">{t('dashboard', 'rate')}</th>
                      <th className="py-2.5 text-right">{t('dashboard', 'total')}</th>
                      <th className="py-2.5 text-right">{t('dashboard', 'del')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {milkStatus === 'loading' && displayCollections.length === 0 ? (
                      <TableSkeleton rows={5} cols={8} />
                    ) : displayCollections.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">{t('dashboard', 'noEntriesToday')}</td>
                      </tr>
                    ) : displayCollections.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-2.5 font-bold text-[#0052cc]">{c.customerCode}</td>
                        <td className="py-2.5 font-semibold text-[#091e42]">{c.customerName}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.shift === 'MORNING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.shift === 'MORNING' ? t('dashboard', 'morning') : t('dashboard', 'evening')}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{c.quantity}</td>
                        <td className="py-2.5 font-mono text-gray-500">{c.fat}% / {c.snf}%</td>
                        <td className="py-2.5 text-right font-mono font-medium">₹{c.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#091e42]">₹{c.totalAmount.toFixed(2)}</td>
                        <td className="py-2.5 text-right space-x-1">
                          <button onClick={() => openMilkReceipt(c)} title="Print Milk Slip" className="p-1 text-gray-500 hover:text-[#0052cc] hover:bg-blue-50 rounded transition cursor-pointer">
                            <Printer className="w-3.5 h-3.5 inline" />
                          </button>
                          <button onClick={() => handleEditMilkClick(c)} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer font-bold text-[10px]">
                            EDIT
                          </button>
                          <button onClick={() => handleBillDelete(c.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. FARMERS DIRECTORY
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'farmers' && (
          <div className="space-y-6">
            {farmerSuccessMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {farmerSuccessMsg}
                </div>
                <button onClick={() => setFarmerSuccessMsg('')} className="text-green-700 font-bold">×</button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <div className="relative w-full sm:w-80">
                <input
                  type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('customer', 'searchPlaceholder')}
                  className="w-full light-input text-xs py-2 px-3 pl-9 rounded-lg"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => exportFarmersCsv(filteredFarmers)}
                  disabled={filteredFarmers.length === 0}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => { setFarmerErrorMsg(''); setFarmerSuccessMsg(''); setFarmerModalOpen(true); }}
                  className="w-full sm:w-auto bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> {t('customer', 'registerButton')}
                </button>
              </div>
            </div>

            <div className="light-panel rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-3">{t('customer', 'tableCode')}</th>
                      <th className="py-3">{t('customer', 'tableName')}</th>
                      <th className="py-3">{t('customer', 'tableMobile')}</th>
                      <th className="py-3">{t('customer', 'tableMilkType')}</th>
                      <th className="py-3">{t('customer', 'tableAddress')}</th>
                      <th className="py-3 text-right">Advance Bal</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {farmerStatus === 'loading' && filteredFarmers.length === 0 ? (
                      <TableSkeleton rows={6} cols={7} />
                    ) : filteredFarmers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          {searchQuery ? t('customer', 'noSearchResults') : t('customer', 'emptyState')}
                        </td>
                      </tr>
                    ) : filteredFarmers.map((f) => (
                      <tr key={f.id} className={`hover:bg-gray-50 ${!f.isActive ? 'opacity-50' : ''}`}>
                        <td className="py-3.5 font-bold text-[#0052cc]">
                          {f.code} {!f.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-1">Inactive</span>}
                        </td>
                        <td className="py-3.5 font-semibold text-[#091e42]">{f.name}</td>
                        <td className="py-3.5 text-gray-500">{f.mobile}</td>
                        <td className="py-3.5 font-medium">{f.milkType}</td>
                        <td className="py-3.5 text-gray-500">{f.address || '—'}</td>
                        <td className={`py-3.5 text-right font-bold ${f.advanceBalance > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                          ₹{f.advanceBalance?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button onClick={() => handleEditFarmerClick(f)} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleFarmer(f.id, f.isActive)} className={`${f.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-semibold text-[11px] cursor-pointer`}>
                            {f.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. RATE CHARTS (Production Grade Module)
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'rates' && (
          <RateChartModule />
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. FEED SALES & INVENTORY
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Sell Feed Form */}
            <div className="lg:col-span-4 light-panel rounded-xl p-6 self-start space-y-4">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">{t('dashboard', 'sellFeedToFarmer')}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setDealerModalOpen(true)} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-[#091e42] font-bold px-2 py-1 rounded cursor-pointer">
                    {t('dashboard', 'addDealer')}
                  </button>
                  <button onClick={() => setPurchaseModalOpen(true)} className="text-[10px] bg-[#deebff] hover:bg-blue-100 text-[#0052cc] font-bold px-2 py-1 rounded cursor-pointer">
                    {t('dashboard', 'addPurchase')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleFeedSaleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'farmerLabel')}</label>
                  <select value={saleFarmerId} onChange={(e) => setSaleFarmerId(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2" required>
                    <option value="">{t('dashboard', 'chooseFarmer')}</option>
                    {farmers.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'selectFeedBatch')}</label>
                  <select value={salePurchaseId} onChange={(e) => setSalePurchaseId(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2" required>
                    <option value="">{t('dashboard', 'chooseBatch')}</option>
                    {availablePurchases.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.foodName} ({t('landing', 'stockLeft')}: {p.remainingQuantity} / ₹{p.sellRate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'quantityBags')}</label>
                    <input type="number" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5 text-center" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'amountPaid')}</label>
                    <input type="number" value={salePaidAmount} onChange={(e) => setSalePaidAmount(e.target.value)} disabled={saleCredit} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5 text-center disabled:opacity-50" required />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="saleCredit" checked={saleCredit} onChange={(e) => setSaleCredit(e.target.checked)} className="rounded border-gray-300 accent-[#0052cc]" />
                  <label htmlFor="saleCredit" className="text-xs font-medium text-gray-500">{t('dashboard', 'bookOnCredit')}</label>
                </div>

                <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer">
                  {t('dashboard', 'recordFeedSale')}
                </button>
              </form>
            </div>

            {/* Sales History */}
            <div className="lg:col-span-8 light-panel rounded-xl p-6">
              <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">{t('dashboard', 'feedSalesHistory')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">{t('dashboard', 'date')}</th>
                      <th className="py-2.5">{t('dashboard', 'farmerLabel')}</th>
                      <th className="py-2.5">{t('dashboard', 'feed')}</th>
                      <th className="py-2.5">{t('dashboard', 'qty')}</th>
                      <th className="py-2.5 text-right">{t('dashboard', 'total')}</th>
                      <th className="py-2.5 text-center">{t('dashboard', 'mode')}</th>
                      <th className="py-2.5 text-right">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {feedStatus === 'loading' && sales.length === 0 ? (
                      <TableSkeleton rows={4} cols={7} />
                    ) : sales.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400">{t('dashboard', 'noSalesRecorded')}</td></tr>
                    ) : sales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-2.5 font-medium text-gray-500">
                          {s.saleDate ? s.saleDate.split('T')[0] : '—'}
                        </td>
                        <td className="py-2.5 font-semibold text-[#091e42]">
                          {s.customer?.name ?? '—'} <span className="text-gray-400">({s.customer?.code ?? '—'})</span>
                        </td>
                        <td className="py-2.5 text-gray-700">{s.foodPurchase?.foodName ?? '—'}</td>
                        <td className="py-2.5 font-mono">{s.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-[#091e42]">
                          <div className="font-bold">₹{s.totalAmount?.toFixed(2) ?? '0.00'}</div>
                          {!s.isCashPayment && s.pendingAmount > 0 && (
                            <div className="text-[10px] text-amber-600 font-semibold">Bal: ₹{s.pendingAmount.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isCashPayment ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.isCashPayment ? t('dashboard', 'paid') : t('dashboard', 'credit')}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => openFeedReceipt(s)} title="Print Feed Slip" className="p-1 text-gray-500 hover:text-[#0052cc] hover:bg-blue-50 rounded transition cursor-pointer">
                            <Printer className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dealers & Inventory Views */}
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dealers List */}
              <div className="light-panel rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">Dealer Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5">Code</th>
                        <th className="py-2.5">Name</th>
                        <th className="py-2.5">Phone</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {feedStatus === 'loading' && dealers.length === 0 ? (
                        <TableSkeleton rows={3} cols={4} />
                      ) : dealers.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-400">No dealers added</td></tr>
                      ) : dealers.map((d) => (
                        <tr key={d.id} className={`hover:bg-gray-50 ${!d.isActive ? 'opacity-50' : ''}`}>
                          <td className="py-2.5 font-bold text-[#0052cc]">
                            {d.code} {!d.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-1">Inactive</span>}
                          </td>
                          <td className="py-2.5 font-semibold text-[#091e42]">{d.name}</td>
                          <td className="py-2.5 text-gray-500">{d.phone}</td>
                          <td className="py-2.5 text-right space-x-2">
                            <button onClick={() => handleEditDealerClick(d)} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] cursor-pointer">Edit</button>
                            <button onClick={() => handleToggleDealer(d.id)} className={`${d.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-semibold text-[11px] cursor-pointer`}>
                              {d.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Out of Stock inventory */}
              <div className="light-panel rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">Out-of-Stock Batches</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5">Feed</th>
                        <th className="py-2.5">Dealer</th>
                        <th className="py-2.5">Purchased Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {outOfStockPurchases.length === 0 ? (
                        <tr><td colSpan={3} className="py-8 text-center text-gray-400">No out-of-stock batches</td></tr>
                      ) : outOfStockPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 opacity-60">
                          <td className="py-2.5 font-semibold text-[#091e42]">{p.foodName}</td>
                          <td className="py-2.5 text-gray-500">{p.dealer?.name ?? '—'}</td>
                          <td className="py-2.5 font-mono">{p.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            6. BILLING & SETTLEMENT (Persistent via Backend Store)
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'billing' && (
          <div className="space-y-6">

            <div className="bg-blue-50 border border-blue-200 text-[#0747a6] text-xs p-4 rounded-xl flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#0052cc]" />
              <span>Billing calculates payouts using live database records across your custom date range. Settlements are recorded and stored permanently on the server.</span>
            </div>

            <div className="light-panel p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600">Farmer</label>
                <select value={billingFarmerId} onChange={(e) => setBillingFarmerId(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2">
                  <option value="">-- Choose Farmer --</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">Start Date</label>
                <input type="date" value={billingStartDate} onChange={(e) => setBillingStartDate(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">End Date</label>
                <input type="date" value={billingEndDate} onChange={(e) => setBillingEndDate(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5" />
              </div>
            </div>

            {targetBillingFarmer && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 light-panel rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#091e42] border-b pb-3">
                    {targetBillingFarmer.name} — {billingStartDate} to {billingEndDate}
                  </h3>
                  {billingCollections.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                      No collections found in this period for {targetBillingFarmer.name}.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {billingCollections.map((c) => (
                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[#091e42] font-semibold">{c.date} ({c.shift})</span>
                            <span className="text-[10px] text-gray-500 block">{c.quantity} L | {c.fat}% / {c.snf}%</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-gray-400 block text-[10px]">₹{c.rate.toFixed(2)}/L</span>
                            <strong className="text-[#091e42]">₹{c.totalAmount.toFixed(2)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 light-panel rounded-xl p-6 self-start space-y-4">
                  <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider pb-3 border-b">Settlement</h3>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex justify-between"><span>Total Litres</span><span className="font-mono font-bold text-[#091e42]">{billingTotalQty.toFixed(1)} L</span></div>
                    <div className="flex justify-between"><span>Avg FAT</span><span className="font-mono">{avgFat}%</span></div>
                    <div className="flex justify-between"><span>Avg SNF</span><span className="font-mono">{avgSnf}%</span></div>
                    <div className="border-t border-gray-200 my-2" />
                    <div className="flex justify-between font-bold text-[#091e42]">
                      <span>Gross Milk Value</span>
                      <span className="font-mono">₹{billingTotalGross.toFixed(2)}</span>
                    </div>
                    {customerSummary && customerSummary.summary.totalPending > 0 && (
                      <div className="py-2 border-y border-gray-200 mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-amber-600 font-semibold text-[10px]">Pending Advance: ₹{customerSummary.summary.totalPending.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Advance Deduction</span>
                          <input type="number" max={customerSummary.summary.totalPending} value={billingAdvanceDeduction} onChange={(e) => setBillingAdvanceDeduction(e.target.value)} placeholder="0.00" className="w-24 light-input rounded py-1 px-2 text-right text-[10px]" />
                        </div>
                      </div>
                    )}
                    <div className="bg-[#deebff] border border-blue-200 p-3 rounded-lg flex justify-between mt-2">
                      <span className="text-[10px] font-bold uppercase text-[#0747a6]">Net Payout</span>
                      <strong className="text-[#091e42] text-lg font-black">₹{billingNetPayable}</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleBillSettlement}
                    disabled={billingCollections.length === 0 || isSettlingBill}
                    className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSettlingBill ? 'Settling...' : 'Confirm Settlement'}
                  </button>
                </div>
              </div>
            )}

            <div className="light-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">
                  Settled Bills History {settlements.length > 0 && `(${settlements.length})`}
                </h3>
                {settlements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => exportSettlementsCsv(settlements)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Settlements CSV
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Farmer</th>
                      <th className="py-2.5">Period</th>
                      <th className="py-2.5">Litres</th>
                      <th className="py-2.5 text-right">Net Paid</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {billingStatus === 'loading' && settlements.length === 0 ? (
                      <TableSkeleton rows={4} cols={6} />
                    ) : settlements.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No settled bills recorded</td></tr>
                    ) : settlements.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-2.5 text-gray-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="py-2.5 font-semibold text-[#091e42]">{b.customerName} ({b.customerCode})</td>
                        <td className="py-2.5 text-gray-500 text-[10px]">{b.period}</td>
                        <td className="py-2.5 font-mono">{b.litres.toFixed(1)} L</td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-green-600">₹{b.netPayable.toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => openBillReceipt(b)} className="px-2 py-1 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded transition cursor-pointer inline-flex items-center gap-1">
                            <Printer className="w-3 h-3" /> Slip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            7. ADVANCES LEDGER PANEL
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'advances' && (
          <div className="space-y-8">

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'totalAdvanceIssued')}</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">₹{totalAdvanceIssued.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">{advances.length} total advances in DB</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0052cc]">
                  <HandCoins className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'totalRecoveredAmount')}</span>
                  <span className="text-2xl font-black text-green-700 mt-1 block">₹{totalRecoveredAmt.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">Recovered to date</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">{t('dashboard', 'totalPendingBalance')}</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">₹{totalPendingBal.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">Outstanding balance</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar & Issue CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={advSearchQuery}
                    onChange={(e) => setAdvSearchQuery(e.target.value)}
                    placeholder="Search by advance #, farmer name or mobile..."
                    className="w-full light-input text-xs py-2 px-3 pl-9 rounded-lg"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={advStatusFilter}
                  onChange={(e) => setAdvStatusFilter(e.target.value as any)}
                  className="w-full sm:w-44 light-input rounded-lg text-xs py-2 px-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">{t('dashboard', 'active')}</option>
                  <option value="PARTIALLY_RECOVERED">{t('dashboard', 'partiallyRecovered')}</option>
                  <option value="CLOSED">{t('dashboard', 'closed')}</option>
                </select>
              </div>

              <button
                onClick={() => setAdvanceModalOpen(true)}
                className="w-full sm:w-auto bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {t('dashboard', 'issueAdvance')}
              </button>
            </div>

            {/* Advances Table */}
            <div className="light-panel rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-3">{t('dashboard', 'advanceNumber')}</th>
                      <th className="py-3">{t('dashboard', 'farmerLabel')}</th>
                      <th className="py-3">{t('dashboard', 'givenDate')}</th>
                      <th className="py-3 text-right">{t('dashboard', 'originalAmount')}</th>
                      <th className="py-3 text-right">{t('dashboard', 'recoveredAmount')}</th>
                      <th className="py-3 text-right">{t('dashboard', 'pendingAmount')}</th>
                      <th className="py-3 text-center">{t('dashboard', 'status')}</th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {advLoading && filteredAdvances.length === 0 ? (
                      <TableSkeleton rows={5} cols={8} />
                    ) : filteredAdvances.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          {t('dashboard', 'noAdvancesFound')}
                        </td>
                      </tr>
                    ) : filteredAdvances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-gray-50">
                        <td className="py-3.5 font-mono font-bold text-[#0052cc]">{adv.advanceNumber}</td>
                        <td className="py-3.5 font-semibold text-[#091e42]">
                          {adv.customer?.name ?? '—'} <span className="text-gray-400 font-normal">({adv.customer?.mobile})</span>
                        </td>
                        <td className="py-3.5 text-gray-500">{adv.givenDate ? String(adv.givenDate).split('T')[0] : '—'}</td>
                        <td className="py-3.5 text-right font-mono font-bold text-[#091e42]">₹{Number(adv.originalAmount || 0).toFixed(2)}</td>
                        <td className="py-3.5 text-right font-mono text-green-700 font-semibold">₹{Number(adv.recoveredAmount || 0).toFixed(2)}</td>
                        <td className="py-3.5 text-right font-mono text-amber-700 font-bold">₹{Number(adv.pendingAmount || 0).toFixed(2)}</td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${adv.status === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : adv.status === 'PARTIALLY_RECOVERED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                            {adv.status === 'ACTIVE' ? t('dashboard', 'active') : adv.status === 'PARTIALLY_RECOVERED' ? t('dashboard', 'partiallyRecovered') : t('dashboard', 'closed')}
                          </span>
                        </td>
                        <td className="py-3.5 text-center flex justify-center gap-2">
                          {adv.status !== 'CLOSED' && (
                            <button
                              onClick={() => {
                                setSelectedAdvance(adv);
                                setRepayAmount('');
                                setRepayNotes('');
                                setRepaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[10px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold rounded transition cursor-pointer"
                            >
                              + Repay
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              setSelectedAdvance(adv);
                              setHistoryModalOpen(true);
                              const freshAdv = await getAdvanceById(adv.id);
                              if (freshAdv) {
                                setSelectedAdvance(freshAdv);
                              }
                            }}
                            className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition cursor-pointer flex items-center gap-1"
                          >
                            <HistoryIcon className="w-3 h-3" /> History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            8. SETTINGS & PROFILE MANAGEMENT PANEL
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'settings' && (
          <div className="space-y-6 max-w-5xl">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-black text-[#091e42] tracking-tight">Dairy & Profile Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your personal contact details, dairy establishment location, and collection/payment rules.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isUpdatingProfile}
                className="bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-2 px-4 rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-3.5 h-3.5" />
                {isUpdatingProfile ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileFormError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{profileFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Card 1: Owner & Account Info */}
              <div className="light-panel rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Users className="w-4 h-4 text-[#0052cc]" />
                  <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">Owner & Account Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Owner Name *</label>
                    <input
                      type="text"
                      value={profOwnerName}
                      onChange={(e) => setProfOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Primary Mobile Number *</label>
                    <input
                      type="tel"
                      value={profMobile}
                      onChange={(e) => setProfMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3 font-mono"
                      required
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Used for authentication and SMS notifications.</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Dairy Establishment Info */}
              <div className="light-panel rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Building2 className="w-4 h-4 text-[#0052cc]" />
                  <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">Dairy Location & Registry</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600">Dairy / Center Name *</label>
                    <input
                      type="text"
                      value={profDairyName}
                      onChange={(e) => setProfDairyName(e.target.value)}
                      placeholder="e.g. Gokul Dudh Sankalan Kendra"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">GSTIN / Tax ID (Optional)</label>
                    <input
                      type="text"
                      value={profGstin}
                      onChange={(e) => setProfGstin(e.target.value)}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Village / Town</label>
                    <input
                      type="text"
                      value={profVillage}
                      onChange={(e) => setProfVillage(e.target.value)}
                      placeholder="e.g. Khed"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Taluka / Sub-district</label>
                    <input
                      type="text"
                      value={profTaluka}
                      onChange={(e) => setProfTaluka(e.target.value)}
                      placeholder="e.g. Shirur"
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">District & State</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        value={profDistrict}
                        onChange={(e) => setProfDistrict(e.target.value)}
                        placeholder="District"
                        className="w-full light-input rounded-lg text-xs py-2 px-3"
                      />
                      <input
                        type="text"
                        value={profState}
                        onChange={(e) => setProfState(e.target.value)}
                        placeholder="State"
                        className="w-full light-input rounded-lg text-xs py-2 px-3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Collection Defaults & Business Rules */}
              <div className="light-panel rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Coins className="w-4 h-4 text-[#0052cc]" />
                  <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">Collection & Payment Rules</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Rate Calculation</label>
                    <select
                      value={profCollectionType}
                      onChange={(e) => setProfCollectionType(e.target.value as any)}
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    >
                      <option value="FAT_SNF_BASED">FAT + SNF Based</option>
                      <option value="FAT_BASED">FAT Only Based</option>
                      <option value="FIXED_RATE">Fixed Rate per Litre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Default Milk Type</label>
                    <select
                      value={profMilkType}
                      onChange={(e) => setProfMilkType(e.target.value as any)}
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    >
                      <option value="COW">Cow Milk</option>
                      <option value="BUFFALO">Buffalo Milk</option>
                      <option value="MIX">Mix Milk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Collection Shifts</label>
                    <select
                      value={profCollectionShift}
                      onChange={(e) => setProfCollectionShift(e.target.value as any)}
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    >
                      <option value="BOTH">Morning & Evening (Both)</option>
                      <option value="MORNING">Morning Only</option>
                      <option value="EVENING">Evening Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Payment Period</label>
                    <select
                      value={profPaymentPeriod}
                      onChange={(e) => setProfPaymentPeriod(e.target.value as any)}
                      className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    >
                      <option value="WEEKLY">Weekly Cycle (7 Days)</option>
                      <option value="BIWEEKLY">Bi-Weekly (15 Days)</option>
                      <option value="MONTHLY">Monthly Cycle (30 Days)</option>
                      <option value="DAILY">Daily Settlement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD FARMER
      ══════════════════════════════════════════════════════════════ */}
      {farmerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setFarmerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">
                {editFarmerId ? 'Edit Farmer Details' : t('customer', 'registerModalTitle')}
              </h4>
              <button onClick={() => setFarmerModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddFarmerSubmit} className="p-5 space-y-4 text-xs">
              {farmerErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {farmerErrorMsg}
                </div>
              )}

              {/* 1. Customer Code */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('customer', 'customerCode')}</label>
                <input
                  type="text"
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value)}
                  placeholder={t('customer', 'customerCodePlaceholder')}
                  className="mt-1 w-full light-input rounded py-1.5 px-2.5 disabled:opacity-50"
                  maxLength={20}
                  disabled={!!editFarmerId}
                  required
                />
              </div>

              {/* 2. Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('customer', 'fullName')}</label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder={t('customer', 'fullNamePlaceholder')}
                  className="mt-1 w-full light-input rounded py-1.5 px-2.5"
                  required
                />
              </div>

              {/* 3. Mobile & 4. Milk Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('customer', 'mobile')}</label>
                  <input
                    type="tel"
                    value={fMobile}
                    onChange={(e) => setFMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={t('customer', 'mobilePlaceholder')}
                    className="mt-1 w-full light-input rounded py-1.5 px-2.5"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('customer', 'milkType')}</label>
                  <select value={fMilkType} onChange={(e) => setFMilkType(e.target.value as any)} className="mt-1 w-full light-input rounded py-1.5 px-2">
                    <option value="COW">{t('customer', 'cow')}</option>
                    <option value="BUFFALO">{t('customer', 'buffalo')}</option>
                    <option value="MIX">{t('customer', 'mix')}</option>
                  </select>
                </div>
              </div>

              {/* 5. Address / Village */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('customer', 'addressVillage')}</label>
                <input
                  type="text"
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                  placeholder={t('customer', 'addressPlaceholder')}
                  className="mt-1 w-full light-input rounded py-1.5 px-2.5"
                />
              </div>

              {/* 6. Bank Details */}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <h5 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Bank Details (Optional)</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bank Name</label>
                    <input type="text" value={fBankName} onChange={(e) => setFBankName(e.target.value)} placeholder="e.g. State Bank of India" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Account No</label>
                    <input type="text" value={fAccountNo} onChange={(e) => setFAccountNo(e.target.value)} placeholder="e.g. 1234567890" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">IFSC Code</label>
                    <input type="text" value={fIfscCode} onChange={(e) => setFIfscCode(e.target.value)} placeholder="e.g. SBIN0001234" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFarmerModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded transition cursor-pointer"
                >
                  {t('customer', 'cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFarmer}
                  className="flex-1 bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold py-2 rounded transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingFarmer ? (editFarmerId ? 'Saving...' : 'Registering...') : (editFarmerId ? 'Save Changes' : t('customer', 'registerSubmit'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD DEALER
      ══════════════════════════════════════════════════════════════ */}
      {dealerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => { setDealerModalOpen(false); setEditDealerId(null); }} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">{editDealerId ? 'Edit Wholesale Dealer' : t('dashboard', 'addWholesaleDealer')}</h4>
              <button onClick={() => { setDealerModalOpen(false); setEditDealerId(null); }} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddDealerSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('dashboard', 'dealerCode')}</label>
                  <input type="text" value={dCode} onChange={(e) => setDCode(e.target.value)} placeholder={t('dashboard', 'dealerCodePlaceholder')} className="mt-1 w-full light-input rounded py-1.5 px-2.5" disabled={!!editDealerId} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('dashboard', 'dealerName')}</label>
                  <input type="text" value={dName} onChange={(e) => setDName(e.target.value)} placeholder={t('dashboard', 'dealerNamePlaceholder')} className="mt-1 w-full light-input rounded py-1.5 px-2.5" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('dashboard', 'phone')}</label>
                <input type="text" value={dPhone} onChange={(e) => setDPhone(e.target.value)} placeholder={t('dashboard', 'phonePlaceholder')} className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('dashboard', 'address')}</label>
                <input type="text" value={dAddress} onChange={(e) => setDAddress(e.target.value)} placeholder={t('dashboard', 'addressPlaceholder')} className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
              </div>
              <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold py-2 rounded transition cursor-pointer">
                {editDealerId ? 'Update Dealer' : t('dashboard', 'createDealer')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: RECORD PURCHASE
      ══════════════════════════════════════════════════════════════ */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setPurchaseModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">{t('dashboard', 'recordBulkPurchaseTitle')}</h4>
              <button onClick={() => setPurchaseModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleRecordPurchaseSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'wholesaleDealer')}</label>
                <select value={pDealerId} onChange={(e) => setPDealerId(e.target.value)} className="mt-1 w-full light-input rounded-lg py-2 px-2" required>
                  <option value="">{t('dashboard', 'chooseDealer')}</option>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'feedProductName')}</label>
                <input type="text" value={pFoodName} onChange={(e) => setPFoodName(e.target.value)} placeholder={t('dashboard', 'feedProductNamePlaceholder')} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'bagsQty')}</label>
                  <input type="number" value={pQty} onChange={(e) => setPQty(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'buyRateBag')}</label>
                  <input type="number" value={pBuyRate} onChange={(e) => setPBuyRate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'sellRateBag')}</label>
                  <input type="number" value={pSellRate} onChange={(e) => setPSellRate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'amountPaid')}</label>
                  <input type="number" value={pPaid} onChange={(e) => setPPaid(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'purchaseDate')}</label>
                <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5" required />
              </div>
              <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold py-2 rounded transition cursor-pointer">
                {t('dashboard', 'logBulkPurchase')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ISSUE ADVANCE
      ══════════════════════════════════════════════════════════════ */}
      {advanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setAdvanceModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">{t('dashboard', 'issueAdvance')}</h4>
              <button onClick={() => setAdvanceModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleCreateAdvanceSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'selectFarmer')}</label>
                <select
                  value={advCustomerId}
                  onChange={(e) => setAdvCustomerId(e.target.value)}
                  className="mt-1 w-full light-input rounded-lg py-2 px-2"
                  required
                >
                  <option value="">{t('dashboard', 'selectFarmer')}</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.code} - {f.name} ({f.mobile})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'originalAmount')} (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'givenDate')}</label>
                <input
                  type="date"
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'notesOptional')}</label>
                <textarea
                  value={advNotes}
                  onChange={(e) => setAdvNotes(e.target.value)}
                  placeholder="Purpose of advance loan..."
                  rows={3}
                  className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5"
                />
              </div>

              <button type="submit" disabled={advLoading} className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold py-2.5 rounded-lg transition shadow-md cursor-pointer">
                {advLoading ? 'Processing...' : t('dashboard', 'saveAdvance')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: RECORD REPAYMENT
      ══════════════════════════════════════════════════════════════ */}
      {repaymentModalOpen && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setRepaymentModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">{t('dashboard', 'recordRepaymentTitle')}</h4>
              <button onClick={() => setRepaymentModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleRepaymentSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-[#deebff] border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between text-gray-700">
                  <span>{t('dashboard', 'advanceNumber')}:</span>
                  <strong className="font-mono text-[#0052cc]">{selectedAdvance.advanceNumber}</strong>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{t('dashboard', 'farmerLabel')}:</span>
                  <strong className="text-[#091e42]">{selectedAdvance.customer?.name}</strong>
                </div>
                <div className="flex justify-between text-[#0747a6] pt-1 border-t border-blue-200">
                  <span>{t('dashboard', 'pendingAmount')}:</span>
                  <strong className="font-mono text-lg text-amber-700">₹{Number(selectedAdvance.pendingAmount || 0).toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'repaymentAmountLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  max={Number(selectedAdvance.pendingAmount || 0)}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder={`Max ₹${Number(selectedAdvance.pendingAmount || 0).toFixed(2)}`}
                  className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">{t('dashboard', 'notesOptional')}</label>
                <textarea
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="Repayment remarks..."
                  rows={3}
                  className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5"
                />
              </div>

              <button type="submit" disabled={advLoading} className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold py-2.5 rounded-lg transition shadow-md cursor-pointer">
                {advLoading ? 'Saving...' : t('dashboard', 'saveRepayment')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: TRANSACTION HISTORY
      ══════════════════════════════════════════════════════════════ */}
      {historyModalOpen && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <div>
                <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">{t('dashboard', 'advanceHistoryTitle')}</h4>
                <span className="text-[10px] text-[#0052cc] font-mono font-bold">{selectedAdvance.advanceNumber}</span>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border text-center">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Original</span>
                  <strong className="font-mono text-[#091e42]">₹{Number(selectedAdvance.originalAmount || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Recovered</span>
                  <strong className="font-mono text-green-700">₹{Number(selectedAdvance.recoveredAmount || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Pending</span>
                  <strong className="font-mono text-amber-700">₹{selectedAdvance.pendingAmount.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ledger Entries</h5>
                {!selectedAdvance.transactions || selectedAdvance.transactions.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs bg-gray-50 rounded border">No transaction entries</div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {selectedAdvance.transactions.map((tx) => (
                      <div key={tx.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {tx.type}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'} {tx.notes ? `• ${tx.notes}` : ''}
                          </span>
                        </div>
                        <strong className={`font-mono text-sm ${tx.type === 'ISSUED' ? 'text-[#091e42]' : 'text-green-700'}`}>
                          {tx.type === 'ISSUED' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BULK MILK IMPORT MODAL
      ══════════════════════════════════════════════════════════════ */}
      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        farmers={farmers}
        onImportEntry={addCollectionEntry}
        onComplete={() => {
          fetchCollections();
          fetchDashboard();
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          PRINTABLE RECEIPT / THERMAL SLIP MODAL
      ══════════════════════════════════════════════════════════════ */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        type={receiptType}
        dairyProfile={profile || user}
        data={receiptData}
      />

    </div>
  </div>
  );
}
