import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Form0Form from '../components/Form0Form.js';
import { getFormById } from '../forms/registry.js';
import { useFormSchema } from '../forms/use-form-schema.js';
import Screen from '../components/Screen.js';
import form0Config from '../../form0.config.js';

export default function FormPage({ formId, onBack }) {
  const formDefinition = getFormById(formId);
  const { schema, loading, error } = useFormSchema(formDefinition?.id);
  const resolveMode = (value) => {
    if (!value) return null;
    if (value === 'readonly' || value === 'view') {
      return 'readonly';
    }
    return 'edit';
  };
  const [mode, setMode] = useState(
    () => resolveMode(form0Config.interaction?.defaultMode) || 'edit'
  );

  if (!formDefinition) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <Text>Form "{formId}" was not found.</Text>
          <Pressable onPress={onBack} style={{ marginTop: 12 }}>
            <Text style={{ color: '#2563eb' }}>← All forms</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: '#fff' }}>
      <View style={{ padding: 18, paddingBottom: 8 }}>
        <Pressable
          onPress={onBack}
          style={{
            alignSelf: 'flex-start',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: '#f0f1f6',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#374151' }}>All forms</Text>
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>{formDefinition.title}</Text>
        {formDefinition.description ? (
          <Text style={{ color: '#666', marginTop: 4 }}>{formDefinition.description}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: '#6b7280', marginRight: 8 }}>Mode</Text>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#eef0f6',
              borderRadius: 999,
              padding: 2,
            }}
          >
            {[
              { value: 'edit', label: 'Edit' },
              { value: 'readonly', label: 'View' },
            ].map((option) => {
              const isActive = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setMode(option.value)}
                  style={({ pressed }) => ({
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: isActive
                      ? '#fff'
                      : pressed
                        ? '#e4e6f0'
                        : 'transparent',
                  })}
                >
                  <Text
                    style={{
                      color: isActive ? '#111827' : '#6b7280',
                      fontWeight: isActive ? '600' : '500',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {loading && !schema ? (
        <View style={{ padding: 16 }}>
          <Text>Loading schema…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'tomato' }}>
            Failed to load schema. Check the console for details.
          </Text>
        </View>
      ) : null}

      {schema ? (
        <Form0Form
          schema={schema}
          initialValues={formDefinition.initialValues}
          mode={mode}
          onSubmit={(values) => console.log('📤 Submitted:', values)}
        />
      ) : null}
    </Screen>
  );
}
