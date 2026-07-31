import { useState, useEffect } from 'react';
import { useUIStore, useAuthStore, useRateChartStore, useTranslation } from '../store';
import LanguageSelector from './LanguageSelector';
import { 
  Milk, 
  Users, 
  ShoppingBag, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calculator, 
  Layers,
  ChevronDown,
  Menu,
  X,
  CreditCard,
  Coins
} from 'lucide-react';

export default function LandingPage() {
  const setView = useUIStore((state) => state.setView);
  const setAuthModal = useUIStore((state) => state.setAuthModal);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const initialize = useAuthStore((state) => state.initialize);
  const calculateRate = useRateChartStore((state) => state.calculateRate);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'collection' | 'farmers' | 'rates' | 'feed'>('collection');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    initialize();
  }, []);

  // Mock states for interactive sections on the landing page
  const [demoFat, setDemoFat] = useState(4.2);
  const [demoSnf, setDemoSnf] = useState(8.7);
  const [demoQty, setDemoQty] = useState(12.5);
  const [demoMilkType, setDemoMilkType] = useState<'COW' | 'BUFFALO' | 'MIX'>('COW');

  const { rate, chartName } = calculateRate(demoMilkType, demoFat, demoSnf);
  const demoTotal = Number((demoQty * rate).toFixed(2));

  // Feature tab configurations
  const tabs = [
    { id: 'collection', label: t('landing', 'demoTabCollection'), icon: Milk },
    { id: 'farmers', label: t('landing', 'demoTabFarmers'), icon: Users },
    { id: 'rates', label: t('landing', 'demoTabRates'), icon: FileSpreadsheet },
    { id: 'feed', label: t('landing', 'demoTabFeed'), icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#091e42]">
      
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL HEADER (Atlassian Light Navigation)
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#dfe1e6]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo & Main Navigation */}
            <div className="flex items-center gap-8">
              <a href="#" className="flex items-center gap-2 text-[#091e42] font-display text-xl font-bold tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-[#0052cc] flex items-center justify-center shadow-md">
                  <Milk className="w-5 h-5 text-white" />
                </div>
                <span>Lacto<span className="text-[#0065ff]">Flow</span></span>
              </a>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-6">
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm font-semibold text-[#505f79] hover:text-[#091e42] transition cursor-pointer">
                    {t('nav', 'features')} <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
                  </button>
                  {/* Dropdown menu */}
                  <div className="absolute left-0 mt-2 w-64 bg-white border border-[#dfe1e6] rounded-xl shadow-xl p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition duration-200 translate-y-2 group-hover:translate-y-0 z-10">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('landing', 'recordMilkIntakeTitle')}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{t('landing', 'recordMilkIntakeDesc')}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('landing', 'farmerDirectoryTitle')}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{t('landing', 'farmerDirectoryDesc')}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('landing', 'feedInventoryTitle')}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{t('landing', 'feedInventoryDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm font-semibold text-[#505f79] hover:text-[#091e42] transition cursor-pointer">
                    {t('nav', 'rateSheets')} <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
                  </button>
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-[#dfe1e6] rounded-xl shadow-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition duration-200 translate-y-2 group-hover:translate-y-0 z-10">
                    <div className="space-y-2 text-xs">
                      <a href="#" className="block p-2 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-[#091e42] font-medium">{t('auth', 'fixedRate')}</a>
                      <a href="#" className="block p-2 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-[#091e42] font-medium">{t('auth', 'fatBasedOnly')}</a>
                      <a href="#" className="block p-2 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-[#091e42] font-medium">{t('auth', 'fatSnfBased')}</a>
                    </div>
                  </div>
                </div>

                <a href="#" className="text-sm font-semibold text-[#505f79] hover:text-[#091e42] transition">{t('nav', 'pricing')}</a>
                <a href="#" className="text-sm font-semibold text-[#505f79] hover:text-[#091e42] transition">{t('nav', 'caseStudies')}</a>
              </nav>
            </div>

            {/* Right Side: Search, Language, Profile/CTA */}
            <div className="hidden sm:flex items-center gap-4">
              
              {/* Search Bar Mock */}
              <div className="relative w-40 md:w-56">
                <input 
                  type="text" 
                  placeholder={t('nav', 'searchFarmers')} 
                  className="w-full bg-[#fafbfc] border border-[#dfe1e6] hover:border-gray-400 text-xs px-3 py-1.5 pl-8 rounded-lg focus:outline-none focus:border-brand-500 transition text-[#091e42] font-medium"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Language Switcher */}
              <LanguageSelector variant="light" />

              {user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="bg-[#0052cc] hover:bg-[#0747a6] text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    {t('nav', 'dashboard')}
                  </button>
                  <button 
                    onClick={logout}
                    className="border border-[#dfe1e6] hover:bg-gray-50 text-gray-500 hover:text-[#091e42] text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                  >
                    {t('nav', 'logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAuthModal(true, 'login')}
                    className="text-xs font-bold text-[#505f79] hover:text-[#091e42] px-3 py-2 transition cursor-pointer"
                  >
                    {t('nav', 'signIn')}
                  </button>
                  <button 
                    onClick={() => setAuthModal(true, 'register')}
                    className="bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-md cursor-pointer"
                  >
                    {t('nav', 'getStarted')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Burger Menu Button & Lang Selector */}
            <div className="flex items-center lg:hidden gap-2">
              <LanguageSelector variant="light" />
              <button 
                onClick={() => setAuthModal(true, 'register')}
                className="bg-[#0052cc] text-white text-xs px-3 py-1.5 rounded-lg font-bold transition"
              >
                {t('auth', 'signUp')}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg border border-[#dfe1e6] text-gray-500 hover:bg-gray-50 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#dfe1e6] bg-[#fafbfc] px-4 pt-2 pb-6 space-y-3 shadow-md">
            <a href="#" className="block py-2 text-sm text-[#505f79] hover:text-[#091e42] font-semibold">{t('nav', 'features')}</a>
            <a href="#" className="block py-2 text-sm text-[#505f79] hover:text-[#091e42] font-semibold">{t('nav', 'rateSheets')}</a>
            <a href="#" className="block py-2 text-sm text-[#505f79] hover:text-[#091e42] font-semibold">{t('nav', 'pricing')}</a>
            {user ? (
              <div className="pt-2 flex flex-col gap-2">
                <button 
                  onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                  className="bg-[#0052cc] text-center text-white py-2 rounded-lg text-sm font-semibold"
                >
                  {t('nav', 'dashboard')}
                </button>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="border border-[#dfe1e6] text-center text-gray-500 py-2 rounded-lg text-sm"
                >
                  {t('nav', 'logout')}
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <button 
                  onClick={() => { setAuthModal(true, 'login'); setMobileMenuOpen(false); }}
                  className="border border-[#dfe1e6] text-center text-[#505f79] py-2 rounded-lg text-sm font-semibold"
                >
                  {t('nav', 'signIn')}
                </button>
                <button 
                  onClick={() => { setAuthModal(true, 'register'); setMobileMenuOpen(false); }}
                  className="bg-[#0052cc] text-center text-white py-2 rounded-lg text-sm font-semibold"
                >
                  {t('nav', 'getStarted')}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-white">
        
        {/* Soft background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Small floating badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#deebff] border border-blue-100 px-3.5 py-1 rounded-full text-[#0747a6] text-xs font-bold tracking-wide mb-6">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0052cc]" /> {t('landing', 'heroBadge')}
        </div>

        {/* Big Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#091e42] max-w-4xl mx-auto leading-[1.1]">
          {t('landing', 'heroTitle1')} <br />
          <span className="text-[#0052cc]">
            {t('landing', 'heroTitleHighlight')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#505f79] max-w-2xl mx-auto font-normal leading-relaxed">
          {t('landing', 'heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={() => setAuthModal(true, 'register')}
            className="w-full sm:w-auto bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {t('landing', 'getStartedFree')}
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition" />
          </button>
          
          <button 
            onClick={() => {
              const el = document.getElementById('demo-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto border border-[#dfe1e6] hover:bg-gray-50 text-[#091e42] font-semibold text-sm px-8 py-3.5 rounded-xl transition cursor-pointer"
          >
            {t('landing', 'seeDemo')}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {t('landing', 'noCcRequired')}
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE TABS WORKSPACE (Light Theme matching image)
          ───────────────────────────────────────────────────────────── */}
      <section id="demo-section" className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        
        {/* The Capsule Tab bar (exactly matches screenshot capsule) */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex tab-capsule-bar p-1.5 rounded-full shadow-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'tab-btn-active' 
                      : 'tab-btn-inactive'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Panel Screen Mockup */}
        <div className="light-panel rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Header Bar decoration of the mockup window */}
          <div className="bg-[#f4f5f7] px-4 py-3 border-b border-[#dfe1e6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-[10px] text-gray-400 font-mono ml-4">workspace://lactoflow-dashboard/client</span>
            </div>
            <div className="text-[10px] bg-[#deebff] text-[#0747a6] font-bold px-2 py-0.5 rounded border border-blue-100">
              {t('landing', 'liveMockup')}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#fafbfc]">
            
            {/* 1. MILK COLLECTION TAB PREVIEW */}
            {activeTab === 'collection' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left explanation */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-2xl font-display font-bold text-[#091e42] leading-snug">
                    {t('landing', 'recordMilkIntakeTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {t('landing', 'recordMilkIntakeDesc')}
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'shiftSupport')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'fatValidationWarning')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'printReceipts')}</span>
                    </li>
                  </ul>
                </div>

                {/* Right Interactive Component */}
                <div className="lg:col-span-7 bg-white border border-[#dfe1e6] rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div className="text-xs font-bold text-[#091e42] uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#0052cc]" /> {t('landing', 'collectionCalculator')}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> {t('landing', 'activeChart')}: {chartName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'milkType')}</label>
                      <select 
                        value={demoMilkType} 
                        onChange={(e) => setDemoMilkType(e.target.value as any)}
                        className="mt-1 w-full bg-[#fafbfc] border border-[#dfe1e6] rounded-lg text-xs py-2 px-2.5 text-[#091e42] font-semibold outline-none focus:border-brand-500 transition"
                      >
                        <option value="COW">{t('landing', 'cow')}</option>
                        <option value="BUFFALO">{t('landing', 'buffalo')}</option>
                        <option value="MIX">{t('landing', 'mix')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'quantityLitres')}</label>
                      <input 
                        type="number" 
                        value={demoQty} 
                        onChange={(e) => setDemoQty(Number(e.target.value))}
                        className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'fatPercent')}</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={demoFat} 
                        onChange={(e) => setDemoFat(Number(e.target.value))}
                        className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'snfPercent')}</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={demoSnf} 
                        onChange={(e) => setDemoSnf(Number(e.target.value))}
                        className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5"
                      />
                    </div>
                  </div>

                  {/* Pricing Result */}
                  <div className="mt-5 bg-[#deebff] border border-blue-200 rounded-lg p-3.5 flex items-center justify-between text-[#0747a6]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block">{t('landing', 'computedPrice')}</span>
                      <span className="text-lg font-bold text-[#091e42]">₹{rate.toFixed(2)} <span className="text-xs text-gray-500 font-normal">{t('landing', 'perLitre')}</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">{t('landing', 'totalPayout')}</span>
                      <span className="text-xl font-black text-[#0052cc]">₹{demoTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FARMERS TAB PREVIEW */}
            {activeTab === 'farmers' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left explanation */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-2xl font-display font-bold text-[#091e42] leading-snug">
                    {t('landing', 'farmerDirectoryTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {t('landing', 'farmerDirectoryDesc')}
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'checkOutstandingAdvance')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'toggleActiveStatus')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'integratedLedger')}</span>
                    </li>
                  </ul>
                </div>

                {/* Right Mock List */}
                <div className="lg:col-span-7 bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="text-xs font-bold text-[#091e42] uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0052cc]" /> {t('landing', 'farmersLedgerView')}
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                    {[
                      { code: 101, name: 'Ramesh Patil', milk: 'COW', advance: 1200, status: 'Active' },
                      { code: 102, name: 'Suresh Deshmukh', milk: 'BUFFALO', advance: 0, status: 'Active' },
                      { code: 103, name: 'Vitthal Jadhav', milk: 'MIX', advance: 4500, status: 'Active' },
                    ].map((f) => (
                      <div key={f.code} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between text-xs hover:border-gray-400 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#deebff] flex items-center justify-center font-bold text-[#0052cc]">
                            {f.code}
                          </div>
                          <div>
                            <span className="font-bold text-[#091e42] block">{f.name}</span>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">{t('landing', 'prefers')}: {f.milk}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-bold">{t('landing', 'advanceBalance')}</span>
                          <span className={`font-bold ${f.advance > 1000 ? 'text-red-600' : 'text-gray-700'}`}>
                            ₹{f.advance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 3. RATES TAB PREVIEW */}
            {activeTab === 'rates' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left explanation */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-2xl font-display font-bold text-[#091e42] leading-snug">
                    {t('landing', 'rateSlabsTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {t('landing', 'rateSlabsDesc')}
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'cowBuffaloMixSheets')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'multipleActiveCharts')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'customizableSlabs')}</span>
                    </li>
                  </ul>
                </div>

                {/* Right Mock Grid */}
                <div className="lg:col-span-7 bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="text-xs font-bold text-[#091e42] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0052cc]" /> {t('landing', 'activeCowSlabs')}
                    </div>
                    <span className="text-[10px] text-green-700 font-bold px-2 py-0.5 bg-green-50 border border-green-200 rounded">Cow Rate Chart</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-400 text-[10px] font-bold uppercase">
                          <th className="py-2">{t('landing', 'fatRange')}</th>
                          <th className="py-2">{t('landing', 'snfRange')}</th>
                          <th className="py-2 text-right">{t('landing', 'pricePerLitre')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        <tr>
                          <td className="py-2 font-mono">3.0% - 3.4%</td>
                          <td className="py-2 font-mono">7.5% - 8.0%</td>
                          <td className="py-2 text-right font-bold text-[#091e42]">₹30.50</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">3.0% - 3.4%</td>
                          <td className="py-2 font-mono">8.1% - 8.5%</td>
                          <td className="py-2 text-right font-bold text-[#091e42]">₹32.00</td>
                        </tr>
                        <tr className="bg-[#deebff]/40">
                          <td className="py-2 font-mono text-[#0052cc] font-bold">3.5% - 3.9%</td>
                          <td className="py-2 font-mono text-[#0052cc] font-bold">8.0% - 8.5%</td>
                          <td className="py-2 text-right font-bold text-[#0052cc]">₹34.50</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">3.5% - 3.9%</td>
                          <td className="py-2 font-mono">8.6% - 9.0%</td>
                          <td className="py-2 text-right font-bold text-[#091e42]">₹36.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 4. FEED TAB PREVIEW */}
            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left explanation */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-2xl font-display font-bold text-[#091e42] leading-snug">
                    {t('landing', 'feedInventoryTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {t('landing', 'feedInventoryDesc')}
                  </p>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'trackBulkInventory')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'recordCustomerFeed')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{t('landing', 'linkedWithAccounts')}</span>
                    </li>
                  </ul>
                </div>

                {/* Right Mock Sales Input */}
                <div className="lg:col-span-7 bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-150 mb-3">
                    <div className="text-xs font-bold text-[#091e42] uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#0052cc]" /> {t('landing', 'bookFeedSale')}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('landing', 'stockLeft')}: 82 Bags left</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'itemName')}</span>
                      <span className="block mt-1 font-semibold text-[#091e42] bg-[#fafbfc] border border-[#dfe1e6] rounded-lg p-2">
                        Kapila Super Feed (50kg Bag)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'quantity')}</span>
                        <span className="block mt-1 font-bold text-[#091e42] bg-[#fafbfc] border border-[#dfe1e6] rounded-lg p-1.5 text-center">
                          2 Bags
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('landing', 'pricePerBag')}</span>
                        <span className="block mt-1 font-bold text-[#091e42] bg-[#fafbfc] border border-[#dfe1e6] rounded-lg p-1.5 text-center">
                          ₹1,600.00
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">{t('landing', 'chargedToLedger')}</span>
                        <span className="text-xs text-red-500 font-bold">{t('landing', 'yesAutoDeduct')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">{t('landing', 'totalSale')}</span>
                        <span className="text-base font-extrabold text-[#091e42]">₹3,200.00</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          WHY CHOOSE US (Features & Value Propositions)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafbfc] relative border-t border-[#dfe1e6]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-[#091e42]">
              {t('landing', 'whyChooseUsTitle')}
            </h2>
            <p className="mt-4 text-sm text-[#505f79] font-medium">
              {t('landing', 'whyChooseUsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white border border-[#dfe1e6] p-6 rounded-2xl hover:shadow-lg transition duration-300 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#deebff] flex items-center justify-center text-[#0052cc] shadow-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#091e42] font-display">{t('landing', 'instantFatSnfTitle')}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                {t('landing', 'instantFatSnfDesc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-[#dfe1e6] p-6 rounded-2xl hover:shadow-lg transition duration-300 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#deebff] flex items-center justify-center text-[#0052cc] shadow-sm">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#091e42] font-display">{t('landing', 'advanceDeductionsTitle')}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                {t('landing', 'advanceDeductionsDesc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-[#dfe1e6] p-6 rounded-2xl hover:shadow-lg transition duration-300 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#deebff] flex items-center justify-center text-[#0052cc] shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#091e42] font-display">{t('landing', 'paymentSettleWizardTitle')}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                {t('landing', 'paymentSettleWizardDesc')}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#dfe1e6] py-12 text-center text-xs text-[#505f79] font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0052cc] flex items-center justify-center">
              <Milk className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#091e42]">{t('landing', 'footerBrand')}</span>
          </div>
          <p>© {new Date().getFullYear()} {t('landing', 'allRightsReserved')}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#091e42] transition">{t('landing', 'terms')}</a>
            <a href="#" className="hover:text-[#091e42] transition">{t('landing', 'privacy')}</a>
            <a href="#" className="hover:text-[#091e42] transition">{t('landing', 'support')}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
