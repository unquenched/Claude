import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys: "notes_YYYY-MM-DD_ot" | "notes_YYYY-MM-DD_psalm" | etc.
//       "highlights_YYYY-MM-DD_ot" — comma-separated verse numbers

function dateKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function getNote(date, readingType) {
  try {
    return await AsyncStorage.getItem(`notes_${dateKey(date)}_${readingType}`);
  } catch {
    return null;
  }
}

export async function saveNote(date, readingType, text) {
  try {
    if (text) {
      await AsyncStorage.setItem(`notes_${dateKey(date)}_${readingType}`, text);
    } else {
      await AsyncStorage.removeItem(`notes_${dateKey(date)}_${readingType}`);
    }
  } catch {}
}

export async function getHighlights(date, readingType) {
  try {
    const raw = await AsyncStorage.getItem(`highlights_${dateKey(date)}_${readingType}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveHighlights(date, readingType, verseNumbers) {
  try {
    await AsyncStorage.setItem(
      `highlights_${dateKey(date)}_${readingType}`,
      JSON.stringify(verseNumbers),
    );
  } catch {}
}

export async function getAllNotesForDate(date) {
  const types = ['ot', 'psalm', 'nt', 'gospel'];
  const results = {};
  for (const t of types) {
    results[t] = await getNote(date, t);
  }
  return results;
}

export async function getAllHighlightsForDate(date) {
  const types = ['ot', 'psalm', 'nt', 'gospel'];
  const results = {};
  for (const t of types) {
    results[t] = await getHighlights(date, t);
  }
  return results;
}
