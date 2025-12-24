import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Form0Form from '../components/Form0Form.js';
import { getFormById } from '../forms/registry.js';
import { useFormSchema } from '../forms/use-form-schema.js';
import Screen from '../components/Screen.js';

export default function FormPage({ formId, onBack }) {
  const formDefinition = getFormById(formId);
  const { schema, loading, error } = useFormSchema(formDefinition?.id);

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
          onSubmit={(values) => console.log('📤 Submitted:', values)}
        />
      ) : null}
    </Screen>
  );
}
