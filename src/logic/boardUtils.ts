import { GEM_TYPES } from '../types';
import type { Grid, Tile, GemType } from '../types';

export const ROWS = 8;
export const COLS = 8;

export const generateRandomTileType = (): GemType => {
    return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
};

export const createBoard = (): Grid => {
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

export const findMatches = (grid: Grid): Map<string, 'match' | 'bomb' | 'lightning' | 'cross'> => {
    const matchMap = new Map<string, 'match' | 'bomb' | 'lightning' | 'cross'>();
    const processed = new Set<string>();

    const getTileBaseType = (tile: Tile): GemType | null => {
        if (tile.type === 'bomb' || tile.type === 'lightning' || tile.type === 'cross') {
            return tile.gemType || null;
        }
        return (tile.type as any).length > 0 ? (tile.type as GemType) : null;
    };

    const isSameType = (t1: Tile, t2: Tile): boolean => {
        return getTileBaseType(t1) === getTileBaseType(t2);
    };

    const addGroup = (tileIds: string[], type: 'match' | 'bomb' | 'lightning') => {
        for (const id of tileIds) {
            if (processed.has(id)) return;
        }
        for (const id of tileIds) {
            matchMap.set(id, type);
            processed.add(id);
        }
    };

    // 1) T-shapes (5) -> lightning
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS - 2; x++) {
            const a = grid[y][x];
            const b = grid[y][x + 1];
            const c = grid[y][x + 2];

            if (!isSameType(a, b) || !isSameType(a, c)) continue;

            // Two above the center
            if (y >= 2) {
                const up1 = grid[y - 1][x + 1];
                const up2 = grid[y - 2][x + 1];
                if (isSameType(a, up1) && isSameType(a, up2)) {
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'lightning');
                }
            }

            // Two below the center
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x + 1];
                const down2 = grid[y + 2][x + 1];
                if (isSameType(a, down1) && isSameType(a, down2)) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'lightning');
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

            // Two left of center
            if (x >= 2) {
                const left1 = grid[y + 1][x - 1];
                const left2 = grid[y + 1][x - 2];
                if (isSameType(a, left1) && isSameType(a, left2)) {
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'lightning');
                }
            }

            // Two right of center
            if (x <= COLS - 3) {
                const right1 = grid[y + 1][x + 1];
                const right2 = grid[y + 1][x + 2];
                if (isSameType(a, right1) && isSameType(a, right2)) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'lightning');
                }
            }
        }
    }

    // 2) L-shapes (5) -> lightning
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
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'lightning');
                }
            }
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x];
                const down2 = grid[y + 2][x];
                if (isSameType(a, down1) && isSameType(a, down2)) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'lightning');
                }
            }

            // Vertical leg on right end
            if (y >= 2) {
                const up1 = grid[y - 1][x + 2];
                const up2 = grid[y - 2][x + 2];
                if (isSameType(a, up1) && isSameType(a, up2)) {
                    addGroup([a.id, b.id, c.id, up1.id, up2.id], 'lightning');
                }
            }
            if (y <= ROWS - 3) {
                const down1 = grid[y + 1][x + 2];
                const down2 = grid[y + 2][x + 2];
                if (isSameType(a, down1) && isSameType(a, down2)) {
                    addGroup([a.id, b.id, c.id, down1.id, down2.id], 'lightning');
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
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'lightning');
                }
            }
            if (x <= COLS - 3) {
                const right1 = grid[y][x + 1];
                const right2 = grid[y][x + 2];
                if (isSameType(a, right1) && isSameType(a, right2)) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'lightning');
                }
            }

            // Horizontal leg on bottom end
            if (x >= 2) {
                const left1 = grid[y + 2][x - 1];
                const left2 = grid[y + 2][x - 2];
                if (isSameType(a, left1) && isSameType(a, left2)) {
                    addGroup([a.id, b.id, c.id, left1.id, left2.id], 'lightning');
                }
            }
            if (x <= COLS - 3) {
                const right1 = grid[y + 2][x + 1];
                const right2 = grid[y + 2][x + 2];
                if (isSameType(a, right1) && isSameType(a, right2)) {
                    addGroup([a.id, b.id, c.id, right1.id, right2.id], 'lightning');
                }
            }
        }
    }

    // 3) Line matches: 5+ -> lightning, 4 -> bomb, 3 -> match
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
                if (len >= 5) addGroup(ids, 'lightning');
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
                if (len >= 5) addGroup(ids, 'lightning');
                else if (len === 4) addGroup(ids, 'bomb');
                else addGroup(ids, 'match');
            }
            y = end + 1;
        }
    }

    return matchMap;
};

