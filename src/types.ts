export type GemType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type SpecialType = 'bomb' | 'lightning' | 'cross' | 'nova';
export type TileType = GemType | SpecialType;

export interface Tile {
  id: string;
  type: TileType;
  gemType?: GemType;  // For special pieces, store the base gem color
  x: number;
  y: number;
  isMatched?: boolean;
  hasTrash?: boolean;
}

export type Grid = Tile[][];

export const GEM_TYPES: GemType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

