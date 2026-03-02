import { GEM_TYPES } from '../types';
import type { Grid, Tile, GemType } from '../types';

export const ROWS = 8;
export const COLS = 8;

export const generateRandomTileType = (): GemType => {
    return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
};

const createBoardWithoutMatches = (): Grid => {
    const grid: Grid = [];
    for (let y = 0; y < ROWS; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < COLS; x++) {
            let type = generateRandomTileType();

            // Prevent Horizontal Matches (look back 2)
            while (
                (x >= 2 && row[x - 1].type === type && row[x - 2].type === type) ||
                (y >= 2 && grid[y - 1][x].type === type && grid[y - 2][x].type === type)
            ) {
                type = generateRandomTileType();
            }

            row.push({
                id: `${x}-${y}-${Date.now()}-${Math.random()}`,
                type,
                x,
                y,
            });
        }
        grid.push(row);
    }
    return grid;
};

export const createBoard = (): Grid => {
    // Keep re-rolling until the start board has at least one legal move.
    for (let i = 0; i < 120; i++) {
        const candidate = createBoardWithoutMatches();
        if (hasPossibleMoves(candidate)) {
            return candidate;
        }
    }
    const fallback = createBoardWithoutMatches();
    if (hasPossibleMoves(fallback)) return fallback;
    return reshuffleBoard(fallback);
};

