import { useEffect, useState, useCallback, useRef } from 'react';
import type { Grid, Tile, GemType, SpecialType } from '../types';
import { createBoard, findMatches, removeMatches, applyGravity, copyGrid, convertToSpecialPieces, getBombAffectedTiles, getLightningAffectedTiles, getCrossAffectedTiles, getNovaAffectedTiles, getPulseAffectedTiles, expandSpecialChain, hasPossibleMoves, reshuffleBoard, ROWS, COLS } from '../logic/boardUtils';

type SpecialGoalType = SpecialType | 'smash';
type Goal =
    | { type: 'collect'; value: number; color: GemType }
    | { type: 'collect_multi'; targets: Partial<Record<GemType, number>> }
    | { type: 'bombs'; value: number }
    | { type: 'lightning'; value: number }
    | { type: 'special'; value: number; special: SpecialGoalType }
    | { type: 'combo_x5'; value: number }
    | { type: 'trash'; value: number }
    | { type: 'boss'; value: number };

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

const GEM_ROTATION: GemType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const SPECIAL_GOAL_ROTATION: SpecialGoalType[] = ['bomb', 'lightning', 'cross', 'pulse', 'nova'];
const BOSS_DEBRIS_CAP = 14;

function normalizeSpecialGoal(special: SpecialGoalType, value: number): SpecialGoalType {
    // Product requirement: avoid "Pulse x3" goals.
    if (special === 'pulse' && value === 3) return 'nova';
    return special;
}

function buildLevelConfigs(): LevelConfig[] {
    const levels: LevelConfig[] = [];

    for (let idx = 0; idx < 60; idx++) {
        const level = idx + 1;
        const phase = idx % 10;
        const paletteA = GEM_ROTATION[idx % GEM_ROTATION.length];
        const paletteB = GEM_ROTATION[(idx + 2) % GEM_ROTATION.length];
        const inSecondSector = level > 30;

        if (phase === 9) {
            const baseBossHp = inSecondSector ? 170 + Math.floor((level - 30) * 2) : 120 + idx * 2;
            levels.push({
                mode: 'moves',
                limit: inSecondSector ? 28 : 26,
                goal: { type: 'boss', value: Math.floor(baseBossHp * 1.2) },
            });
            continue;
        }

        if (phase === 0) {
            levels.push({ mode: 'moves', limit: inSecondSector ? 24 : 28, goal: { type: 'collect', value: inSecondSector ? 22 : 18, color: paletteA } });
            continue;
        }

        if (phase === 1) {
            levels.push({ mode: 'moves', limit: inSecondSector ? 24 : 26, goal: { type: 'special', special: SPECIAL_GOAL_ROTATION[idx % SPECIAL_GOAL_ROTATION.length], value: inSecondSector ? 3 : 2 } });
            continue;
        }

        if (phase === 2) {
            levels.push({ mode: 'time', limit: inSecondSector ? 52 : 58, goal: { type: 'collect_multi', targets: { [paletteA]: inSecondSector ? 12 : 10, [paletteB]: inSecondSector ? 12 : 10 } } });
            continue;
        }

        if (phase === 3) {
            levels.push({ mode: 'moves', limit: inSecondSector ? 22 : 24, goal: { type: 'combo_x5', value: inSecondSector ? 3 : 2 } });
            continue;
        }

        if (phase === 4) {
            const trashCount = inSecondSector ? 14 : 10;
            levels.push({ mode: 'moves', limit: inSecondSector ? 24 : 26, goal: { type: 'trash', value: trashCount }, trashCount });
            continue;
        }

        if (phase === 5) {
            levels.push({ mode: 'time', limit: inSecondSector ? 56 : 62, goal: { type: 'collect', value: inSecondSector ? 20 : 18, color: paletteB } });
            continue;
        }

        if (phase === 6) {
            const value = inSecondSector ? 4 : 3;
            const special = normalizeSpecialGoal(SPECIAL_GOAL_ROTATION[(idx + 2) % SPECIAL_GOAL_ROTATION.length], value);
            levels.push({ mode: 'moves', limit: inSecondSector ? 23 : 24, goal: { type: 'special', special, value } });
            continue;
        }

        if (phase === 7) {
            levels.push({ mode: 'moves', limit: inSecondSector ? 22 : 24, goal: { type: 'collect_multi', targets: { [paletteA]: inSecondSector ? 14 : 12, [paletteB]: inSecondSector ? 14 : 12 } } });
            continue;
        }

        levels.push({ mode: 'moves', limit: inSecondSector ? 22 : 24, goal: { type: 'special', special: phase % 2 === 0 ? 'bomb' : 'lightning', value: inSecondSector ? 5 : 3 } });
    }

    levels[1] = { mode: 'moves', limit: 26, goal: { type: 'bombs', value: 4 } };
    levels[3] = { mode: 'moves', limit: 24, goal: { type: 'lightning', value: 2 } };
    return levels;
}

