/**
 * Daily Office lectionary lookup.
 * Data source: MIT-licensed JSON from iethree/daily-office (BCP Daily Office Lectionary,
 * closely related to the CCT Revised Common Lectionary daily cycle).
 * Two-year cycle: Year One begins Advent of odd-numbered years (2025, 2027…),
 *                 Year Two begins Advent of even-numbered years (2024, 2026…).
 */
import { getLiturgicalInfo, getEaster, getFirstAdvent } from './liturgical';

import year1Data from '../data/dol-year-1.json';
import year2Data from '../data/dol-year-2.json';
import holyDaysData from '../data/dol-holy-days.json';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Map from liturgical.js key base (without _A/_B/_C suffix) → Daily Office week label
const WEEK_MAP = {
  advent1: 'Week of 1 Advent',
  advent2: 'Week of 2 Advent',
  advent3: 'Week of 3 Advent',
  advent4: 'Week of 4 Advent',
  christmas1: 'Christmas Day and Following',
  christmas2: 'Christmas Day and Following',
  epiphany1: 'Week of 1 Epiphany',
  epiphany2: 'Week of 2 Epiphany',
  epiphany3: 'Week of 3 Epiphany',
  epiphany4: 'Week of 4 Epiphany',
  epiphany5: 'Week of 5 Epiphany',
  epiphany6: 'Week of 6 Epiphany',
  epiphany7: 'Week of 7 Epiphany',
  epiphany8: 'Week of 8 Epiphany',
  transfiguration: 'Week of Last Epiphany',
  ash_wednesday: 'Ash Wednesday and Following',
  lent1: 'Week of 1 Lent',
  lent2: 'Week of 2 Lent',
  lent3: 'Week of 3 Lent',
  lent4: 'Week of 4 Lent',
  lent5: 'Week of 5 Lent',
  palm: 'Holy Week',
  holy_week_mon: 'Holy Week',
  holy_week_tue: 'Holy Week',
  holy_week_wed: 'Holy Week',
  maundy_thursday: 'Holy Week',
  good_friday: 'Holy Week',
  holy_saturday: 'Holy Week',
  easter: 'Easter Week',
  easter2: 'Week of 2 Easter',
  easter3: 'Week of 3 Easter',
  easter4: 'Week of 4 Easter',
  easter5: 'Week of 5 Easter',
  easter6: 'Week of 6 Easter',
  ascension: 'Week of 6 Easter',
  easter7: 'Week of 7 Easter',
  pentecost: 'Proper 1',   // weekdays of Pentecost week → Proper 1
  trinity: 'Proper 2',     // weekdays of Trinity week → Proper 2
  proper3: 'Proper 3',
  proper4: 'Proper 4',
  proper5: 'Proper 5',
  proper6: 'Proper 6',
  proper7: 'Proper 7',
  proper8: 'Proper 8',
  proper9: 'Proper 9',
  proper10: 'Proper 10',
  proper11: 'Proper 11',
  proper12: 'Proper 12',
  proper13: 'Proper 13',
  proper14: 'Proper 14',
  proper15: 'Proper 15',
  proper16: 'Proper 16',
  proper17: 'Proper 17',
  proper18: 'Proper 18',
  proper19: 'Proper 19',
  proper20: 'Proper 20',
  proper21: 'Proper 21',
  proper22: 'Proper 22',
  proper23: 'Proper 23',
  proper24: 'Proper 24',
  proper25: 'Proper 25',
  proper26: 'Proper 26',
  proper27: 'Proper 27',
  proper28: 'Proper 28',
  christ_king: 'Proper 29',
};

