import { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export type CardTheme = 'white' | 'dark';
export type ColorFilter = 'none' | 'gold' | 'monochrome' | 'vibrant' | 'cool';

interface PhaseCompletionInfo {
  phaseKey: string;
  titleKey: string;
  completedCount: number;
  totalCount: number;
  isUnlocked: boolean; // true ONLY when completedCount === totalCount && totalCount > 0
}

interface DigitalPassCardProps {
  phaseInfos: PhaseCompletionInfo[];
  totalMissionsCompleted: number;
  totalMissionsCount: number;
}

interface ThemeConfig {
  id: CardTheme;
  name: string;
  bgImage: string;
  isDarkTheme: boolean;
  border: string;
  textColor: string;
  subtextColor: string;
  circleBorder: string;
  circleLockedBg: string;
  circleLockedText: string;
  radialGradientCss: string;
  canvasRadialColors: [string, string, string];
  canvasTextFill: string;
  canvasSubtextFill: string;
}

interface FilterConfig {
  id: ColorFilter;
  name: string;
  cssFilter: string;
  canvasFilter: string;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'white',
    name: 'Pearl White',
    bgImage: '/card-white.jpg',
    isDarkTheme: false,
    border: 'border-slate-300/90 shadow-slate-900/20 ring-1 ring-white/60',
    textColor: 'text-slate-950',
    subtextColor: 'text-slate-800 font-bold',
    circleBorder: 'border-2 border-slate-700/90 shadow-[0_0_12px_rgba(15,23,42,0.25)] bg-slate-900/5',
    circleLockedBg: 'bg-slate-100/80 backdrop-blur-md',
    circleLockedText: 'text-slate-950',
    radialGradientCss: 'radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.9) 50%, rgba(203, 213, 225, 0.95) 100%)',
    canvasRadialColors: ['#ffffff', '#f8fafc', '#cbd5e1'],
    canvasTextFill: '#020617',
    canvasSubtextFill: '#1e293b',
  },
  {
    id: 'dark',
    name: 'Prada Dark',
    bgImage: '/card-dark.jpg',
    isDarkTheme: true,
    border: 'border-slate-700/80 shadow-black/90 ring-1 ring-white/10',
    textColor: 'text-white',
    subtextColor: 'text-slate-200 font-semibold',
    circleBorder: 'border-2 border-white/90 shadow-[0_0_12px_rgba(255,255,255,0.5)]',
    circleLockedBg: 'bg-black/50 backdrop-blur-md',
    circleLockedText: 'text-white',
    radialGradientCss: 'radial-gradient(circle at 50% 45%, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 55%, rgba(2, 6, 23, 1) 100%)',
    canvasRadialColors: ['#1e293b', '#0f172a', '#020617'],
    canvasTextFill: '#ffffff',
    canvasSubtextFill: 'rgba(255, 255, 255, 0.9)',
  },
];

const COLOR_FILTERS: FilterConfig[] = [
  { id: 'none', name: 'ปกติ', cssFilter: 'none', canvasFilter: 'none' },
  { id: 'gold', name: 'โทนทอง', cssFilter: 'sepia(40%) contrast(115%) brightness(105%) hue-rotate(-15deg)', canvasFilter: 'sepia(40%) contrast(115%) brightness(105%) hue-rotate(-15deg)' },
  { id: 'monochrome', name: 'ขาวดำ', cssFilter: 'grayscale(100%) contrast(125%) brightness(95%)', canvasFilter: 'grayscale(100%) contrast(125%) brightness(95%)' },
  { id: 'vibrant', name: 'สีสด', cssFilter: 'saturate(160%) contrast(110%)', canvasFilter: 'saturate(160%) contrast(110%)' },
  { id: 'cool', name: 'ฟ้าเย็น', cssFilter: 'hue-rotate(150deg) saturate(115%)', canvasFilter: 'hue-rotate(150deg) saturate(115%)' },
];

