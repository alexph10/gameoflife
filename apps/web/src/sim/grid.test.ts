import { describe, it, expect } from 'vitest';
import { LifeGrid } from './grid.ts';
import { BLINKER, BLOCK, GLIDER } from './patterns.ts';

describe('LifeGrid basics', () => {
  it('throws on invalid dimensions', () => {
    expect(() => new LifeGrid({ width: 0, height: 1 })).toThrow();
    expect(() => new LifeGrid({ width: 1.5, height: 1 })).toThrow();
  });

  it('set/get/toggle maintain population', () => {
    const g = new LifeGrid({ width: 4, height: 4 });
    expect(g.population).toBe(0);
    g.set(1, 1, 1);
    expect(g.get(1, 1)).toBe(1);
    expect(g.population).toBe(1);
    g.set(1, 1, 1);
    expect(g.population).toBe(1);
    g.toggle(1, 1);
    expect(g.get(1, 1)).toBe(0);
    expect(g.population).toBe(0);
    g.toggle(2, 2);
    expect(g.population).toBe(1);
  });

  it('out-of-bounds set/get is a no-op', () => {
    const g = new LifeGrid({ width: 3, height: 3 });
    g.set(-1, 0, 1);
    g.set(0, 3, 1);
    expect(g.population).toBe(0);
    expect(g.get(-1, 0)).toBe(0);
  });

  it('clear resets state', () => {
    const g = new LifeGrid({ width: 4, height: 4 });
    g.set(0, 0, 1);
    g.step();
    g.clear();
    expect(g.population).toBe(0);
    expect(g.generation).toBe(0);
  });

  it('randomize reports correct population', () => {
    const g = new LifeGrid({ width: 20, height: 20 });
    let i = 0;
    const rng = () => (i++ % 2 === 0 ? 0 : 1);
    g.randomize(0.5, rng);
    let count = 0;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) count += g.get(x, y);
    expect(g.population).toBe(count);
  });
});

describe('LifeGrid neighbours and step', () => {
  it('counts neighbours with dead boundary', () => {
    const g = new LifeGrid({ width: 3, height: 3, boundary: 'dead' });
    g.set(0, 0, 1);
    g.set(1, 0, 1);
    g.set(0, 1, 1);
    expect(g.countNeighbors(1, 1)).toBe(3);
    expect(g.countNeighbors(0, 0)).toBe(2);
  });

  it('counts neighbours with wrap boundary', () => {
    const g = new LifeGrid({ width: 3, height: 3, boundary: 'wrap' });
    g.set(2, 2, 1);
    expect(g.countNeighbors(0, 0)).toBe(1);
  });

  it('blinker oscillates with period 2', () => {
    const g = new LifeGrid({ width: 5, height: 5 });
    g.placePattern(BLINKER, 1, 2);
    expect(g.population).toBe(3);
    const snapshot = Array.from(g.cells);
    g.step();
    expect(g.generation).toBe(1);
    expect(g.population).toBe(3);
    g.step();
    expect(Array.from(g.cells)).toEqual(snapshot);
    expect(g.generation).toBe(2);
  });

  it('block is still life', () => {
    const g = new LifeGrid({ width: 5, height: 5 });
    g.placePattern(BLOCK, 1, 1);
    const snap = Array.from(g.cells);
    g.step();
    expect(Array.from(g.cells)).toEqual(snap);
    expect(g.population).toBe(4);
  });

  it('glider translates by (1,1) after 4 generations on a wrap grid', () => {
    const g = new LifeGrid({ width: 10, height: 10, boundary: 'wrap' });
    g.placePattern(GLIDER, 0, 0);
    const start = g.population;
    for (let i = 0; i < 4; i++) g.step();
    expect(g.population).toBe(start);
    const ref = new LifeGrid({ width: 10, height: 10, boundary: 'wrap' });
    ref.placePattern(GLIDER, 1, 1);
    expect(Array.from(g.cells)).toEqual(Array.from(ref.cells));
  });
});

describe('LifeGrid pattern placement', () => {
  it('placePattern returns false when out of bounds and clip=false', () => {
    const g = new LifeGrid({ width: 3, height: 3 });
    expect(g.placePattern(GLIDER, 2, 2, { clip: false })).toBe(false);
    expect(g.population).toBe(0);
  });

  it('placePattern clips by default', () => {
    const g = new LifeGrid({ width: 4, height: 4 });
    expect(g.placePattern(GLIDER, 2, 2)).toBe(true);
    expect(g.population).toBeGreaterThan(0);
    expect(g.population).toBeLessThan(5);
  });
});
