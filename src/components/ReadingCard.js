import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPE_LABELS = {
  ot: 'Old Testament',
  psalm: 'Psalm / Canticle',
  nt: 'Epistle',
  gospel: 'Gospel',
};

const TYPE_ICONS = {
  ot: 'book-outline',
  psalm: 'musical-notes-outline',
  nt: 'mail-outline',
  gospel: 'star-outline',
};

// Convert an abbreviated reference like "Isa 2:1-5" to a bible-api.com URL
const BOOK_MAP = {
  'Genesis': 'Genesis', 'Gen': 'Genesis',
  'Exodus': 'Exodus', 'Ex': 'Exodus',
  'Leviticus': 'Leviticus', 'Lev': 'Leviticus',
  'Numbers': 'Numbers', 'Num': 'Numbers',
  'Deuteronomy': 'Deuteronomy', 'Deut': 'Deuteronomy',
  'Joshua': 'Joshua', 'Josh': 'Joshua',
  'Judges': 'Judges', 'Judg': 'Judges',
  'Ruth': 'Ruth',
  '1 Samuel': '1 Samuel', '1 Sam': '1 Samuel',
  '2 Samuel': '2 Samuel', '2 Sam': '2 Samuel',
  '1 Kings': '1 Kings', '1 Kgs': '1 Kings',
  '2 Kings': '2 Kings', '2 Kgs': '2 Kings',
  '1 Chronicles': '1 Chronicles', '1 Chr': '1 Chronicles',
  '2 Chronicles': '2 Chronicles', '2 Chr': '2 Chronicles',
  'Ezra': 'Ezra', 'Nehemiah': 'Nehemiah', 'Neh': 'Nehemiah',
  'Esther': 'Esther', 'Esth': 'Esther',
  'Job': 'Job',
  'Psalm': 'Psalms', 'Psalms': 'Psalms', 'Ps': 'Psalms',
  'Proverbs': 'Proverbs', 'Prov': 'Proverbs',
  'Ecclesiastes': 'Ecclesiastes', 'Eccl': 'Ecclesiastes',
  'Song of Solomon': 'Song of Solomon', 'Song': 'Song of Solomon',
  'Isaiah': 'Isaiah', 'Isa': 'Isaiah',
  'Jeremiah': 'Jeremiah', 'Jer': 'Jeremiah',
  'Lamentations': 'Lamentations', 'Lam': 'Lamentations',
  'Ezekiel': 'Ezekiel', 'Ezek': 'Ezekiel',
  'Daniel': 'Daniel', 'Dan': 'Daniel',
  'Hosea': 'Hosea', 'Hos': 'Hosea',
  'Joel': 'Joel', 'Amos': 'Amos',
  'Obadiah': 'Obadiah', 'Obad': 'Obadiah',
  'Jonah': 'Jonah', 'Jon': 'Jonah',
  'Micah': 'Micah', 'Mic': 'Micah',
  'Nahum': 'Nahum', 'Nah': 'Nahum',
  'Habakkuk': 'Habakkuk', 'Hab': 'Habakkuk',
  'Zephaniah': 'Zephaniah', 'Zeph': 'Zephaniah',
  'Haggai': 'Haggai', 'Hag': 'Haggai',
  'Zechariah': 'Zechariah', 'Zech': 'Zechariah',
  'Malachi': 'Malachi', 'Mal': 'Malachi',
  'Matthew': 'Matthew', 'Matt': 'Matthew',
  'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
  'Romans': 'Romans', 'Rom': 'Romans',
  '1 Corinthians': '1 Corinthians', '1 Cor': '1 Corinthians',
  '2 Corinthians': '2 Corinthians', '2 Cor': '2 Corinthians',
  'Galatians': 'Galatians', 'Gal': 'Galatians',
  'Ephesians': 'Ephesians', 'Eph': 'Ephesians',
  'Philippians': 'Philippians', 'Phil': 'Philippians',
  'Colossians': 'Colossians', 'Col': 'Colossians',
  '1 Thessalonians': '1 Thessalonians', '1 Thess': '1 Thessalonians',
  '2 Thessalonians': '2 Thessalonians', '2 Thess': '2 Thessalonians',
  '1 Timothy': '1 Timothy', '1 Tim': '1 Timothy',
  '2 Timothy': '2 Timothy', '2 Tim': '2 Timothy',
  'Titus': 'Titus', 'Philemon': 'Philemon',
  'Hebrews': 'Hebrews', 'Heb': 'Hebrews',
  'James': 'James', 'Jas': 'James',
  '1 Peter': '1 Peter', '1 Pet': '1 Peter',
  '2 Peter': '2 Peter', '2 Pet': '2 Peter',
  '1 John': '1 John', '2 John': '2 John', '3 John': '3 John',
  'Jude': 'Jude',
  'Revelation': 'Revelation', 'Rev': 'Revelation',
};

