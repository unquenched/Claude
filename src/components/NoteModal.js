import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

const READING_LABELS = { ot: 'Old Testament', psalm: 'Psalm', nt: 'Epistle', gospel: 'Gospel' };

export default function NoteModal({ visible, readingType, initialText, onSave, onClose }) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(initialText || '');
  }, [initialText, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            {READING_LABELS[readingType] || 'Note'}
          </Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Add your note here…"
            placeholderTextColor="#999"
            multiline
            autoFocus
            textAlignVertical="top"
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(text)}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a2e4a',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#222',
    minHeight: 120,
    maxHeight: 240,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelText: { fontSize: 15, color: '#555' },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a2e4a',
  },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
