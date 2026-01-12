import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'form0-react-native';
import Form0Form from '../components/Form0Form.js';
import form0Config from '../../form0.config.js';
import { getFormById } from '../forms/registry.js';
import { useFormSchema } from '../forms/use-form-schema.js';
import Screen from '../components/Screen.js';
import {
  clearStoredRecords,
  getAllStoredRecords,
  isLocalStorageEnabled,
} from '../lib/local-record-store.js';

export default function FormPage({ formId, onBack }) {
  const { theme, isDark } = useTheme();
  const formDefinition = getFormById(formId);
  const { schema, loading, error } = useFormSchema(formDefinition?.id);
  const storageConfig = form0Config.storage || {};
  const showStorageDebug = storageConfig?.debug === true;

  const debugButtonStyle = ({ pressed }) => ({
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: pressed ? (isDark ? theme.color.section : '#ececf2') : theme.color.section,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: isDark ? 2 : 1,
  });

  if (!formDefinition) {
    return (
      <Screen style={{ backgroundColor: theme.color.background }}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.color.foreground }}>Form "{formId}" was not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: theme.color.background }} edges={['left', 'right', 'bottom']}>
      {loading && !schema ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.color.description }}>Loading schema…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.color.error }}>
            Failed to load schema. Check the console for details.
          </Text>
        </View>
      ) : null}

      {schema ? (
        <>
          <Form0Form
            schema={schema}
            initialValues={formDefinition.initialValues}
            onSubmit={(values) => console.log('📤 Submitted:', values)}
            onRequestClose={({ reason }) => {
              console.log('📋 Form close requested:', reason);
              onBack();
            }}
          />
          {showStorageDebug ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Pressable
                onPress={async () => {
                  if (!isLocalStorageEnabled(storageConfig)) {
                    console.info('[form0] Local storage disabled; nothing to show.');
                    return;
                  }
                  try {
                    const rows = await getAllStoredRecords({
                      config: storageConfig,
                    });
                    console.info('[form0] Local records:', rows);
                  } catch (error) {
                    console.error('[form0] Failed to read local records.', error);
                  }
                }}
                style={debugButtonStyle}
              >
                <Text style={{ color: theme.color.foreground, fontWeight: '600' }}>
                  Debug: Log Local Records
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!isLocalStorageEnabled(storageConfig)) {
                    console.info('[form0] Local storage disabled; nothing to clear.');
                    return;
                  }
                  try {
                    const result = await clearStoredRecords({
                      config: storageConfig,
                    });
                    console.info('[form0] Cleared local records.', result);
                  } catch (error) {
                    console.error('[form0] Failed to clear local records.', error);
                  }
                }}
                style={debugButtonStyle}
              >
                <Text style={{ color: theme.color.foreground, fontWeight: '600' }}>
                  Debug: Clear Local Records
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
