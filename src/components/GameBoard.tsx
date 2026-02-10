import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tile as TileComponent } from './Tile';
import type { Grid, Tile } from '../types';
import { COLS, ROWS } from '../logic/boardUtils';

interface GameBoardProps {
    grid: Grid;
    selectedTile: Tile | null;
    explodingIds: Set<string>;
    onTileClick: (tile: Tile) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid, selectedTile, explodingIds, onTileClick }) => {
    const [itemSize, setItemSize] = useState(52);
    const GRID_GAP = 4;

    useEffect(() => {
        const updateSize = () => {
            if (typeof window === 'undefined') return;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const horizontalPadding = 24;
            const verticalPadding = 220;
            const available = Math.max(260, Math.min(vw - horizontalPadding, vh - verticalPadding));
            const tileSize = Math.floor((available - GRID_GAP * (COLS - 1)) / COLS);
            const clampedTile = Math.max(36, Math.min(60, tileSize));
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
                        onClick={() => onTileClick(tile)}
                        size={ITEM_SIZE}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