export const findMatches = (grid: Grid): Map<string, 'match' | 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'> => {
    const matchMap = new Map<string, 'match' | 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'>();
    const processed = new Set<string>();

    const getTileBaseType = (tile: Tile): GemType | null => {
        if (tile.hasTrash) return null;
        if (tile.type == null) return null;
        if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse') {
            return tile.gemType || null;
        }
        return tile.type as GemType;
    };

    const isSameType = (t1: Tile, t2: Tile): boolean => {
        const b1 = getTileBaseType(t1);
        const b2 = getTileBaseType(t2);
        return b1 !== null && b1 === b2;
    };

    const addGroup = (tileIds: string[], type: 'match' | 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse') => {
        const hasExistingSpecial = tileIds.some((id) => {
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const tile = grid[y][x];
                    if (tile.id !== id) continue;
                    return tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse';
                }
            }
            return false;
        });

        // Existing specials should not be consumed to craft a stronger special:
        // they stay regular matched tiles and explode through chain resolution.
        const finalType = hasExistingSpecial && type !== 'match' ? 'match' : type;

        for (const id of tileIds) {
            if (processed.has(id)) return;
        }
        for (const id of tileIds) {
            matchMap.set(id, finalType);
            processed.add(id);
        }
    };

    // 1) Strong shapes next: T/L/Nova patterns should win over weaker square/line bombs.
    // T-shapes (5) -> pulse
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS - 2; x++) {
            const a = grid[y][x];
            const b = grid[y][x + 1];
            const c = grid[y][x + 2];

            if (!isSameType(a, b) || !isSameType(a, c)) continue;
            const noLeftExtension = x === 0 || !isSameType(a, grid[y][x - 1]);
            const noRightExtension = x + 3 >= COLS || !isSameType(a, grid[y][x + 3]);
            if (!noLeftExtension || !noRightExtension) continue;

            // Two above the center
            if (y >= 2) {
                const up1 = grid[y - 1][x + 1];
                const up2 = grid[y - 2][x + 1];
                const up3 = y >= 3 ? grid[y - 3][x + 1] : null;
                if (isSameType(a, up1) && isSameType(a, up2) && !(up3 && isSameType(a, up3))) {
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'pulse');
                }
            }

            // Two below the center
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x + 1];
                const down2 = grid[y + 2][x + 1];
                const down3 = y <= ROWS - 4 ? grid[y + 3][x + 1] : null;
                if (isSameType(a, down1) && isSameType(a, down2) && !(down3 && isSameType(a, down3))) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'pulse');
                }
            }
        }
    }

    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS - 2; y++) {
            const a = grid[y][x];
            const b = grid[y + 1][x];
            const c = grid[y + 2][x];

            if (!isSameType(a, b) || !isSameType(a, c)) continue;
            const noTopExtension = y === 0 || !isSameType(a, grid[y - 1][x]);
            const noBottomExtension = y + 3 >= ROWS || !isSameType(a, grid[y + 3][x]);
            if (!noTopExtension || !noBottomExtension) continue;

            // Two left of center
            if (x >= 2) {
                const left1 = grid[y + 1][x - 1];
                const left2 = grid[y + 1][x - 2];
                const left3 = x >= 3 ? grid[y + 1][x - 3] : null;
                if (isSameType(a, left1) && isSameType(a, left2) && !(left3 && isSameType(a, left3))) {
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'pulse');
                }
            }

            // Two right of center
            if (x <= COLS - 3) {
                const right1 = grid[y + 1][x + 1];
                const right2 = grid[y + 1][x + 2];
                const right3 = x <= COLS - 4 ? grid[y + 1][x + 3] : null;
                if (isSameType(a, right1) && isSameType(a, right2) && !(right3 && isSameType(a, right3))) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'pulse');
                }
            }
        }
    }

    // 1b) Guide-aligned extended T-shapes (6-7) -> nova
    // Supported forms:
    // - Vertical stem of 4/5 with a 2-cell arm branching from the 3rd cell
    // - Horizontal stem of 4/5 with a 2-cell arm branching from the 3rd cell
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            const center = grid[y][x];

            for (const stemLen of [4, 5]) {
                if (y + stemLen > ROWS) continue;

                const stemIds = [center.id];
                let stemOk = true;
                for (let i = 1; i < stemLen; i++) {
                    const next = grid[y + i][x];
                    if (!isSameType(center, next)) {
                        stemOk = false;
                        break;
                    }
                    stemIds.push(next.id);
                }
                if (!stemOk) continue;

                const branchY = y + 2;

                if (x + 2 < COLS) {
                    const right1 = grid[branchY][x + 1];
                    const right2 = grid[branchY][x + 2];
                    if (isSameType(center, right1) && isSameType(center, right2)) {
                        addGroup([...stemIds, right1.id, right2.id], 'nova');
                    }
                }

                if (x - 2 >= 0) {
                    const left1 = grid[branchY][x - 1];
                    const left2 = grid[branchY][x - 2];
                    if (isSameType(center, left1) && isSameType(center, left2)) {
                        addGroup([...stemIds, left1.id, left2.id], 'nova');
                    }
                }
            }
        }
    }

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const center = grid[y][x];

            for (const stemLen of [4, 5]) {
                if (x + stemLen > COLS) continue;

                const stemIds = [center.id];
                let stemOk = true;
                for (let i = 1; i < stemLen; i++) {
                    const next = grid[y][x + i];
                    if (!isSameType(center, next)) {
                        stemOk = false;
                        break;
                    }
                    stemIds.push(next.id);
                }
                if (!stemOk) continue;

                const branchX = x + 2;

                if (y + 2 < ROWS) {
                    const down1 = grid[y + 1][branchX];
                    const down2 = grid[y + 2][branchX];
                    if (isSameType(center, down1) && isSameType(center, down2)) {
                        addGroup([...stemIds, down1.id, down2.id], 'nova');
                    }
                }

                if (y - 2 >= 0) {
                    const up1 = grid[y - 1][branchX];
                    const up2 = grid[y - 2][branchX];
                    if (isSameType(center, up1) && isSameType(center, up2)) {
                        addGroup([...stemIds, up1.id, up2.id], 'nova');
                    }
                }
            }
        }
    }

    // 2) L-shapes (5) -> cross
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS - 2; x++) {
            const a = grid[y][x];
            const b = grid[y][x + 1];
            const c = grid[y][x + 2];

            if (!isSameType(a, b) || !isSameType(a, c)) continue;

            // Vertical leg on left end
            if (y >= 2) {
                const up1 = grid[y - 1][x];
                const up2 = grid[y - 2][x];
                if (isSameType(a, up1) && isSameType(a, up2)) {
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'cross');
                }
            }
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x];
                const down2 = grid[y + 2][x];
                if (isSameType(a, down1) && isSameType(a, down2)) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'cross');
                }
            }

            // Vertical leg on right end
            if (y >= 2) {
                const up1 = grid[y - 1][x + 2];
                const up2 = grid[y - 2][x + 2];
                if (isSameType(a, up1) && isSameType(a, up2)) {
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'cross');
                }
            }
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x + 2];
                const down2 = grid[y + 2][x + 2];
                if (isSameType(a, down1) && isSameType(a, down2)) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'cross');
                }
            }
        }
    }

    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS - 2; y++) {
            const a = grid[y][x];
            const b = grid[y + 1][x];
            const c = grid[y + 2][x];

            if (!isSameType(a, b) || !isSameType(a, c)) continue;

            // Horizontal leg on top end
            if (x >= 2) {
                const left1 = grid[y][x - 1];
                const left2 = grid[y][x - 2];
                if (isSameType(a, left1) && isSameType(a, left2)) {
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'cross');
                }
            }
            if (x <= COLS - 3) {
                const right1 = grid[y][x + 1];
                const right2 = grid[y][x + 2];
                if (isSameType(a, right1) && isSameType(a, right2)) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'cross');
                }
            }

            // Horizontal leg on bottom end
            if (x >= 2) {
                const left1 = grid[y + 2][x - 1];
                const left2 = grid[y + 2][x - 2];
                if (isSameType(a, left1) && isSameType(a, left2)) {
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'cross');
                }
            }
            if (x <= COLS - 3) {
                const right1 = grid[y + 2][x + 1];
                const right2 = grid[y + 2][x + 2];
                if (isSameType(a, right1) && isSameType(a, right2)) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'cross');
                }
            }
        }
    }

    // 2b) 2x2 square -> bomb (after stronger T/L/Nova shapes)
    for (let y = 0; y < ROWS - 1; y++) {
        for (let x = 0; x < COLS - 1; x++) {
            const a = grid[y][x];
            const b = grid[y][x + 1];
            const c = grid[y + 1][x];
            const d = grid[y + 1][x + 1];
            if (isSameType(a, b) && isSameType(a, c) && isSameType(a, d)) {
                addGroup([a.id, b.id, c.id, d.id], 'bomb');
            }
        }
    }

    // 3) Line matches: 5 -> lightning, 4 -> bomb, 3+ otherwise -> match
    for (let y = 0; y < ROWS; y++) {
        let x = 0;
        while (x < COLS) {
            const start = x;
            const t = grid[y][x];
            let end = x;
            while (end + 1 < COLS && isSameType(t, grid[y][end + 1])) {
                end++;
            }
            const len = end - start + 1;
            if (len >= 3) {
                const ids = [];
                for (let i = start; i <= end; i++) ids.push(grid[y][i].id);
                if (len === 5) addGroup(ids, 'lightning');
                else if (len === 4) addGroup(ids, 'bomb');
                else addGroup(ids, 'match');
            }
            x = end + 1;
        }
    }

    for (let x = 0; x < COLS; x++) {
        let y = 0;
        while (y < ROWS) {
            const start = y;
            const t = grid[y][x];
            let end = y;
            while (end + 1 < ROWS && isSameType(t, grid[end + 1][x])) {
                end++;
            }
            const len = end - start + 1;
            if (len >= 3) {
                const ids = [];
                for (let i = start; i <= end; i++) ids.push(grid[i][x].id);
                if (len === 5) addGroup(ids, 'lightning');
                else if (len === 4) addGroup(ids, 'bomb');
                else addGroup(ids, 'match');
            }
            y = end + 1;
        }
    }

    return matchMap;
};

