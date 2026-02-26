import React from 'react';
import { motion } from 'framer-motion';
import type { Tile as TileType, TileType as TType } from '../types';
import { clsx } from 'clsx';

interface TileProps {
    tile: TileType;
    isSelected: boolean;
    isExploding: boolean;
    isMobile: boolean;
    isLevelTransition: boolean;
    lowPerfMode: boolean;
    onClick: (tile: TileType) => void;
    onPointerDown: (tile: TileType) => void;
    onPointerEnter: (tile: TileType) => void;
    onPointerUp: () => void;
    size: number;
}

// VIVID CRYSTAL CONFIG: Multi-layered internal facets with high-contrast volumetric lighting
const getGemConfig = (type: TType) => {
    switch (type) {
        case 'red': return {
            // Smooth Heart Ruby - Brightened
            path: "M50 88 C20 75 2 50 2 30 A18 18 0 0 1 45 15 L50 22 L55 15 A18 18 0 0 1 98 30 C98 50 80 75 50 88 Z",
            base: ['#ff4d6d', '#ff0a54', '#800020'],
            facets: [
                { d: "M50 78 C25 65 12 50 12 35 Q12 25 25 25 L50 35 Z", fill: "white", op: 0.15 },
                { d: "M50 78 L88 35 Q88 25 75 25 L50 35 Z", fill: "black", op: 0.2 },
                { d: "M50 35 L25 25 Q35 15 50 22 L75 25 Z", fill: "white", op: 0.2 }
            ],
            table: "M30 35 Q30 25 50 25 Q70 25 70 35 Q50 55 30 35 Z",
            scale: 0.88,
            glow: 'rgba(255, 77, 109, 0.5)'
        };
        case 'blue': return {
            // Hex Sapphire - Brightened
            path: "M25 10 L75 10 L100 50 L75 90 L25 90 L0 50 Z",
            base: ['#60a5fa', '#2563eb', '#1e3a8a'],
            facets: [
                { d: "M25 10 L75 10 L65 25 L35 25 Z", fill: "white", op: 0.25 },
                { d: "M75 10 L100 50 L80 50 L65 25 Z", fill: "black", op: 0.15 },
                { d: "M100 50 L75 90 L65 75 L80 50 Z", fill: "black", op: 0.3 },
                { d: "M75 90 L25 90 L35 75 L65 75 Z", fill: "black", op: 0.45 },
                { d: "M25 90 L0 50 L20 50 L35 75 Z", fill: "black", op: 0.3 },
                { d: "M0 50 L25 10 L35 25 L20 50 Z", fill: "white", op: 0.15 }
            ],
            table: "M35 25 L65 25 L80 50 L65 75 L35 75 L20 50 Z",
            scale: 0.95,
            glow: 'rgba(96, 165, 250, 0.5)'
        };
        case 'green': return {
            // Emerald - Brightened
            path: "M25 5 L75 5 Q95 5 95 25 L95 75 Q95 95 75 95 L25 95 Q5 95 5 75 L5 25 Q5 5 25 5 Z",
            base: ['#34d399', '#059669', '#064e3b'],
            facets: [
                { d: "M25 5 L75 5 L70 20 L30 20 Z", fill: "white", op: 0.3 },
                { d: "M95 25 L95 75 L80 70 L80 30 Z", fill: "black", op: 0.2 },
                { d: "M75 95 L25 95 L30 80 L70 80 Z", fill: "black", op: 0.4 },
                { d: "M5 75 L5 25 L20 30 L20 70 Z", fill: "white", op: 0.15 }
            ],
            table: "M30 20 L70 20 L80 30 L80 70 L70 80 L30 80 L20 70 L20 30 Z",
            scale: 0.9,
            glow: 'rgba(52, 211, 153, 0.5)'
        };
        case 'yellow': return {
            // Star - Brightened
            path: "M50 5 L63 35 L98 35 L70 55 L81 90 L50 72 L19 90 L30 55 L2 35 L37 35 Z",
            base: ['#fde047', '#f59e0b', '#78350f'],
            facets: [
                { d: "M50 5 L63 35 L50 48 Z", fill: "white", op: 0.4 },
                { d: "M98 35 L70 55 L52 48 Z", fill: "black", op: 0.15 },
                { d: "M81 90 L50 72 L50 55 Z", fill: "black", op: 0.3 },
                { d: "M19 90 L30 55 L48 55 Z", fill: "black", op: 0.4 },
                { d: "M2 35 L37 35 L48 48 Z", fill: "white", op: 0.25 }
            ],
            table: "M50 30 L55 42 L50 48 L45 42 Z",
            scale: 1.0,
            glow: 'rgba(253, 224, 71, 0.5)'
        };
        case 'purple': return {
            // Sphere - Brightened
            path: "M50 50 m-45 0 a45 45 0 1 0 90 0 a45 45 0 1 0 -90 0",
            base: ['#c084fc', '#8b5cf6', '#4c1d95'],
            facets: [
                { d: "M50 15 Q85 15 85 50 Q50 65 15 50 Q15 15 50 15", fill: "white", op: 0.2 },
                { d: "M50 85 Q85 85 85 50 Q50 35 15 50 Q15 85 50 85", fill: "black", op: 0.3 }
            ],
            table: "M30 30 A20 20 0 1 1 70 30 A20 20 0 1 1 30 30",
            scale: 0.95,
            glow: 'rgba(192, 132, 252, 0.5)'
        };
        case 'orange': return {
            // Diamond - Brightened
            path: "M50 5 L95 48 L50 92 L5 48 Z",
            base: ['#fb923c', '#f97316', '#9a3412'],
            facets: [
                { d: "M50 5 L95 48 L50 48 Z", fill: "white", op: 0.3 },
                { d: "M95 48 L50 92 L50 48 Z", fill: "black", op: 0.2 },
                { d: "M50 92 L5 48 L50 48 Z", fill: "black", op: 0.45 },
                { d: "M5 48 L50 5 L50 48 Z", fill: "white", op: 0.15 }
            ],
            table: "M32 48 L50 22 L68 48 L50 74 Z",
            scale: 0.95,
            glow: 'rgba(251, 146, 60, 0.5)'
        };
        default: return null;
    }
};

