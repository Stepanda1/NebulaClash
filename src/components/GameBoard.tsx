import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tile as TileComponent } from './Tile';
import type { Grid, Tile } from '../types';
import { COLS, ROWS, findHintMatchPreview, findHintMove, findLightningSwap } from '../logic/boardUtils';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

const IDLE_HINT_DELAY_MS = 6000;

interface GameBoardProps {
    grid: Grid;
    selectedTile: Tile | null;
    explodingIds: Set<string>;
    isLevelTransition: boolean;
    showTutorial: boolean;
    tutorialStep: number;
    isProcessing: boolean;
    lowPerfMode: boolean;
    language: Language;
    onTileClick: (tile: Tile) => void;
    onTileSwipe: (from: Tile, to: Tile) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid, selectedTile, explodingIds, isLevelTransition, showTutorial, tutorialStep, isProcessing, lowPerfMode, language, onTileClick, onTileSwipe }) => {
    const t = COPY[language];
    const [itemSize, setItemSize] = useState(52);
    const [isMobile, setIsMobile] = useState(false);
    const [showIdleHint, setShowIdleHint] = useState(false);
    const GRID_GAP = 4;
    const dragStartRef = React.useRef<Tile | null>(null);
    const draggingRef = React.useRef(false);
    const dragRafRef = React.useRef<number | null>(null);
    const pendingPointerRef = React.useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const updateSize = () => {
            if (typeof window === 'undefined') return;
            const vw = window.innerWidth;
            const vh = window.visualViewport?.height ?? window.innerHeight;

            const isDesktop = vw >= 768;
            setIsMobile(!isDesktop);
            const horizontalPadding = isDesktop ? 150 : 22;
            const verticalPadding = isDesktop ? 390 : 330;
            const rawAvailable = Math.min(vw - horizontalPadding, vh - verticalPadding);
            const minAvailable = isDesktop ? 180 : 130;
            const available = Math.max(minAvailable, rawAvailable);
            const tileSize = Math.floor((available - GRID_GAP * (COLS - 1)) / COLS);
            const clampedTile = Math.max(isDesktop ? 20 : 14, Math.min(isDesktop ? 56 : 42, tileSize));
            setItemSize(clampedTile + GRID_GAP);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        return () => {
            if (dragRafRef.current !== null) {
                cancelAnimationFrame(dragRafRef.current);
                dragRafRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        setShowIdleHint(false);
        if (showTutorial || isProcessing || isLevelTransition) return;

        const timeoutId = window.setTimeout(() => {
            setShowIdleHint(true);
        }, IDLE_HINT_DELAY_MS);

        return () => window.clearTimeout(timeoutId);
    }, [grid, showTutorial, isProcessing, isLevelTransition]);

    const ITEM_SIZE = itemSize;
    const BOARD_WIDTH = COLS * ITEM_SIZE;
    const BOARD_HEIGHT = ROWS * ITEM_SIZE;

    // Flatten grid for rendering
    const tiles = useMemo(() => {
        const t: Tile[] = [];
        grid.forEach(row => row.forEach(tile => t.push(tile)));
        return t;
    }, [grid]);

    const tutorialHint = useMemo(() => {
        if (!showTutorial || isProcessing || isLevelTransition) return null;
        if (tutorialStep === 2) {
            return findHintMove(grid, 'match');
        }
        if (tutorialStep === 6) {
            return findLightningSwap(grid);
        }
        return null;
    }, [grid, showTutorial, isProcessing, isLevelTransition, tutorialStep]);

    const idleHint = useMemo(() => {
        if (showTutorial || !showIdleHint || isProcessing || isLevelTransition) return null;
        return findHintMatchPreview(grid);
    }, [grid, showTutorial, showIdleHint, isProcessing, isLevelTransition]);

    const bombHint = useMemo(() => {
        if (!showTutorial || isProcessing || isLevelTransition) return null;
        if (tutorialStep !== 4) return null;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = grid[y][x];
                if (tile.type === 'bomb' && y > 0) {
                    return { x, y };
                }
            }
        }
        return null;
    }, [grid, showTutorial, isProcessing, isLevelTransition, tutorialStep]);

    const resetIdleHint = () => {
        if (!showIdleHint) return;
        setShowIdleHint(false);
    };

    const hintedFromId = idleHint ? grid[idleHint.from.y][idleHint.from.x]?.id : null;
    const hintDirection = idleHint
        ? {
            x: idleHint.to.x - idleHint.from.x,
            y: idleHint.to.y - idleHint.from.y,
        }
        : null;

    const boardContent = (
        <>
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(140% 120% at 16% 10%, rgba(56,189,248,0.2) 0%, rgba(14,116,144,0.1) 26%, rgba(7,12,30,0.58) 58%, rgba(2,6,23,0.9) 100%), radial-gradient(70% 70% at 84% 82%, rgba(245,158,11,0.18) 0%, rgba(30,41,59,0) 72%)',
                }}
            />
            {!lowPerfMode && (
                <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen bg-[radial-gradient(circle_at_22%_24%,rgba(186,230,253,0.24)_0%,transparent_34%),radial-gradient(circle_at_76%_68%,rgba(251,191,36,0.2)_0%,transparent_36%),radial-gradient(circle_at_56%_42%,rgba(125,211,252,0.14)_0%,transparent_30%)]" />
            )}
            {!lowPerfMode && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:22px_22px,22px_22px]" />
            )}
            {!lowPerfMode && (
                <div
                    className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: `${ITEM_SIZE}px ${ITEM_SIZE}px`
                    }}
                />
            )}
            <AnimatePresence mode={lowPerfMode ? "sync" : "popLayout"}>
                {tiles.filter(t => t.type).map(tile => (
                    <TileComponent
                        key={tile.id}
                        tile={tile}
                        isSelected={selectedTile?.id === tile.id}
                        isExploding={explodingIds.has(tile.id)}
                        isHinted={!!idleHint?.matchedIds.has(tile.id)}
                        hintOffset={tile.id === hintedFromId ? hintDirection : null}
                        isMobile={isMobile}
                        isLevelTransition={isLevelTransition}
                        lowPerfMode={lowPerfMode}
                        onClick={() => {
                            resetIdleHint();
                            onTileClick(tile);
                        }}
                        onPointerDown={(t) => {
                            resetIdleHint();
                            draggingRef.current = true;
                            dragStartRef.current = t;
                        }}
                        onPointerEnter={(t) => {
                            if (!draggingRef.current) return;
                            const start = dragStartRef.current;
                            if (!start || start.id === t.id) return;
                            const dx = Math.abs(t.x - start.x);
                            const dy = Math.abs(t.y - start.y);
                            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                                draggingRef.current = false;
                                dragStartRef.current = null;
                                onTileSwipe(start, t);
                            }
                        }}
                        onPointerUp={() => {
                            resetIdleHint();
                            draggingRef.current = false;
                            dragStartRef.current = null;
                        }}
                        size={ITEM_SIZE}
                    />
                ))}
            </AnimatePresence>
            {!lowPerfMode && tutorialHint && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute rounded-2xl border-2 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"
                        style={{
                            left: tutorialHint.from.x * ITEM_SIZE,
                            top: tutorialHint.from.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute rounded-2xl border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                        style={{
                            left: tutorialHint.to.x * ITEM_SIZE,
                            top: tutorialHint.to.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute z-50 text-white text-xs font-bold bg-black px-2 py-1 rounded-full"
                        style={{
                            left: Math.max(6, Math.min(BOARD_WIDTH - 60, (tutorialHint.from.x + tutorialHint.to.x) * ITEM_SIZE * 0.5 - 30)),
                            top: Math.max(6, Math.min(BOARD_HEIGHT - 22, Math.min(tutorialHint.from.y, tutorialHint.to.y) * ITEM_SIZE - 18)),
                        }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        {t.swipe}
                    </motion.div>
                </div>
            )}
            {lowPerfMode && tutorialHint && (
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute rounded-2xl border-2 border-yellow-300/85"
                        style={{
                            left: tutorialHint.from.x * ITEM_SIZE,
                            top: tutorialHint.from.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                    />
                    <div
                        className="absolute rounded-2xl border-2 border-cyan-300/85"
                        style={{
                            left: tutorialHint.to.x * ITEM_SIZE,
                            top: tutorialHint.to.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                    />
                </div>
            )}
            {!lowPerfMode && bombHint && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute rounded-2xl border-2 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"
                        style={{
                            left: bombHint.x * ITEM_SIZE,
                            top: bombHint.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute z-50 text-white text-xs font-bold bg-black px-2 py-1 rounded-full"
                        style={{
                            left: Math.max(6, Math.min(BOARD_WIDTH - 80, bombHint.x * ITEM_SIZE - 10)),
                            top: Math.max(6, Math.min(BOARD_HEIGHT - 22, bombHint.y * ITEM_SIZE - 20)),
                        }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        {t.doubleTap}
                    </motion.div>
                </div>
            )}
            {lowPerfMode && bombHint && (
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute rounded-2xl border-2 border-yellow-300/85"
                        style={{
                            left: bombHint.x * ITEM_SIZE,
                            top: bombHint.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                    />
                </div>
            )}
        </>
    );

    return (
        <div
            className={`relative ${lowPerfMode ? 'bg-slate-900/72' : 'bg-slate-950/66 backdrop-blur-xl'} rounded-2xl border border-cyan-100/20 ${lowPerfMode ? 'shadow-lg' : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_34px_rgba(2,6,23,0.6),0_0_40px_rgba(34,211,238,0.16)]'} overflow-hidden touch-none`}
            style={{
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT,
            }}
            onPointerUp={() => {
                resetIdleHint();
                draggingRef.current = false;
                dragStartRef.current = null;
            }}
            onPointerLeave={() => { draggingRef.current = false; dragStartRef.current = null; }}
            onPointerMove={(e) => {
                if (!draggingRef.current) return;
                resetIdleHint();
                pendingPointerRef.current = { x: e.clientX, y: e.clientY };
                if (dragRafRef.current !== null) return;
                dragRafRef.current = window.requestAnimationFrame(() => {
                    dragRafRef.current = null;
                    const point = pendingPointerRef.current;
                    if (!point || !draggingRef.current) return;
                    const start = dragStartRef.current;
                    if (!start) return;
                    const targetEl = document.elementFromPoint(point.x, point.y) as HTMLElement | null;
                    const tileEl = targetEl?.closest('[data-tile="true"]') as HTMLElement | null;
                    if (!tileEl) return;
                    const tx = Number(tileEl.dataset.x);
                    const ty = Number(tileEl.dataset.y);
                    if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
                    if (tx === start.x && ty === start.y) return;
                    const dx = Math.abs(tx - start.x);
                    const dy = Math.abs(ty - start.y);
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        draggingRef.current = false;
                        dragStartRef.current = null;
                        onTileSwipe(start, grid[ty][tx]);
                    }
                });
            }}
        >
            {boardContent}
        </div>
    );
};