function getDOLYear(date) {
  const year = date.getFullYear();
  const advent = getFirstAdvent(year);
  const adventYear = date >= advent ? year : year - 1;
  return adventYear % 2 === 1 ? 'Year One' : 'Year Two';
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

function normalizeRef(ref) {
  if (!ref) return null;
  // Replace en-dash / em-dash with regular hyphen, trim whitespace
  return ref.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

function formatPsalms(psalmNums) {
  if (!psalmNums || psalmNums.length === 0) return null;
  const first = normalizeRef(psalmNums[0]);
  const extra = psalmNums.length > 1
    ? ` (+ ${psalmNums.slice(1).map(p => normalizeRef(p)).join(', ')})`
    : '';
  return `Psalm ${first}${extra}`;
}

function formatEntry(entry) {
  if (!entry) return null;
  const lessons = entry.lessons || {};
  const psalms = entry.psalms || {};

  let ot = null, nt = null, gospel = null;

  if (lessons.first) {
    // Flat format: {first, second, gospel?}
    ot = normalizeRef(lessons.first);
    nt = lessons.second ? normalizeRef(lessons.second) : null;
    gospel = lessons.gospel ? normalizeRef(lessons.gospel) : null;
  } else if (lessons.morning) {
    // Nested format: {morning: {first, second}, evening: {first, second}}
    ot = lessons.morning.first ? normalizeRef(lessons.morning.first) : null;
    nt = lessons.morning.second ? normalizeRef(lessons.morning.second) : null;
  }

  const psalmRef = formatPsalms(psalms.morning);

  return { ot, psalm: psalmRef, nt, gospel, name: entry.title || null };
}

function findInData(yearData, week, day) {
  return yearData.find(e => e.week === week && e.day === day) || null;
}

/**
 * Returns daily office readings for any date, or null if not found.
 * For Sundays and fixed feasts the caller should prefer the Sunday RCL readings.
 */
export function getDailyOfficeReadings(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAYS[date.getDay()];
  const dolYear = getDOLYear(date);
  const yearData = dolYear === 'Year One' ? year1Data : year2Data;

  // ── 1. Holy days lookup (by date string, e.g. "Nov 10") ─────────────────
  const dateStr = `${MONTHS_SHORT[month - 1]} ${day}`;
  const holyDay = holyDaysData.find(e => e.day === dateStr);
  if (holyDay) return formatEntry(holyDay);

  // ── 2. Christmas season (Dec 25 – Jan 5) by specific date ───────────────
  const isChristmasSeason =
    (month === 12 && day >= 25) || (month === 1 && day >= 1 && day <= 5);
  if (isChristmasSeason) {
    // Sundays in Christmas season use the generic "Sunday" entry
    const lookupDay = date.getDay() === 0 ? 'Sunday' : dateStr;
    const entry = findInData(yearData, 'Christmas Day and Following', lookupDay);
    if (entry) return formatEntry(entry);
  }

  // ── 3. Epiphany "and Following" week (Jan 6–12) by specific date ─────────
  if (month === 1 && day >= 6 && day <= 12) {
    const lookupDay = date.getDay() === 6 ? 'Saturday' : dateStr;
    const entry = findInData(yearData, 'The Epiphany and Following', lookupDay);
    if (entry) return formatEntry(entry);
  }

  // ── 4. Ash Wednesday week (Thu–Sat, days 1–3 after Ash Wednesday) ────────
  const easter = getEaster(date.getFullYear());
  const ashWed = addDays(easter, -46);
  const daysFromAshWed = Math.round((date.getTime() - ashWed.getTime()) / 86400000);
  if (daysFromAshWed >= 1 && daysFromAshWed <= 3) {
    const entry = findInData(yearData, 'Ash Wednesday and Following', dayName);
    if (entry) return formatEntry(entry);
  }

  // ── 5. General lookup via liturgical info ────────────────────────────────
  const info = getLiturgicalInfo(date);
  if (!info || !info.key) return null;

  const baseKey = info.key
    .replace(/_[A-C]$/, '')   // strip year suffix (_A, _B, _C)
    .replace(/_Year\s\w+$/, ''); // strip any year label

  const week = WEEK_MAP[baseKey];
  if (!week) return null;

  const entry = findInData(yearData, week, dayName);
  return entry ? formatEntry(entry) : null;
}

/** Human-readable label for the Daily Office year cycle */
export function getDOLYearLabel(date) {
  return getDOLYear(date);
}
