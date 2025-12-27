import React from 'react';
import { Text, View } from 'react-native';
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
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: '#fff' }} edges={['left', 'right', 'bottom']}>
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
          onRequestClose={({ reason }) => {
            console.log('📋 Form close requested:', reason);
            onBack();
          }}
        />
      ) : null}
    </Screen>
  );
}
