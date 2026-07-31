import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../store';
import type { Language } from '../i18n/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'light' | 'dark' | 'minimal';
}

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

export default function LanguageSelector({ variant = 'light' }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonStyles = () => {
    switch (variant) {
      case 'dark':
        return 'bg-[#172b4d] hover:bg-[#091e42] text-white border-blue-900/40';
      case 'minimal':
        return 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent';
      case 'light':
      default:
        return 'bg-white hover:bg-gray-50 text-[#091e42] border-[#dfe1e6] shadow-sm';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${getButtonStyles()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-3.5 h-3.5 text-[#0052cc]" />
        <span className="font-bold">{currentLangObj.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-[#dfe1e6] shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 mb-1 border-b border-gray-100">
            Select Language
          </div>
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#deebff] text-[#0747a6] font-bold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#091e42] font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.nativeName}</span>
                  {lang.code !== 'en' && (
                    <span className="text-[10px] text-gray-400 font-normal">({lang.name})</span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0052cc]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
