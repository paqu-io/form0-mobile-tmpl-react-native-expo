import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { listForms } from '../forms/registry.js';
import Screen from '../components/Screen.js';

export default function Home({ onSelectForm }) {
  const forms = listForms();

  return (
    <Screen style={{ backgroundColor: '#f6f6f8' }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 6 }}>
          Forms
        </Text>
        <Text style={{ color: '#666', marginBottom: 16 }}>
          Pick a form to start.
        </Text>
        {forms.length === 0 ? (
          <Text>No forms registered.</Text>
        ) : (
          forms.map((form) => (
            <Pressable
              key={form.id}
              onPress={() => onSelectForm?.(form.id)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: '#e0e0e8',
                borderRadius: 14,
                marginBottom: 12,
                backgroundColor: pressed ? '#ececf2' : '#fff',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              })}
            >
              <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 16 }}>
                {form.title}
              </Text>
              {form.description ? (
                <Text style={{ color: '#666' }}>{form.description}</Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
