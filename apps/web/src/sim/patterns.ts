/**
 * Named patterns and placement helpers for Conway's Game of Life.
 *
 * Each pattern is encoded with `1` for live cells and `0` for dead cells.
 * Coordinates passed to placement helpers are the **top-left** corner of
 * the pattern's bounding box on the destination grid.
 */

import type { LifeGrid } from "./grid.ts";
import type {
  CellState,
  Pattern,
  PatternName,
  PlacePatternOptions,
} from "./types.ts";
import { ALIVE, DEAD } from "./types.ts";

/** Build a {@link Pattern} from a string-art grid (`O`/`#`/`1` = live). */
function fromRows(name: string, rows: ReadonlyArray<string>): Pattern {
  const height = rows.length;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cells: CellState[][] = [];
  for (let y = 0; y < height; y++) {
    const row: CellState[] = [];
    const src = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = src[x] ?? " ";
      row.push(ch === "O" || ch === "#" || ch === "1" ? ALIVE : DEAD);
    }
    cells.push(row);
  }
  return { name, width, height, cells };
}

export const BLOCK: Pattern = fromRows("block", [
  "OO",
  "OO",
]);

export const BLINKER: Pattern = fromRows("blinker", [
  "OOO",
]);

export const TOAD: Pattern = fromRows("toad", [
  ".OOO",
  "OOO.",
]);

export const BEACON: Pattern = fromRows("beacon", [
  "OO..",
  "OO..",
  "..OO",
  "..OO",
]);

export const GLIDER: Pattern = fromRows("glider", [
  ".O.",
  "..O",
  "OOO",
]);

/** Lightweight spaceship — travels horizontally at c/2. */
export const LWSS: Pattern = fromRows("lwss", [
  ".OOOO",
  "O...O",
  "....O",
  "O..O.",
]);

export const PULSAR: Pattern = fromRows("pulsar", [
  "..OOO...OOO..",
  ".............",
  "O....O.O....O",
  "O....O.O....O",
  "O....O.O....O",
  "..OOO...OOO..",
  ".............",
  "..OOO...OOO..",
  "O....O.O....O",
  "O....O.O....O",
  "O....O.O....O",
  ".............",
  "..OOO...OOO..",
]);

/** Lookup table for every named pattern shipped with the simulator. */
export const PATTERNS: Readonly<Record<PatternName, Pattern>> = {
  block: BLOCK,
  blinker: BLINKER,
  toad: TOAD,
  beacon: BEACON,
  glider: GLIDER,
  lwss: LWSS,
  pulsar: PULSAR,
};

/** Sorted list of pattern names, suitable for UI menus. */
export const PATTERN_NAMES: ReadonlyArray<PatternName> = Object.freeze(
  Object.keys(PATTERNS).sort() as PatternName[],
);

/**
 * Stamp a pattern onto the grid with its top-left at `(originX, originY)`.
 * Returns the number of cells actually written (i.e. cells that changed
 * state). Cells that fall outside the grid are clipped unless `wrap: true`.
 *
 * When `additive` is true (the default) only live cells in the pattern are
 * written, leaving existing background cells alone. Set `additive: false`
 * to also stamp the dead cells (erasing whatever was underneath the pattern's
 * bounding box).
 */
export function placePattern(
  grid: LifeGrid,
  pattern: Pattern,
  originX: number,
  originY: number,
  options: PlacePatternOptions = {},
): number {
  const { additive = true, wrap = false } = options;
  const { width: gw, height: gh } = grid;
  let writes = 0;
  for (let py = 0; py < pattern.height; py++) {
    for (let px = 0; px < pattern.width; px++) {
      const cell = pattern.cells[py][px];
      if (additive && cell === DEAD) continue;
      let gx = originX + px;
      let gy = originY + py;
      if (wrap) {
        gx = ((gx % gw) + gw) % gw;
        gy = ((gy % gh) + gh) % gh;
      } else if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) {
        continue;
      }
      const before = grid.get(gx, gy);
      if (before !== cell) {
        grid.set(gx, gy, cell);
        writes++;
      }
    }
  }
  return writes;
}

/** Convenience wrapper around {@link placePattern} that resolves by name. */
export function placeNamedPattern(
  grid: LifeGrid,
  name: PatternName,
  originX: number,
  originY: number,
  options?: PlacePatternOptions,
): number {
  const pattern = PATTERNS[name];
  if (!pattern) throw new RangeError(`Unknown pattern: ${name as string}`);
  return placePattern(grid, pattern, originX, originY, options);
}

/**
 * Place a pattern centered on `(centerX, centerY)`. The pattern's centre is
 * its bounding-box centre (rounded down for even dimensions).
 */
export function placePatternCentered(
  grid: LifeGrid,
  pattern: Pattern,
  centerX: number,
  centerY: number,
  options?: PlacePatternOptions,
): number {
  const ox = centerX - Math.floor(pattern.width / 2);
  const oy = centerY - Math.floor(pattern.height / 2);
  return placePattern(grid, pattern, ox, oy, options);
}

/**
 * Seed a small demo on the grid: a glider in the top-left, a blinker, a
 * pulsar (if it fits) and a couple of still-lifes. Clears the grid first.
 */
export function seedDemo(grid: LifeGrid): void {
  grid.clear();
  const { width: w, height: h } = grid;
  placeNamedPattern(grid, "glider", 1, 1);
  placeNamedPattern(grid, "blinker", Math.floor(w / 2), Math.floor(h / 4));
  placeNamedPattern(grid, "block", w - 4, 1);
  placeNamedPattern(grid, "beacon", 2, h - 6);
  if (w >= 20 && h >= 20) {
    placePatternCentered(grid, PULSAR, Math.floor(w / 2), Math.floor(h / 2));
  }
}
