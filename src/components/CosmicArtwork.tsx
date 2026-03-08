type CosmicBackdropProps = {
  variant: 'landing' | 'roadmap' | 'shop';
  className?: string;
};

type GlyphProps = {
  className?: string;
};

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function CosmicBackdrop({ variant, className }: CosmicBackdropProps) {
  const theme = {
    landing: {
      base: 'bg-[radial-gradient(176%_148%_at_12%_-4%,#2563a7_0%,#163971_26%,#0b1d44_52%,#040713_100%)]',
      stars: '[background-image:radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.86)_1px,transparent_1.2px),radial-gradient(circle_at_72%_24%,rgba(186,230,253,0.62)_1px,transparent_1.3px),radial-gradient(circle_at_62%_74%,rgba(252,211,77,0.54)_1px,transparent_1.4px),radial-gradient(circle_at_32%_62%,rgba(255,255,255,0.22)_0.8px,transparent_1.1px)] [background-size:150px_150px,220px_220px,280px_280px,90px_90px]',
      haze: 'bg-[radial-gradient(circle_at_8%_26%,rgba(14,165,233,0.26),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_74%_72%,rgba(245,158,11,0.2),transparent_40%),radial-gradient(circle_at_36%_82%,rgba(59,130,246,0.16),transparent_36%)]',
      leftOrb: 'bg-sky-300/22',
      rightOrb: 'bg-amber-300/18',
      beam: 'bg-[linear-gradient(118deg,transparent_0%,rgba(125,211,252,0.06)_20%,rgba(186,230,253,0.12)_46%,rgba(253,224,71,0.08)_74%,transparent_100%)]',
    },
    roadmap: {
      base: 'bg-[radial-gradient(180%_176%_at_8%_2%,#24518a_0%,#173762_24%,#0c2148_54%,#050916_100%)]',
      stars: '[background-image:radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.86)_1px,transparent_1.2px),radial-gradient(circle_at_84%_18%,rgba(125,211,252,0.64)_1px,transparent_1.3px),radial-gradient(circle_at_66%_76%,rgba(148,163,184,0.56)_1px,transparent_1.4px),radial-gradient(circle_at_36%_58%,rgba(255,255,255,0.2)_0.8px,transparent_1.2px)] [background-size:170px_170px,230px_230px,310px_310px,92px_92px]',
      haze: 'bg-[radial-gradient(circle_at_16%_22%,rgba(34,211,238,0.26),transparent_38%),radial-gradient(circle_at_82%_66%,rgba(59,130,246,0.2),transparent_38%),radial-gradient(circle_at_52%_16%,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_50%_86%,rgba(16,185,129,0.12),transparent_34%)]',
      leftOrb: 'bg-cyan-300/22',
      rightOrb: 'bg-blue-300/18',
      beam: 'bg-[linear-gradient(112deg,transparent_0%,rgba(56,189,248,0.06)_18%,rgba(125,211,252,0.14)_50%,rgba(59,130,246,0.08)_82%,transparent_100%)]',
    },
    shop: {
      base: 'bg-[radial-gradient(156%_160%_at_50%_0%,#1d548b_0%,#153c70_24%,#0c234b_52%,#050917_100%)]',
      stars: '[background-image:radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.82)_1px,transparent_1.2px),radial-gradient(circle_at_82%_26%,rgba(125,211,252,0.62)_1px,transparent_1.3px),radial-gradient(circle_at_46%_76%,rgba(251,191,36,0.52)_1px,transparent_1.4px),radial-gradient(circle_at_64%_50%,rgba(255,255,255,0.2)_0.8px,transparent_1.1px)] [background-size:150px_150px,220px_220px,300px_300px,90px_90px]',
      haze: 'bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.24),transparent_38%),radial-gradient(circle_at_84%_70%,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_18%_78%,rgba(245,158,11,0.18),transparent_34%)]',
      leftOrb: 'bg-cyan-300/20',
      rightOrb: 'bg-amber-300/16',
      beam: 'bg-[linear-gradient(122deg,transparent_0%,rgba(56,189,248,0.06)_22%,rgba(250,204,21,0.08)_52%,rgba(59,130,246,0.05)_82%,transparent_100%)]',
    },
  }[variant];

  return (
    <div className={joinClassNames('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className={joinClassNames('absolute inset-0', theme.base)} />
      <div className={joinClassNames('absolute inset-0 opacity-70', theme.stars)} />
      <div className={joinClassNames('absolute inset-0', theme.haze)} />
      <div className={joinClassNames('absolute -left-24 top-12 h-72 w-72 rounded-full blur-3xl', theme.leftOrb)} />
      <div className={joinClassNames('absolute -right-20 bottom-12 h-72 w-72 rounded-full blur-3xl', theme.rightOrb)} />
      <div className={joinClassNames('absolute inset-0 opacity-80', theme.beam)} />
      <div className="absolute inset-0 opacity-65 bg-[linear-gradient(122deg,transparent_10%,rgba(255,255,255,0.05)_36%,rgba(125,211,252,0.06)_52%,rgba(250,204,21,0.05)_74%,transparent_92%)] animate-[auroraSweep_18s_ease-in-out_infinite_alternate]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:84px_84px,84px_84px]" />
      <div className="absolute inset-x-[12%] top-[8%] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
    </div>
  );
}

export function NebulaCoreIcon({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 96 96" className={joinClassNames('h-6 w-6', className)} aria-hidden="true">
      <defs>
        <radialGradient id="nebulaCoreGlow" cx="38%" cy="32%" r="74%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="28%" stopColor="#67e8f9" />
          <stop offset="62%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <linearGradient id="nebulaRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="30" fill="url(#nebulaCoreGlow)" />
      <circle cx="48" cy="48" r="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <ellipse cx="48" cy="48" rx="40" ry="12" fill="none" stroke="url(#nebulaRing)" strokeWidth="4" transform="rotate(-16 48 48)" />
      <path d="M48 22L53 43L74 48L53 53L48 74L43 53L22 48L43 43Z" fill="rgba(255,255,255,0.24)" />
      <circle cx="36" cy="34" r="4" fill="rgba(255,255,255,0.55)" />
      <circle cx="61" cy="60" r="3.5" fill="rgba(253,224,71,0.65)" />
    </svg>
  );
}

export function LaunchGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <path d="M21.5 4.5c-5.6 1.2-10.3 5.2-12 10.6l7.4 7.4c5.4-1.7 9.4-6.4 10.6-12l-3.4-3.4Z" fill="currentColor" opacity="0.92" />
      <path d="M10.4 17.7l-3.8 2.7 1.1-4.6 2.7 1.9Zm5.9 5.9-4.6 1.1 2.7-3.8 1.9 2.7Z" fill="currentColor" opacity="0.64" />
      <circle cx="19.2" cy="12.8" r="2.4" fill="#e0f2fe" />
      <path d="M6 26l4.3-1 1.7 1.7L11 31z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function SignalGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="3.2" fill="currentColor" />
      <path d="M10.5 16a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      <path d="M6.5 16a9.5 9.5 0 0 1 19 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.58" />
      <path d="M16 19.8v5.7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.66" />
    </svg>
  );
}

export function CompassGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.92" />
      <path d="M20.8 11.2l-3.4 8-8 3.4 3.4-8z" fill="currentColor" />
      <path d="M11.2 20.8l8-3.4 3.4-8-8 3.4z" fill="#e0f2fe" opacity="0.9" />
    </svg>
  );
}