// Convert matched tiles to single special piece (one per combo)
export const convertToSpecialPieces = (grid: Grid, matchMap: Map<string, 'match' | 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse'>): Grid => {
    const newGrid = copyGrid(grid);

    const specialIds = new Set<string>();
    matchMap.forEach((type, tileId) => {
        if (type === 'bomb' || type === 'lightning' || type === 'cross' || type === 'nova' || type === 'pulse') {
            specialIds.add(tileId);
        }
    });

    const visited = new Set<string>();

    const getNeighbors = (x: number, y: number) => {
        const neighbors: Tile[] = [];
        if (y > 0) neighbors.push(newGrid[y - 1][x]);
        if (y < ROWS - 1) neighbors.push(newGrid[y + 1][x]);
        if (x > 0) neighbors.push(newGrid[y][x - 1]);
        if (x < COLS - 1) neighbors.push(newGrid[y][x + 1]);
        return neighbors;
    };

    const getNeighborCount = (tile: Tile, groupSet: Set<string>) => {
        let count = 0;
        for (const n of getNeighbors(tile.x, tile.y)) {
            if (groupSet.has(n.id)) count++;
        }
        return count;
    };

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = newGrid[y][x];
            if (!specialIds.has(tile.id) || visited.has(tile.id)) continue;

            const specialType = matchMap.get(tile.id) as 'bomb' | 'lightning' | 'cross' | 'nova' | 'pulse';
            const group: Tile[] = [];
            const queue: Tile[] = [tile];
            visited.add(tile.id);

            while (queue.length > 0) {
                const current = queue.shift()!;
                group.push(current);
                for (const neighbor of getNeighbors(current.x, current.y)) {
                if (specialIds.has(neighbor.id) && !visited.has(neighbor.id) && matchMap.get(neighbor.id) === specialType) {
                        visited.add(neighbor.id);
                        queue.push(neighbor);
                    }
                }
            }

            if (group.length === 0) continue;

            const groupSet = new Set(group.map(t => t.id));
            const sorted = [...group].sort((a, b) => {
                const na = getNeighborCount(a, groupSet);
                const nb = getNeighborCount(b, groupSet);
                if (na !== nb) return nb - na;
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            const specialTile = sorted[0];
            const gemType = (specialTile.type === 'bomb' || specialTile.type === 'lightning' || specialTile.type === 'cross' || specialTile.type === 'nova' || specialTile.type === 'pulse')
                ? specialTile.gemType
                : specialTile.type as GemType;

            for (const t of group) {
                if (t.id === specialTile.id) {
                    newGrid[t.y][t.x] = {
                        ...t,
                        type: specialType,
                        gemType
                    };
                } else {
                    newGrid[t.y][t.x] = {
                        ...t,
                        type: null as any
                    };
                }
            }
        }
    }

    return newGrid;
};

