import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text, useTheme } from 'form0-react-native';
import { listForms } from '../forms/registry.js';
import Screen from '../components/Screen.js';

export default function Home({ onSelectForm }) {
  const { theme, isDark } = useTheme();
  const forms = listForms();

  return (
    <Screen style={{ backgroundColor: theme.color.background }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text
          style={{
            fontSize: theme.fontSize.xxl,
            fontWeight: '700',
            marginBottom: 6,
            color: theme.color.foreground,
          }}
        >
          Forms
        </Text>
        <Text style={{ color: theme.color.description, marginBottom: 16 }}>Pick a form to start.</Text>
        {forms.length === 0 ? (
          <Text style={{ color: theme.color.foreground }}>No forms registered.</Text>
        ) : (
          forms.map((form) => (
            <Pressable
              key={form.id}
              onPress={() => onSelectForm?.(form.id)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: theme.color.border,
                borderRadius: 14,
                marginBottom: 12,
                backgroundColor: pressed
                  ? isDark
                    ? theme.color.section
                    : '#ececf2'
                  : theme.color.section,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: isDark ? 2 : 1,
              })}
            >
              <Text
                style={{
                  fontWeight: '600',
                  marginBottom: 4,
                  fontSize: theme.fontSize.md,
                  color: theme.color.foreground,
                }}
              >
                {form.title}
              </Text>
              {form.description ? (
                <Text style={{ color: theme.color.description }}>{form.description}</Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
