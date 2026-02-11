import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tile as TileComponent } from './Tile';
import type { Grid, Tile } from '../types';
import { COLS, ROWS, findHintMove } from '../logic/boardUtils';

interface GameBoardProps {
    grid: Grid;
    selectedTile: Tile | null;
    explodingIds: Set<string>;
    isLevelTransition: boolean;
    showTutorial: boolean;
    isProcessing: boolean;
    onTileClick: (tile: Tile) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid, selectedTile, explodingIds, isLevelTransition, showTutorial, isProcessing, onTileClick }) => {
    const [itemSize, setItemSize] = useState(52);
    const [isMobile, setIsMobile] = useState(false);
    const GRID_GAP = 4;

    useEffect(() => {
        const updateSize = () => {
            if (typeof window === 'undefined') return;
            const vw = window.innerWidth;
            const vh = window.visualViewport?.height ?? window.innerHeight;

            const isDesktop = vw >= 768;
            setIsMobile(!isDesktop);
            const horizontalPadding = isDesktop ? 140 : 8;
            const verticalPadding = isDesktop ? 320 : 140;
            const available = Math.max(300, Math.min(vw - horizontalPadding, vh - verticalPadding));
            const tileSize = Math.floor((available - GRID_GAP * (COLS - 1)) / COLS);
            const clampedTile = Math.max(isDesktop ? 36 : 42, Math.min(58, tileSize));
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
        return findHintMove(grid);
    }, [grid, showTutorial, isProcessing, isLevelTransition]);

    return (
        <div
            className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT,
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
            <AnimatePresence mode="popLayout">
                {tiles.filter(t => t.type).map(tile => (
                    <TileComponent
                        key={tile.id}
                        tile={tile}
                        isSelected={selectedTile?.id === tile.id}
                        isExploding={explodingIds.has(tile.id)}
                        isMobile={isMobile}
                        isLevelTransition={isLevelTransition}
                        onClick={() => onTileClick(tile)}
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
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute rounded-2xl border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                        style={{
                            left: hint.to.x * ITEM_SIZE,
                            top: hint.to.y * ITEM_SIZE,
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                        }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute text-white text-xs font-bold bg-black/100 px-2 py-1 rounded-full"
                        style={{
                            left: (hint.from.x + hint.to.x) * ITEM_SIZE * 0.5,
                            top: Math.min(hint.from.y, hint.to.y) * ITEM_SIZE - 18,
                            transform: 'translateX(-50%)',
                        }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        Swipe
                    </motion.div>
                </div>
            )}
        </div>
    );
};
