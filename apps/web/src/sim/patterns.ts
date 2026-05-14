import type { Pattern } from './types.ts';

function pattern(name: string, rows: string[]): Pattern {
  const height = rows.length;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cells: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'O' || row[x] === '#' || row[x] === '1') {
        cells.push([x, y]);
      }
    }
  }
  return { name, width, height, cells };
}

export const BLOCK = pattern('Block', [
  'OO',
  'OO',
]);

export const BLINKER = pattern('Blinker', [
  'OOO',
]);

export const GLIDER = pattern('Glider', [
  '.O.',
  '..O',
  'OOO',
]);

export const LWSS = pattern('Lightweight Spaceship', [
  '.OOOO',
  'O...O',
  '....O',
  'O..O.',
]);

export const PULSAR = pattern('Pulsar', [
  '..OOO...OOO..',
  '.............',
  'O....O.O....O',
  'O....O.O....O',
  'O....O.O....O',
  '..OOO...OOO..',
  '.............',
  '..OOO...OOO..',
  'O....O.O....O',
  'O....O.O....O',
  'O....O.O....O',
  '.............',
  '..OOO...OOO..',
]);

export const PATTERNS: readonly Pattern[] = [BLOCK, BLINKER, GLIDER, LWSS, PULSAR];