export default function DigitalPassCard({
  phaseInfos,
  totalMissionsCompleted,
  totalMissionsCount,
}: DigitalPassCardProps) {
  const { t } = useLanguage();

  // Load saved name, theme, and color filter from localStorage
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('prada_card_user_name') || t('defaultCardName');
  });
  const [inputName, setInputName] = useState(userName);
  const [cardTheme, setCardTheme] = useState<CardTheme>(() => {
    const saved = localStorage.getItem('prada_card_theme') as CardTheme;
    if (saved && ['dark', 'white'].includes(saved)) {
      return saved;
    }
    return 'white';
  });

  const [colorFilter, setColorFilter] = useState<ColorFilter>(() => {
    const saved = localStorage.getItem('prada_card_filter') as ColorFilter;
    if (saved && ['none', 'gold', 'monochrome', 'vibrant', 'cool'].includes(saved)) {
      return saved;
    }
    return 'none';
  });

  // Toggle Card Customization Control Drawer (Default false: show card only)
  const [showControls, setShowControls] = useState<boolean>(false);

  // 3D Parallax Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glossX: 50, glossY: 50, isHovered: false });

  useEffect(() => {
    localStorage.setItem('prada_card_user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('prada_card_theme', cardTheme);
  }, [cardTheme]);

  useEffect(() => {
    localStorage.setItem('prada_card_filter', colorFilter);
  }, [colorFilter]);

  const activeTheme = THEMES.find(t => t.id === cardTheme) || THEMES[0];
  const activeFilter = COLOR_FILTERS.find(f => f.id === colorFilter) || COLOR_FILTERS[0];

  const handleSaveName = () => {
    const trimmed = inputName.trim();
    if (trimmed) {
      setUserName(trimmed);
    }
  };

  // Handle 3D Tilt calculation
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    const glossX = (x / rect.width) * 100;
    const glossY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glossX, glossY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glossX: 50, glossY: 50, isHovered: false });
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || !e.touches[0]) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({ rotateX, rotateY, glossX: (x / rect.width) * 100, glossY: (y / rect.height) * 100, isHovered: true });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* ── CARD DISPLAY WITH RADIAL GRADIENT & THEME STYLING ── */}
      <div
        className="perspective-1000 w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
      >
        <div
          ref={cardRef}
          style={{
            transform: tilt.isHovered
              ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: tilt.isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-in-out',
          }}
          className={`relative w-full rounded-3xl aspect-[1.28/1] sm:aspect-[1.42/1] min-h-[295px] sm:min-h-[330px] p-3 sm:p-4 border ${activeTheme.border} shadow-2xl overflow-hidden select-none transition-all duration-300 flex flex-col justify-between items-center`}
        >
          {/* Card Radial Gradient Background + Image Filter Support */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              style={{ background: activeTheme.radialGradientCss }}
              className="absolute inset-0 transition-all duration-500"
            />
            <img
              src={activeTheme.bgImage}
              alt={activeTheme.name}
              style={{ filter: activeFilter.cssFilter }}
              className={`w-full h-full object-cover object-center transition-all duration-500 mix-blend-overlay ${
                activeTheme.isDarkTheme ? 'opacity-45 brightness-90' : 'opacity-40'
              }`}
            />
            {/* Overlay of /tablet.jpg with rich deep dark intensity */}
            <img
              src="/tablet.jpg"
              alt="Tablet Texture Overlay"
              style={{ filter: activeFilter.cssFilter }}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 pointer-events-none ${
                activeTheme.isDarkTheme
                  ? 'opacity-48 mix-blend-overlay contrast-125'
                  : 'opacity-45 mix-blend-multiply'
              }`}
            />
          </div>

          {/* Holographic Light Sheen Effect */}
          {tilt.isHovered && (
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${tilt.glossX}% ${tilt.glossY}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)`,
              }}
            />
          )}

          {/* ── CARD CONTENT CONTAINER ── */}
          <div className="relative z-20 w-full h-full flex flex-col justify-between p-1 sm:p-1.5">
            {/* ── TOP HEADER SECTION: LEFT (NAME & LOYALTY CARD) | RIGHT (BRAND & EVENT DETAILS) ── */}
            <div className="w-full flex items-start justify-between gap-2">
              {/* Left Column: Top-Left Name & Loyalty Card */}
              <div className={`flex flex-col items-start text-left max-w-[55%] ${activeTheme.textColor}`}>
                <span className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-md leading-tight break-words">
                  {userName}
                </span>
                <div className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase opacity-90 mt-0.5 flex items-center gap-1.5 ${activeTheme.subtextColor}`}>
                  <span>Loyalty Card</span>
                  {totalMissionsCount > 0 && totalMissionsCompleted === totalMissionsCount && (
                    <span className="text-[7.5px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded-full shadow-xs">VIP 👑</span>
                  )}
                </div>
              </div>

              {/* Right Column: Brand & Fashion Show Details */}
              <div className={`flex flex-col items-end text-right ${activeTheme.textColor}`}>
                <div className="font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1 drop-shadow-xs">
                  <span>PRADA</span>
                  <span className="opacity-70 text-[10px]">×</span>
                  <span>Namtan</span>
                </div>
                <span className="text-[8px] sm:text-[10px] font-semibold tracking-wide opacity-90 leading-tight">
                  Spring/Summer 2027
                </span>
                <span className="text-[8px] sm:text-[10px] font-semibold tracking-wide opacity-90 leading-tight">
                  Womenswear Fashion Show
                </span>
                <span className="text-[7.5px] sm:text-[9.5px] font-medium tracking-tight opacity-80 leading-tight">
                  Milan, September 22nd.
                </span>
              </div>
            </div>

            {/* ── BOTTOM STAMPS ROW (STAMP 1, STAMP 2, STAMP 3) ── */}
            <div className="w-full pb-0.5">
              <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-[380px] sm:max-w-[460px] mx-auto">
                {phaseInfos.map((phase, idx) => {
                  const pct = phase.totalCount > 0 ? Math.floor((phase.completedCount / phase.totalCount) * 100) : 0;
                  const isUnlocked = phase.isUnlocked;
                  const remainingTasks = Math.max(0, phase.totalCount - phase.completedCount);

                  const missionLabels = [
                    'Mission 1 : pre',
                    'Mission 2 : Fashion Show',
                    'Mission 3 : afterglow'
                  ];
                  const missionLabel = missionLabels[idx] || `Mission ${idx + 1}`;

                  return (
                    <div key={phase.phaseKey} className="flex flex-col items-center gap-0.5 text-center">
                      {/* Stamp Slot Container (Border & circle bg only shown when locked) */}
                      <div
                        style={!isUnlocked ? { clipPath: 'circle(50% at 50% 50%)' } : undefined}
                        className={`relative w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 flex items-center justify-center transition-all duration-300 ${
                          isUnlocked
                            ? 'scale-105'
                            : `rounded-full border-2 border-current/40 ${activeTheme.circleLockedBg} ${activeTheme.circleLockedText} overflow-hidden`
                        }`}
                      >
                        {isUnlocked ? (
                          <div className="w-full h-full p-0 flex items-center justify-center animate-bounce-short">
                            {activeTheme.isDarkTheme ? (
                              <div
                                style={{
                                  maskImage: `url(/Stamp-${idx + 1}.png)`,
                                  WebkitMaskImage: `url(/Stamp-${idx + 1}.png)`,
                                  maskSize: 'contain',
                                  WebkitMaskSize: 'contain',
                                  maskRepeat: 'no-repeat',
                                  WebkitMaskRepeat: 'no-repeat',
                                  maskPosition: 'center',
                                  WebkitMaskPosition: 'center',
                                  backgroundColor: '#ffffff',
                                }}
                                className="w-full h-full filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                              />
                            ) : (
                              <img
                                src={`/Stamp-${idx + 1}.png`}
                                alt={`Stamp ${idx + 1}`}
                                className="w-full h-full object-contain filter drop-shadow-md"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-center p-1 select-none">
                            <span className={`text-xs sm:text-sm font-black tracking-tight leading-none ${activeTheme.textColor}`}>
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mission Label under Stamp */}
                      <span className={`text-[7.5px] sm:text-[9px] font-black tracking-tight text-center drop-shadow-xs leading-tight ${activeTheme.textColor}`}>
                        {missionLabel}
                      </span>

                      {/* Remaining Tasks & Progress Status (Only shown when not unlocked) */}
                      {!isUnlocked && (
                        <span className={`text-[6.5px] sm:text-[8px] font-bold opacity-85 leading-tight ${activeTheme.subtextColor}`}>
                          {phase.completedCount}/{phase.totalCount} {remainingTasks > 0 ? `(อีก ${remainingTasks})` : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── ACTION BUTTONS BAR (ALWAYS VISIBLE BELOW CARD) ── */}
      <div className="flex items-center justify-center mt-1">
        {/* Toggle Customize Card Settings Button */}
        <button
          onClick={() => setShowControls(!showControls)}
          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            showControls
              ? 'bg-prada-charcoal text-white border-prada-charcoal shadow-md ring-2 ring-amber-400/50'
              : 'bg-white hover:bg-slate-50 text-prada-charcoal border-prada-warm/40 shadow-sm'
          }`}
          title="ปรับแต่งสีและธีมการ์ด"
        >
          <span>🎨</span>
          <span>{showControls ? 'ซ่อนเมนูปรับแต่งการ์ด ▲' : 'ปรับแต่งสี & ธีมการ์ด ▼'}</span>
        </button>
      </div>

      {/* ── EXPANDABLE CUSTOMIZATION DRAWER (EXPANDS WHEN CLICKED) ── */}
      {showControls && (
        <div className="flex flex-col gap-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-prada-warm/30 shadow-lg animate-fade-in transition-all">
          {/* Edit Display Name Field */}
          <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <span>✏️</span>
              <span>แก้ไขชื่อของคุณบนการ์ด (Display Name)</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  setUserName(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="พิมพ์ชื่อของคุณ..."
                className="flex-1 px-3 py-1.5 text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>

          {/* Theme Selector Pills (2 Themes: Pearl White & Prada Dark) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-prada-charcoal/70 uppercase tracking-wider flex items-center gap-1">
              <span>🖼️</span>
              <span>เลือกธีมสีการ์ด ({t('cardThemeLabel')})</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setCardTheme(theme.id)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    cardTheme === theme.id
                      ? 'bg-prada-charcoal text-white border-prada-charcoal shadow-md scale-105 ring-2 ring-prada-gold/50'
                      : 'bg-white text-prada-charcoal/80 border-prada-warm/40 hover:bg-prada-cream'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/20 overflow-hidden shrink-0"
                    style={{ backgroundImage: `url(${theme.bgImage})`, backgroundSize: 'cover' }}
                  />
                  <span className="truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter Pills */}
          <div className="flex flex-col gap-1 mt-0.5">
            <span className="text-[10px] font-bold text-prada-charcoal/70 uppercase tracking-wider flex items-center gap-1">
              <span>🎨</span>
              <span>ปรับฟิลเตอร์การ์ด (Card Filter)</span>
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {COLOR_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setColorFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all border shrink-0 ${
                    colorFilter === filter.id
                      ? 'bg-amber-500 text-black border-amber-600 shadow-sm scale-105'
                      : 'bg-white/90 text-prada-charcoal border-prada-warm/30 hover:bg-prada-cream'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