// Convert matched tiles to single special piece (one per combo)
export const convertToSpecialPieces = (grid: Grid, matchMap: Map<string, 'match' | 'bomb' | 'lightning' | 'cross'>): Grid => {
    const newGrid = copyGrid(grid);

    const specialIds = new Set<string>();
    matchMap.forEach((type, tileId) => {
        if (type === 'bomb' || type === 'lightning') {
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

            const specialType = matchMap.get(tile.id) as 'bomb' | 'lightning';
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
            const gemType = (specialTile.type === 'bomb' || specialTile.type === 'lightning' || specialTile.type === 'cross')
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

export const expandSpecialChain = (grid: Grid, initial: Set<string>): Set<string> => {
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
        if (tile && (tile.type === 'bomb' || tile.type === 'lightning')) {
            queue.push(tile);
            triggered.add(tile.id);
        }
    }

    while (queue.length > 0) {
        const tile = queue.shift()!;
        const affected = tile.type === 'bomb'
            ? getBombAffectedTiles(grid, tile.x, tile.y)
            : getLightningAffectedTiles(grid, tile.x, tile.y);

        for (const id of affected) {
            if (!toRemove.has(id)) {
                toRemove.add(id);
            }
            const nextTile = idMap.get(id);
            if (nextTile && (nextTile.type === 'bomb' || nextTile.type === 'lightning') && !triggered.has(nextTile.id)) {
                triggered.add(nextTile.id);
                queue.push(nextTile);
            }
        }
    }

    return toRemove;
};

// Get all tiles affected by cross (horizontal and vertical lines)
export const getCrossAffectedTiles = (grid: Grid, x: number, y: number): Set<string> => {
    const affected = new Set<string>();
    
    // Horizontal line
    for (let i = 0; i < COLS; i++) {
        affected.add(grid[y][i].id);
    }
    
    // Vertical line
    for (let i = 0; i < ROWS; i++) {
        affected.add(grid[i][x].id);
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
        let writeY = ROWS - 1;
        // Move existing tiles down
        for (let y = ROWS - 1; y >= 0; y--) {
            if (newGrid[y][x].type as any !== null) { // Check if not null
                if (y !== writeY) {
                    newGrid[writeY][x] = { ...newGrid[y][x], x, y: writeY };
                    newGrid[y][x].type = null as any;
                }
                writeY--;
            }
        }
        // Fill top with new tiles
        for (let y = writeY; y >= 0; y--) {
            const newTile: Tile = {
                id: `${x}-${y}-${Date.now()}-${Math.random()}`,
                type: generateRandomTileType(),
                x,
                y,
            };
            newGrid[y][x] = newTile;
            newTiles.push(newTile);
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
            if ((grid[y][x] as any).type == null) {
                return null;
            }
        }
    }

    const trySwap = (g: Grid, x1: number, y1: number, x2: number, y2: number): Grid => {
        const newGrid = copyGrid(g);
        const t1 = newGrid[y1][x1];
        const t2 = newGrid[y2][x2];
        newGrid[y1][x1] = { ...t2, x: x1, y: y1 };
        newGrid[y2][x2] = { ...t1, x: x2, y: y2 };
        return newGrid;
    };

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (x + 1 < COLS) {
                const swapped = trySwap(grid, x, y, x + 1, y);
                const matches = findMatches(swapped);
                let hasRequired = false;
                matches.forEach((type) => {
                    if (type === requiredType) hasRequired = true;
                });
                if (hasRequired) {
                    if (y > 0) {
                        return { from: { x, y }, to: { x: x + 1, y } };
                    }
                }
            }
            if (y + 1 < ROWS) {
                const swapped = trySwap(grid, x, y, x, y + 1);
                const matches = findMatches(swapped);
                let hasRequired = false;
                matches.forEach((type) => {
                    if (type === requiredType) hasRequired = true;
                });
                if (hasRequired) {
                    if (y > 0) {
                        return { from: { x, y }, to: { x, y: y + 1 } };
                    }
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
            if (tile.type !== 'lightning') continue;
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
                if ((target as any).type == null) continue;
                if (y === 0) continue;
                return { from: { x, y }, to: { x: c.x, y: c.y } };
            }
        }
    }
    return null;
};

export const hasPossibleMoves = (_grid: Grid): boolean => {
    return true;
};
