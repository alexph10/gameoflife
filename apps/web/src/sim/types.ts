export type Cell = 0 | 1;

export type BoundaryMode = 'dead' | 'wrap';

export interface GridStats {
  width: number;
  height: number;
  generation: number;
  population: number;
}

export interface Pattern {
  name: string;
  width: number;
  height: number;
  cells: ReadonlyArray<readonly [number, number]>;
}
