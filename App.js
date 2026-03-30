import React from 'react';
import { StatusBar } from 'expo-status-bar';
import ReadingsScreen from './src/screens/ReadingsScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <ReadingsScreen />
    </>
  );
}
