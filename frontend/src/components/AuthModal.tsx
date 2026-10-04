import { useState, useEffect } from 'react';
import { useUIStore, useAuthStore, useTranslation } from '../store';
import LanguageSelector from './LanguageSelector';
import { X, Lock, Phone, User, Building, MapPin, Settings2, ShieldCheck, RotateCcw, ChevronLeft } from 'lucide-react';
import OtpInput from './OtpInput';
import { clearRecaptchaVerifier } from '../utils/firebase';

export default function AuthModal() {
  const authModalOpen = useUIStore((state) => state.authModalOpen);
  const authModalMode = useUIStore((state) => state.authModalMode);
  const setAuthModal = useUIStore((state) => state.setAuthModal);
  const setView = useUIStore((state) => state.setView);
  const { t } = useTranslation();

  const login = useAuthStore((state) => state.login);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const confirmOtp = useAuthStore((state) => state.confirmOtp);
  const register = useAuthStore((state) => state.register);
  const registrationProgress = useAuthStore((state) => state.registrationProgress);
  const tempMobile = useAuthStore((state) => state.tempMobile);
  const authStatus = useAuthStore((state) => state.status);
  const isLoading = authStatus === 'loading';
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const resetToPhoneStep = useAuthStore((state) => state.resetToPhoneStep);

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Register Step 1 (phone) ───────────────────────────────────────────
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');

  // ── Register Step 2 (OTP) ────────────────────────────────────────────
  const [otp, setOtp] = useState('');

  // ── Register Step 3 (details) ─────────────────────────────────────────
  const [regPassword, setRegPassword] = useState('');
  const [regDairyName, setRegDairyName] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regTaluka, setRegTaluka] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regState, setRegState] = useState('');
  const [regCollectionType, setRegCollectionType] = useState<'FIXED_RATE' | 'FAT_BASED' | 'FAT_SNF_BASED'>('FAT_SNF_BASED');
  const [regMilkType, setRegMilkType] = useState<'COW' | 'BUFFALO' | 'MIX'>('MIX');
  const [regCollectionShift, setRegCollectionShift] = useState<'MORNING' | 'EVENING' | 'BOTH'>('BOTH');
  const [regPaymentPeriod, setRegPaymentPeriod] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModal(false);
    clearError();
    clearRecaptchaVerifier();
  };

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = loginMobile.replace(/\D/g, '');
    if (digits.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    const success = await login(loginMobile, loginPassword);
    if (success) {
      setAuthModal(false);
      setView('dashboard');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regName.trim().length < 2) {
      alert('Owner name must be at least 2 characters');
      return;
    }
    const digits = regMobile.replace(/\D/g, '');
    if (digits.length < 10) {
      alert('Enter a valid 10-digit mobile number');
      return;
    }
    await sendOtp(regName.trim(), regMobile);
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      alert('Please enter all 6 digits of the OTP');
      return;
    }
    const success = await confirmOtp(otp);
    if (!success) setOtp('');
  };

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (!regDairyName || !regVillage || !regTaluka || !regDistrict || !regState) {
      alert('Please fill out all address and dairy name fields');
      return;
    }
    const success = await register({
      dairyName: regDairyName,
      village: regVillage,
      taluka: regTaluka,
      district: regDistrict,
      state: regState,
      collectionType: regCollectionType,
      milkType: regMilkType,
      collectionShift: regCollectionShift,
      paymentPeriod: regPaymentPeriod,
      password: regPassword,
    });
    if (success) {
      setAuthModal(false);
      setView('dashboard');
    }
  };

  // ── Step indicators ───────────────────────────────────────────────────

  const steps = [
    { label: t('auth', 'stepPhone'), key: 'phone' },
    { label: t('auth', 'stepOtp'), key: 'otp' },
    { label: t('auth', 'stepDetails'), key: 'details' },
  ];
  const stepIndex = steps.findIndex((s) => s.key === registrationProgress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-[#091e42]/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white border border-[#dfe1e6] rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dfe1e6] bg-[#f4f5f7]">
          <h3 className="text-sm font-bold text-[#091e42] font-display">
            {authModalMode === 'login' ? t('auth', 'signInTitle') : t('auth', 'registerTitle')}
          </h3>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            <button
              onClick={handleClose}
              className="p-1 rounded-lg border border-[#dfe1e6] text-gray-500 hover:text-black transition cursor-pointer font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Box */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold flex items-start gap-2">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================
            LOGIN MODE
        ============================================================ */}
        {authModalMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('auth', 'mobileNumber')}
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold select-none">+91</span>
                <input
                  type="tel"
                  value={loginMobile}
                  onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full light-input rounded-lg text-xs py-2.5 px-3 pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('auth', 'password')}</label>
              <div className="relative mt-1">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full light-input rounded-lg text-xs py-2.5 px-3 pl-9"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-3 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : t('auth', 'logIn')}
            </button>

            <div className="text-center pt-2 text-xs text-gray-500 font-semibold">
              {t('auth', 'dontHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => { clearError(); setAuthModal(true, 'register'); }}
                className="text-[#0052cc] font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                {t('auth', 'signUp')}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================
            REGISTER MODE
        ============================================================ */}
        {authModalMode === 'register' && (
          <div className="p-6">

            {/* Step progress breadcrumbs */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((step, i) => (
                <div key={step.key} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={[
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                        i < stepIndex
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : i === stepIndex
                          ? 'bg-[#0052cc] text-white'
                          : 'bg-gray-100 text-gray-400',
                      ].join(' ')}
                    >
                      {i < stepIndex ? '✓' : i + 1}
                    </span>
                    <span
                      className={[
                        'text-xs font-bold whitespace-nowrap',
                        i === stepIndex ? 'text-[#091e42]' : 'text-gray-400',
                      ].join(' ')}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px ${i < stepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── STEP 1: PHONE ── */}
            {registrationProgress === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('auth', 'ownerFullName')}</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Aditya Supekar"
                      className="w-full light-input rounded-lg text-xs py-2.5 px-3 pl-9"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('auth', 'mobileNumber')}</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold select-none">+91</span>
                    <input
                      type="tel"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone number"
                      className="w-full light-input rounded-lg text-xs py-2.5 px-3 pl-11"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-3 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5" />
                      {t('auth', 'sendOtp')}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP ── */}
            {registrationProgress === 'otp' && (
              <form onSubmit={handleConfirmOtp} className="space-y-5 text-xs">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#deebff] mb-2">
                    <ShieldCheck className="w-6 h-6 text-[#0052cc]" />
                  </div>
                  <p className="text-[#091e42] font-bold text-sm">{t('auth', 'enterOtp')}</p>
                  <p className="text-gray-500 text-xs">
                    {t('auth', 'otpSentTo')}{' '}
                    <span className="font-bold text-[#091e42]">{tempMobile}</span>
                  </p>
                </div>

                <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-3 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('auth', 'verifyOtp')}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setOtp(''); resetToPhoneStep(); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-[#0052cc] font-semibold bg-transparent border-0 cursor-pointer transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    {t('auth', 'changeNumber')}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setOtp(''); clearError(); sendOtp(regName, regMobile); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-[#0052cc] font-semibold bg-transparent border-0 cursor-pointer disabled:opacity-50 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('auth', 'resendOtp')}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: DETAILS ── */}
            {registrationProgress === 'details' && (
              <form onSubmit={handleRegisterDetails} className="space-y-4 max-h-[420px] overflow-y-auto pr-1 text-xs">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('auth', 'dairyName')}</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={regDairyName}
                        onChange={(e) => setRegDairyName(e.target.value)}
                        placeholder="e.g. Gokul Cooperative"
                        className="w-full light-input rounded-lg text-xs py-2 px-2.5 pl-8"
                        required
                      />
                      <Building className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('auth', 'passwordMin')}</label>
                    <div className="relative mt-1">
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full light-input rounded-lg text-xs py-2 px-2.5 pl-8"
                        required
                        minLength={8}
                      />
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 p-3 border border-gray-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#0052cc]" /> {t('auth', 'locationInfo')}
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t('auth', 'village'), val: regVillage, set: setRegVillage, placeholder: t('auth', 'village') },
                      { label: t('auth', 'taluka'), val: regTaluka, set: setRegTaluka, placeholder: t('auth', 'taluka') },
                      { label: t('auth', 'district'), val: regDistrict, set: setRegDistrict, placeholder: t('auth', 'district') },
                      { label: t('auth', 'state'), val: regState, set: setRegState, placeholder: t('auth', 'state') },
                    ].map(({ label, val, set: setter, placeholder }) => (
                      <div key={label}>
                        <label className="block text-[10px] text-gray-500 font-bold">{label}</label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={placeholder}
                          className="mt-1 w-full light-input rounded-lg text-xs py-1.5 px-2.5"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dairy Configurations */}
                <div className="bg-gray-50 p-3 border border-gray-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Settings2 className="w-3 h-3 text-[#0052cc]" /> {t('auth', 'dairyConfig')}
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold">{t('auth', 'pricingModel')}</label>
                      <select
                        value={regCollectionType}
                        onChange={(e) => setRegCollectionType(e.target.value as typeof regCollectionType)}
                        className="mt-1 w-full light-input rounded-lg py-1.5 px-2 font-semibold"
                      >
                        <option value="FAT_SNF_BASED">{t('auth', 'fatSnfBased')}</option>
                        <option value="FAT_BASED">{t('auth', 'fatBasedOnly')}</option>
                        <option value="FIXED_RATE">{t('auth', 'fixedRate')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold">{t('auth', 'supportedMilk')}</label>
                      <select
                        value={regMilkType}
                        onChange={(e) => setRegMilkType(e.target.value as typeof regMilkType)}
                        className="mt-1 w-full light-input rounded-lg py-1.5 px-2 font-semibold"
                      >
                        <option value="COW">{t('auth', 'cowOnly')}</option>
                        <option value="BUFFALO">{t('auth', 'buffaloOnly')}</option>
                        <option value="MIX">{t('auth', 'mixBoth')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold">{t('auth', 'collectionShift')}</label>
                      <select
                        value={regCollectionShift}
                        onChange={(e) => setRegCollectionShift(e.target.value as typeof regCollectionShift)}
                        className="mt-1 w-full light-input rounded-lg py-1.5 px-2 font-semibold"
                      >
                        <option value="BOTH">{t('auth', 'bothShifts')}</option>
                        <option value="MORNING">{t('auth', 'morningOnly')}</option>
                        <option value="EVENING">{t('auth', 'eveningOnly')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold">{t('auth', 'settlementCycle')}</label>
                      <select
                        value={regPaymentPeriod}
                        onChange={(e) => setRegPaymentPeriod(e.target.value as typeof regPaymentPeriod)}
                        className="mt-1 w-full light-input rounded-lg py-1.5 px-2 font-semibold"
                      >
                        <option value="WEEKLY">{t('auth', 'weeklyCycle')}</option>
                        <option value="BIWEEKLY">{t('auth', 'biweeklyCycle')}</option>
                        <option value="MONTHLY">{t('auth', 'monthlyCycle')}</option>
                        <option value="DAILY">{t('auth', 'dailyCycle')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white font-bold text-xs py-3 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : t('auth', 'completeRegistration')}
                </button>
              </form>
            )}

            {/* Switch to login */}
            <div className="text-center pt-3 text-xs text-gray-500 border-t border-gray-200 mt-4 font-semibold">
              {t('auth', 'alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => { clearError(); setAuthModal(true, 'login'); }}
                className="text-[#0052cc] font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                {t('auth', 'logIn')}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
