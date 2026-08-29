import React from 'react';
import { StyleSheet, View } from 'react-native';

export const COLORS = {
  primary: '#0066FF',      // Электрический синий
  secondary: '#00D9FF',    // Cyan
  accent: '#FF6B6B',       // Красный
  background: '#10121C',   // Очень темный синий
  surface: '#1A1D2E',      // Темная поверхность
  surfaceAlt: '#242C4A',   // Альтернативная поверхность
  text: '#FFFFFF',         // Белый текст
  textSecondary: '#B0B8D4', // Приглушенный текст
  border: '#2A3255',       // Граница
};

export const FONTS = {
  regular: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  medium: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  semibold: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  bold: { fontFamily: 'Inter_700Bold', fontSize: 14 },
};

export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: COLORS.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
