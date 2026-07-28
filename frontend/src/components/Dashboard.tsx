import { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useFarmerStore } from '../store/useFarmerStore';
import { useRateChartStore } from '../store/useRateChartStore';
import { useMilkStore } from '../store/useMilkStore';
import { useFeedStore } from '../store/useFeedStore';
import {
  Milk,
  Users,
  FileSpreadsheet,
  ShoppingBag,
  Coins,
  LayoutDashboard,
  Home,
  LogOut,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  UserPlus,
  Info,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const { setView } = useUIStore();
  const { user, token, logout } = useAuthStore();
  const { dashboardStats, fetchDashboard, error: adminError } = useAdminStore();
  const { farmers, fetchFarmers, addFarmer, error: farmerError } = useFarmerStore();
  const { rateCharts, fetchRateCharts, calculateRate, deleteRateChart, error: rateError } = useRateChartStore();
  const { collections, fetchCollections, addCollectionEntry, deleteCollectionEntry, error: milkError } = useMilkStore();
  const { dealers, purchases, sales, fetchDealers, fetchPurchases, fetchSales, addDealer, recordPurchase, recordSale, error: feedError } = useFeedStore();

  const fetchError = adminError || farmerError || rateError || milkError || feedError;

  // Load all data from backend when component mounts or token changes
  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchFarmers();
      fetchRateCharts();
      fetchCollections();
      fetchDealers();
      fetchPurchases();
      fetchSales();
    }
  }, [token]);

  // Refresh dashboard stats every 60 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchDashboard(), 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Internal routing in Dashboard
  const [dbTab, setDbTab] = useState<'overview' | 'milk' | 'farmers' | 'rates' | 'feed' | 'billing'>('overview');

  // Modal control states
  const [farmerModalOpen, setFarmerModalOpen] = useState(false);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // 1. ADD FARMER FORM STATE
  const [fName, setFName] = useState('');
  const [fMobile, setFMobile] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fMilkType, setFMilkType] = useState<'COW' | 'BUFFALO' | 'MIX'>('COW');

  // 2. ADD DEALER STATE
  const [dName, setDName] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dAddress, setDAddress] = useState('');
  const [dCode, setDCode] = useState('');

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

  // 5. FEED SALE FORM STATE
  const [saleFarmerId, setSaleFarmerId] = useState('');
  const [salePurchaseId, setSalePurchaseId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [salePaidAmount, setSalePaidAmount] = useState('0');
  const [saleCredit, setSaleCredit] = useState(true);

  // 6. BILLING (local: no billing endpoint on backend)
  const [billingFarmerId, setBillingFarmerId] = useState('');
  const [billingStartDate, setBillingStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [billingEndDate, setBillingEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settledBills, setSettledBills] = useState<any[]>([]);

  // Search farmers filter
  const [searchQuery, setSearchQuery] = useState('');

  // ── Derived state ──────────────────────────────────────────────────────────

  const foundFarmer = farmers.find(f => f.code === Number(selectedFarmerCode));
  const liveRateInfo = foundFarmer
    ? calculateRate(foundFarmer.milkType, Number(milkFat) || 0, Number(milkSnf) || 0)
    : { rate: 0, chartName: 'No Farmer Selected' };

  // Overview metrics — from DB dashboard endpoint
  const todayLiters = dashboardStats?.todayMilkCollection ?? 0;
  const todayValue = dashboardStats?.todayAmount ?? 0;
  const totalCustomers = dashboardStats?.totalCustomers ?? farmers.length;

  // Today's collections list (for overview table)
  // Backend `/milk/today` already filters for today's entries
  const todayCollections = collections;

  // Billing (local calculation from cached collections)
  const targetBillingFarmer = farmers.find(f => f.id === billingFarmerId);
  const billingCollections = collections.filter(c =>
    c.customerId === billingFarmerId &&
    c.date >= billingStartDate &&
    c.date <= billingEndDate
  );
  const billingTotalQty = billingCollections.reduce((sum, c) => sum + c.quantity, 0);
  const billingTotalGross = billingCollections.reduce((sum, c) => sum + c.totalAmount, 0);
  const avgFat = billingCollections.length
    ? Number((billingCollections.reduce((sum, c) => sum + c.fat, 0) / billingCollections.length).toFixed(2))
    : 0;
  const avgSnf = billingCollections.length
    ? Number((billingCollections.reduce((sum, c) => sum + c.snf, 0) / billingCollections.length).toFixed(2))
    : 0;
  const billingNetPayable = Number(billingTotalGross.toFixed(2));

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toString().includes(searchQuery) ||
    f.mobile.includes(searchQuery)
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fMobile) { alert('Name and Mobile are required'); return; }
    const success = await addFarmer({ name: fName, mobile: fMobile, address: fAddress, milkType: fMilkType });
    if (success) {
      setFarmerModalOpen(false);
      setFName(''); setFMobile(''); setFAddress('');
      fetchDashboard();
    }
  };

  const handleAddDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName || !dCode) { alert('Dealer Name and Code are required'); return; }
    const success = await addDealer({ name: dName, phone: dPhone, address: dAddress, code: dCode });
    if (success) {
      setDealerModalOpen(false);
      setDName(''); setDPhone(''); setDAddress(''); setDCode('');
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
    }
  };

  const handleMilkEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMilkSuccessMsg('');
    setMilkErrorMsg('');
    if (!foundFarmer) { setMilkErrorMsg('Please select a valid farmer'); return; }
    const qty = Number(milkQty);
    if (isNaN(qty) || qty <= 0) { setMilkErrorMsg('Enter a valid milk quantity in Litres'); return; }

    const success = await addCollectionEntry({
      customerCode: foundFarmer.code,
      customerName: foundFarmer.name,
      customerId: foundFarmer.id,
      milkType: foundFarmer.milkType,
      quantity: qty,
      fat: Number(milkFat) || 0,
      snf: Number(milkSnf) || 0,
      shift: milkShift,
    });

    if (success) {
      setMilkSuccessMsg(`Entry saved for ${foundFarmer.name}! Rate: ₹${liveRateInfo.rate.toFixed(2)}/L`);
      setMilkQty(''); setMilkFat(''); setMilkSnf('');
      fetchDashboard();
    } else {
      setMilkErrorMsg('Error saving entry. Duplicate shift for today may already exist.');
    }
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
    const billObj = {
      id: 'bill_' + Math.random().toString(36).substr(2, 9),
      farmerCode: targetBillingFarmer.code,
      farmerName: targetBillingFarmer.name,
      period: `${billingStartDate} to ${billingEndDate}`,
      litres: billingTotalQty,
      avgFat,
      avgSnf,
      gross: billingTotalGross,
      net: billingNetPayable,
      date: new Date().toISOString().split('T')[0],
    };
    setSettledBills([billObj, ...settledBills]);
    alert(`Bill settled successfully for ₹${billingNetPayable}!`);
    setBillingFarmerId('');
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex text-[#091e42]">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-[#091e42] flex flex-col justify-between p-4 shrink-0 text-white shadow-xl">
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
            <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">Active Dairy Hub</span>
            <span className="text-sm font-bold block mt-0.5">{user?.dairyName || '—'}</span>
            <span className="text-xs text-blue-200 block">{user?.village || '—'}, {user?.district || '—'}</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'milk', label: 'Milk Entry Registry', icon: Milk },
              { id: 'farmers', label: 'Farmer Accounts', icon: Users },
              { id: 'rates', label: 'Rate Slab Sheets', icon: FileSpreadsheet },
              { id: 'feed', label: 'Feeds & Sales', icon: ShoppingBag },
              { id: 'billing', label: 'Settle Billing', icon: Coins },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = dbTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setDbTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                    isActive ? 'bg-[#0052cc] text-white shadow-md' : 'text-blue-100 hover:text-white hover:bg-[#172b4d]'
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
          <button onClick={() => setView('landing')} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-blue-200 hover:text-white rounded-lg transition">
            <Home className="w-4 h-4" /> Landing View
          </button>
          <button onClick={() => { logout(); setView('landing'); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/20 rounded-lg transition">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-8">

        {/* TOP HEADER */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-200 mb-8">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#091e42]">
              {dbTab === 'overview' && 'System Analytics'}
              {dbTab === 'milk' && 'Milk Collection Register'}
              {dbTab === 'farmers' && 'Farmers Ledger Directory'}
              {dbTab === 'rates' && 'Pricing Slabs Configuration'}
              {dbTab === 'feed' && 'Cattle Feed Sales Inventory'}
              {dbTab === 'billing' && 'Billing Settlement Hub'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Logged in as <span className="font-semibold text-[#0052cc]">{user?.ownerName}</span> ({user?.mobile})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { fetchDashboard(); fetchCollections(); fetchFarmers(); fetchRateCharts(); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0052cc] font-semibold cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Pricing Mode</span>
              <span className="text-xs font-bold text-[#0052cc] bg-[#deebff] px-2.5 py-1 rounded">
                {user?.collectionType?.replace(/_/g, ' ') || '—'}
              </span>
            </div>
          </div>
        </header>

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
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">Liters Today</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{todayLiters.toFixed(1)} L</span>
                  <span className="text-[10px] text-gray-400">Live from database</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#deebff] flex items-center justify-center text-[#0052cc]">
                  <Milk className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">Intake Value</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">₹{todayValue.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400">Live from database</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">Active Farmers</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{totalCustomers}</span>
                  <span className="text-[10px] text-gray-400">Live from database</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="light-panel p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold uppercase tracking-wider">Rate Charts</span>
                  <span className="text-2xl font-black text-[#091e42] mt-1 block">{rateCharts.filter(r => r.isActive).length} Active</span>
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
                  Today's Milk Collections ({todayCollections.length})
                </h3>

                {todayCollections.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 bg-[#fafbfc] rounded-lg border border-dashed border-gray-300">
                    No milk collected yet today. Go to the "Milk Entry Registry" tab to log records.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5">Code</th>
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Shift</th>
                          <th className="py-2.5">Qty (L)</th>
                          <th className="py-2.5">Fat/SNF</th>
                          <th className="py-2.5 text-right">Rate</th>
                          <th className="py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        {todayCollections.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="py-2.5 font-bold text-[#0052cc]">{c.customerCode}</td>
                            <td className="py-2.5 font-semibold text-[#091e42]">{c.customerName}</td>
                            <td className="py-2.5">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${c.shift === 'MORNING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {c.shift}
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
                    Cattle Feed Stock
                  </h3>
                  {purchases.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4 bg-[#fafbfc] rounded border">
                      No feed stock recorded. Add a purchase in "Feeds & Sales".
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
                Record Delivery Entry
              </h3>

              {milkSuccessMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {milkSuccessMsg}
                </div>
              )}
              {milkErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {milkErrorMsg}
                </div>
              )}

              <form onSubmit={handleMilkEntrySubmit} className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-600">Shift</label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setMilkShift('MORNING')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${milkShift === 'MORNING' ? 'bg-[#091e42] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      Morning
                    </button>
                    <button type="button" onClick={() => setMilkShift('EVENING')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${milkShift === 'EVENING' ? 'bg-[#091e42] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      Evening
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600">Farmer</label>
                  <select
                    value={selectedFarmerCode}
                    onChange={(e) => setSelectedFarmerCode(e.target.value)}
                    className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2"
                    required
                  >
                    <option value="">-- Select Farmer --</option>
                    {farmers.map(f => (
                      <option key={f.id} value={f.code}>
                        {f.code} - {f.name} ({f.milkType})
                      </option>
                    ))}
                  </select>
                </div>

                {foundFarmer && (
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[10px] text-gray-500 flex items-center justify-between font-semibold">
                    <span>Farmer: <strong className="text-[#091e42]">{foundFarmer.name}</strong></span>
                    <span>Milk: <strong className="text-[#091e42]">{foundFarmer.milkType}</strong></span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[ 
                    { label: 'Qty (L)', val: milkQty, set: setMilkQty, ph: '0.0', step: '0.1' },
                    { label: 'Fat %', val: milkFat, set: setMilkFat, ph: '0.0', step: '0.1' },
                    { label: 'SNF %', val: milkSnf, set: setMilkSnf, ph: '0.0', step: '0.1' },
                  ].map(({ label, val, set: setter, ph, step }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-600">{label}</label>
                      <input
                        type="number" step={step} value={val}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={ph}
                        className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2 text-center"
                        required
                      />
                    </div>
                  ))}
                </div>

                {foundFarmer && (
                  <div className="bg-[#deebff] border border-blue-200 rounded-lg p-3 flex justify-between items-center text-xs text-[#0747a6]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block">
                        Rate ({liveRateInfo.chartName})
                      </span>
                      <strong className="text-[#091e42] text-lg">₹{liveRateInfo.rate.toFixed(2)}/L</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Total Amount</span>
                      <strong className="text-[#0052cc] text-lg">₹{((Number(milkQty) || 0) * liveRateInfo.rate).toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer">
                  Save Milk Collection
                </button>
              </form>
            </div>

            {/* Today's log */}
            <div className="lg:col-span-8 light-panel rounded-xl p-6">
              <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">
                Today's Milk Collections Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">Code</th>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Shift</th>
                      <th className="py-2.5">Qty (L)</th>
                      <th className="py-2.5">Fat/SNF</th>
                      <th className="py-2.5 text-right">Rate/L</th>
                      <th className="py-2.5 text-right">Amount</th>
                      <th className="py-2.5 text-right">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {collections.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">No entries today</td>
                      </tr>
                    ) : collections.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-2.5 font-bold text-[#0052cc]">{c.customerCode}</td>
                        <td className="py-2.5 font-semibold text-[#091e42]">{c.customerName}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.shift === 'MORNING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.shift[0]}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{c.quantity}</td>
                        <td className="py-2.5 font-mono text-gray-500">{c.fat}% / {c.snf}%</td>
                        <td className="py-2.5 text-right font-mono font-medium">₹{c.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#091e42]">₹{c.totalAmount.toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => handleBillDelete(c.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <div className="relative w-full sm:w-80">
                <input
                  type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, name or mobile..."
                  className="w-full light-input text-xs py-2 px-3 pl-9 rounded-lg"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={() => setFarmerModalOpen(true)}
                className="w-full sm:w-auto bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Register Farmer
              </button>
            </div>

            <div className="light-panel rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-3">Code</th>
                      <th className="py-3">Name</th>
                      <th className="py-3">Mobile</th>
                      <th className="py-3">Milk Type</th>
                      <th className="py-3">Address</th>
                      <th className="py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {filteredFarmers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">No farmers found</td>
                      </tr>
                    ) : filteredFarmers.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="py-3.5 font-bold text-[#0052cc]">{f.code}</td>
                        <td className="py-3.5 font-semibold text-[#091e42]">{f.name}</td>
                        <td className="py-3.5 text-gray-500">{f.mobile}</td>
                        <td className="py-3.5 font-medium">{f.milkType}</td>
                        <td className="py-3.5 text-gray-500">{f.address || '—'}</td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {f.isActive ? 'Active' : 'Inactive'}
                          </span>
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
            4. RATE CHARTS (aligned to actual DB model: fatSteps / snfSteps / baseRate)
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'rates' && (
          <div className="space-y-6">
            <div className="bg-[#deebff] border border-blue-200 p-5 rounded-xl">
              <h3 className="text-base font-bold text-[#091e42]">Pricing Rate Charts</h3>
              <p className="text-xs text-gray-500 mt-1">
                Charts are stored in the database and used for live rate calculation during milk entry.
              </p>
            </div>

            {rateCharts.length === 0 ? (
              <div className="light-panel rounded-xl p-12 text-center text-gray-400 text-xs border border-dashed border-gray-300">
                No rate charts configured yet. Create one via the API or ask your admin.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rateCharts.map((rc) => (
                  <div key={rc.id} className="light-panel rounded-xl p-6">
                    <div className="flex justify-between items-start pb-3 border-b border-gray-200 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#091e42]">{rc.name}</h4>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {rc.milkType} · {rc.method} · {rc.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${rc.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400'}`}>
                          {rc.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => deleteRateChart(rc.id)}
                          className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                          title="Delete chart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Base Rate */}
                    <div className="flex justify-between items-center mb-3 text-xs">
                      <span className="text-gray-500 font-semibold">Base Rate</span>
                      <span className="font-mono font-bold text-[#0052cc]">₹{rc.baseRate.toFixed(2)}/L</span>
                    </div>

                    {/* FAT Steps */}
                    {rc.fatSteps.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">FAT Steps (increment per point above start)</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {rc.fatSteps.map((s, i) => (
                            <div key={s.id || i} className="bg-gray-50 border border-gray-200 rounded p-1.5 text-[10px] font-mono text-center">
                              <span className="text-gray-500 block">≥{s.startValue}</span>
                              <span className="font-bold text-[#0052cc]">+₹{s.increment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SNF Steps */}
                    {rc.snfSteps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">SNF Steps</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {rc.snfSteps.map((s, i) => (
                            <div key={s.id || i} className="bg-orange-50 border border-orange-200 rounded p-1.5 text-[10px] font-mono text-center">
                              <span className="text-gray-500 block">≥{s.startValue}</span>
                              <span className="font-bold text-orange-700">+₹{s.increment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rules */}
                    {rc.rules.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Bonus/Penalty Rules</p>
                        <div className="space-y-1">
                          {rc.rules.map((r, i) => (
                            <div key={r.id || i} className="flex justify-between text-[10px] font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                              <span>{r.axis}: {r.fromValue}–{r.toValue}</span>
                              <span className={r.amount >= 0 ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>
                                {r.amount >= 0 ? '+' : ''}₹{r.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. FEED SALES & INVENTORY
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Sell Feed Form */}
            <div className="lg:col-span-4 light-panel rounded-xl p-6 self-start space-y-4">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">Sell Feed to Farmer</h3>
                <div className="flex gap-2">
                  <button onClick={() => setDealerModalOpen(true)} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-[#091e42] font-bold px-2 py-1 rounded cursor-pointer">
                    + Dealer
                  </button>
                  <button onClick={() => setPurchaseModalOpen(true)} className="text-[10px] bg-[#deebff] hover:bg-blue-100 text-[#0052cc] font-bold px-2 py-1 rounded cursor-pointer">
                    + Purchase
                  </button>
                </div>
              </div>

              <form onSubmit={handleFeedSaleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Select Farmer</label>
                  <select value={saleFarmerId} onChange={(e) => setSaleFarmerId(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2" required>
                    <option value="">-- Choose Farmer --</option>
                    {farmers.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600">Select Feed Batch (Stock)</label>
                  <select value={salePurchaseId} onChange={(e) => setSalePurchaseId(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-2 px-2" required>
                    <option value="">-- Select Batch --</option>
                    {purchases.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.foodName} (Stock: {p.remainingQuantity} / ₹{p.sellRate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Quantity (Bags)</label>
                    <input type="number" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5 text-center" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Amount Paid (₹)</label>
                    <input type="number" value={salePaidAmount} onChange={(e) => setSalePaidAmount(e.target.value)} disabled={saleCredit} className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5 text-center disabled:opacity-50" required />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="saleCredit" checked={saleCredit} onChange={(e) => setSaleCredit(e.target.checked)} className="rounded border-gray-300 accent-[#0052cc]" />
                  <label htmlFor="saleCredit" className="text-xs font-medium text-gray-500">Book on Credit</label>
                </div>

                <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer">
                  Record Feed Sale
                </button>
              </form>
            </div>

            {/* Sales History */}
            <div className="lg:col-span-8 light-panel rounded-xl p-6">
              <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">Feed Sales History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Farmer</th>
                      <th className="py-2.5">Feed</th>
                      <th className="py-2.5">Qty</th>
                      <th className="py-2.5 text-right">Total</th>
                      <th className="py-2.5 text-center">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {sales.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No sales recorded</td></tr>
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
                        <td className="py-2.5 text-right font-mono font-bold text-[#091e42]">₹{s.totalAmount?.toFixed(2) ?? '0.00'}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isCashPayment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.isCashPayment ? 'Paid' : 'Credit'}
                          </span>
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
            6. BILLING & SETTLEMENT (local — no billing backend endpoint)
        ══════════════════════════════════════════════════════════════ */}
        {dbTab === 'billing' && (
          <div className="space-y-6">

            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Billing uses milk data fetched from the database. Settlement records are local session-only (no billing endpoint exists on the backend yet).</span>
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
                      No collections in this period.
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
                    <div className="bg-[#deebff] border border-blue-200 p-3 rounded-lg flex justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#0747a6]">Net Payout</span>
                      <strong className="text-[#091e42] text-lg font-black">₹{billingNetPayable}</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleBillSettlement}
                    disabled={billingCollections.length === 0}
                    className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md cursor-pointer"
                  >
                    Confirm Settlement
                  </button>
                </div>
              </div>
            )}

            {settledBills.length > 0 && (
              <div className="light-panel rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider mb-4 border-b pb-2">
                  Settled Bills History ({settledBills.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Farmer</th>
                        <th className="py-2.5">Period</th>
                        <th className="py-2.5">Litres</th>
                        <th className="py-2.5 text-right">Net Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {settledBills.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="py-2.5 text-gray-500">{b.date}</td>
                          <td className="py-2.5 font-semibold text-[#091e42]">{b.farmerName} ({b.farmerCode})</td>
                          <td className="py-2.5 text-gray-500 text-[10px]">{b.period}</td>
                          <td className="py-2.5 font-mono">{b.litres.toFixed(1)} L</td>
                          <td className="py-2.5 text-right font-mono font-extrabold text-green-600">₹{b.net}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD FARMER
      ══════════════════════════════════════════════════════════════ */}
      {farmerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setFarmerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">Register Farmer</h4>
              <button onClick={() => setFarmerModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddFarmerSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Ramesh Patil" className="mt-1 w-full light-input rounded py-1.5 px-2.5" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mobile</label>
                  <input type="text" value={fMobile} onChange={(e) => setFMobile(e.target.value)} placeholder="10 digit number" className="mt-1 w-full light-input rounded py-1.5 px-2.5" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Milk Type</label>
                  <select value={fMilkType} onChange={(e) => setFMilkType(e.target.value as any)} className="mt-1 w-full light-input rounded py-1.5 px-2">
                    <option value="COW">COW</option>
                    <option value="BUFFALO">BUFFALO</option>
                    <option value="MIX">MIX</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address / Village</label>
                <input type="text" value={fAddress} onChange={(e) => setFAddress(e.target.value)} placeholder="Village name" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
              </div>
              <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold py-2 rounded transition cursor-pointer">
                Register Farmer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD DEALER
      ══════════════════════════════════════════════════════════════ */}
      {dealerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm" onClick={() => setDealerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">Add Wholesale Dealer</h4>
              <button onClick={() => setDealerModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddDealerSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dealer Code</label>
                  <input type="text" value={dCode} onChange={(e) => setDCode(e.target.value)} placeholder="e.g. DLR-001" className="mt-1 w-full light-input rounded py-1.5 px-2.5" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dealer Name</label>
                  <input type="text" value={dName} onChange={(e) => setDName(e.target.value)} placeholder="e.g. Vijay Patel" className="mt-1 w-full light-input rounded py-1.5 px-2.5" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                <input type="text" value={dPhone} onChange={(e) => setDPhone(e.target.value)} placeholder="9876543210" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <input type="text" value={dAddress} onChange={(e) => setDAddress(e.target.value)} placeholder="Address" className="mt-1 w-full light-input rounded py-1.5 px-2.5" />
              </div>
              <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold py-2 rounded transition cursor-pointer">
                Create Dealer
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
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden z-10 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-[#f4f5f7]">
              <h4 className="text-xs font-bold text-[#091e42] uppercase tracking-wider">Record Bulk Stock Purchase</h4>
              <button onClick={() => setPurchaseModalOpen(false)} className="text-gray-500 hover:text-black font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleRecordPurchaseSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-600">Wholesale Dealer</label>
                <select value={pDealerId} onChange={(e) => setPDealerId(e.target.value)} className="mt-1 w-full light-input rounded-lg py-2 px-2" required>
                  <option value="">-- Choose Dealer --</option>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">Feed Product Name</label>
                <input type="text" value={pFoodName} onChange={(e) => setPFoodName(e.target.value)} placeholder="e.g. Kapila Super Feed 50kg" className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Bags Qty</label>
                  <input type="number" value={pQty} onChange={(e) => setPQty(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Buy Rate/Bag (₹)</label>
                  <input type="number" value={pBuyRate} onChange={(e) => setPBuyRate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Sell Rate/Bag (₹)</label>
                  <input type="number" value={pSellRate} onChange={(e) => setPSellRate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Amount Paid (₹)</label>
                  <input type="number" value={pPaid} onChange={(e) => setPPaid(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5 text-center" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">Purchase Date</label>
                <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} className="mt-1 w-full light-input rounded-lg py-1.5 px-2.5" required />
              </div>
              <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold py-2 rounded transition cursor-pointer">
                Log Bulk Purchase
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
