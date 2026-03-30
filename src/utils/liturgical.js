/**
 * Liturgical calendar utilities for the Revised Common Lectionary.
 * Calculates the liturgical occasion for any given date.
 */

// ─── Easter calculation (Anonymous Gregorian algorithm) ─────────────────────

export function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─── First Sunday of Advent ──────────────────────────────────────────────────
// The Sunday that falls between Nov 27 and Dec 3 (nearest Sunday to Nov 30).

export function getFirstAdvent(year) {
  // Last Sunday on or before Dec 3
  const dec3 = new Date(year, 11, 3);
  const dow = dec3.getDay(); // 0=Sun
  return new Date(year, 11, 3 - dow);
}

// ─── Liturgical year (A / B / C) ─────────────────────────────────────────────
// Year is determined by the calendar year in which Advent begins.
// 2025 % 3 === 0 → Year A, 2026 % 3 === 1 → Year B, 2027 % 3 === 2 → Year C

export function getLiturgicalYear(date) {
  const year = date.getFullYear();
  const advent = getFirstAdvent(year);
  // If the date is on or after this year's Advent, the new liturgical year starts
  const liturgicalStartYear = date >= advent ? year : year - 1;
  const mod = liturgicalStartYear % 3;
  if (mod === 0) return 'A';
  if (mod === 1) return 'B';
  return 'C';
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

function prevSunday(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ─── Proper number (Ordinary Time after Pentecost) ───────────────────────────
// Proper N = the Sunday whose date falls in the fixed calendar window.

const PROPER_RANGES = [
  { proper: 3,  m: 5,  d1: 22, d2: 28 },
  { proper: 4,  m: 5,  d1: 29, d2: 31, m2: 6, d2end: 4 },
  { proper: 5,  m: 6,  d1:  5, d2: 11 },
  { proper: 6,  m: 6,  d1: 12, d2: 18 },
  { proper: 7,  m: 6,  d1: 19, d2: 25 },
  { proper: 8,  m: 6,  d1: 26, d2: 30, m2: 7, d2end: 2 },
  { proper: 9,  m: 7,  d1:  3, d2:  9 },
  { proper: 10, m: 7,  d1: 10, d2: 16 },
  { proper: 11, m: 7,  d1: 17, d2: 23 },
  { proper: 12, m: 7,  d1: 24, d2: 30 },
  { proper: 13, m: 7,  d1: 31, d2: 31, m2: 8, d2end: 6 },
  { proper: 14, m: 8,  d1:  7, d2: 13 },
  { proper: 15, m: 8,  d1: 14, d2: 20 },
  { proper: 16, m: 8,  d1: 21, d2: 27 },
  { proper: 17, m: 8,  d1: 28, d2: 31, m2: 9, d2end: 3 },
  { proper: 18, m: 9,  d1:  4, d2: 10 },
  { proper: 19, m: 9,  d1: 11, d2: 17 },
  { proper: 20, m: 9,  d1: 18, d2: 24 },
  { proper: 21, m: 9,  d1: 25, d2: 30, m2: 10, d2end: 1 },
  { proper: 22, m: 10, d1:  2, d2:  8 },
  { proper: 23, m: 10, d1:  9, d2: 15 },
  { proper: 24, m: 10, d1: 16, d2: 22 },
  { proper: 25, m: 10, d1: 23, d2: 29 },
  { proper: 26, m: 10, d1: 30, d2: 31, m2: 11, d2end: 5 },
  { proper: 27, m: 11, d1:  6, d2: 12 },
  { proper: 28, m: 11, d1: 13, d2: 19 },
  { proper: 29, m: 11, d1: 20, d2: 26 },
];

function getProperNumber(date) {
  const m = date.getMonth() + 1; // 1-based
  const d = date.getDate();
  for (const r of PROPER_RANGES) {
    if (r.m2) {
      // Range spans two months
      if ((m === r.m && d >= r.d1) || (m === r.m2 && d <= r.d2end)) return r.proper;
    } else {
      if (m === r.m && d >= r.d1 && d <= r.d2) return r.proper;
    }
  }
  return null;
}

// ─── Main function: getLiturgicalInfo ────────────────────────────────────────
// Returns { key, name, year, season, isWeekday, sundayDate }

export function getLiturgicalInfo(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const litYear = getLiturgicalYear(date);

  // ── Fixed feasts (same date every year) ──
  if (month === 12 && day === 25) {
    return { key: 'christmas_day', name: 'Christmas Day', year: null, season: 'Christmas', isWeekday: false };
  }
  if (month === 1 && day === 1) {
    return { key: 'holy_name', name: 'Holy Name of Jesus', year: null, season: 'Christmas', isWeekday: false };
  }
  if (month === 1 && day === 6) {
    return { key: 'epiphany', name: 'Epiphany of the Lord', year: null, season: 'Epiphany', isWeekday: false };
  }
  if (month === 11 && day === 1) {
    return { key: 'all_saints', name: 'All Saints\' Day', year: null, season: 'Ordinary', isWeekday: false };
  }

  // US Thanksgiving: 4th Thursday in November
  if (month === 11 && date.getDay() === 4) {
    const firstThursday = new Date(year, 10, 1);
    while (firstThursday.getDay() !== 4) firstThursday.setDate(firstThursday.getDate() + 1);
    const fourthThursday = new Date(firstThursday.getTime() + 21 * 86400000);
    if (isSameDay(date, fourthThursday)) {
      return { key: 'thanksgiving', name: 'Thanksgiving Day', year: null, season: 'Ordinary', isWeekday: false };
    }
  }

  // ── Moveable feasts based on Easter ──
  const easter = getEaster(year);
  const ashWednesday = addDays(easter, -46);
  const palmSunday = addDays(easter, -7);
  const maundyThursday = addDays(easter, -3);
  const goodFriday = addDays(easter, -2);
  const holySaturday = addDays(easter, -1);
  const ascension = addDays(easter, 39);
  const pentecost = addDays(easter, 49);
  const trinitySunday = addDays(easter, 56);

  if (isSameDay(date, ashWednesday)) {
    return { key: 'ash_wednesday', name: 'Ash Wednesday', year: null, season: 'Lent', isWeekday: false };
  }
  if (isSameDay(date, maundyThursday)) {
    return { key: 'maundy_thursday', name: 'Maundy Thursday', year: null, season: 'HolyWeek', isWeekday: false };
  }
  if (isSameDay(date, goodFriday)) {
    return { key: 'good_friday', name: 'Good Friday', year: null, season: 'HolyWeek', isWeekday: false };
  }
  if (isSameDay(date, holySaturday)) {
    return { key: 'holy_saturday', name: 'Holy Saturday', year: null, season: 'HolyWeek', isWeekday: false };
  }
  if (isSameDay(date, ascension)) {
    return { key: `ascension_${litYear}`, name: 'Ascension of the Lord', year: litYear, season: 'Easter', isWeekday: false };
  }

  // ── For Sunday-only occasions, handle weekdays by falling back to Sunday ──
  const sunday = prevSunday(date);
  const isWeekday = date.getDay() !== 0;

  // Recalculate easter-relative offsets for the relevant Sunday
  const sundayDiffDays = Math.round((sunday.getTime() - easter.getTime()) / 86400000);
  const dateDiffDays = Math.round((date.getTime() - easter.getTime()) / 86400000);

  // Holy Week weekdays (Mon–Wed, after Palm Sunday and before Maundy Thursday)
  if (dateDiffDays >= -6 && dateDiffDays <= -4) {
    const names = ['', 'Monday in Holy Week', 'Tuesday in Holy Week', 'Wednesday in Holy Week'];
    const idx = dateDiffDays + 6; // -6→0, -5→1, -4→2
    return {
      key: `holy_week_${['mon','tue','wed'][idx]}`,
      name: names[idx + 1],
      year: null,
      season: 'HolyWeek',
      isWeekday: true,
    };
  }

  // Use the Sunday of the week for all lookups below
  const refDate = isWeekday ? sunday : date;
  const refLitYear = getLiturgicalYear(refDate);
  const refEaster = isSameDay(refDate, easter) || Math.round((refDate.getTime() - easter.getTime()) / 86400000) === 0
    ? easter
    : getEaster(refDate.getFullYear());
  const refDiff = Math.round((refDate.getTime() - easter.getTime()) / 86400000);

  // ── Easter Sunday ──
  if (isSameDay(refDate, easter)) {
    return { key: `easter_${refLitYear}`, name: 'Easter Sunday', year: refLitYear, season: 'Easter', isWeekday, sundayDate: refDate };
  }

  // ── Easter season (E2–E7) ──
  if (refDiff > 0 && refDiff < 49) {
    const week = Math.round(refDiff / 7);
    if (week >= 1 && week <= 6) {
      const ordinals = ['Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'];
      return {
        key: `easter${week + 1}_${refLitYear}`,
        name: `${ordinals[week - 1]} Sunday of Easter`,
        year: refLitYear,
        season: 'Easter',
        isWeekday,
        sundayDate: refDate,
      };
    }
  }

  // ── Pentecost ──
  if (isSameDay(refDate, pentecost)) {
    return { key: `pentecost_${refLitYear}`, name: 'Day of Pentecost', year: refLitYear, season: 'Easter', isWeekday, sundayDate: refDate };
  }

  // ── Trinity ──
  if (isSameDay(refDate, trinitySunday)) {
    return { key: `trinity_${refLitYear}`, name: 'Trinity Sunday', year: refLitYear, season: 'Ordinary', isWeekday, sundayDate: refDate };
  }

  // ── Palm Sunday ──
  if (isSameDay(refDate, palmSunday)) {
    return { key: `palm_${refLitYear}`, name: 'Palm Sunday', year: refLitYear, season: 'HolyWeek', isWeekday, sundayDate: refDate };
  }

  // ── Lent 1–5 ──
  if (refDiff >= -42 && refDiff < -7) {
    const week = Math.round((refDiff + 49) / 7); // 1–5
    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    return {
      key: `lent${week}_${refLitYear}`,
      name: `${ordinals[week - 1]} Sunday in Lent`,
      year: refLitYear,
      season: 'Lent',
      isWeekday,
      sundayDate: refDate,
    };
  }

  // ── Advent ──
  const adventYear = refDate >= getFirstAdvent(refDate.getFullYear())
    ? refDate.getFullYear()
    : refDate.getFullYear() - 1;
  const adventStart = getFirstAdvent(adventYear);
  const daysSinceAdvent = Math.round((refDate.getTime() - adventStart.getTime()) / 86400000);

  if (daysSinceAdvent >= 0 && daysSinceAdvent < 28) {
    const week = Math.floor(daysSinceAdvent / 7) + 1; // 1–4
    const ordinals = ['First', 'Second', 'Third', 'Fourth'];
    return {
      key: `advent${week}_${refLitYear}`,
      name: `${ordinals[week - 1]} Sunday of Advent`,
      year: refLitYear,
      season: 'Advent',
      isWeekday,
      sundayDate: refDate,
    };
  }

  // ── Christmas season ──
  const refYear = refDate.getFullYear();
  const christmas = new Date(refYear, 11, 25);
  const daysSinceChristmas = Math.round((refDate.getTime() - christmas.getTime()) / 86400000);
  if (daysSinceChristmas >= 1 && daysSinceChristmas <= 7) {
    return { key: `christmas1_${refLitYear}`, name: 'First Sunday after Christmas', year: refLitYear, season: 'Christmas', isWeekday, sundayDate: refDate };
  }
  // Jan 2–5 may yield Christmas 2
  if (refDate.getMonth() === 0 && refDate.getDate() >= 2 && refDate.getDate() <= 5) {
    return { key: 'christmas2', name: 'Second Sunday after Christmas', year: null, season: 'Christmas', isWeekday, sundayDate: refDate };
  }

  // ── Epiphany season ──
  // Baptism of the Lord: first Sunday after Jan 6
  const jan6 = new Date(refYear, 0, 6);
  const jan6Dow = jan6.getDay();
  const baptismSunday = addDays(jan6, jan6Dow === 0 ? 7 : 7 - jan6Dow);

  // Transfiguration: Sunday before Ash Wednesday
  // Ash Wednesday is always Wednesday (dow=3), so Sunday is 3 days before
  const transfiguration = addDays(ashWednesday, -3);

  if (isSameDay(refDate, transfiguration)) {
    return { key: `transfiguration_${refLitYear}`, name: 'Transfiguration Sunday', year: refLitYear, season: 'Epiphany', isWeekday, sundayDate: refDate };
  }

  const daysSinceBaptism = Math.round((refDate.getTime() - baptismSunday.getTime()) / 86400000);
  if (daysSinceBaptism >= 0 && daysSinceBaptism < 7) {
    return { key: `epiphany1_${refLitYear}`, name: 'Baptism of the Lord', year: refLitYear, season: 'Epiphany', isWeekday, sundayDate: refDate };
  }
  if (daysSinceBaptism >= 7) {
    const epiphanyWeek = Math.floor(daysSinceBaptism / 7) + 1; // 2–8
    if (epiphanyWeek >= 2 && epiphanyWeek <= 8) {
      const ordinals = ['', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
      return {
        key: `epiphany${epiphanyWeek}_${refLitYear}`,
        name: `${ordinals[epiphanyWeek]} Sunday after Epiphany`,
        year: refLitYear,
        season: 'Epiphany',
        isWeekday,
        sundayDate: refDate,
      };
    }
  }

  // ── Ordinary Time (Christ the King / Propers 4–29) ──
  // Christ the King = last Sunday before Advent
  const nextAdvent = getFirstAdvent(
    refDate >= getFirstAdvent(refYear) ? refYear + 1 : refYear
  );
  const christKing = addDays(nextAdvent, -7);
  if (isSameDay(refDate, christKing)) {
    return { key: `christ_king_${refLitYear}`, name: 'Christ the King', year: refLitYear, season: 'Ordinary', isWeekday, sundayDate: refDate };
  }

  // Regular Ordinary Time propers
  const proper = getProperNumber(refDate);
  if (proper !== null) {
    return {
      key: `proper${proper}_${refLitYear}`,
      name: `Proper ${proper}`,
      year: refLitYear,
      season: 'Ordinary',
      isWeekday,
      sundayDate: refDate,
    };
  }

  // Fallback
  return {
    key: null,
    name: 'Ordinary Time',
    year: refLitYear,
    season: 'Ordinary',
    isWeekday,
    sundayDate: refDate,
  };
}

// ─── Season colour ────────────────────────────────────────────────────────────

export function getSeasonColor(season) {
  switch (season) {
    case 'Advent':   return '#4a1b6e'; // Purple
    case 'Christmas': return '#c8a84b'; // Gold
    case 'Epiphany': return '#c8a84b'; // Gold/Green
    case 'Lent':     return '#6b3a7d'; // Violet
    case 'HolyWeek': return '#8b1a1a'; // Deep red
    case 'Easter':   return '#ffffff'; // White
    case 'Ordinary': return '#2d6a2d'; // Green
    default:         return '#1a2e4a'; // Navy
  }
}

export function getSeasonAccent(season) {
  switch (season) {
    case 'Advent':   return '#9b4fd4';
    case 'Christmas': return '#f0c040';
    case 'Epiphany': return '#f0c040';
    case 'Lent':     return '#a060c0';
    case 'HolyWeek': return '#cc3333';
    case 'Easter':   return '#f0c040';
    case 'Ordinary': return '#4caf50';
    default:         return '#4a90d9';
  }
}
