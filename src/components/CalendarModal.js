import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function CalendarModal({ visible, selectedDate, onSelect, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build grid cells (include padding for first day's weekday offset)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#1a2e4a" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={24} color="#1a2e4a" />
            </TouchableOpacity>
          </View>

          {/* Day-of-week labels */}
          <View style={styles.dowRow}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={styles.dowLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((date, idx) => {
              if (!date) return <View key={`empty-${idx}`} style={styles.cell} />;
              const isToday = sameDay(date, today);
              const isSelected = sameDay(date, selectedDate);
              const isSunday = date.getDay() === 0;
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.cell,
                    isSelected && styles.cellSelected,
                    isToday && !isSelected && styles.cellToday,
                  ]}
                  onPress={() => { onSelect(date); onClose(); }}
                >
                  <Text style={[
                    styles.cellText,
                    isSelected && styles.cellTextSelected,
                    isToday && !isSelected && styles.cellTextToday,
                    isSunday && !isSelected && styles.cellTextSunday,
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today button */}
          <TouchableOpacity style={styles.todayBtn} onPress={() => { onSelect(today); onClose(); }}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1a2e4a' },
  dowRow: { flexDirection: 'row', marginBottom: 8 },
  dowLabel: {
    width: CELL_SIZE, textAlign: 'center', fontSize: 12,
    fontWeight: '600', color: '#888',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  cellSelected: { backgroundColor: '#1a2e4a' },
  cellToday: { backgroundColor: '#e8f0fb' },
  cellText: { fontSize: 15, color: '#333' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#1a2e4a', fontWeight: '700' },
  cellTextSunday: { color: '#8b1a1a' },
  todayBtn: {
    marginTop: 16, alignSelf: 'center',
    paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: '#1a2e4a', borderRadius: 20,
  },
  todayText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  closeBtn: { marginTop: 10, alignSelf: 'center', padding: 8 },
  closeText: { color: '#888', fontSize: 14 },
});