// Get all tiles affected by a bomb (center + 4 adjacent)
export const getBombAffectedTiles = (grid: Grid, x: number, y: number): Set<string> => {
    const affected = new Set<string>();
    affected.add(grid[y][x].id); // center
    
    // 4 adjacent tiles
    if (y > 0) affected.add(grid[y - 1][x].id); // up
    if (y < ROWS - 1) affected.add(grid[y + 1][x].id); // down
    if (x > 0) affected.add(grid[y][x - 1].id); // left
    if (x < COLS - 1) affected.add(grid[y][x + 1].id); // right
    
    return affected;
};

// Get all tiles affected by lightning (one random line - row or column)
export const getLightningAffectedTiles = (grid: Grid, x: number, y: number, direction?: 'horizontal' | 'vertical'): Set<string> => {
    const affected = new Set<string>();
    
    // If direction not specified, pick randomly
    const selectedDirection = direction || (Math.random() < 0.5 ? 'horizontal' : 'vertical');
    
    if (selectedDirection === 'horizontal') {
        // Entire row
        for (let i = 0; i < COLS; i++) {
            affected.add(grid[y][i].id);
        }
    } else {
        // Entire column
        for (let i = 0; i < ROWS; i++) {
            affected.add(grid[i][x].id);
        }
    }
    
    return affected;
};

