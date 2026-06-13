import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../constants/theme';
import { StatusColors } from '../constants/theme';

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const config = StatusColors[status] || StatusColors['pending'];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.semibold,
  },
});
