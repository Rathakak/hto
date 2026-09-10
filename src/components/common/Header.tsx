import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import {
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  BookOpen,
  Boxes,
  Users,
  BarChart3,
  Globe,
  Hash,
  Sun,
  Moon,
  Radio,
  Clock,
  LogOut,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { formatKhmerDate, toKhmerDigits } from '../../lib/khmer-date.ts';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    useKhmerDigits,
    setUseKhmerDigits,
    theme,
    setTheme,
    settings,
    currentStaff,
    allStaff,
    loginWithPin,
    logout,
    clockIn,
    clockOut,
    currentShiftId,
    sseConnected,
    toastMessage,
  } = useRestaurant();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      const ok = await loginWithPin(pinInput);
      if (ok) {
        setShowPinModal(false);
        setPinInput('');
      }
    }
  };

  const navItems = [
    {
      id: 'pos',
      labelKh: 'POS កម្មង់',
      labelEn: 'POS Terminal',
      icon: UtensilsCrossed,
      badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    },
    {
      id: 'kds',
      labelKh: 'ផ្ទះបាយ KDS',
      labelEn: 'Kitchen Display',
      icon: ChefHat,
      badgeColor: 'bg-red-500/20 text-red-500 border-red-500/30',
    },
    {
      id: 'tables',
      labelKh: 'គ្រប់គ្រងតុ',
      labelEn: 'Floor Plan',
      icon: LayoutGrid,
    },
    {
      id: 'menu',
      labelKh: 'មីនុយ',
      labelEn: 'Menu & 86',
      icon: BookOpen,
    },
    {
      id: 'inventory',
      labelKh: 'ស្តុក & Recipe',
      labelEn: 'Inventory',
      icon: Boxes,
    },
    {
      id: 'staff',
      labelKh: 'បុគ្គលិក',
      labelEn: 'Staff & Shift',
      icon: Users,
    },
    {
      id: 'reports',
      labelKh: 'របាយការណ៍',
      labelEn: 'Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <>
      <header
        id="app-header"
        className="w-full bg-[#171A1F] border-b border-[#262A31] text-[#F3F4F6] sticky top-0 z-40 select-none"
      >
        {/* Top bar with Branding and Controls */}
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          {/* Brand Logo & Name in Moul font */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E0913A] to-[#B86B1E] flex items-center justify-center text-white font-bold shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-moul text-base md:text-lg text-[#E0913A] tracking-wide leading-tight">
                {language === 'km' ? settings.nameKh : settings.nameEn}
              </h1>
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <span>{formatKhmerDate(new Date(), { includeTime: false, useKhmerDigits })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sseConnected ? 'bg-[#3FB68B] animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {sseConnected ? 'Realtime Live' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Utility Toggles & Staff Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Khmer / Arabic Digits Switcher */}
            <button
              id="toggle-digits-btn"
              onClick={() => setUseKhmerDigits(!useKhmerDigits)}
              title="ប្តូរលេខខ្មែរ / អន្តរជាតិ"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                useKhmerDigits
                  ? 'bg-[#E0913A]/20 text-[#E0913A] border-[#E0913A]/40'
                  : 'bg-[#20242B] text-[#9CA3AF] border-[#262A31] hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{useKhmerDigits ? 'លេខខ្មែរ (១២៣)' : 'Arabic (123)'}</span>
            </button>

            {/* Language Switcher */}
            <button
              id="toggle-lang-btn"
              onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#20242B] text-[#9CA3AF] hover:text-white border border-[#262A31] flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#E0913A]" />
              <span>{language === 'km' ? 'ភាសាខ្មែរ' : 'English'}</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              id="toggle-theme-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg bg-[#20242B] text-[#9CA3AF] hover:text-white border border-[#262A31] transition-all"
              title="ប្តូររចនាបថ Light / Dark"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Active Staff & Shift */}
            {currentStaff ? (
              <div className="flex items-center gap-2 bg-[#20242B] border border-[#262A31] px-3 py-1 rounded-xl">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    <span>{currentStaff.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#E0913A]/20 text-[#E0913A] rounded border border-[#E0913A]/30">
                      {currentStaff.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">
                    {currentShiftId ? (
                      <span className="text-emerald-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> កំពុងបំពេញវេន
                      </span>
                    ) : (
                      'មិនទាន់ចូលវេន'
                    )}
                  </div>
                </div>

                {/* Clock in/out button */}
                <button
                  id="shift-clock-btn"
                  onClick={currentShiftId ? clockOut : clockIn}
                  className={`p-1.5 rounded-lg text-xs font-medium border transition-all ${
                    currentShiftId
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                  title={currentShiftId ? 'បញ្ចប់វេន (Clock Out)' : 'ចូលវេន (Clock In)'}
                >
                  <Clock className="w-4 h-4" />
                </button>

                {/* Switch staff by PIN */}
                <button
                  id="switch-staff-btn"
                  onClick={() => setShowPinModal(true)}
                  className="p-1.5 rounded-lg bg-[#2A2E37] text-gray-300 hover:text-white border border-[#383E49]"
                  title="ប្តូរបុគ្គលិក / វាយ PIN"
                >
                  <KeyRound className="w-4 h-4 text-[#E0913A]" />
                </button>
              </div>
            ) : (
              <button
                id="login-staff-btn"
                onClick={() => setShowPinModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#E0913A] text-white text-xs font-semibold hover:bg-[#CC7E2A] flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ចូលប្រើតាម PIN</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-[#262A31]/80 py-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-h-[42px] ${
                  isActive
                    ? 'bg-[#E0913A] text-white font-semibold shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#20242B]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`} />
                <span>{language === 'km' ? item.labelKh : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast"
          className="fixed bottom-5 right-5 z-50 bg-[#171A1F] border border-[#E0913A]/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up"
        >
          <CheckCircle2 className="w-5 h-5 text-[#E0913A] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Quick 4-Digit Staff PIN Modal */}
      {showPinModal && (
        <div
          id="staff-pin-modal"
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#171A1F] border border-[#262A31] rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-[#E0913A]/20 border border-[#E0913A]/40 flex items-center justify-center mx-auto mb-3 text-[#E0913A]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">បញ្ចូលលេខកូដសម្ងាត់ PIN</h3>
              <p className="text-xs text-[#9CA3AF] mt-1">
                ជ្រើសរើសបុគ្គលិក ឬវាយលេខ PIN ៤ ខ្ទង់ដើម្បីចូលប្រើប្រព័ន្ធ
              </p>
            </div>

            {/* Quick staff picker */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {allStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => {
                    if (staff.pinCode) {
                      loginWithPin(staff.pinCode);
                      setShowPinModal(false);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-[#20242B] border border-[#262A31] hover:border-[#E0913A] text-left transition-all"
                >
                  <div className="text-xs font-semibold text-white truncate">{staff.name}</div>
                  <div className="text-[10px] text-[#E0913A]">{staff.role}</div>
                </button>
              ))}
            </div>

            {/* Manual PIN Input Pad */}
            <form onSubmit={handlePinSubmit}>
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="w-11 h-12 rounded-xl bg-[#20242B] border border-[#262A31] flex items-center justify-center text-xl font-bold text-[#E0913A]"
                  >
                    {pinInput[idx] ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Number Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pinInput.length < 4) setPinInput((prev) => prev + num);
                    }}
                    className="h-12 rounded-xl bg-[#20242B] border border-[#262A31] hover:bg-[#2A2E37] text-base font-bold active:scale-95 transition-all"
                  >
                    {useKhmerDigits ? toKhmerDigits(num) : num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinInput('')}
                  className="h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium"
                >
                  លុប (Clear)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) setPinInput((prev) => prev + '0');
                  }}
                  className="h-12 rounded-xl bg-[#20242B] border border-[#262A31] hover:bg-[#2A2E37] text-base font-bold active:scale-95 transition-all"
                >
                  {useKhmerDigits ? toKhmerDigits(0) : '0'}
                </button>
                <button
                  type="button"
                  onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                  className="h-12 rounded-xl bg-[#20242B] border border-[#262A31] hover:bg-[#2A2E37] text-xs font-medium text-gray-300"
                >
                  ←
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#20242B] hover:bg-[#2A2E37] text-xs font-medium text-[#9CA3AF]"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-[#E0913A] hover:bg-[#CC7E2A] text-xs font-bold disabled:opacity-50 transition-all"
                >
                  ចូលប្រើ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
