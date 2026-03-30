import { FIXED } from './lectionary_fixed';
import { YEAR_A } from './lectionary_a';
import { YEAR_B } from './lectionary_b';
import { YEAR_C } from './lectionary_c';

const ALL = { ...FIXED, ...YEAR_A, ...YEAR_B, ...YEAR_C };

export function getReadings(liturgicalInfo) {
  if (!liturgicalInfo) return null;
  const { key } = liturgicalInfo;
  if (!key) return null;
  return ALL[key] || null;
}