const LEVEL_CONFIGS: LevelConfig[] = buildLevelConfigs();

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
    const [levelCrossActivations, setLevelCrossActivations] = useState(0);
    const [levelPulseActivations, setLevelPulseActivations] = useState(0);
    const [levelNovaActivations, setLevelNovaActivations] = useState(0);
    const [levelSmashEvents, setLevelSmashEvents] = useState(0);
    const [comboX5Count, setComboX5Count] = useState(0);
    const [trashDestroyed, setTrashDestroyed] = useState(0);
    const [trashTotal, setTrashTotal] = useState(0);
    const [matchTick, setMatchTick] = useState(0);
    const [comboLevel, setComboLevel] = useState(0);
    const [comboId, setComboId] = useState(0);
    const [bigBlastId, setBigBlastId] = useState(0);
    const [smashId, setSmashId] = useState(0);
    const [bossHp, setBossHp] = useState(0);
    const [bossMaxHp, setBossMaxHp] = useState(0);
    const [bossHitTick, setBossHitTick] = useState(0);
    const [bossLastHitDamage, setBossLastHitDamage] = useState(0);
    const [goalClearId, setGoalClearId] = useState(0);
    const goalFinalizingRef = useRef(false);
    const gridRef = useRef<Grid>(grid);

    const levelIndex = (level - 1) % LEVEL_CONFIGS.length;
    const levelConfig = LEVEL_CONFIGS[levelIndex];

    const isTimeMode = levelConfig.mode === 'time';
    const goal = levelConfig.goal;

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

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
        goalFinalizingRef.current = false;
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
        setLevelCrossActivations(0);
        setLevelPulseActivations(0);
        setLevelNovaActivations(0);
        setLevelSmashEvents(0);
        setComboX5Count(0);
        setTrashDestroyed(0);
        setTrashTotal(config.trashCount ?? (config.goal.type === 'trash' ? config.goal.value : 0));
        setBossMaxHp(config.goal.type === 'boss' ? config.goal.value : 0);
        setBossHp(config.goal.type === 'boss' ? config.goal.value : 0);
        setBossLastHitDamage(0);
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
            if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse') {
                triggered.add(id);
            }
        });

        if (triggered.size === 0) return new Set<string>();
        return expandSpecialChain(g, triggered);
    }, []);

    const spawnSpecial = useCallback((type: 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse') => {
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
            const base = (pick.type === 'bomb' || pick.type === 'lightning' || pick.type === 'cross' || pick.type === 'nova')
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

                const base = (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova')
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
        let crosses = 0;
        let pulses = 0;
        let novas = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = g[y][x];
                if (!ids.has(tile.id) || tile.hasTrash) continue;
                if (tile.type === 'bomb') bombs += 1;
                if (tile.type === 'lightning') lightnings += 1;
                if (tile.type === 'cross') crosses += 1;
                if (tile.type === 'pulse') pulses += 1;
                if (tile.type === 'nova') novas += 1;
            }
        }
        if (bombs > 0) {
            setLevelBombActivations(prev => prev + bombs);
        }
        if (lightnings > 0) {
            setLevelLightningActivations(prev => prev + lightnings);
        }
        if (crosses > 0) {
            setLevelCrossActivations(prev => prev + crosses);
        }
        if (pulses > 0) {
            setLevelPulseActivations(prev => prev + pulses);
        }
        if (novas > 0) {
            setLevelNovaActivations(prev => prev + novas);
        }
    }, []);

    const applyBossDamage = useCallback((
        matchMap: Map<string, 'match' | 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'>,
        totalRemoved: Set<string>,
        comboChainIndex: number,
    ) => {
        if (goal.type !== 'boss' || totalRemoved.size === 0) return;

        let damage = 0;
        matchMap.forEach((type) => {
            if (type === 'match') damage += 2;
            else if (type === 'bomb') damage += 8;
            else if (type === 'lightning') damage += 10;
            else if (type === 'cross') damage += 12;
            else if (type === 'nova') damage += 14;
            else if (type === 'pulse') damage += 10;
        });

        const overflow = Math.max(0, totalRemoved.size - matchMap.size);
        damage += overflow;
        damage += Math.min(6, Math.floor(totalRemoved.size / 4));
        damage += Math.min(4, comboChainIndex);
        damage = Math.max(1, Math.floor(damage * 0.85));

        if (damage <= 0) return;

        setBossLastHitDamage(damage);
        setBossHitTick((tick) => tick + 1);
        setBossHp((prev) => Math.max(0, prev - damage));
    }, [goal.type]);

    const swapTiles = (g: Grid, t1: Tile, t2: Tile): Grid => {
        const newGrid = copyGrid(g);
        const tile1 = newGrid[t1.y][t1.x];
        const tile2 = newGrid[t2.y][t2.x];

        newGrid[t1.y][t1.x] = { ...tile2, x: t1.x, y: t1.y };
        newGrid[t2.y][t2.x] = { ...tile1, x: t2.x, y: t2.y };

        return newGrid;
    };

    const placeRandomSpecialOnGrid = useCallback((baseGrid: Grid, type: 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'): Grid => {
        const newGrid = copyGrid(baseGrid);
        const candidates: Tile[] = [];
        for (let y = 1; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = newGrid[y][x];
                if ((tile as { type?: unknown }).type == null || tile.hasTrash) continue;
                candidates.push(tile);
            }
        }
        if (candidates.length === 0) return baseGrid;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const gemType = (pick.type === 'bomb' || pick.type === 'lightning' || pick.type === 'cross' || pick.type === 'nova' || pick.type === 'pulse')
            ? pick.gemType
            : (pick.type as GemType);
        newGrid[pick.y][pick.x] = {
            ...pick,
            type,
            gemType,
        };
        return newGrid;
    }, []);

    const applyBossDebrisPressure = useCallback((baseGrid: Grid): Grid => {
        if (goal.type !== 'boss' || bossHp <= 0) return baseGrid;

        let existingTrash = 0;
        const candidates: Tile[] = [];
        for (let y = 1; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = baseGrid[y][x];
                if (tile.hasTrash) {
                    existingTrash += 1;
                    continue;
                }
                candidates.push(tile);
            }
        }

        const freeSlots = Math.max(0, BOSS_DEBRIS_CAP - existingTrash);
        if (freeSlots <= 0 || candidates.length === 0) return baseGrid;

        const hpRatio = bossMaxHp > 0 ? bossHp / bossMaxHp : 0;
        const desiredSpawn = hpRatio <= 0.35 ? 3 : hpRatio <= 0.7 ? 2 : 1;
        const spawnCount = Math.min(desiredSpawn, freeSlots, candidates.length);
        if (spawnCount <= 0) return baseGrid;

        const shuffled = [...candidates];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const nextGrid = copyGrid(baseGrid);
        for (let i = 0; i < spawnCount; i++) {
            const pick = shuffled[i];
            nextGrid[pick.y][pick.x] = { ...nextGrid[pick.y][pick.x], hasTrash: true };
        }

        if (hasPossibleMoves(nextGrid)) return nextGrid;
        return reshuffleBoard(nextGrid);
    }, [bossHp, bossMaxHp, goal.type]);

    const applyComboRewards = useCallback(async (baseGrid: Grid, comboCount: number, includePlayerMove: boolean = true): Promise<Grid> => {
        let activeGrid = baseGrid;
        const effectiveCombo = comboCount + (includePlayerMove ? 1 : 0);
        if (effectiveCombo >= 2) {
            setComboLevel(effectiveCombo);
            setComboId(id => id + 1);
        }
        if (effectiveCombo >= 4) {
            setComboX5Count(prev => prev + 1);
        }
        if (effectiveCombo >= 7) {
            const specials: Array<'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'> = ['bomb', 'lightning', 'cross', 'nova', 'pulse'];
            for (let i = 0; i < 3; i++) {
                activeGrid = placeRandomSpecialOnGrid(activeGrid, specials[Math.floor(Math.random() * specials.length)]);
            }
            setGrid(activeGrid);
            setSmashId((id) => id + 1);
            setLevelSmashEvents((prev) => prev + 1);
            await new Promise(r => setTimeout(r, 260));
        }
        return activeGrid;
    }, [placeRandomSpecialOnGrid]);

    const runVictoryMoveBonus = useCallback(async (startGrid: Grid, blasts: number): Promise<Grid> => {
        let activeGrid = copyGrid(startGrid);
        const totalBlasts = Math.max(0, Math.floor(blasts));

        for (let i = 0; i < totalBlasts; i++) {
            const candidates: Tile[] = [];
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const tile = activeGrid[y][x];
                    if (tile.hasTrash) continue;
                    candidates.push(tile);
                }
            }
            if (candidates.length === 0) break;

            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            let affected =
                i % 4 === 0 ? getBombAffectedTiles(activeGrid, pick.x, pick.y)
                : i % 4 === 1 ? getPulseAffectedTiles(activeGrid, pick.x, pick.y)
                : i % 4 === 2 ? getCrossAffectedTiles(activeGrid, pick.x, pick.y)
                : getLightningAffectedTiles(activeGrid, pick.x, pick.y, i % 2 === 0 ? 'horizontal' : 'vertical');

            affected = expandSpecialChain(activeGrid, affected, new Set([pick.id]));
            if (affected.size === 0) continue;

            if (explodeTimeoutRef.current !== null) {
                clearTimeout(explodeTimeoutRef.current);
            }
            setExplodingIds(new Set(affected));
            explodeTimeoutRef.current = window.setTimeout(() => {
                setExplodingIds(new Set());
                explodeTimeoutRef.current = null;
            }, 220);

            countCollected(activeGrid, affected);
            countSpecialGoalActivations(activeGrid, affected);
            clearTrashByImpact(activeGrid, affected);
            setScore(prev => prev + affected.size * 14 + 40);

            activeGrid = removeMatches(activeGrid, affected);
            setGrid(activeGrid);
            await new Promise(r => setTimeout(r, 120));

            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);
            await new Promise(r => setTimeout(r, 150));
        }

        setExplodingIds(new Set());
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        return activeGrid;
    }, [clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid]);

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
            applyBossDamage(matchMap, totalRemoved, comboCount);
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
                else if (type === 'cross') scoreGain += 60;
                else if (type === 'nova') scoreGain += 70;
                else if (type === 'pulse') scoreGain += 55;
            });
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));
            await new Promise(r => setTimeout(r, 320));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            const removeSet = new Set<string>([...regularMatches, ...triggeredByMatch]);
            clearTrashByImpact(activeGrid, removeSet, allMatched);
            activeGrid = removeMatches(activeGrid, removeSet);
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 320));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            const { grid: gravityGrid } = applyGravity(activeGrid);
            activeGrid = gravityGrid;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 460));
            while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        activeGrid = await applyComboRewards(activeGrid, comboCount, false);
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        setIsProcessing(false);
    }, [applyBossDamage, applyComboRewards, clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getTriggeredSpecialRemoval]);

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
            if (goal.type === 'special') {
                if (goal.special === 'bomb') return levelBombActivations >= goal.value;
                if (goal.special === 'lightning') return levelLightningActivations >= goal.value;
                if (goal.special === 'cross') return levelCrossActivations >= goal.value;
                if (goal.special === 'pulse') return levelPulseActivations >= goal.value;
                if (goal.special === 'nova') return levelNovaActivations >= goal.value;
                return levelSmashEvents >= goal.value;
            }
            if (goal.type === 'combo_x5') {
                return comboX5Count >= goal.value;
            }
            if (goal.type === 'trash') {
                return trashDestroyed >= goal.value;
            }
            return bossHp <= 0;
        })();

        if (!goalReached || isLevelUp || isProcessing || goalFinalizingRef.current) return;

        goalFinalizingRef.current = true;
        void (async () => {
            setIsProcessing(true);
            setGoalClearId((id) => id + 1);
            await new Promise(r => setTimeout(r, 900));
            const bonusBursts = levelConfig.mode === 'moves'
                ? Math.max(0, moves)
                : Math.max(0, Math.floor(timeLeft / 5));
            if (bonusBursts > 0) {
                await runVictoryMoveBonus(gridRef.current, bonusBursts);
            }
            setIsLevelUp(true);
        })();
    }, [bossHp, collected, comboX5Count, goal, isLevelUp, isProcessing, levelBombActivations, levelCrossActivations, levelLightningActivations, levelNovaActivations, levelPulseActivations, levelSmashEvents, levelConfig.mode, moves, runVictoryMoveBonus, timeLeft, trashDestroyed]);

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
        } else if (tile.type === 'pulse') {
            toRemove = getPulseAffectedTiles(activeGrid, x, y);
        } else if (tile.type === 'nova') {
            toRemove = getNovaAffectedTiles(activeGrid, x, y);
        }

        toRemove = expandSpecialChain(activeGrid, toRemove, new Set([tile.id]));

        if (explodeTimeoutRef.current !== null) {
            clearTimeout(explodeTimeoutRef.current);
        }
        setExplodingIds(new Set(toRemove));
        explodeTimeoutRef.current = window.setTimeout(() => {
            setExplodingIds(new Set());
            explodeTimeoutRef.current = null;
        }, 380);

        if (toRemove.size >= 10) {
            setBigBlastId(id => id + 1);
        }
        countCollected(activeGrid, toRemove);
        countSpecialGoalActivations(activeGrid, toRemove);
        applyBossDamage(new Map(), toRemove, 0);

        setScore(prev => prev + toRemove.size * 10);

        await new Promise(r => setTimeout(r, 180));

        clearTrashByImpact(activeGrid, toRemove);
        activeGrid = removeMatches(activeGrid, toRemove);
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 320));

        const { grid: gravityGrid } = applyGravity(activeGrid);
        activeGrid = gravityGrid;
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 460));

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
            applyBossDamage(matchMap, totalRemoved, comboCount);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 60;
                else if (type === 'nova') scoreGain += 70;
                else if (type === 'pulse') scoreGain += 55;
            });
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 320));

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

            await new Promise(r => setTimeout(r, 320));

            const { grid: gravityGrid2 } = applyGravity(activeGrid);
            activeGrid = gravityGrid2;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 460));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        activeGrid = await applyComboRewards(activeGrid, comboCount, true);
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        if (finalizeProcessing) {
            setIsProcessing(false);
        }
    }, [applyBossDamage, applyComboRewards, clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getPulseAffectedTiles, getTriggeredSpecialRemoval]);

    const activateSpecialCombo = useCallback(async (currentGrid: Grid, tiles: Tile[]) => {
        let activeGrid = copyGrid(currentGrid);
        let toRemove = new Set<string>();
        let comboCount = 0;

        for (const tile of tiles) {
            if (tile.type === 'bomb') {
                getBombAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            } else if (tile.type === 'lightning') {
                const direction = Math.random() < 0.5 ? 'horizontal' as const : 'vertical' as const;
                getLightningAffectedTiles(activeGrid, tile.x, tile.y, direction).forEach(id => toRemove.add(id));
            } else if (tile.type === 'cross') {
                getCrossAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            } else if (tile.type === 'pulse') {
                getPulseAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            } else if (tile.type === 'nova') {
                getNovaAffectedTiles(activeGrid, tile.x, tile.y).forEach(id => toRemove.add(id));
            }
        }

        toRemove = expandSpecialChain(activeGrid, toRemove, new Set(tiles.map((t) => t.id)));

        if (explodeTimeoutRef.current !== null) {
            clearTimeout(explodeTimeoutRef.current);
        }
        setExplodingIds(new Set(toRemove));
        explodeTimeoutRef.current = window.setTimeout(() => {
            setExplodingIds(new Set());
            explodeTimeoutRef.current = null;
        }, 380);

        if (toRemove.size >= 10) {
            setBigBlastId(id => id + 1);
        }
        countCollected(activeGrid, toRemove);
        countSpecialGoalActivations(activeGrid, toRemove);
        applyBossDamage(new Map(), toRemove, 0);

        setScore(prev => prev + toRemove.size * 10);

        await new Promise(r => setTimeout(r, 180));

        clearTrashByImpact(activeGrid, toRemove);
        activeGrid = removeMatches(activeGrid, toRemove);
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 320));

        const { grid: gravityGrid } = applyGravity(activeGrid);
        activeGrid = gravityGrid;
        setGrid(activeGrid);

        await new Promise(r => setTimeout(r, 460));

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
            applyBossDamage(matchMap, totalRemoved, comboCount);

            let scoreGain = 0;
            matchMap.forEach((type) => {
                scoreGain += 10;
                if (type === 'bomb') scoreGain += 40;
                else if (type === 'lightning') scoreGain += 40;
                else if (type === 'cross') scoreGain += 60;
                else if (type === 'nova') scoreGain += 70;
                else if (type === 'pulse') scoreGain += 55;
            });
            const extraTriggeredCount = [...totalRemoved].filter(id => !allMatched.has(id)).length;
            if (extraTriggeredCount > 0) {
                scoreGain += extraTriggeredCount * 10;
            }
            setScore(prev => prev + scoreGain);

            await new Promise(r => setTimeout(r, 320));

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

            await new Promise(r => setTimeout(r, 320));

            const { grid: gravityGrid2 } = applyGravity(activeGrid);
            activeGrid = gravityGrid2;
            setGrid(activeGrid);

            await new Promise(r => setTimeout(r, 460));

            matchMap = findMatches(activeGrid);
            iteration++;
        }

        activeGrid = await applyComboRewards(activeGrid, comboCount, true);
        const playableGrid = ensurePlayableGrid(activeGrid);
        if (playableGrid !== activeGrid) {
            activeGrid = playableGrid;
            setGrid(activeGrid);
        }
        setIsProcessing(false);
    }, [applyBossDamage, applyComboRewards, clearTrashByImpact, countCollected, countSpecialGoalActivations, ensurePlayableGrid, getPulseAffectedTiles, getTriggeredSpecialRemoval]);

    const attemptSwap = async (firstTile: Tile, secondTile: Tile) => {
        if (isProcessing || isPaused || (levelConfig.mode === 'moves' && moves <= 0) || (levelConfig.mode === 'time' && timeLeft <= 0) || isLevelUp) return;
        const dx = Math.abs(secondTile.x - firstTile.x);
        const dy = Math.abs(secondTile.y - firstTile.y);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        if (!isAdjacent) return;
        if (firstTile.hasTrash || secondTile.hasTrash) return;

        const selectedWasSpecial = firstTile.type === 'bomb' || firstTile.type === 'lightning' || firstTile.type === 'cross' || firstTile.type === 'nova' || firstTile.type === 'pulse';
        const clickedWasSpecial = secondTile.type === 'bomb' || secondTile.type === 'lightning' || secondTile.type === 'cross' || secondTile.type === 'nova' || secondTile.type === 'pulse';
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
                    const pressuredGrid = applyBossDebrisPressure(gridRef.current);
                    if (pressuredGrid !== gridRef.current) {
                        setGrid(pressuredGrid);
                    }
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
                const pressuredGrid = applyBossDebrisPressure(gridRef.current);
                if (pressuredGrid !== gridRef.current) {
                    setGrid(pressuredGrid);
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
            const pressuredGrid = applyBossDebrisPressure(gridRef.current);
            if (pressuredGrid !== gridRef.current) {
                setGrid(pressuredGrid);
            }
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
            if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse') {
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

    const addExtraMoves = useCallback((amount: number): boolean => {
        if (!Number.isFinite(amount)) return false;
        const normalized = Math.floor(amount);
        if (normalized <= 0) return false;
        if (levelConfig.mode !== 'moves' || isLevelUp) return false;
        setMoves(prev => prev + normalized);
        return true;
    }, [isLevelUp, levelConfig.mode]);

    const addExtraTime = useCallback((seconds: number): boolean => {
        if (!Number.isFinite(seconds)) return false;
        const normalized = Math.floor(seconds);
        if (normalized <= 0) return false;
        if (levelConfig.mode !== 'time' || isLevelUp) return false;
        setTimeLeft(prev => prev + normalized);
        return true;
    }, [isLevelUp, levelConfig.mode]);

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
        levelCrossActivations,
        levelPulseActivations,
        levelNovaActivations,
        levelSmashEvents,
        comboX5Count,
        trashDestroyed,
        trashTotal,
        spawnSpecial,
        handleTileSwipe,
        handleTileClick,
        matchTick,
        comboLevel,
        comboId,
        bigBlastId,
        smashId,
        bossHp,
        bossMaxHp,
        bossHitTick,
        bossLastHitDamage,
        goalClearId,
        handleRestart,
        handleNextLevel,
        startAtLevel,
        addExtraMoves,
        addExtraTime,
    };
};