// Pulse: 3x3 area
export const getPulseAffectedTiles = (grid: Grid, x: number, y: number): Set<string> => {
    const affected = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
            affected.add(grid[ny][nx].id);
        }
    }
    return affected;
};

// Nova: diagonal starburst + local 3x3 shockwave
export const getNovaAffectedTiles = (grid: Grid, x: number, y: number): Set<string> => {
    const affected = getPulseAffectedTiles(grid, x, y);

    // Main diagonal
    let dx = x;
    let dy = y;
    while (dx >= 0 && dy >= 0) {
        affected.add(grid[dy][dx].id);
        dx--;
        dy--;
    }
    dx = x + 1;
    dy = y + 1;
    while (dx < COLS && dy < ROWS) {
        affected.add(grid[dy][dx].id);
        dx++;
        dy++;
    }

    // Anti-diagonal
    dx = x;
    dy = y;
    while (dx < COLS && dy >= 0) {
        affected.add(grid[dy][dx].id);
        dx++;
        dy--;
    }
    dx = x - 1;
    dy = y + 1;
    while (dx >= 0 && dy < ROWS) {
        affected.add(grid[dy][dx].id);
        dx--;
        dy++;
    }

    return affected;
};

export const expandSpecialChain = (grid: Grid, initial: Set<string>, skipSpecialIds: Set<string> = new Set()): Set<string> => {
    const idMap = new Map<string, Tile>();
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = grid[y][x];
            idMap.set(tile.id, tile);
        }
    }

    const toRemove = new Set<string>(initial);
    const queue: Tile[] = [];
    const triggered = new Set<string>();

    for (const id of initial) {
        const tile = idMap.get(id);
        if (tile && (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross' || tile.type === 'nova' || tile.type === 'pulse') && !skipSpecialIds.has(tile.id)) {
            queue.push(tile);
            triggered.add(tile.id);
        }
    }

    while (queue.length > 0) {
        const tile = queue.shift()!;
        const affected = tile.type === 'bomb'
                ? getBombAffectedTiles(grid, tile.x, tile.y)
                : tile.type === 'lightning'
                    ? getLightningAffectedTiles(grid, tile.x, tile.y)
                    : tile.type === 'cross'
                        ? getCrossAffectedTiles(grid, tile.x, tile.y)
                        : tile.type === 'pulse'
                            ? getPulseAffectedTiles(grid, tile.x, tile.y)
                            : getNovaAffectedTiles(grid, tile.x, tile.y);

        for (const id of affected) {
            if (!toRemove.has(id)) {
                toRemove.add(id);
            }
            const nextTile = idMap.get(id);
            if (nextTile && (nextTile.type === 'bomb' || nextTile.type === 'lightning' || nextTile.type === 'cross' || nextTile.type === 'nova' || nextTile.type === 'pulse') && !triggered.has(nextTile.id)) {
                triggered.add(nextTile.id);
                queue.push(nextTile);
            }
        }
    }

    return toRemove;
};

// Cross: plus-shape radius 2 (9 elements max)
export const getCrossAffectedTiles = (grid: Grid, x: number, y: number): Set<string> => {
    const affected = new Set<string>();
    affected.add(grid[y][x].id);
    for (let d = 1; d <= 2; d++) {
        if (x - d >= 0) affected.add(grid[y][x - d].id);
        if (x + d < COLS) affected.add(grid[y][x + d].id);
        if (y - d >= 0) affected.add(grid[y - d][x].id);
        if (y + d < ROWS) affected.add(grid[y + d][x].id);
    }
    return affected;
};

