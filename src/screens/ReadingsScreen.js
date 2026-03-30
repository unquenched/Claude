import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getLiturgicalInfo, getSeasonColor, getSeasonAccent } from '../utils/liturgical';
import { getReadings } from '../data/lectionary';
import { getAllNotesForDate, getAllHighlightsForDate, saveNote, saveHighlights } from '../utils/storage';

import ReadingCard from '../components/ReadingCard';
import NoteModal from '../components/NoteModal';
import CalendarModal from '../components/CalendarModal';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatDate(date) {
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function ReadingsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [liturgicalInfo, setLiturgicalInfo] = useState(null);
  const [readings, setReadings] = useState(null);
  const [notes, setNotes] = useState({});
  const [highlights, setHighlights] = useState({});
  const [noteModal, setNoteModal] = useState({ visible: false, type: null });
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Recompute liturgical info + load storage whenever date changes
  useEffect(() => {
    const info = getLiturgicalInfo(currentDate);
    setLiturgicalInfo(info);
    setReadings(getReadings(info));

    (async () => {
      const [n, h] = await Promise.all([
        getAllNotesForDate(currentDate),
        getAllHighlightsForDate(currentDate),
      ]);
      setNotes(n || {});
      setHighlights(h || {});
    })();
  }, [currentDate]);

  const handleSaveNote = useCallback(async (text) => {
    const type = noteModal.type;
    await saveNote(currentDate, type, text);
    setNotes(prev => ({ ...prev, [type]: text || null }));
    setNoteModal({ visible: false, type: null });
  }, [noteModal.type, currentDate]);

  const handleHighlightsChange = useCallback(async (type, verseNumbers) => {
    await saveHighlights(currentDate, type, verseNumbers);
    setHighlights(prev => ({ ...prev, [type]: verseNumbers }));
  }, [currentDate]);

  const season = liturgicalInfo?.season || 'Ordinary';
  const headerBg = getSeasonColor(season);
  const accent = getSeasonAccent(season);
  const isDarkHeader = ['Ordinary', 'Advent', 'Lent', 'HolyWeek'].includes(season);

  const readingTypes = readings
    ? [
        { type: 'ot',     ref: readings.ot     },
        { type: 'psalm',  ref: readings.psalm   },
        { type: 'nt',     ref: readings.nt      },
        { type: 'gospel', ref: readings.gospel  },
      ].filter(r => r.ref)
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: headerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <TouchableOpacity
          onPress={() => setCurrentDate(d => addDays(d, -1))}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={isDarkHeader ? '#fff' : '#1a2e4a'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateCenter} onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateText, { color: isDarkHeader ? '#fff' : '#1a2e4a' }]}>
            {formatDate(currentDate)}
          </Text>
          <Ionicons name="calendar-outline" size={16} color={isDarkHeader ? '#ffffffaa' : '#1a2e4aaa'} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentDate(d => addDays(d, 1))}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-forward" size={28} color={isDarkHeader ? '#fff' : '#1a2e4a'} />
        </TouchableOpacity>
      </View>

      {/* Liturgical occasion banner */}
      {liturgicalInfo && (
        <View style={[styles.occasionBanner, { backgroundColor: headerBg }]}>
          <Text style={[styles.occasionName, { color: isDarkHeader ? '#ffffffdd' : '#1a2e4add' }]}>
            {liturgicalInfo.name}
            {liturgicalInfo.year ? `  ·  Year ${liturgicalInfo.year}` : ''}
          </Text>
          {liturgicalInfo.isWeekday && liturgicalInfo.sundayDate && (
            <Text style={[styles.weekdayNote, { color: isDarkHeader ? '#ffffff88' : '#1a2e4a88' }]}>
              Readings for the week of{' '}
              {MONTHS[liturgicalInfo.sundayDate.getMonth()]} {liturgicalInfo.sundayDate.getDate()}
            </Text>
          )}
        </View>
      )}

      {/* Readings list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {readingTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No readings found for this date.</Text>
          </View>
        ) : (
          readingTypes.map(({ type, ref }) => (
            <ReadingCard
              key={type}
              type={type}
              reference={ref}
              note={notes[type] || null}
              highlights={highlights[type] || []}
              accentColor={accent}
              onNotePress={() => setNoteModal({ visible: true, type })}
              onHighlightsChange={(vv) => handleHighlightsChange(type, vv)}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Note modal */}
      <NoteModal
        visible={noteModal.visible}
        readingType={noteModal.type}
        initialText={noteModal.type ? (notes[noteModal.type] || '') : ''}
        onSave={handleSaveNote}
        onClose={() => setNoteModal({ visible: false, type: null })}
      />

      {/* Calendar modal */}
      <CalendarModal
        visible={calendarVisible}
        selectedDate={currentDate}
        onSelect={setCurrentDate}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  dateText: { fontSize: 16, fontWeight: '600' },
  occasionBanner: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
  },
  occasionName: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  weekdayNote: { fontSize: 12, textAlign: 'center', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: '#aaa' },
});
