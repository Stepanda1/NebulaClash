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
      base: 'bg-[radial-gradient(140%_140%_at_16%_14%,#18386b_0%,#101b45_28%,#090b24_58%,#03040f_100%)]',
      stars: '[background-image:radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.85)_1px,transparent_1.3px),radial-gradient(circle_at_74%_26%,rgba(125,211,252,0.6)_1px,transparent_1.4px),radial-gradient(circle_at_68%_74%,rgba(251,191,36,0.5)_1px,transparent_1.5px)] [background-size:160px_160px,220px_220px,280px_280px]',
      haze: 'bg-[radial-gradient(circle_at_14%_28%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_76%_74%,rgba(245,158,11,0.14),transparent_34%),radial-gradient(circle_at_36%_80%,rgba(59,130,246,0.12),transparent_28%)]',
      leftOrb: 'bg-sky-400/16',
      rightOrb: 'bg-amber-300/12',
      beam: 'bg-[linear-gradient(115deg,transparent_0%,rgba(148,163,184,0.02)_25%,rgba(103,232,249,0.06)_52%,rgba(251,191,36,0.04)_74%,transparent_100%)]',
    },
    roadmap: {
      base: 'bg-[radial-gradient(135%_150%_at_18%_10%,#163b66_0%,#12214c_26%,#0a1430_54%,#040814_100%)]',
      stars: '[background-image:radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.82)_1px,transparent_1.2px),radial-gradient(circle_at_84%_22%,rgba(125,211,252,0.58)_1px,transparent_1.3px),radial-gradient(circle_at_64%_78%,rgba(148,163,184,0.5)_1px,transparent_1.4px)] [background-size:180px_180px,240px_240px,320px_320px]',
      haze: 'bg-[radial-gradient(circle_at_18%_26%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_84%_70%,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_54%_18%,rgba(245,158,11,0.1),transparent_24%)]',
      leftOrb: 'bg-cyan-400/14',
      rightOrb: 'bg-blue-400/12',
      beam: 'bg-[linear-gradient(108deg,transparent_0%,rgba(56,189,248,0.04)_20%,rgba(14,165,233,0.08)_50%,rgba(59,130,246,0.04)_80%,transparent_100%)]',
    },
    shop: {
      base: 'bg-[radial-gradient(130%_140%_at_50%_8%,#143766_0%,#0f224a_26%,#09132f_56%,#040814_100%)]',
      stars: '[background-image:radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.8)_1px,transparent_1.2px),radial-gradient(circle_at_82%_30%,rgba(125,211,252,0.58)_1px,transparent_1.3px),radial-gradient(circle_at_48%_78%,rgba(251,191,36,0.48)_1px,transparent_1.4px)] [background-size:150px_150px,220px_220px,300px_300px]',
      haze: 'bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_84%_70%,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_18%_78%,rgba(245,158,11,0.12),transparent_30%)]',
      leftOrb: 'bg-cyan-400/12',
      rightOrb: 'bg-amber-300/10',
      beam: 'bg-[linear-gradient(120deg,transparent_0%,rgba(56,189,248,0.04)_22%,rgba(250,204,21,0.05)_50%,rgba(59,130,246,0.03)_80%,transparent_100%)]',
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
        <radialGradient id="coinAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coinFill" cx="34%" cy="24%" r="76%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="24%" stopColor="#fde68a" />
          <stop offset="52%" stopColor="#fbbf24" />
          <stop offset="76%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fde68a" />
          <stop offset="64%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#coinAura)" />
      <circle cx="16" cy="16" r="10.8" fill="url(#coinRim)" />
      <circle cx="16" cy="16" r="8.9" fill="url(#coinFill)" />
      <circle cx="16" cy="16" r="6.9" fill="none" stroke="rgba(120,53,15,0.36)" strokeWidth="1.5" />
      <path d="M16 10.7 18.2 13.8 21.9 14.6 19.3 17.1 19.7 20.8 16 18.9 12.3 20.8 12.7 17.1 10.1 14.6 13.8 13.8Z" fill="#5b2a06" />
      <path d="M16 12.2 17.3 14 19.5 14.5 18 16 18.2 18.2 16 17.1 13.8 18.2 14 16 12.5 14.5 14.7 14Z" fill="rgba(255,243,199,0.55)" />
      <path d="M9.8 10.6c1.2-2.3 3.4-3.7 6.6-4.2" fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="12.1" cy="10.9" rx="3.3" ry="1.6" fill="rgba(255,255,255,0.42)" />
      <circle cx="21.2" cy="20.5" r="1.2" fill="rgba(255,255,255,0.24)" />
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