export const removeMatches = (grid: Grid, matchedIds: Set<string>): Grid => {
    const newGrid = copyGrid(grid);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (matchedIds.has(newGrid[y][x].id)) {
                newGrid[y][x].type = null as any; // Mark as empty
            }
        }
    }
    return newGrid;
};

export const applyGravity = (grid: Grid): { grid: Grid; newTiles: Tile[] } => {
    const newGrid = copyGrid(grid);
    const newTiles: Tile[] = [];

    for (let x = 0; x < COLS; x++) {
        let segmentBottom = ROWS - 1;

        for (let y = ROWS - 1; y >= -1; y--) {
            const isBarrier = y >= 0 && newGrid[y][x].hasTrash;
            if (!isBarrier && y !== -1) continue;

            const segmentTop = y + 1;
            let writeY = segmentBottom;

            for (let readY = segmentBottom; readY >= segmentTop; readY--) {
                const tile = newGrid[readY][x];
                if (tile.type == null || tile.hasTrash) continue;
                if (readY !== writeY) {
                    newGrid[writeY][x] = { ...tile, x, y: writeY };
                    newGrid[readY][x] = { ...newGrid[readY][x], type: null as any };
                }
                writeY--;
            }

            for (let fillY = writeY; fillY >= segmentTop; fillY--) {
                const newTile: Tile = {
                    id: `${x}-${fillY}-${Date.now()}-${Math.random()}`,
                    type: generateRandomTileType(),
                    x,
                    y: fillY,
                };
                newGrid[fillY][x] = newTile;
                newTiles.push(newTile);
            }

            segmentBottom = y - 1;
        }
    }

    return { grid: newGrid, newTiles };
};

export const copyGrid = (grid: Grid): Grid => {
    return grid.map(row => row.map(tile => ({ ...tile })));
};

export const findHintMove = (grid: Grid, requiredType: 'match' | 'bomb' | 'lightning' = 'match'): { from: { x: number; y: number }; to: { x: number; y: number } } | null => {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if ((grid[y][x] as any).type == null || grid[y][x].hasTrash) {
                return null;
            }
        }
    }

    const trySwap = (g: Grid, x1: number, y1: number, x2: number, y2: number): Grid => {
        const newGrid = copyGrid(g);
        const t1 = newGrid[y1][x1];
        const t2 = newGrid[y2][x2];
        if (t1.hasTrash || t2.hasTrash) return newGrid;
        newGrid[y1][x1] = { ...t2, x: x1, y: y1 };
        newGrid[y2][x2] = { ...t1, x: x2, y: y2 };
        return newGrid;
    };

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (x + 1 < COLS && !grid[y][x].hasTrash && !grid[y][x + 1].hasTrash) {
                const swapped = trySwap(grid, x, y, x + 1, y);
                const matches = findMatches(swapped);
                let hasRequired = false;
                matches.forEach((type) => {
                    if (type === requiredType) hasRequired = true;
                });
                if (hasRequired && y > 0) {
                    return { from: { x, y }, to: { x: x + 1, y } };
                }
            }
            if (y + 1 < ROWS && !grid[y][x].hasTrash && !grid[y + 1][x].hasTrash) {
                const swapped = trySwap(grid, x, y, x, y + 1);
                const matches = findMatches(swapped);
                let hasRequired = false;
                matches.forEach((type) => {
                    if (type === requiredType) hasRequired = true;
                });
                if (hasRequired && y > 0) {
                    return { from: { x, y }, to: { x, y: y + 1 } };
                }
            }
        }
    }
    return null;
};

