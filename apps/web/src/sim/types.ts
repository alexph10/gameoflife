/**
 * Core type definitions for the Conway's Game of Life simulation.
 *
 * The compiler runs with `verbatimModuleSyntax` and `erasableSyntaxOnly`,
 * so all types here are erasable: string-literal unions and plain `const`
 * objects are used instead of `enum`/`namespace`.
 */

/** A single cell is either dead (0) or alive (1). */
export type CellState = 0 | 1;

/** Convenience constants matching the {@link CellState} domain. */
export const DEAD: CellState = 0;
export const ALIVE: CellState = 1;

/**
 * How the grid handles neighbour lookups across edges.
 *
 * - `"dead"`: cells outside the grid are treated as dead.
 * - `"wrap"`: the grid is a torus; neighbours wrap from edge to edge.
 */
export type BoundaryMode = "dead" | "wrap";

/** Available boundary modes, useful for UI selectors. */
export const BOUNDARY_MODES = ["dead", "wrap"] as const;

/** Construction options for a {@link LifeGrid}. */
export interface LifeGridOptions {
  width: number;
  height: number;
  /** Defaults to `"dead"`. */
  boundary?: BoundaryMode;
}

/** A snapshot of the grid's runtime statistics. */
export interface GridStats {
  width: number;
  height: number;
  /** Number of completed {@link LifeGrid.step} calls since the last reset. */
  generation: number;
  /** Count of living cells in the current generation. */
  population: number;
  boundary: BoundaryMode;
}

/**
 * A 2D pattern expressed as a rectangular array of {@link CellState} rows.
 * Rows must all share the same length.
 */
export interface Pattern {
  /** Human-readable name; useful in UI lists. */
  name: string;
  width: number;
  height: number;
  /** Row-major: `cells[y][x]` is the cell at column `x`, row `y`. */
  cells: ReadonlyArray<ReadonlyArray<CellState>>;
}

/** Canonical names of the built-in patterns shipped in `patterns.ts`. */
export type PatternName =
  | "block"
  | "blinker"
  | "glider"
  | "lwss"
  | "beacon"
  | "toad"
  | "pulsar";

/** Options accepted by pattern-placement helpers. */
export interface PlacePatternOptions {
  /** If true, existing live cells outside the pattern are preserved. Default: true. */
  additive?: boolean;
  /**
   * If true, the pattern wraps around grid edges instead of being clipped.
   * Default: false.
   */
  wrap?: boolean;
}