function refToApiUrl(ref) {
  // Take only the first range if semicolons separate multiple passages
  const primary = ref.split(';')[0].trim();
  // Replace abbreviated book name with full
  const match = primary.match(/^(\d\s)?([A-Za-z\s]+)\s(\d.*)/);
  if (!match) return null;
  const prefix = match[1] ? match[1].trim() + ' ' : '';
  const book = (prefix + match[2].trim());
  const verses = match[3];
  const fullBook = BOOK_MAP[book] || book;
  const encoded = encodeURIComponent(`${fullBook} ${verses}`);
  return `https://bible-api.com/${encoded}?translation=web`;
}

export default function ReadingCard({
  type, reference, note, highlights, onNotePress, onHighlightsChange, accentColor,
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);

  const toggleExpand = useCallback(async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (verses) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const url = refToApiUrl(reference);
      if (!url) throw new Error('Could not parse reference');
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVerses(data.verses || []);
    } catch (e) {
      setError(e.message || 'Failed to load text');
    } finally {
      setLoading(false);
    }
  }, [expanded, verses, reference]);

  function toggleHighlight(verseNum) {
    const next = highlights.includes(verseNum)
      ? highlights.filter(v => v !== verseNum)
      : [...highlights, verseNum];
    onHighlightsChange(next);
  }

  const hasNote = !!note;

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      {/* Card header */}
      <View style={styles.headerRow}>
        <View style={[styles.typePill, { backgroundColor: accentColor + '22' }]}>
          <Ionicons name={TYPE_ICONS[type]} size={14} color={accentColor} />
          <Text style={[styles.typeLabel, { color: accentColor }]}>{TYPE_LABELS[type]}</Text>
        </View>
        <TouchableOpacity
          style={[styles.noteBtn, hasNote && styles.noteBtnActive]}
          onPress={onNotePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={hasNote ? 'create' : 'create-outline'}
            size={18}
            color={hasNote ? accentColor : '#aaa'}
          />
        </TouchableOpacity>
      </View>

      {/* Reference */}
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <Text style={styles.reference}>{reference}</Text>
        {note ? (
          <Text style={styles.noteSummary} numberOfLines={2}>
            {note}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Expand toggle */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand}>
        <Text style={[styles.expandText, { color: accentColor }]}>
          {expanded ? 'Collapse' : 'Read passage'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={accentColor}
        />
      </TouchableOpacity>

      {/* Verse content */}
      {expanded && (
        <View style={styles.verseContainer}>
          {loading && <ActivityIndicator color={accentColor} style={{ marginVertical: 16 }} />}
          {error && <Text style={styles.errorText}>Could not load text: {error}</Text>}
          {verses && verses.map(v => (
            <Pressable
              key={`${v.chapter}-${v.verse}`}
              onLongPress={() => toggleHighlight(v.verse)}
              style={[
                styles.verseLine,
                highlights.includes(v.verse) && styles.verseHighlighted,
              ]}
            >
              <Text style={styles.verseNum}>{v.verse}</Text>
              <Text style={styles.verseText}>{v.text.trim()}</Text>
            </Pressable>
          ))}
          {verses && (
            <Text style={styles.highlightHint}>Long-press a verse to highlight</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardExpanded: { shadowOpacity: 0.12, elevation: 5 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  typePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, gap: 5,
  },
  typeLabel: { fontSize: 12, fontWeight: '600' },
  noteBtn: { padding: 4 },
  noteBtnActive: {},
  reference: {
    fontSize: 17, fontWeight: '700', color: '#1a2e4a', marginBottom: 4,
  },
  noteSummary: {
    fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 4,
  },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, alignSelf: 'flex-start',
  },
  expandText: { fontSize: 13, fontWeight: '600' },
  verseContainer: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  verseLine: {
    flexDirection: 'row', marginBottom: 8, borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  verseHighlighted: { backgroundColor: '#fff9c4' },
  verseNum: {
    fontSize: 11, color: '#aaa', fontWeight: '700',
    width: 24, marginTop: 2, flexShrink: 0,
  },
  verseText: { fontSize: 15, color: '#222', lineHeight: 22, flex: 1 },
  highlightHint: {
    fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 8,
  },
  errorText: { color: '#c0392b', fontSize: 14, textAlign: 'center', marginVertical: 10 },
});
