# Copilot Instructions for Match3 Game

## Architecture Overview

This is a **Match3 puzzle game** built with React 19 + TypeScript + Vite + Framer Motion.

**Core layers:**
- **Game Logic** (`src/logic/boardUtils.ts`): 8x8 tile grid, match detection, gravity simulation
- **State Management** (`src/hooks/useGame.ts`): Single hook managing all game state, async animation orchestration
- **Components** (`src/components/`): Presentational UI powered by Framer Motion animations
- **Types** (`src/types.ts`): Strongly-typed Tile/Grid, GemType union ('red'|'blue'|'green'|'yellow'|'purple'|'orange')

## Game Mechanics

### Match Detection & Special Pieces
Special pieces are auto-created when 4+ gems match:
- **Bomb** (4 gems in line): Removes 3x3 area
- **Lightning** (5 gems in line): Removes entire row/column  
- **Cross** (7-element T-pattern): Removes cross pattern

Special pieces have both `type` ('bomb'|'lightning'|'cross') and `gemType` (base color for scoring context).

### Game Loop Flow
1. Swap adjacent tiles → `swapTiles()` updates x/y coordinates
2. Detect matches → `findMatches()` returns Map<tileId, type>
3. Convert 4+ matches to special pieces → `convertToSpecialPieces()`
4. Remove only regular 3-gem matches (NOT special pieces yet) → `removeMatches()`
5. Apply gravity → drops tiles down, creates animation offsets
6. Check for cascades → loop back to step 2

**Critical**: Special pieces persist during removal phase to create cascade effects. See `processBoard()` in [useGame.ts](src/hooks/useGame.ts#L39).

### Pause Handling
Pause interrupts animation sequences via `isPausedRef`. The `processBoard()` loop checks this ref between animations:
```typescript
while (isPausedRef.current) await new Promise(r => setTimeout(r, 50));
```
Do NOT directly `setGrid()` while paused—use the ref-based polling instead.

### Tile Grid Representation
Grid is stored as `Tile[][]` where `grid[y][x]` maps to screen position. Tiles maintain both array position (`[y][x]`) AND coordinate properties (`x`, `y`). Always keep these in sync.

## Development Workflow

```bash
npm run dev      # Start Vite dev server (HMR enabled)
npm run build    # TypeScript check + Vite bundle
npm run lint     # ESLint check
npm run preview  # Preview production build
```

**Hot Module Replacement (HMR)** works with React component edits. State persists unless you edit `useGame` hook logic.

## Key Patterns

### Animation Orchestration
Framer Motion `AnimatePresence` mode="popLayout" prevents layout shift during match cascades. Tiles animate on:
- **"matched"** class: Scale-out fade → disappear animation (200ms)
- **"fall"** class: Y-axis translation → gravity animation (300ms)
- **selection** class: Highlight selected tile (no timeout)

See [Tile.tsx](src/components/Tile.tsx) for motion configs.

### TypeScript Conventions
- Use `GemType` type for regular gems, `TileType` for unions (gems + special pieces)
- Tile.id is UUID: `${x}-${y}-${Date.now()}-${Math.random()}` (prevents duplicates during rapid swaps)
- Grid mutations: ALWAYS use `copyGrid()` before modifying—React state expects new object reference

### Styling: Tailwind + PostCSS
- Use Tailwind v4 (postcss-first) with `@tailwindcss/postcss`
- Backdrop blur, glassmorphism (border-white/20, bg-black/30), rounded-[3rem]
- Safe-area-inset applied on main container for mobile notch support

## Common Tasks

### Adding a New Special Piece Type
1. Add to `SpecialType` union in [types.ts](src/types.ts)
2. Extend `findMatches()` pattern detection in [boardUtils.ts](src/logic/boardUtils.ts) (currently checks 4, 5, and 7-element patterns)
3. Create activation logic in `activateSpecialPiece()` in [useGame.ts](src/hooks/useGame.ts) (define affected tiles set)
4. Add Framer Motion variant in [Tile.tsx](src/components/Tile.tsx)

### Modifying Match Rules
See `findMatches()` in [boardUtils.ts](src/logic/boardUtils.ts)—it processes CROSS → LIGHTNING → BOMB → MATCH in priority order to assign highest-priority matches to overlapping tiles.

### Debugging Animation Timing
Game loop has fixed timeouts (200ms match, 200ms remove, 300ms gravity). To pause between steps for debugging:
```typescript
// In processBoard() - add after any setGrid()
await new Promise(r => setTimeout(r, 1000));
```

## Integration Points

- **Framer Motion**: Exit animations on tile removal, layout animations on gravity. Use `exit` prop for cleanup.
- **Lucide Icons**: `Settings` icon in pause button; can add more from lucide-react library
- **Tailwind Colors**: Scale animations use `scale-95` on button press; gem colors hardcoded in Tile component with Tailwind colors (e.g., `bg-red-500`)
- **Audio**: [AudioPlayer.tsx](src/components/AudioPlayer.tsx) isolated; mute/unmute via LocalStorage

## Project Configuration Files

- `vite.config.ts`: React plugin only, minimal config
- `tsconfig.app.json` / `tsconfig.json`: Base + app-specific settings, module: "ESNext"
- `tailwind.config.js`: Extends theme with custom rounded-[3rem], no custom colors
- `eslint.config.js`: Basic React + TypeScript rules, not strict type-aware yet
