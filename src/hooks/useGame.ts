import { useEffect, useState, useCallback, useRef } from 'react';
import type { Grid, Tile, GemType } from '../types';
import { createBoard, findMatches, removeMatches, applyGravity, copyGrid, convertToSpecialPieces, getBombAffectedTiles, getLightningAffectedTiles, getCrossAffectedTiles, expandSpecialChain, hasPossibleMoves, reshuffleBoard, ROWS, COLS } from '../logic/boardUtils';

type Goal =
    | { type: 'score'; value: number }
    | { type: 'collect'; value: number; color: GemType };

type LevelConfig = {
    mode: 'moves' | 'time';
    limit: number;
    goal: Goal;
};

type LevelStateSnapshot = {
    grid: Grid;
    moves: number;
    timeLeft: number;
};

const LEVEL_CONFIGS: LevelConfig[] = [
    { mode: 'moves', limit: 28, goal: { type: 'score', value: 1100 } },
    { mode: 'moves', limit: 26, goal: { type: 'collect', value: 18, color: 'red' } },
    { mode: 'time', limit: 55, goal: { type: 'score', value: 1300 } },
    { mode: 'moves', limit: 24, goal: { type: 'collect', value: 20, color: 'blue' } },
    { mode: 'time', limit: 65, goal: { type: 'score', value: 1700 } },
    { mode: 'moves', limit: 22, goal: { type: 'collect', value: 22, color: 'green' } },
    { mode: 'moves', limit: 24, goal: { type: 'collect', value: 20, color: 'yellow' } },
    { mode: 'time', limit: 60, goal: { type: 'collect', value: 18, color: 'purple' } },
    { mode: 'moves', limit: 23, goal: { type: 'collect', value: 20, color: 'orange' } },
];

