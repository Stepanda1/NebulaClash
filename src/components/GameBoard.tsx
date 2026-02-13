import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tile as TileComponent } from './Tile';
import type { Grid, Tile } from '../types';
import { COLS, ROWS, findHintMove, findLightningSwap } from '../logic/boardUtils';

interface GameBoardProps {
    grid: Grid;
    selectedTile: Tile | null;
    explodingIds: Set<string>;
    isLevelTransition: boolean;
    showTutorial: boolean;
    tutorialStep: number;
    isProcessing: boolean;
    lowPerfMode: boolean;
    onTileClick: (tile: Tile) => void;
    onTileSwipe: (from: Tile, to: Tile) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid, selectedTile, explodingIds, isLevelTransition, showTutorial, tutorialStep, isProcessing, lowPerfMode, onTileClick, onTileSwipe }) => {
    const [itemSize, setItemSize] = useState(52);
    const [isMobile, setIsMobile] = useState(false);
    const GRID_GAP = 4;
    const dragStartRef = React.useRef<Tile | null>(null);
    const draggingRef = React.useRef(false);

    useEffect(() => {
        const updateSize = () => {
            if (typeof window === 'undefined') return;
            const vw = window.innerWidth;
            const vh = window.visualViewport?.height ?? window.innerHeight;

            const isDesktop = vw >= 768;
            setIsMobile(!isDesktop);
            const horizontalPadding = isDesktop ? 140 : 8;
            const verticalPadding = isDesktop ? 330 : 280;
            const rawAvailable = Math.min(vw - horizontalPadding, vh - verticalPadding);
            const minAvailable = isDesktop ? 300 : 220;
            const available = Math.max(minAvailable, rawAvailable);
            const tileSize = Math.floor((available - GRID_GAP * (COLS - 1)) / COLS);
            const clampedTile = Math.max(isDesktop ? 36 : 32, Math.min(isDesktop ? 60 : 48, tileSize));
            setItemSize(clampedTile + GRID_GAP);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const ITEM_SIZE = itemSize;
    const BOARD_WIDTH = COLS * ITEM_SIZE;
    const BOARD_HEIGHT = ROWS * ITEM_SIZE;

    // Flatten grid for rendering
    const tiles = useMemo(() => {
        const t: Tile[] = [];
        grid.forEach(row => row.forEach(tile => t.push(tile)));
        return t;
    }, [grid]);

    const hint = useMemo(() => {
        if (!showTutorial || isProcessing || isLevelTransition) return null;
        if (tutorialStep === 0) {
            return findHintMove(grid, 'match');
        }
        if (tutorialStep === 2) {
            return findLightningSwap(grid);
        }
        return null;
    }, [grid, showTutorial, isProcessing, isLevelTransition, tutorialStep]);

    const bombHint = useMemo(() => {
        if (!showTutorial || isProcessing || isLevelTransition) return null;
        if (tutorialStep !== 1) return null;
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

    return (
        <div
            className={`relative bg-black/60 ${lowPerfMode ? '' : 'backdrop-blur-xl'} rounded-2xl border border-white/10 ${lowPerfMode ? 'shadow-lg' : 'shadow-2xl'} overflow-hidden`}
            style={{
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT,
            }}
            onPointerUp={() => { draggingRef.current = false; dragStartRef.current = null; }}
            onPointerLeave={() => { draggingRef.current = false; dragStartRef.current = null; }}
            onPointerMove={(e) => {
                if (!draggingRef.current) return;
                const start = dragStartRef.current;
                if (!start) return;
                const targetEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
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
            }}
        >
            {/* Very Subtle Checkered Pattern */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: `${ITEM_SIZE}px ${ITEM_SIZE}px`
                }}
            />
            <AnimatePresence mode={lowPerfMode ? "sync" : "popLayout"}>
                {tiles.filter(t => t.type).map(tile => (
                    <TileComponent
                        key={tile.id}
                        tile={tile}
                        isSelected={selectedTile?.id === tile.id}
                        isExploding={explodingIds.has(tile.id)}
                        isMobile={isMobile}
                        isLevelTransition={isLevelTransition}
                        lowPerfMode={lowPerfMode}
                        onClick={() => onTileClick(tile)}
                        onPointerDown={(t) => {
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
                            draggingRef.current = false;
                            dragStartRef.current = null;
                        }}
                        size={ITEM_SIZE}
                    />
                ))}
            </AnimatePresence>
            {hint && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute rounded-2xl border-2 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"
                        style={{
                            left: hint.from.x * ITEM_SIZE,
                            top: hint.from.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={lowPerfMode ? { opacity: 0.95 } : { scale: [1, 1.08, 1] }}
                        transition={lowPerfMode ? undefined : { duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute rounded-2xl border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                        style={{
                            left: hint.to.x * ITEM_SIZE,
                            top: hint.to.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={lowPerfMode ? { opacity: 0.95 } : { scale: [1, 1.08, 1] }}
                        transition={lowPerfMode ? undefined : { duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute z-50 text-white text-xs font-bold bg-black px-2 py-1 rounded-full"
                        style={{
                            left: Math.max(6, Math.min(BOARD_WIDTH - 60, (hint.from.x + hint.to.x) * ITEM_SIZE * 0.5 - 30)),
                            top: Math.max(6, Math.min(BOARD_HEIGHT - 22, Math.min(hint.from.y, hint.to.y) * ITEM_SIZE - 18)),
                        }}
                        animate={lowPerfMode ? { opacity: 0.95 } : { opacity: [0.6, 1, 0.6] }}
                        transition={lowPerfMode ? undefined : { duration: 1.2, repeat: Infinity }}
                    >
                        Swipe
                    </motion.div>
                </div>
            )}
            {bombHint && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute rounded-2xl border-2 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"
                        style={{
                            left: bombHint.x * ITEM_SIZE,
                            top: bombHint.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={lowPerfMode ? { opacity: 0.95 } : { scale: [1, 1.08, 1] }}
                        transition={lowPerfMode ? undefined : { duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute z-50 text-white text-xs font-bold bg-black px-2 py-1 rounded-full"
                        style={{
                            left: Math.max(6, Math.min(BOARD_WIDTH - 80, bombHint.x * ITEM_SIZE - 10)),
                            top: Math.max(6, Math.min(BOARD_HEIGHT - 22, bombHint.y * ITEM_SIZE - 20)),
                        }}
                        animate={lowPerfMode ? { opacity: 0.95 } : { opacity: [0.6, 1, 0.6] }}
                        transition={lowPerfMode ? undefined : { duration: 1.2, repeat: Infinity }}
                    >
                        Double tap
                    </motion.div>
                </div>
            )}
        </div>
    );
};
