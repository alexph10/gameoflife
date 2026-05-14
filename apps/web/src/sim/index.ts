/**
 * Barrel exports for the Game of Life simulation core.
 *
 * Consumers should import from `./sim` (this module) rather than reaching
 * into individual files, so internal layout can evolve without breaking
 * callers.
 */

export type {
  BoundaryMode,
  CellState,
  GridStats,
  LifeGridOptions,
  Pattern,
  PatternName,
  PlacePatternOptions,
} from "./types.ts";
export { ALIVE, DEAD, BOUNDARY_MODES } from "./types.ts";

export { LifeGrid } from "./grid.ts";
export type { Rng } from "./grid.ts";

export {
  BEACON,
  BLINKER,
  BLOCK,
  GLIDER,
  LWSS,
  PATTERNS,
  PATTERN_NAMES,
  PULSAR,
  TOAD,
  placeNamedPattern,
  placePattern,
  placePatternCentered,
  seedDemo,
} from "./patterns.ts";
