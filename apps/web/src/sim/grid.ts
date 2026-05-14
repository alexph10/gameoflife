/**
 * Uint8Array-backed Game of Life grid with double buffering.
 *
 * The grid stores one byte per cell (0 or 1). Each {@link LifeGrid.step}
 * computes the next generation into a back buffer and then swaps, so the
 * current generation is never partially overwritten during evaluation.
 */

import type {
  BoundaryMode,
  CellState,
  GridStats,
  LifeGridOptions,
} from "./types.ts";
import { ALIVE, DEAD } from "./types.ts";

/** Pseudo-random number generator interface (e.g. `Math.random`). */
export type Rng = () => number;

export class LifeGrid {
  readonly width: number;
  readonly height: number;
  boundary: BoundaryMode;

  private front: Uint8Array;
  private back: Uint8Array;
  private _generation = 0;
  private _population = 0;

  constructor(options: LifeGridOptions) {
    const { width, height, boundary = "dead" } = options;
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new RangeError("LifeGrid dimensions must be integers");
    }
    if (width <= 0 || height <= 0) {
      throw new RangeError("LifeGrid dimensions must be positive");
    }
    this.width = width;
    this.height = height;
    this.boundary = boundary;
    const size = width * height;
    this.front = new Uint8Array(size);
    this.back = new Uint8Array(size);
  }

  // ---- bounds helpers ---------------------------------------------------

  /** True when `(x, y)` lies inside the grid. */
  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * Flat-buffer index for `(x, y)`. Caller is responsible for checking
   * {@link inBounds} unless they already know coordinates are valid.
   */
  index(x: number, y: number): number {
    return y * this.width + x;
  }

  // ---- accessors --------------------------------------------------------

  /** Read a single cell. Out-of-bounds reads return `DEAD` (regardless of boundary mode). */
  get(x: number, y: number): CellState {
    if (!this.inBounds(x, y)) return DEAD;
    return this.front[this.index(x, y)] as CellState;
  }

  /** Write a cell. Out-of-bounds writes are no-ops. */
  set(x: number, y: number, value: CellState): void {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    const prev = this.front[i];
    if (prev === value) return;
    this.front[i] = value;
    this._population += value === ALIVE ? 1 : -1;
  }

  /** Flip a cell's state and return its new value. */
  toggle(x: number, y: number): CellState {
    if (!this.inBounds(x, y)) return DEAD;
    const i = this.index(x, y);
    const next: CellState = this.front[i] === ALIVE ? DEAD : ALIVE;
    this.front[i] = next;
    this._population += next === ALIVE ? 1 : -1;
    return next;
  }

  /**
   * Read-only view of the current generation's buffer. Mutating the returned
   * array bypasses population tracking and is unsupported.
   */
  cells(): Readonly<Uint8Array> {
    return this.front;
  }

  /** Returns a defensive copy of the current generation's buffer. */
  snapshot(): Uint8Array {
    return new Uint8Array(this.front);
  }

  // ---- lifecycle --------------------------------------------------------

  /** Zero all cells and reset generation/population counters. */
  clear(): void {
    this.front.fill(0);
    this.back.fill(0);
    this._generation = 0;
    this._population = 0;
  }

  /**
   * Fill the grid randomly with the given density of live cells.
   * Resets the generation counter; useful for seeding a fresh run.
   *
   * @param density Probability in `[0, 1]` that any given cell is alive.
   * @param rng    Source of randomness; defaults to `Math.random`.
   */
  randomize(density = 0.3, rng: Rng = Math.random): void {
    const clamped = density < 0 ? 0 : density > 1 ? 1 : density;
    let pop = 0;
    for (let i = 0; i < this.front.length; i++) {
      const alive = rng() < clamped ? 1 : 0;
      this.front[i] = alive;
      pop += alive;
    }
    this._generation = 0;
    this._population = pop;
  }

  // ---- evaluation -------------------------------------------------------

  /**
   * Count the live Moore-neighbours (8-adjacency) of `(x, y)` in the current
   * generation. Honors the configured {@link BoundaryMode}.
   */
  countNeighbors(x: number, y: number): number {
    const { width: w, height: h, front, boundary } = this;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        let nx = x + dx;
        let ny = y + dy;
        if (boundary === "wrap") {
          // `+ w` / `+ h` keeps the modulo non-negative for -1 wraps.
          nx = (nx + w) % w;
          ny = (ny + h) % h;
        } else if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          continue;
        }
        count += front[ny * w + nx];
      }
    }
    return count;
  }

  /**
   * Advance one generation using B3/S23 (Conway) rules and return `this` for
   * chaining. The previous generation remains available in the back buffer
   * until the next call.
   */
  step(): this {
    const { width: w, height: h, front, back, boundary } = this;
    let pop = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Inlined neighbour count for hot-path performance.
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            let ny = y + dy;
            if (boundary === "wrap") {
              nx = (nx + w) % w;
              ny = (ny + h) % h;
            } else if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
              continue;
            }
            n += front[ny * w + nx];
          }
        }
        const i = y * w + x;
        const alive = front[i] === ALIVE;
        // B3/S23: born on exactly 3, survives on 2 or 3.
        const next: CellState = alive ? (n === 2 || n === 3 ? ALIVE : DEAD) : n === 3 ? ALIVE : DEAD;
        back[i] = next;
        pop += next;
      }
    }
    // Swap front/back.
    this.front = back;
    this.back = front;
    this._generation++;
    this._population = pop;
    return this;
  }

  /** Run `n` steps in sequence and return `this`. */
  steps(n: number): this {
    for (let i = 0; i < n; i++) this.step();
    return this;
  }

  // ---- stats ------------------------------------------------------------

  get generation(): number {
    return this._generation;
  }

  get population(): number {
    return this._population;
  }

  stats(): GridStats {
    return {
      width: this.width,
      height: this.height,
      generation: this._generation,
      population: this._population,
      boundary: this.boundary,
    };
  }
}