export const findLightningSwap = (grid: Grid): { from: { x: number; y: number }; to: { x: number; y: number } } | null => {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = grid[y][x];
            if (tile.type !== 'lightning' || tile.hasTrash) continue;
            const candidates = [
                { x: x + 1, y },
                { x: x - 1, y },
                { x, y: y + 1 },
                { x, y: y - 1 },
            ];
            for (const c of candidates) {
                if (c.x < 0 || c.x >= COLS || c.y < 0 || c.y >= ROWS) continue;
                if (c.y === 0) continue;
                const target = grid[c.y][c.x];
                if ((target as any).type == null || target.hasTrash) continue;
                if (y === 0) continue;
                return { from: { x, y }, to: { x: c.x, y: c.y } };
            }
        }
    }
    return null;
};

export const hasPossibleMoves = (grid: Grid): boolean => {
    const trySwap = (g: Grid, x1: number, y1: number, x2: number, y2: number): Grid => {
        const newGrid = copyGrid(g);
        const t1 = newGrid[y1][x1];
        const t2 = newGrid[y2][x2];
        if (t1.hasTrash || t2.hasTrash) return newGrid;
        newGrid[y1][x1] = { ...t2, x: x1, y: y1 };
        newGrid[y2][x2] = { ...t1, x: x2, y: y2 };
        return newGrid;
    };

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = grid[y][x];
            if ((tile as any).type == null) return false;
        }
    }

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const current = grid[y][x];
            if (x + 1 < COLS) {
                const right = grid[y][x + 1];
                if (!current.hasTrash && !right.hasTrash && (
                    current.type === 'bomb' || current.type === 'lightning' || current.type === 'cross' || current.type === 'nova' ||
                    right.type === 'bomb' || right.type === 'lightning' || right.type === 'cross' || right.type === 'nova'
                )) {
                    return true;
                }
                if (!current.hasTrash && !right.hasTrash && findMatches(trySwap(grid, x, y, x + 1, y)).size > 0) {
                    return true;
                }
            }
            if (y + 1 < ROWS) {
                const down = grid[y + 1][x];
                if (!current.hasTrash && !down.hasTrash && (
                    current.type === 'bomb' || current.type === 'lightning' || current.type === 'cross' || current.type === 'nova' ||
                    down.type === 'bomb' || down.type === 'lightning' || down.type === 'cross' || down.type === 'nova'
                )) {
                    return true;
                }
                if (!current.hasTrash && !down.hasTrash && findMatches(trySwap(grid, x, y, x, y + 1)).size > 0) {
                    return true;
                }
            }
        }
    }

    return false;
};

export const reshuffleBoard = (grid: Grid, maxAttempts: number = 120): Grid => {
    const movablePieces: Array<{ type: Tile['type']; gemType?: GemType }> = [];
    const locked: boolean[][] = [];

    for (let y = 0; y < ROWS; y++) {
        const rowLocks: boolean[] = [];
        for (let x = 0; x < COLS; x++) {
            const tile = grid[y][x];
            if ((tile as any).type == null) {
                return createBoard();
            }
            const isLocked = !!tile.hasTrash;
            rowLocks.push(isLocked);
            if (!isLocked) {
                movablePieces.push({
                    type: tile.type as any,
                    gemType: tile.gemType,
                });
            }
        }
        locked.push(rowLocks);
    }

    const shuffle = <T,>(arr: T[]): T[] => {
        const out = [...arr];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const shuffled = shuffle(movablePieces);
        let idx = 0;
        const candidate: Grid = [];

        for (let y = 0; y < ROWS; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < COLS; x++) {
                const source = grid[y][x];
                if (locked[y][x]) {
                    row.push({
                        ...source,
                        id: `${x}-${y}-${Date.now()}-${Math.random()}` ,
                        x,
                        y,
                    });
                } else {
                    const next = shuffled[idx++];
                    row.push({
                        id: `${x}-${y}-${Date.now()}-${Math.random()}` ,
                        type: next.type as any,
                        gemType: next.gemType,
                        x,
                        y,
                    });
                }
            }
            candidate.push(row);
        }

        if (findMatches(candidate).size === 0 && hasPossibleMoves(candidate)) {
            return candidate;
        }
    }

    return createBoard();
};