export const useGame = () => {
    const [grid, setGrid] = useState<Grid>(createBoard());
    const [score, setScore] = useState(0);

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
    const [validMoves, setValidMoves] = useState(0);
    const [moves, setMoves] = useState<number>(LEVEL_CONFIGS[0].mode === 'moves' ? LEVEL_CONFIGS[0].limit : 30);
    const [timeLeft, setTimeLeft] = useState<number>(LEVEL_CONFIGS[0].mode === 'time' ? LEVEL_CONFIGS[0].limit : 60);
    const [collected, setCollected] = useState<Record<GemType, number>>({
        red: 0,
        blue: 0,
        green: 0,
        yellow: 0,
        purple: 0,
        orange: 0,
    });
    const [match3Moves, setMatch3Moves] = useState(0);
    const [bombDoubleActivations, setBombDoubleActivations] = useState(0);
    const [lightningSwaps, setLightningSwaps] = useState(0);
    const [matchTick, setMatchTick] = useState(0);
    const [comboLevel, setComboLevel] = useState(0);
    const [comboId, setComboId] = useState(0);
    const [bigBlastId, setBigBlastId] = useState(0);

    const levelIndex = (level - 1) % LEVEL_CONFIGS.length;
    const levelConfig = LEVEL_CONFIGS[levelIndex];

    const isTimeMode = levelConfig.mode === 'time';
    const goal = levelConfig.goal;

    // Update ref when state changes
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    const preparedLevelRef = useRef<{ level: number; snapshot: LevelStateSnapshot } | null>(null);

    const getLevelConfig = useCallback((targetLevel: number): LevelConfig => {
        return LEVEL_CONFIGS[(targetLevel - 1) % LEVEL_CONFIGS.length];
    }, []);

    const createLevelSnapshot = useCallback((config: LevelConfig): LevelStateSnapshot => {
        return {
            grid: createBoard(),
            moves: config.mode === 'moves' ? config.limit : 30,
            timeLeft: config.mode === 'time' ? config.limit : 60,
        };
    }, []);

    const prepareLevel = useCallback((targetLevel: number) => {
        const sanitizedLevel = Math.max(1, Math.floor(targetLevel));
        preparedLevelRef.current = {
            level: sanitizedLevel,
            snapshot: createLevelSnapshot(getLevelConfig(sanitizedLevel)),
        };
    }, [createLevelSnapshot, getLevelConfig]);

    const resetLevelState = (config = levelConfig, snapshot?: LevelStateSnapshot) => {
        const source = snapshot ?? createLevelSnapshot(config);
        setGrid(source.grid);
        setScore(0);
        setMoves(source.moves);
        setTimeLeft(source.timeLeft);
        setCollected({
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0,
            purple: 0,
            orange: 0,
        });
        setValidMoves(0);
    };

    useEffect(() => {
        prepareLevel(level + 1);
    }, [level, prepareLevel]);

    const ensurePlayableGrid = useCallback((candidate: Grid): Grid => {
        if (hasPossibleMoves(candidate)) return candidate;
        return reshuffleBoard(candidate);
    }, []);

    const getTriggeredSpecialRemoval = useCallback((g: Grid, matchedIds: Set<string>): Set<string> => {
        const idMap = new Map<string, Tile>();
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                idMap.set(tile.id, tile);
            }
        }

        const triggered = new Set<string>();
        matchedIds.forEach((id) => {
            const tile = idMap.get(id);
            if (!tile) return;
            if (tile.type === 'bomb' || tile.type === 'lightning') {
                triggered.add(id);
            }
        });

        if (triggered.size === 0) return new Set<string>();
        return expandSpecialChain(g, triggered);
    }, []);

    const spawnSpecial = useCallback((type: 'bomb' | 'lightning') => {
        setGrid(prev => {
            const newGrid = copyGrid(prev);
            const candidates: Tile[] = [];
            for (let y = 1; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const tile = newGrid[y][x];
                    if ((tile as any).type == null) continue;
                    candidates.push(tile);
                }
            }
            if (candidates.length === 0) return prev;
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            const base = (pick.type === 'bomb' || pick.type === 'lightning' || pick.type === 'cross')
                ? pick.gemType
                : (pick.type as GemType);
            newGrid[pick.y][pick.x] = {
                ...pick,
                type,
                gemType: base
            };
            return newGrid;
        });
    }, []);

    const countCollected = useCallback((g: Grid, ids: Set<string>) => {
        if (goal.type !== 'collect') return;
        const color = goal.color;
        let add = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (ids.has(tile.id)) {
                    if ((tile.type as any) == null) continue;
                    const base = (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross')
                        ? tile.gemType
                        : (tile.type as GemType);
                    if (base === color) add++;
                }
            }
        }
        if (add > 0) {
            setCollected(prev => ({ ...prev, [color]: prev[color] + add }));
        }
    }, [goal]);

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
        let comboCount = 0;

        while (matchMap.size > 0 && iteration < 10) { // Safety break
            // Separate regular matches from special pieces
            const specialPieceMap = new Map<string, string>();
            const regularMatches = new Set<string>();
            const allMatched = new Set<string>();
            
            matchMap.forEach((type, tileId) => {
                allMatched.add(tileId);
                if (type !== 'match') {
                    specialPieceMap.set(tileId, type);
                } else {
                    regularMatches.add(tileId);
                }
            });
            const triggeredByMatch = getTriggeredSpecialRemoval(activeGrid, allMatched);
            const totalRemoved = new Set<string>([...allMatched, ...triggeredByMatch]);

            if (iteration === 0) {
                let hasSpecial = false;
                matchMap.forEach((type) => {
                    if (type !== 'match') hasSpecial = true;
                });
                if (!hasSpecial) {
                    setMatch3Moves(c => c + 1);
                }
            }

            countCollected(activeGrid, totalRemoved);
            comboCount += 1;
            setMatchTick(t => t + 1);
            if (totalRemoved.size >= 12) {
                setBigBlastId(id => id + 1);
            }

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
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            // Wait if paused
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // Wait for "match" animation
            await new Promise(r => setTimeout(r, 200));

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            // 2. Remove only regular matches, keep special pieces
            const removeSet = new Set<string>([...regularMatches, ...triggeredByMatch]);
            activeGrid = removeMatches(activeGrid, removeSet);
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

        if (comboCount >= 2) {
            setComboLevel(comboCount);
            setComboId(id => id + 1);
        }
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        setIsProcessing(false);
    }, [countCollected, ensurePlayableGrid, getTriggeredSpecialRemoval]);

    // Level Up Check
    useEffect(() => {
        const goalReached =
            (goal.type === 'score' && score >= goal.value) ||
            (goal.type === 'collect' && goal.color && collected[goal.color] >= goal.value);

        if (goalReached && !isLevelUp) {
            // Level Up Trigger
            setIsProcessing(true);
            setIsLevelUp(true);
            // We wait for user to click "Next Level"
        }
    }, [score, isLevelUp, goal, collected]);

    useEffect(() => {
        if (!isTimeMode || isPaused || isProcessing || isLevelUp) return;
        if (timeLeft <= 0) return;

        const id = window.setInterval(() => {
            setTimeLeft(t => Math.max(0, t - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [isTimeMode, isPaused, isProcessing, isLevelUp, timeLeft]);

    const handleNextLevel = () => {
        setIsLevelTransition(true);
        if (levelTransitionRef.current !== null) {
            clearTimeout(levelTransitionRef.current);
        }
        const nextLevel = level + 1;
        const nextConfig = getLevelConfig(nextLevel);
        const prepared = preparedLevelRef.current;
        const snapshot = prepared && prepared.level === nextLevel ? prepared.snapshot : undefined;

        setLevel(nextLevel);
        resetLevelState(nextConfig, snapshot);
        setIsLevelUp(false);
        setIsProcessing(false);
        prepareLevel(nextLevel + 1);

        levelTransitionRef.current = window.setTimeout(() => {
            setIsLevelTransition(false);
            levelTransitionRef.current = null;
        }, 500);
    };

    const attemptSwap = async (firstTile: Tile, secondTile: Tile) => {
        if (isProcessing || isPaused || (levelConfig.mode === 'moves' && moves <= 0) || (levelConfig.mode === 'time' && timeLeft <= 0) || isLevelUp) return;
        const dx = Math.abs(secondTile.x - firstTile.x);
        const dy = Math.abs(secondTile.y - firstTile.y);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        if (!isAdjacent) return;

        const selectedWasSpecial = firstTile.type === 'bomb' || firstTile.type === 'lightning';
        const clickedWasSpecial = secondTile.type === 'bomb' || secondTile.type === 'lightning';
        const nextGrid = swapTiles(grid, firstTile, secondTile);
        setGrid(nextGrid);
        setSelectedTile(null);

        if (selectedWasSpecial || clickedWasSpecial) {
            setMoves(m => m - 1);
            setValidMoves(v => v + 1);
            setIsProcessing(true);
            const selectedWasLightning = firstTile.type === 'lightning';
            const clickedWasLightning = secondTile.type === 'lightning';
            if (selectedWasLightning || clickedWasLightning) {
                setLightningSwaps(c => c + 1);
            }
            if (selectedWasSpecial && clickedWasSpecial) {
                const t1 = findTileById(nextGrid, firstTile.id);
                const t2 = findTileById(nextGrid, secondTile.id);
                if (t1 && t2) {
                    await activateSpecialCombo(nextGrid, [t1, t2]);
                } else {
                    setIsProcessing(false);
                }
            } else {
                const triggerId = selectedWasSpecial ? firstTile.id : secondTile.id;
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

        const matches = findMatches(nextGrid);
        if (matches.size > 0) {
            setMoves(m => m - 1);
            setValidMoves(v => v + 1);
            setIsProcessing(true);
            await processBoard(nextGrid);
        } else {
            setIsProcessing(true);
            await new Promise(r => setTimeout(r, 300));
            setGrid(grid);
            setIsProcessing(false);
        }
    };

    const handleTileSwipe = async (fromTile: Tile, toTile: Tile) => {
        await attemptSwap(fromTile, toTile);
    };

    const handleTileClick = async (clickedTile: Tile) => {
        if (isProcessing || isPaused || (levelConfig.mode === 'moves' && moves <= 0) || (levelConfig.mode === 'time' && timeLeft <= 0) || isLevelUp) return;

        // Check if clicking a special piece twice to activate it
        if (selectedTile && selectedTile.id === clickedTile.id) {
            const tile = grid[clickedTile.y][clickedTile.x];
            if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross') {
                // Activate special piece
                setIsProcessing(true);
                setSelectedTile(null);
                if (tile.type === 'bomb') {
                    setBombDoubleActivations(c => c + 1);
                }
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
                await attemptSwap(selectedTile, clickedTile);
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
        let comboCount = 0;

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

        if (toRemove.size >= 10) {
            setBigBlastId(id => id + 1);
        }
        countCollected(activeGrid, toRemove);

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
            const allMatched = new Set<string>();
            matchMap.forEach((type, tileId) => {
                allMatched.add(tileId);
                if (type === 'match') {
                    regularMatches.add(tileId);
                }
            });
            const triggeredByMatch = getTriggeredSpecialRemoval(activeGrid, allMatched);
            const totalRemoved = new Set<string>([...allMatched, ...triggeredByMatch]);

            // Convert and remove
            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);
            comboCount += 1;
            setMatchTick(t => t + 1);
            countCollected(activeGrid, totalRemoved);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 50;
            });
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 200));

            // Find all regular matches (3-matches)
            const allRegularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    allRegularMatches.add(tileId);
                }
            });

            const removeSet = new Set<string>([...allRegularMatches, ...triggeredByMatch]);
            activeGrid = removeMatches(activeGrid, removeSet);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 200));

            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 300));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        if (comboCount >= 2) {
            setComboLevel(comboCount);
            setComboId(id => id + 1);
        }
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        if (finalizeProcessing) {
            setIsProcessing(false);
        }
    }, [countCollected, ensurePlayableGrid, getTriggeredSpecialRemoval]);

    const activateSpecialCombo = useCallback(async (currentGrid: Grid, tiles: Tile[]) => {
        let activeGrid = copyGrid(currentGrid);
        let toRemove = new Set<string>();
        let comboCount = 0;

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

        if (toRemove.size >= 10) {
            setBigBlastId(id => id + 1);
        }
        countCollected(activeGrid, toRemove);

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
            const allMatched = new Set<string>();
            matchMap.forEach((type, tileId) => {
                allMatched.add(tileId);
                if (type === 'match') {
                    regularMatches.add(tileId);
                }
            });
            const triggeredByMatch = getTriggeredSpecialRemoval(activeGrid, allMatched);
            const totalRemoved = new Set<string>([...allMatched, ...triggeredByMatch]);

            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);
            comboCount += 1;
            setMatchTick(t => t + 1);
            countCollected(activeGrid, totalRemoved);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 50;
            });
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 200));

            const allRegularMatches = new Set<string>();
            matchMap.forEach((type, tileId) => {
                if (type === 'match') {
                    allRegularMatches.add(tileId);
                }
            });

            const removeSet = new Set<string>([...allRegularMatches, ...triggeredByMatch]);
            activeGrid = removeMatches(activeGrid, removeSet);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 200));

            const { grid: gravityGrid2 } = applyGravity(activeGrid);
            activeGrid = gravityGrid2;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 300));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        if (comboCount >= 2) {
            setComboLevel(comboCount);
            setComboId(id => id + 1);
        }
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        setIsProcessing(false);
    }, [countCollected, ensurePlayableGrid, getTriggeredSpecialRemoval]);

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
        resetLevelState(levelConfig);
        setIsProcessing(false);
        setSelectedTile(null);
    };

    const startAtLevel = (nextLevel: number) => {
        const sanitizedLevel = Math.max(1, Math.floor(nextLevel));
        const targetConfig = getLevelConfig(sanitizedLevel);

        if (levelTransitionRef.current !== null) {
            clearTimeout(levelTransitionRef.current);
            levelTransitionRef.current = null;
        }

        const prepared = preparedLevelRef.current;
        const snapshot = prepared && prepared.level === sanitizedLevel ? prepared.snapshot : undefined;

        setLevel(sanitizedLevel);
        resetLevelState(targetConfig, snapshot);
        setIsLevelUp(false);
        setIsPaused(false);
        setIsProcessing(false);
        setSelectedTile(null);
        setIsLevelTransition(false);
        setExplodingIds(new Set());
        prepareLevel(sanitizedLevel + 1);
    };

    return {
        grid,
        score,
        moves,
        timeLeft,
        levelConfig,
        level,
        collected,
        selectedTile,
        isProcessing,
        isLevelUp,
        isPaused,
        setIsPaused,
        explodingIds,
        isLevelTransition,
        validMoves,
        match3Moves,
        bombDoubleActivations,
        lightningSwaps,
        spawnSpecial,
        handleTileSwipe,
        handleTileClick,
        matchTick,
        comboLevel,
        comboId,
        bigBlastId,
        handleRestart,
        handleNextLevel,
        startAtLevel
    };
};


