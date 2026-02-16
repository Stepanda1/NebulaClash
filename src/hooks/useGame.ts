import { useEffect, useState, useCallback, useRef } from 'react';
import type { Grid, Tile, GemType } from '../types';
import { createBoard, findMatches, removeMatches, applyGravity, copyGrid, convertToSpecialPieces, getBombAffectedTiles, getLightningAffectedTiles, getCrossAffectedTiles, expandSpecialChain, hasPossibleMoves, reshuffleBoard, ROWS, COLS } from '../logic/boardUtils';

type Goal =
    | { type: 'collect'; value: number; color: GemType }
    | { type: 'collect_multi'; targets: Partial<Record<GemType, number>> }
    | { type: 'bombs'; value: number }
    | { type: 'lightning'; value: number }
    | { type: 'trash'; value: number };

type LevelConfig = {
    mode: 'moves' | 'time';
    limit: number;
    goal: Goal;
    trashCount?: number;
};

type LevelStateSnapshot = {
    grid: Grid;
    moves: number;
    timeLeft: number;
};

const LEVEL_CONFIGS: LevelConfig[] = [
    { mode: 'moves', limit: 28, goal: { type: 'collect', value: 18, color: 'red' } },
    { mode: 'moves', limit: 26, goal: { type: 'bombs', value: 4 } },
    { mode: 'time', limit: 55, goal: { type: 'collect_multi', targets: { red: 10, green: 10 } } },
    { mode: 'moves', limit: 24, goal: { type: 'lightning', value: 4 } },
    { mode: 'moves', limit: 26, goal: { type: 'trash', value: 10 }, trashCount: 10 },
    { mode: 'time', limit: 60, goal: { type: 'collect', value: 18, color: 'blue' } },
    { mode: 'moves', limit: 24, goal: { type: 'collect_multi', targets: { yellow: 12, purple: 12 } } },
    { mode: 'moves', limit: 22, goal: { type: 'trash', value: 12 }, trashCount: 12 },
    { mode: 'moves', limit: 24, goal: { type: 'bombs', value: 5 } },
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
    const [levelBombActivations, setLevelBombActivations] = useState(0);
    const [levelLightningActivations, setLevelLightningActivations] = useState(0);
    const [trashDestroyed, setTrashDestroyed] = useState(0);
    const [trashTotal, setTrashTotal] = useState(0);
    const [matchTick, setMatchTick] = useState(0);
    const [comboLevel, setComboLevel] = useState(0);
    const [comboId, setComboId] = useState(0);
    const [bigBlastId, setBigBlastId] = useState(0);

    const levelIndex = (level - 1) % LEVEL_CONFIGS.length;
    const levelConfig = LEVEL_CONFIGS[levelIndex];

    const isTimeMode = levelConfig.mode === 'time';
    const goal = levelConfig.goal;

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const preparedLevelRef = useRef<{ level: number; snapshot: LevelStateSnapshot } | null>(null);

    const getLevelConfig = useCallback((targetLevel: number): LevelConfig => {
        return LEVEL_CONFIGS[(targetLevel - 1) % LEVEL_CONFIGS.length];
    }, []);

    const addTrashToGrid = useCallback((baseGrid: Grid, count: number): Grid => {
        const capped = Math.max(0, Math.min(count, ROWS * COLS));
        if (capped === 0) return baseGrid;

        const next = copyGrid(baseGrid);
        const positions: Array<{ x: number; y: number }> = [];
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                positions.push({ x, y });
            }
        }

        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < capped; i++) {
            const p = positions[i];
            next[p.y][p.x] = { ...next[p.y][p.x], hasTrash: true };
        }

        return next;
    }, []);

    const createLevelSnapshot = useCallback((config: LevelConfig): LevelStateSnapshot => {
        const fresh = createBoard();
        const withTrash = addTrashToGrid(fresh, config.trashCount ?? 0);

        return {
            grid: withTrash,
            moves: config.mode === 'moves' ? config.limit : 30,
            timeLeft: config.mode === 'time' ? config.limit : 60,
        };
    }, [addTrashToGrid]);

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
        setLevelBombActivations(0);
        setLevelLightningActivations(0);
        setTrashDestroyed(0);
        setTrashTotal(config.trashCount ?? (config.goal.type === 'trash' ? config.goal.value : 0));
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
                    if ((tile as { type?: unknown }).type == null || tile.hasTrash) continue;
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
                gemType: base,
            };
            return newGrid;
        });
    }, []);

    const countCollected = useCallback((g: Grid, ids: Set<string>) => {
        if (goal.type !== 'collect' && goal.type !== 'collect_multi') return;

        const targets: Partial<Record<GemType, number>> =
            goal.type === 'collect'
                ? { [goal.color]: goal.value }
                : goal.targets;

        const addByColor: Partial<Record<GemType, number>> = {};

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!ids.has(tile.id) || tile.hasTrash) continue;
                if ((tile as { type?: unknown }).type == null) continue;

                const base = (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross')
                    ? tile.gemType
                    : (tile.type as GemType);

                if (!base || targets[base] == null) continue;
                addByColor[base] = (addByColor[base] ?? 0) + 1;
            }
        }

        if (Object.keys(addByColor).length === 0) return;

        setCollected(prev => {
            const next = { ...prev };
            Object.entries(addByColor).forEach(([color, value]) => {
                const key = color as GemType;
                next[key] = prev[key] + (value ?? 0);
            });
            return next;
        });
    }, [goal]);

        const collectAdjacentTrash = useCallback((g: Grid, sourceIds: Set<string>): Set<string> => {
        const hits = new Set<string>();

        const markTrash = (x: number, y: number) => {
            if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
            const tile = g[y][x];
            if (tile.hasTrash) {
                hits.add(tile.id);
            }
        };

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!sourceIds.has(tile.id)) continue;
                markTrash(x + 1, y);
                markTrash(x - 1, y);
                markTrash(x, y + 1);
                markTrash(x, y - 1);
            }
        }

        return hits;
    }, []);

    const clearTrashByImpact = useCallback((g: Grid, directHitIds: Set<string>, adjacentMatchIds?: Set<string>) => {
        const trashToClear = new Set<string>();

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!tile.hasTrash) continue;
                if (directHitIds.has(tile.id)) {
                    trashToClear.add(tile.id);
                }
            }
        }

        if (adjacentMatchIds && adjacentMatchIds.size > 0) {
            const adjacentHits = collectAdjacentTrash(g, adjacentMatchIds);
            adjacentHits.forEach((id) => trashToClear.add(id));
        }

        if (trashToClear.size === 0) return;

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!trashToClear.has(tile.id)) continue;
                g[y][x] = { ...tile, hasTrash: false };
            }
        }

        setTrashDestroyed(prev => prev + trashToClear.size);
    }, [collectAdjacentTrash]);

    const countSpecialGoalActivations = useCallback((g: Grid, ids: Set<string>) => {
        let bombs = 0;
        let lightnings = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!ids.has(tile.id) || tile.hasTrash) continue;
                if (tile.type === 'bomb') bombs += 1;
                if (tile.type === 'lightning') lightnings += 1;
            }
        }
        if (bombs > 0) {
            setLevelBombActivations(prev => prev + bombs);
        }
        if (lightnings > 0) {
            setLevelLightningActivations(prev => prev + lightnings);
        }
    }, []);

    const swapTiles = (g: Grid, t1: Tile, t2: Tile): Grid => {
        const newGrid = copyGrid(g);
        const tile1 = newGrid[t1.y][t1.x];
        const tile2 = newGrid[t2.y][t2.x];

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
            countSpecialGoalActivations(activeGrid, totalRemoved);
            comboCount += 1;
            setMatchTick(t => t + 1);
            if (totalRemoved.size >= 12) {
                setBigBlastId(id => id + 1);
            }

            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);

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

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));
            await new Promise(r => setTimeout(r, 200));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            const removeSet = new Set<string>([...regularMatches, ...triggeredByMatch]);
            clearTrashByImpact(activeGrid, removeSet, allMatched);
            activeGrid = removeMatches(activeGrid, removeSet);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 200));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 300));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

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
    }, [clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getTriggeredSpecialRemoval]);

    useEffect(() => {
        const goalReached = (() => {
            if (goal.type === 'collect') {
                return collected[goal.color] >= goal.value;
            }
            if (goal.type === 'collect_multi') {
                return Object.entries(goal.targets).every(([color, target]) => {
                    if (!target) return true;
                    return collected[color as GemType] >= target;
                });
            }
            if (goal.type === 'bombs') {
                return levelBombActivations >= goal.value;
            }
            if (goal.type === 'lightning') {
                return levelLightningActivations >= goal.value;
            }
            return trashDestroyed >= goal.value;
        })();

        if (goalReached && !isLevelUp) {
            setIsProcessing(true);
            setIsLevelUp(true);
        }
    }, [collected, goal, isLevelUp, levelBombActivations, levelLightningActivations, trashDestroyed]);

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

    const findTileById = (g: Grid, id: string): Tile | null => {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (g[y][x].id === id) return g[y][x];
            }
        }
        return null;
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
        countSpecialGoalActivations(activeGrid, toRemove);

        setScore(prev => prev + toRemove.size * 10);

        await new Promise(r => setTimeout(r, 100));

        clearTrashByImpact(activeGrid, toRemove);
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
            const allMatched = new Set<string>();
            matchMap.forEach((_type, tileId) => {
                allMatched.add(tileId);
            });
            const triggeredByMatch = getTriggeredSpecialRemoval(activeGrid, allMatched);
            const totalRemoved = new Set<string>([...allMatched, ...triggeredByMatch]);

            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);
            comboCount += 1;
            setMatchTick(t => t + 1);
            countCollected(activeGrid, totalRemoved);
            countSpecialGoalActivations(activeGrid, totalRemoved);

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
            clearTrashByImpact(activeGrid, removeSet, allMatched);
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
        if (finalizeProcessing) {
            setIsProcessing(false);
        }
    }, [clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getTriggeredSpecialRemoval]);

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
        countSpecialGoalActivations(activeGrid, toRemove);

        setScore(prev => prev + toRemove.size * 10);

        await new Promise(r => setTimeout(r, 100));

        clearTrashByImpact(activeGrid, toRemove);
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
            const allMatched = new Set<string>();
            matchMap.forEach((_type, tileId) => {
                allMatched.add(tileId);
            });
            const triggeredByMatch = getTriggeredSpecialRemoval(activeGrid, allMatched);
            const totalRemoved = new Set<string>([...allMatched, ...triggeredByMatch]);

            activeGrid = convertToSpecialPieces(activeGrid, matchMap);
            setGrid(activeGrid);
            comboCount += 1;
            setMatchTick(t => t + 1);
            countCollected(activeGrid, totalRemoved);
            countSpecialGoalActivations(activeGrid, totalRemoved);

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
            clearTrashByImpact(activeGrid, removeSet, allMatched);
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
    }, [clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getTriggeredSpecialRemoval]);

    const attemptSwap = async (firstTile: Tile, secondTile: Tile) => {
        if (isProcessing || isPaused || (levelConfig.mode === 'moves' && moves <= 0) || (levelConfig.mode === 'time' && timeLeft <= 0) || isLevelUp) return;
        const dx = Math.abs(secondTile.x - firstTile.x);
        const dy = Math.abs(secondTile.y - firstTile.y);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        if (!isAdjacent) return;
        if (firstTile.hasTrash || secondTile.hasTrash) return;

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

        if (selectedTile && selectedTile.id === clickedTile.id) {
            const tile = grid[clickedTile.y][clickedTile.x];
            if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross') {
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
            const dx = Math.abs(clickedTile.x - selectedTile.x);
            const dy = Math.abs(clickedTile.y - selectedTile.y);
            const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

            if (isAdjacent) {
                await attemptSwap(selectedTile, clickedTile);
            } else {
                setSelectedTile(clickedTile);
            }
        }
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
        levelBombActivations,
        levelLightningActivations,
        trashDestroyed,
        trashTotal,
        spawnSpecial,
        handleTileSwipe,
        handleTileClick,
        matchTick,
        comboLevel,
        comboId,
        bigBlastId,
        handleRestart,
        handleNextLevel,
        startAtLevel,
    };
};












