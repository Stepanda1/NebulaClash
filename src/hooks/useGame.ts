import { useEffect, useState, useCallback, useRef } from 'react';
import type { Grid, Tile } from '../types';
import { createBoard, findMatches, removeMatches, applyGravity, copyGrid, convertToSpecialPieces, getBombAffectedTiles, getLightningAffectedTiles, getCrossAffectedTiles, expandSpecialChain, ROWS, COLS } from '../logic/boardUtils';

export const useGame = () => {
    const [grid, setGrid] = useState<Grid>(createBoard());
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(30);

    const [level, setLevel] = useState(1);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLevelUp, setIsLevelUp] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false);
    const [explodingIds, setExplodingIds] = useState<Set<string>>(new Set());
    const explodeTimeoutRef = useRef<number | null>(null);
    const [isLevelTransition, setIsLevelTransition] = useState(false);
    const levelTransitionRef = useRef<number | null>(null);

    // Update ref when state changes
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    // Level logic
    const scoreToNextLevel = level * 1000;

    // Helper to safely swap two tiles in the grid
    const swapTiles = (g: Grid, t1: Tile, t2: Tile): Grid => {
        const newGrid = copyGrid(g);
        const tile1 = newGrid[t1.y][t1.x];
        const tile2 = newGrid[t2.y][t2.x];

        // Swap types and IDs but keep x/y (or swap x/y?)
        // Actually, in the grid array, we swap the objects at the positions.
        newGrid[t1.y][t1.x] = { ...tile2, x: t1.x, y: t1.y };
        newGrid[t2.y][t2.x] = { ...tile1, x: t2.x, y: t2.y };

        return newGrid;
    };

    const processBoard = useCallback(async (currentGrid: Grid) => {
        setIsProcessing(true);
        let activeGrid = currentGrid;
        let matchMap = findMatches(activeGrid);
        let iteration = 0;

        while (matchMap.size > 0 && iteration < 10) { // Safety break
            // Separate regular matches from special pieces
            const specialPieceMap = new Map<string, string>();
            const regularMatches = new Set<string>();
            
            matchMap.forEach((type, tileId) => {
                if (type !== 'match') {
                    specialPieceMap.set(tileId, type);
                } else {
                    regularMatches.add(tileId);
                }
            });

            // 1. Convert matched 4+ to special pieces and remove only regular 3-matches
            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);
            
            // Calculate score
            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 50;
            });
            setScore(prev => prev + scoreGain);

            // Wait if paused
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // Wait for "match" animation
            await new Promise(r => setTimeout(r, 200));

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // 2. Remove only regular matches, keep special pieces
            activeGrid = removeMatches(activeGrid, regularMatches);
            setGrid(activeGrid);

            // Wait for "disappear" animation
            await new Promise(r => setTimeout(r, 200));

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // 3. Apply gravity
            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);

            // Wait for "fall" animation
            await new Promise(r => setTimeout(r, 300));

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // 4. Check for new matches
            matchMap = findMatches(activeGrid);
            iteration++;
        }

        setIsProcessing(false);
    }, []);

    // Level Up Check
    useEffect(() => {
        if (score >= scoreToNextLevel && !isLevelUp) {
            // Level Up Trigger
            setIsProcessing(true);
            setIsLevelUp(true);
            // We wait for user to click "Next Level"
        }
    }, [score, scoreToNextLevel, isLevelUp]);

    const handleNextLevel = () => {
        setIsLevelTransition(true);
        if (levelTransitionRef.current !== null) {
            clearTimeout(levelTransitionRef.current);
        }
        setLevel(l => l + 1);
        setScore(0);
        setMoves(30);
        setGrid(createBoard());
        setIsLevelUp(false);
        setIsProcessing(false);
        levelTransitionRef.current = window.setTimeout(() => {
            setIsLevelTransition(false);
            levelTransitionRef.current = null;
        }, 500);
    };

    const handleTileClick = async (clickedTile: Tile) => {
        if (isProcessing || isPaused || moves <= 0 || isLevelUp) return;

        // Check if clicking a special piece twice to activate it
        if (selectedTile && selectedTile.id === clickedTile.id) {
            const tile = grid[clickedTile.y][clickedTile.x];
            if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross') {
                // Activate special piece
                setIsProcessing(true);
                setSelectedTile(null);
                await activateSpecialPiece(grid, tile);
                return;
            }
        }

        if (!selectedTile) {
            setSelectedTile(clickedTile);
        } else {
            // Check if adjacent
            const dx = Math.abs(clickedTile.x - selectedTile.x);
            const dy = Math.abs(clickedTile.y - selectedTile.y);
            const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

            if (isAdjacent) {
                // 1. Try Swap
                const selectedWasSpecial = selectedTile.type === 'bomb' || selectedTile.type === 'lightning';
                const clickedWasSpecial = clickedTile.type === 'bomb' || clickedTile.type === 'lightning';
                const nextGrid = swapTiles(grid, selectedTile, clickedTile);
                setGrid(nextGrid);
                setSelectedTile(null); // Deselect immediately

                if (selectedWasSpecial || clickedWasSpecial) {
                    // Trigger special on swap
                    setMoves(m => m - 1);
                    setIsProcessing(true);
                    if (selectedWasSpecial && clickedWasSpecial) {
                        const t1 = findTileById(nextGrid, selectedTile.id);
                        const t2 = findTileById(nextGrid, clickedTile.id);
                        if (t1 && t2) {
                            await activateSpecialCombo(nextGrid, [t1, t2]);
                        } else {
                            setIsProcessing(false);
                        }
                    } else {
                        const triggerId = selectedWasSpecial ? selectedTile.id : clickedTile.id;
                        const triggerTile = findTileById(nextGrid, triggerId);
                        if (triggerTile) {
                            await activateSpecialPiece(nextGrid, triggerTile, false);
                        } else {
                            setIsProcessing(false);
                            return;
                        }
                        setIsProcessing(false);
                    }
                    return;
                }

                // 2. Check Valid
                const matches = findMatches(nextGrid);
                if (matches.size > 0) {
                    // Valid move -> Process
                    setMoves(m => m - 1);
                    setIsProcessing(true); // Set immediately to prevent gaps
                    await processBoard(nextGrid);
                } else {
                    // Invalid -> Swap back after small delay
                    setIsProcessing(true);
                    await new Promise(r => setTimeout(r, 300));
                    setGrid(grid); // Revert to old grid
                    setIsProcessing(false);
                }
            } else {
                // Just select the new one
                setSelectedTile(clickedTile);
            }
        }
    };

    const activateSpecialPiece = useCallback(async (currentGrid: Grid, tile: Tile, finalizeProcessing: boolean = true) => {
        let activeGrid = copyGrid(currentGrid);
        const x = tile.x;
        const y = tile.y;
        let toRemove = new Set<string>();

        if (tile.type === 'bomb') {
            toRemove = getBombAffectedTiles(activeGrid, x, y);
        } else if (tile.type === 'lightning') {
            toRemove = getLightningAffectedTiles(activeGrid, x, y);
        } else if (tile.type === 'cross') {
            toRemove = getCrossAffectedTiles(activeGrid, x, y);
        }

        toRemove = expandSpecialChain(activeGrid, toRemove);

        if (explodeTimeoutRef.current !== null) {
            clearTimeout(explodeTimeoutRef.current);
        }
        setExplodingIds(new Set(toRemove));
        explodeTimeoutRef.current = window.setTimeout(() => {
            setExplodingIds(new Set());
            explodeTimeoutRef.current = null;
        }, 250);

        // Calculate score
        setScore(prev => prev + toRemove.size * 10);

        // Wait for animation
        await new Promise(r => setTimeout(r, 100));

        // Remove tiles
        activeGrid = removeMatches(activeGrid, toRemove);
        setGrid(activeGrid);

        // Wait for disappear animation
        await new Promise(r => setTimeout(r, 200));

        // Apply gravity
        const { grid: gravityGrid } = applyGravity(activeGrid);
        activeGrid = gravityGrid;
        setGrid(activeGrid);

        // Wait for fall animation
        await new Promise(r => setTimeout(r, 300));

        // Check for new matches
        let matchMap = findMatches(activeGrid);
        let iteration = 0;

        while (matchMap.size > 0 && iteration < 10) {
            // Separate regular matches from special pieces
            const regularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    regularMatches.add(tileId);
                }
            });

            // Convert and remove
            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 50;
            });
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 200));

            // Find all regular matches (3-matches)
            const allRegularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    allRegularMatches.add(tileId);
                }
            });

            activeGrid = removeMatches(activeGrid, allRegularMatches);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 200));

            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 300));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        if (finalizeProcessing) {
            setIsProcessing(false);
        }
    }, []);

    const activateSpecialCombo = useCallback(async (currentGrid: Grid, tiles: Tile[]) => {
        let activeGrid = copyGrid(currentGrid);
        let toRemove = new Set<string>();

        for (const tile of tiles) {
            if (tile.type === 'bomb') {
                getBombAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            } else if (tile.type === 'lightning') {
                getLightningAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            } else if (tile.type === 'cross') {
                getCrossAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            }
        }

        toRemove = expandSpecialChain(activeGrid, toRemove);

        if (explodeTimeoutRef.current !== null) {
            clearTimeout(explodeTimeoutRef.current);
        }
        setExplodingIds(new Set(toRemove));
        explodeTimeoutRef.current = window.setTimeout(() => {
            setExplodingIds(new Set());
            explodeTimeoutRef.current = null;
        }, 250);

        setScore(prev => prev + toRemove.size * 10);

        await new Promise(r => setTimeout(r, 100));

        activeGrid = removeMatches(activeGrid, toRemove);
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 200));

        const { grid: gravityGrid } = applyGravity(activeGrid);
        activeGrid = gravityGrid;
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 300));

        let matchMap = findMatches(activeGrid);
        let iteration = 0;

        while (matchMap.size > 0 && iteration < 10) {
            const regularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    regularMatches.add(tileId);
                }
            });

            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 50;
            });
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 200));

            const allRegularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    allRegularMatches.add(tileId);
                }
            });

            activeGrid = removeMatches(activeGrid, allRegularMatches);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 200));

            const { grid: gravityGrid2 } = applyGravity(activeGrid);
            activeGrid = gravityGrid2;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 300));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        setIsProcessing(false);
    }, []);

    const findTileById = (g: Grid, id: string): Tile | null => {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (g[y][x].id === id) return g[y][x];
            }
        }
        return null;
    };

    const handleRestart = () => {
        setIsPaused(false);
        setGrid(createBoard());
        setScore(0);
        setMoves(30);
        setLevel(1);
        setIsProcessing(false);
        setSelectedTile(null);
    };

    return {
        grid,
        score,
        moves,
        level,
        scoreToNextLevel,
        selectedTile,
        isProcessing,
        isLevelUp,
        isPaused,
        setIsPaused,
        explodingIds,
        isLevelTransition,
        handleTileClick,
        handleRestart,
        handleNextLevel
    };
};