export const Tile: React.FC<TileProps> = ({ tile, isSelected, isExploding, isMobile, isLevelTransition, lowPerfMode, onClick, onPointerDown, onPointerEnter, onPointerUp, size }) => {
    // For special pieces, use gemType for visual rendering, type for special effect
    const displayType = (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse') 
        ? tile.gemType 
        : tile.type;
    
    const config = getGemConfig(displayType as any);
    const gradId = `vivid-grad-${tile.id}`;
    const tableId = `table-grad-${tile.id}`;

    if (!config) return null;

    const lowFX = isMobile || isLevelTransition || lowPerfMode;
    const [specLight, specMid, specDark] = config.base;

    return (
        <motion.div
            layoutId={lowFX ? undefined : tile.id}
            initial={lowFX ? { opacity: 0, scale: 0.9 } : { y: -500, opacity: 0, scale: 0 }}
            animate={{
                x: tile.x * size,
                y: tile.y * size,
                scale: isSelected ? 1.05 : 1,
                opacity: 1,
                zIndex: isSelected ? 50 : 10
            }}
            transition={{
                layout: lowFX
                    ? { type: "tween", duration: 0.08 }
                    : { type: "spring", stiffness: 450, damping: 35 },
                y: { type: "tween", ease: "easeOut", duration: lowFX ? 0.12 : 0.25 }
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            style={{
                position: 'absolute',
                width: size,
                height: size,
                padding: size * 0.05,
                cursor: 'pointer',
                willChange: "transform"
            }}
            data-tile="true"
            data-x={tile.x}
            data-y={tile.y}
            onClick={() => onClick(tile)}
            onPointerDown={() => onPointerDown(tile)}
            onPointerEnter={() => onPointerEnter(tile)}
            onPointerUp={onPointerUp}
        >
            <div className="w-full h-full relative flex items-center justify-center">
                {/* Volumetric Glow */}
                {!lowFX && (
                    <div
                        className="absolute inset-[10%] blur-3xl opacity-50 pointer-events-none"
                        style={{ background: config.glow, borderRadius: '50%' }}
                    />
                )}

                <svg
                    viewBox="0 0 100 100"
                    className={clsx(
                        "w-full h-full relative z-10 transition-transform duration-300",
                        !lowFX && "drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]",
                        isSelected ? "scale-105" : "scale-100"
                    )}
                    style={{ transform: `scale(${config.scale})` }}
                >
                    <defs>
                        {/* 3-Stop Base Gradient */}
                        <radialGradient id={gradId} cx="35%" cy="30%" r="90%">
                            <stop offset="0%" stopColor={config.base[0]} />
                            <stop offset="55%" stopColor={config.base[1]} />
                            <stop offset="100%" stopColor={config.base[2]} />
                        </radialGradient>

                        {/* High-Gloss Top Shell */}
                        <linearGradient id={tableId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Ground Matte Shadow */}
                    <path d={config.path} fill="black" fillOpacity="0.4" transform="translate(0, 4)" />

                    {/* Main Silhoutte */}
                    <path
                        d={config.path}
                        fill={`url(#${gradId})`}
                        stroke="rgba(0,0,0,0.4)"
                        strokeWidth="0.5"
                    />

                    {/* Internal Facets (Sharp 3D) */}
                    {config.facets.map((f, i) => (
                        <path
                            key={i}
                            d={f.d}
                            fill={f.fill}
                            fillOpacity={f.op}
                            className="pointer-events-none"
                        />
                    ))}

                    {/* Table Face (The Polished Top) */}
                    <path
                        d={config.table}
                        fill="white"
                        fillOpacity="0.1"
                        stroke="white"
                        strokeOpacity="0.1"
                        strokeWidth="0.5"
                    />
                    <path d={config.table} fill={`url(#${tableId})`} />

                    {/* SPECULAR LIGHTING: Triple Glint */}
                    <circle cx="30" cy="26" r="6" fill="white" fillOpacity="0.35" filter="blur(2px)" />
                    <circle cx="28" cy="24" r="2.5" fill="white" fillOpacity="0.7" />
                    <circle cx="75" cy="25" r="1.5" fill="white" fillOpacity="0.8" />

                    {/* RIM LIGHT: Hard Edge Bottom */}
                    <path
                        d={config.path}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.2"
                        strokeOpacity="0.2"
                        clipPath="inset(80% 0% 0% 0%)"
                    />
                </svg>

                {/* Animated Star Twinkle */}
                {!lowFX && (
                    <motion.div
                        className="absolute inset-[15%] pointer-events-none overflow-hidden rounded-full mix-blend-screen"
                    >
                        <motion.div
                            className="w-[200%] h-[15%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45"
                            animate={{ translateX: ['-100%', '200%'] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatDelay: 5,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                )}

                {tile.hasTrash && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        <div className="absolute inset-[2%] rounded-2xl border-[2.5px] border-slate-50/85 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.2),rgba(30,41,59,0.82)_42%,rgba(2,6,23,0.94)_100%)] shadow-[inset_0_0_18px_rgba(148,163,184,0.4),0_0_14px_rgba(15,23,42,0.35)]" />
                        <div className="absolute inset-[6%] rounded-xl border border-cyan-100/20 bg-black/35" />
                        {!lowFX && (
                            <motion.div
                                className="absolute inset-[4%] rounded-2xl border border-cyan-200/30"
                                animate={{ opacity: [0.2, 0.55, 0.2] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}
                        <svg viewBox="0 0 100 100" className="h-10 w-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">
                            <defs>
                                <linearGradient id={`trash-core-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#cbd5e1" />
                                    <stop offset="55%" stopColor="#94a3b8" />
                                    <stop offset="100%" stopColor="#475569" />
                                </linearGradient>
                            </defs>
                            <ellipse cx="50" cy="50" rx="31" ry="12" fill="rgba(125,211,252,0.12)" stroke="rgba(255,255,255,0.38)" strokeWidth="2.2" />
                            <g fill="url(#trash-core-${tile.id})" stroke="#f1f5f9" strokeOpacity="0.65" strokeWidth="2.2">
                                <path d="M22 46 L35 35 L47 39 L42 53 L28 58 Z" />
                                <path d="M52 28 L68 24 L78 36 L66 46 L51 41 Z" />
                                <path d="M55 56 L73 54 L82 68 L67 77 L50 70 Z" />
                                <path d="M24 62 L39 58 L47 70 L34 80 L20 73 Z" />
                                <path d="M43 44 L58 40 L65 52 L55 63 L41 58 Z" />
                            </g>
                            <circle cx="58" cy="47" r="3.2" fill="#020617" fillOpacity="0.95" />
                            <circle cx="33" cy="50" r="2.4" fill="#e2e8f0" fillOpacity="0.55" />
                            <circle cx="70" cy="33" r="1.8" fill="#f8fafc" fillOpacity="0.8" />
                            <path d="M28 32 Q35 28 41 31" stroke="#bae6fd" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <path d="M20 50 L80 50" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M50 20 L50 80" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                )}

                {/* Selection FX: Pulse & Glow */}
                {isSelected && (
                    <motion.div
                        className="absolute inset-0 border-4 border-white rounded-2xl shadow-[0_0_30px_white] z-20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{
                            opacity: { duration: 0.2 },
                            scale: { repeat: Infinity, duration: 1.5 }
                        }}
                    />
                )}

                {/* Explosion FX */}
                {isExploding && (
                    <motion.div
                        className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                        initial={{ opacity: 0.9, scale: 0.3 }}
                        animate={{ opacity: 0, scale: 1.6 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <div className="w-10 h-10 rounded-full bg-[radial-gradient(circle,#ffffff_0%,rgba(255,255,255,0.5)_35%,rgba(255,255,255,0.0)_70%)] blur-[1px]" />
                        <div className="absolute w-14 h-14 rounded-full border-2 border-white/70 blur-[1px]" />
                    </motion.div>
                )}

                {/* Special Piece Indicators */}
                {tile.type === 'bomb' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        animate={lowFX ? { opacity: 0.95 } : { y: [0, -1.5, 0] }}
                        transition={lowFX ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative h-10 w-10">
                            {!lowFX && (
                                <motion.div
                                    className="absolute inset-[-5px] rounded-full"
                                    style={{ background: `radial-gradient(circle, ${config.glow} 0%, rgba(255,255,255,0.08) 35%, rgba(0,0,0,0) 75%)` }}
                                    animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.55, 0.9, 0.55] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}
                            <div className="absolute left-1/2 top-[7px] h-[9px] w-[13px] -translate-x-1/2 rounded-t-md border bg-gradient-to-b from-slate-300 to-slate-600 shadow-[0_0_8px_rgba(148,163,184,0.35)]" style={{ borderColor: 'rgba(255,255,255,0.35)' }} />
                            <div className="absolute left-1/2 top-[4px] h-[8px] w-[3px] -translate-x-1/2 rounded-full bg-slate-200/80" />
                            <div
                                className="absolute inset-x-[5px] bottom-[4px] top-[11px] rounded-full border shadow-[inset_-4px_-6px_10px_rgba(15,23,42,0.6)]"
                                style={{
                                    borderColor: 'rgba(255,255,255,0.28)',
                                    background: `radial-gradient(circle at 28% 24%, ${specLight} 0%, ${specMid} 24%, ${specDark} 68%, #020617 100%)`,
                                    boxShadow: `0 0 14px ${config.glow}, inset -4px -6px 10px rgba(15,23,42,0.6)`,
                                }}
                            />
                            <div className="absolute inset-x-[8px] bottom-[7px] top-[14px] rounded-full border border-white/15" />
                            <div className="absolute left-[10px] right-[10px] top-[21px] h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
                            <div className="absolute left-[13px] top-[16px] h-[5px] w-[5px] rounded-full bg-white/75 blur-[0.5px]" />
                            <div className="absolute right-[12px] bottom-[13px] h-[4px] w-[4px] rounded-full" style={{ background: specLight, opacity: 0.55 }} />
                            {!lowFX && (
                                <motion.div
                                    className="absolute left-1/2 top-[-1px] h-4 w-4 -translate-x-1/2"
                                    animate={{ rotate: [-8, 8, -8] }}
                                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="absolute left-1/2 top-1 h-2.5 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-t from-slate-300 to-white" />
                                    <motion.div
                                        className="absolute left-1/2 top-[-1px] h-3 w-3 -translate-x-1/2 rounded-full"
                                        style={{ background: `radial-gradient(circle, #ffffff 0%, ${specLight} 32%, ${specMid} 58%, rgba(0,0,0,0) 76%)` }}
                                        animate={{ scale: [0.85, 1.15, 0.9], opacity: [0.7, 1, 0.65] }}
                                        transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {tile.type === 'lightning' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        animate={lowFX ? { opacity: 0.95 } : { opacity: [1, 0.6, 1] }}
                        transition={lowFX ? undefined : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle_at_50%_50%, ${config.glow}, rgba(0,0,0,0))` }} />
                            <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ filter: `drop-shadow(0 0 12px ${config.glow})` }}>
                                <defs>
                                    <linearGradient id={`bolt-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="35%" stopColor={specLight} />
                                        <stop offset="70%" stopColor={specMid} />
                                        <stop offset="100%" stopColor={specDark} />
                                    </linearGradient>
                                </defs>
                                <path d="M60 5 L34 40 L49 40 L37 63 L54 63 L27 95 L42 56 L29 56 L47 30 L36 30 L60 5 Z" fill="none" stroke="rgba(15,23,42,0.9)" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
                                <path d="M60 5 L34 40 L49 40 L37 63 L54 63 L27 95 L42 56 L29 56 L47 30 L36 30 L60 5 Z" fill={`url(#bolt-${tile.id})`} stroke="rgba(255,255,255,0.72)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
                                <path d="M56 13 L41 34 L52 34 L42 52 L58 52 L38 80 L47 49 L38 49 L49 27 L43 27 L56 13 Z" fill="white" fillOpacity="0.25" />
                                <path d="M65 17 L76 12" stroke={specLight} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
                                <path d="M21 66 L32 61" stroke={specLight} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                            </svg>
                            {!lowFX && (
                                <>
                                    <motion.div
                                        className="absolute inset-0"
                                        animate={{ rotate: [0, -6, 0] }}
                                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 opacity-55">
                                            <path d="M63 11 L47 33 L56 33 L45 53 L60 53 L41 78 L49 48 L41 48 L52 26 L46 26 L63 11 Z" fill={specLight} />
                                        </svg>
                                    </motion.div>
                                    <motion.div
                                        className="absolute inset-0"
                                        animate={{ opacity: [0.15, 0.6, 0.15] }}
                                        transition={{ duration: 0.7, repeat: Infinity }}
                                    >
                                        <svg viewBox="0 0 100 100">
                                            <path d="M20 44 L31 38" stroke={specLight} strokeWidth="4" strokeLinecap="round" />
                                            <path d="M71 26 L82 20" stroke={specLight} strokeWidth="4" strokeLinecap="round" />
                                            <path d="M66 73 L81 79" stroke={specLight} strokeWidth="4" strokeLinecap="round" />
                                            <path d="M50 90 L58 82" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
                                        </svg>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {tile.type === 'cross' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        animate={lowFX ? { opacity: 0.95 } : { scale: [1, 1.2, 1] }}
                        transition={lowFX ? undefined : { duration: 1.5, repeat: Infinity }}
                    >
                        <div className="relative h-9 w-9">
                            <div className="absolute inset-0 rounded-full opacity-75" style={{ background: `radial-gradient(circle, ${config.glow} 0%, rgba(0,0,0,0) 72%)` }} />
                            <div className="absolute inset-[12%] rounded-full border-2 bg-black/35 backdrop-blur-[1px]" style={{ borderColor: 'rgba(255,255,255,0.36)' }} />
                            <div className="absolute inset-[8%] rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.24)' }} />
                            <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ filter: `drop-shadow(0 0 10px ${config.glow})` }}>
                                <defs>
                                    <linearGradient id={`cross-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="45%" stopColor={specLight} />
                                        <stop offset="100%" stopColor={specMid} />
                                    </linearGradient>
                                </defs>
                                <line x1="24" y1="24" x2="76" y2="76" stroke="rgba(15,23,42,0.9)" strokeWidth="14" strokeLinecap="round" />
                                <line x1="76" y1="24" x2="24" y2="76" stroke="rgba(15,23,42,0.9)" strokeWidth="14" strokeLinecap="round" />
                                <line x1="24" y1="24" x2="76" y2="76" stroke={`url(#cross-${tile.id})`} strokeWidth="10" strokeLinecap="round" />
                                <line x1="76" y1="24" x2="24" y2="76" stroke={`url(#cross-${tile.id})`} strokeWidth="10" strokeLinecap="round" />
                                <line x1="50" y1="14" x2="50" y2="86" stroke="white" strokeOpacity="0.18" strokeWidth="3" />
                                <line x1="14" y1="50" x2="86" y2="50" stroke="white" strokeOpacity="0.18" strokeWidth="3" />
                                <circle cx="50" cy="50" r="12" fill="rgba(2,6,23,0.92)" stroke="white" strokeOpacity="0.35" strokeWidth="3" />
                                <circle cx="50" cy="50" r="10" fill={specDark} stroke={specLight} strokeWidth="3.5" />
                                <circle cx="50" cy="50" r="4" fill="white" fillOpacity="0.65" />
                            </svg>
                        </div>
                    </motion.div>
                )}

                {tile.type === 'nova' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        animate={lowFX ? { opacity: 0.95 } : { rotate: [0, 12, 0, -12, 0], scale: [1, 1.06, 1] }}
                        transition={lowFX ? undefined : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative h-9 w-9">
                            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glow} 0%, rgba(0,0,0,0) 72%)` }} />
                            <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ filter: `drop-shadow(0 0 12px ${config.glow})` }}>
                                <defs>
                                    <linearGradient id={`nova-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="45%" stopColor={specLight} />
                                        <stop offset="100%" stopColor={specMid} />
                                    </linearGradient>
                                </defs>
                                <path d="M50 10 L58 34 L82 18 L66 42 L92 50 L66 58 L82 82 L58 66 L50 90 L42 66 L18 82 L34 58 L8 50 L34 42 L18 18 L42 34 Z" fill={`url(#nova-${tile.id})`} />
                                <circle cx="50" cy="50" r="11" fill={specDark} stroke={specLight} strokeWidth="3" />
                                <circle cx="50" cy="50" r="5" fill="white" fillOpacity="0.8" />
                            </svg>
                        </div>
                    </motion.div>
                )}

                {tile.type === 'pulse' && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        animate={lowFX ? { opacity: 0.95 } : { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                        transition={lowFX ? undefined : { duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative h-9 w-9">
                            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glow} 0%, rgba(0,0,0,0) 72%)` }} />
                            {!lowFX && (
                                <motion.div
                                    className="absolute inset-[6%] rounded-full border"
                                    style={{ borderColor: specLight }}
                                    animate={{ scale: [0.7, 1.15], opacity: [0.65, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                                />
                            )}
                            <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ filter: `drop-shadow(0 0 10px ${config.glow})` }}>
                                <circle cx="50" cy="50" r="15" fill={specDark} stroke={specLight} strokeWidth="4" />
                                <circle cx="50" cy="50" r="8" fill={specMid} stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                                <path d="M50 12 L57 31 L76 24 L69 43 L88 50 L69 57 L76 76 L57 69 L50 88 L43 69 L24 76 L31 57 L12 50 L31 43 L24 24 L43 31 Z" fill={specLight} fillOpacity="0.9" />
                                <circle cx="50" cy="50" r="4" fill="white" fillOpacity="0.85" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};



