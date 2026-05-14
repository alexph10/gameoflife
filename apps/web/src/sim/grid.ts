import type { BoundaryMode, Cell, GridStats, Pattern } from './types.ts';

export interface LifeGridOptions {
  width: number;
  height: number;
  boundary?: BoundaryMode;
}

export class LifeGrid {
  readonly width: number;
  readonly height: number;
  boundary: BoundaryMode;

  private front: Uint8Array;
  private back: Uint8Array;
  private _generation = 0;
  private _population = 0;

  constructor({ width, height, boundary = 'dead' }: LifeGridOptions) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new RangeError(`LifeGrid dimensions must be positive integers, got ${width}x${height}`);
    }
    this.width = width;
    this.height = height;
    this.boundary = boundary;
    const size = width * height;
    this.front = new Uint8Array(size);
    this.back = new Uint8Array(size);
  }

  get generation(): number {
    return this._generation;
  }

  get population(): number {
    return this._population;
  }

  get cells(): Uint8Array {
    return this.front;
  }

  stats(): GridStats {
    return {
      width: this.width,
      height: this.height,
      generation: this._generation,
      population: this._population,
    };
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  private idx(x: number, y: number): number {
    return y * this.width + x;
  }

  get(x: number, y: number): Cell {
    if (!this.inBounds(x, y)) return 0;
    return this.front[this.idx(x, y)] as Cell;
  }

  set(x: number, y: number, value: Cell): void {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    const prev = this.front[i];
    const next: 0 | 1 = value ? 1 : 0;
    if (prev === next) return;
    this.front[i] = next;
    this._population += next - prev;
  }

  toggle(x: number, y: number): Cell {
    if (!this.inBounds(x, y)) return 0;
    const i = this.idx(x, y);
    const next: Cell = this.front[i] ? 0 : 1;
    this.front[i] = next;
    this._population += next ? 1 : -1;
    return next;
  }

  clear(): void {
    this.front.fill(0);
    this.back.fill(0);
    this._population = 0;
    this._generation = 0;
  }

  randomize(density = 0.3, rng: () => number = Math.random): void {
    const { front } = this;
    let pop = 0;
    for (let i = 0; i < front.length; i++) {
      const v = rng() < density ? 1 : 0;
      front[i] = v;
      pop += v;
    }
    this._population = pop;
    this._generation = 0;
  }

  countNeighbors(x: number, y: number): number {
    const { width, height, front, boundary } = this;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        let nx = x + dx;
        let ny = y + dy;
        if (boundary === 'wrap') {
          if (nx < 0) nx += width;
          else if (nx >= width) nx -= width;
          if (ny < 0) ny += height;
          else if (ny >= height) ny -= height;
        } else if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          continue;
        }
        count += front[ny * width + nx];
      }
    }
    return count;
  }

  step(): void {
    const { width, height, front, back, boundary } = this;
    let pop = 0;
    const wrap = boundary === 'wrap';

    for (let y = 0; y < height; y++) {
      const yN = wrap ? (y === 0 ? height - 1 : y - 1) : y - 1;
      const yS = wrap ? (y === height - 1 ? 0 : y + 1) : y + 1;
      const rowN = yN >= 0 && yN < height ? yN * width : -1;
      const row = y * width;
      const rowS = yS >= 0 && yS < height ? yS * width : -1;

      for (let x = 0; x < width; x++) {
        const xW = wrap ? (x === 0 ? width - 1 : x - 1) : x - 1;
        const xE = wrap ? (x === width - 1 ? 0 : x + 1) : x + 1;
        const xWok = xW >= 0;
        const xEok = xE < width;

        let n = 0;
        if (rowN !== -1) {
          if (xWok) n += front[rowN + xW];
          n += front[rowN + x];
          if (xEok) n += front[rowN + xE];
        }
        if (xWok) n += front[row + xW];
        if (xEok) n += front[row + xE];
        if (rowS !== -1) {
          if (xWok) n += front[rowS + xW];
          n += front[rowS + x];
          if (xEok) n += front[rowS + xE];
        }

        const alive = front[row + x];
        const next = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
        back[row + x] = next;
        pop += next;
      }
    }

    this.front = back;
    this.back = front;
    this._population = pop;
    this._generation++;
  }

  placePattern(pattern: Pattern, originX: number, originY: number, options: { clip?: boolean } = {}): boolean {
    const { clip = true } = options;
    if (!clip) {
      if (
        originX < 0 ||
        originY < 0 ||
        originX + pattern.width > this.width ||
        originY + pattern.height > this.height
      ) {
        return false;
      }
    }
    for (const [dx, dy] of pattern.cells) {
      this.set(originX + dx, originY + dy, 1);
    }
    return true;
  }
}
