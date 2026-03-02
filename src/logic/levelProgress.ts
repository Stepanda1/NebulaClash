import type { GemType, SpecialType } from '../types';

export type SpecialGoalType = SpecialType | 'smash';

export type Goal =
  | { type: 'collect'; value: number; color: GemType }
  | { type: 'collect_multi'; targets: Partial<Record<GemType, number>> }
  | { type: 'bombs'; value: number }
  | { type: 'lightning'; value: number }
  | { type: 'special'; value: number; special: SpecialGoalType }
  | { type: 'combo_x5'; value: number }
  | { type: 'trash'; value: number }
  | { type: 'boss'; value: number };

export type LevelConfig = {
  mode: 'moves' | 'time';
  limit: number;
  goal: Goal;
  trashCount?: number;
};

type GoalProgress = {
  bossHp: number;
  collected: Record<GemType, number>;
  comboX5Count: number;
  levelBombActivations: number;
  levelCrossActivations: number;
  levelLightningActivations: number;
  levelNovaActivations: number;
  levelPulseActivations: number;
  levelSmashEvents: number;
  trashDestroyed: number;
};

const GEM_ROTATION: GemType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const SPECIAL_GOAL_ROTATION: SpecialGoalType[] = ['bomb', 'lightning'];

function normalizeSpecialGoal(special: SpecialGoalType, value: number): SpecialGoalType {
  if (special === 'pulse' && value === 3) return 'nova';
  return special;
}

export function buildLevelConfigs(): LevelConfig[] {
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

  // Smooth the first levels so each new pattern is introduced in isolation.
  const onboardingLevels: LevelConfig[] = [
    { mode: 'moves', limit: 28, goal: { type: 'collect', value: 16, color: 'red' } },
    { mode: 'moves', limit: 28, goal: { type: 'collect', value: 18, color: 'blue' } },
    { mode: 'moves', limit: 26, goal: { type: 'bombs', value: 3 } },
    { mode: 'moves', limit: 26, goal: { type: 'collect_multi', targets: { red: 8, green: 8 } } },
    { mode: 'moves', limit: 24, goal: { type: 'lightning', value: 2 } },
    { mode: 'moves', limit: 24, goal: { type: 'collect', value: 18, color: 'yellow' } },
    { mode: 'moves', limit: 26, goal: { type: 'trash', value: 8 }, trashCount: 8 },
    { mode: 'moves', limit: 24, goal: { type: 'bombs', value: 4 } },
    { mode: 'moves', limit: 24, goal: { type: 'collect_multi', targets: { blue: 10, purple: 10 } } },
    { mode: 'moves', limit: 26, goal: { type: 'boss', value: Math.floor(120 * 1.2) } },
    { mode: 'moves', limit: 24, goal: { type: 'collect', value: 20, color: 'green' } },
    { mode: 'moves', limit: 24, goal: { type: 'lightning', value: 3 } },
    { mode: 'time', limit: 62, goal: { type: 'collect_multi', targets: { yellow: 10, orange: 10 } } },
    { mode: 'moves', limit: 24, goal: { type: 'bombs', value: 4 } },
    { mode: 'moves', limit: 24, goal: { type: 'collect', value: 20, color: 'purple' } },
    { mode: 'moves', limit: 24, goal: { type: 'trash', value: 10 }, trashCount: 10 },
    { mode: 'moves', limit: 24, goal: { type: 'collect_multi', targets: { green: 11, yellow: 11 } } },
    { mode: 'moves', limit: 23, goal: { type: 'lightning', value: 4 } },
    { mode: 'moves', limit: 23, goal: { type: 'bombs', value: 5 } },
    { mode: 'moves', limit: 25, goal: { type: 'boss', value: Math.floor(130 * 1.2) } },
  ];

  onboardingLevels.forEach((config, index) => {
    levels[index] = config;
  });

  return levels;
}

export function isGoalReached(goal: Goal, progress: GoalProgress): boolean {
  if (goal.type === 'collect') {
    return progress.collected[goal.color] >= goal.value;
  }
  if (goal.type === 'collect_multi') {
    return Object.entries(goal.targets).every(([color, target]) => {
      if (!target) return true;
      return progress.collected[color as GemType] >= target;
    });
  }
  if (goal.type === 'bombs') {
    return progress.levelBombActivations >= goal.value;
  }
  if (goal.type === 'lightning') {
    return progress.levelLightningActivations >= goal.value;
  }
  if (goal.type === 'special') {
    if (goal.special === 'bomb') return progress.levelBombActivations >= goal.value;
    if (goal.special === 'lightning') return progress.levelLightningActivations >= goal.value;
    if (goal.special === 'cross') return progress.levelCrossActivations >= goal.value;
    if (goal.special === 'pulse') return progress.levelPulseActivations >= goal.value;
    if (goal.special === 'nova') return progress.levelNovaActivations >= goal.value;
    return progress.levelSmashEvents >= goal.value;
  }
  if (goal.type === 'combo_x5') {
    return progress.comboX5Count >= goal.value;
  }
  if (goal.type === 'trash') {
    return progress.trashDestroyed >= goal.value;
  }
  return progress.bossHp <= 0;
}
