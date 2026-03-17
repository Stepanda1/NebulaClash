export type ShopTimingVariant = 'a' | 'b' | 'c';
export type LiveCoinPack = {
  id: string;
  coins: number;
  amountRub: number;
};

export type LiveExperimentConfig = {
  shopTimingVariantWeights: Partial<Record<ShopTimingVariant, number>>;
  forcedVariant?: ShopTimingVariant | null;
  assignedVariant?: ShopTimingVariant | null;
};

export type LiveEventMissionDefinition = {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  metric: 'ice_cleared' | 'levels_completed' | 'boss_damage' | 'coins_spent';
};

export type LiveEventShopOffer = {
  id: string;
  title: string;
  description: string;
  packId?: string;
  modifierId?: 'startBomb' | 'startLightning' | 'bossShield' | 'trashCleaner';
  priceCoins?: number;
  badge?: string;
};

export type LiveEventConfig = {
  active: boolean;
  id: string;
  title: string;
  description: string;
  endsAt: string | null;
  accentColor: string;
  eventRunIceTiles: number;
  scoreMultiplier: number;
  rewardMultiplier: number;
  missions: LiveEventMissionDefinition[];
  shopOffers: LiveEventShopOffer[];
};

export type LiveConfig = {
  economy: {
    boosterCost: number;
    moveBoostAmount: number;
    timeBoostSeconds: number;
    runModifierCosts: Record<'startBomb' | 'startLightning' | 'bossShield' | 'trashCleaner', number>;
    missionRerollCost: number;
  };
  monetization: {
    coinPacks: LiveCoinPack[];
    starterOffer: {
      id: string;
      coins: number;
      amountRub: number;
      modifierTokens: number;
      continueReserve: number;
      expiresInHours: number;
    };
  };
  experiments: LiveExperimentConfig;
  event: LiveEventConfig;
};

export const DEFAULT_LIVE_CONFIG: LiveConfig = {
  economy: {
    boosterCost: 15,
    moveBoostAmount: 5,
    timeBoostSeconds: 30,
    runModifierCosts: {
      startBomb: 12,
      startLightning: 12,
      bossShield: 18,
      trashCleaner: 14,
    },
    missionRerollCost: 20,
  },
  monetization: {
    coinPacks: [
      { id: 'pack-120', coins: 60, amountRub: 99 },
      { id: 'pack-300', coins: 150, amountRub: 199 },
      { id: 'pack-800', coins: 420, amountRub: 499 },
    ],
    starterOffer: {
      id: 'starter-bundle',
      coins: 120,
      amountRub: 149,
      modifierTokens: 1,
      continueReserve: 2,
      expiresInHours: 12,
    },
  },
  experiments: {
    shopTimingVariantWeights: {
      a: 0.34,
      b: 0.33,
      c: 0.33,
    },
    forcedVariant: null,
  },
  event: {
    active: true,
    id: 'cryo_storm_weekly',
    title: 'Cryo Storm Sector',
    description: 'Launch special runs with cryo shields, close event missions, and convert the storm into extra rewards.',
    endsAt: null,
    accentColor: '#67e8f9',
    eventRunIceTiles: 10,
    scoreMultiplier: 1.15,
    rewardMultiplier: 1.25,
    missions: [
      {
        id: 'cryo_clear_24',
        title: 'Break Cryo Shields',
        description: 'Clear 24 cryo cells during event runs.',
        target: 24,
        reward: 110,
        metric: 'ice_cleared',
      },
      {
        id: 'storm_runs_3',
        title: 'Close 3 Storm Runs',
        description: 'Finish 3 levels while the event flag is active.',
        target: 3,
        reward: 140,
        metric: 'levels_completed',
      },
      {
        id: 'boss_pressure_80',
        title: 'Pressure the Sector Boss',
        description: 'Deal 80 total boss damage across event runs.',
        target: 80,
        reward: 160,
        metric: 'boss_damage',
      },
    ],
    shopOffers: [
      {
        id: 'event_pack_mid',
        title: 'Storm Reserve',
        description: 'Mid pack tuned for event progression.',
        packId: 'pack-300',
        badge: 'Event pack',
      },
      {
        id: 'event_modifier_boss',
        title: 'Cryo Shield Crack',
        description: 'Open the next event run with a boss-safe start.',
        modifierId: 'bossShield',
        priceCoins: 14,
        badge: 'Event boost',
      },
    ],
  },
};