export function JumpGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <path d="M16 25V9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.2 14.5 16 8.7l5.8 5.8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 26h18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function CoinGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <defs>
        <radialGradient id="coinAura" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.76" />
          <stop offset="58%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coinMetal" cx="32%" cy="20%" r="82%">
          <stop offset="0%" stopColor="#fff9de" />
          <stop offset="22%" stopColor="#fde68a" />
          <stop offset="52%" stopColor="#fbbf24" />
          <stop offset="76%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
        <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="28%" stopColor="#fde68a" />
          <stop offset="62%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="coinCenterGlyph" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#422006" />
          <stop offset="55%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#coinAura)" />
      <circle cx="16" cy="16" r="11.2" fill="url(#coinRim)" />
      <circle cx="16" cy="16" r="9.35" fill="url(#coinMetal)" />
      <circle cx="16" cy="16" r="7.25" fill="none" stroke="rgba(120,53,15,0.42)" strokeWidth="1.35" />
      <path d="M16 11.2 18.5 13.6 21.8 13.8 19.4 16 19.9 19.2 16.9 18.1 14.6 20.4 14.2 17.1 11.4 15.4 14.2 14.2Z" fill="url(#coinCenterGlyph)" />
      <path d="M16 12.3 17.5 13.8 19.5 14 18 15.4 18.4 17.4 16.5 16.7 15.1 18.1 14.8 16.1 13.1 15 14.8 14.3Z" fill="rgba(255,245,210,0.54)" />
      <path d="M9.4 11.1c1.4-2.5 3.9-4 7.3-4.4" fill="none" stroke="rgba(255,255,255,0.66)" strokeWidth="1.35" strokeLinecap="round" />
      <ellipse cx="12.2" cy="10.6" rx="3.2" ry="1.5" fill="rgba(255,255,255,0.48)" />
      <circle cx="21.1" cy="20.2" r="1.25" fill="rgba(255,255,255,0.3)" />
      <path d="M6.9 16a9.1 9.1 0 0 1 0-.2m18.2 0a9.1 9.1 0 0 1 0 .2M16 6.9h.2M15.8 25.1h.2" stroke="rgba(120,53,15,0.28)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BoosterGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <path d="M18.2 4.8c-4.6 1-8.6 4.3-10.5 8.6l6 6c4.3-1.9 7.6-5.9 8.6-10.5l-4.1-4.1Z" fill="currentColor" opacity="0.9" />
      <path d="M11.4 17.4 6 20.8l1.4-6 4 2.6Zm7.2 7.2-6 1.4 3.4-5.4 2.6 4Z" fill="currentColor" opacity="0.52" />
      <path d="M19.4 9.2a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z" fill="#e0f2fe" />
    </svg>
  );
}

export function TimeGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <circle cx="16" cy="17" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 17V12.2m0 4.8 3.7 2.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4.8h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M10.7 7.5 8.8 5.8M21.3 7.5l1.9-1.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function GiftGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <rect x="6" y="13" width="20" height="13" rx="3" fill="currentColor" opacity="0.88" />
      <rect x="5" y="10" width="22" height="5" rx="2.5" fill="currentColor" opacity="0.62" />
      <path d="M16 10v16M10 13h12" fill="none" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10c-1.5-4.2-5.3-4.6-6.3-2.4c-.9 2.2 1.6 4.1 6.3 2.4Zm0 0c1.5-4.2 5.3-4.6 6.3-2.4c.9 2.2-1.6 4.1-6.3 2.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function VaultGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <rect x="6" y="7" width="20" height="18" rx="4" fill="currentColor" opacity="0.88" />
      <rect x="9" y="10" width="14" height="12" rx="3" fill="#0f172a" opacity="0.45" />
      <circle cx="16" cy="16" r="3.6" fill="none" stroke="#e0f2fe" strokeWidth="2" />
      <path d="M16 12.4v7.2M12.4 16h7.2" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CloseGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className={joinClassNames('h-5 w-5', className)} aria-hidden="true">
      <path d="M10 10l12 12M22 10 10 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
