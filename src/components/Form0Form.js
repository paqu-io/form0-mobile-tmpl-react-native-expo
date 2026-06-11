import React, { useCallback, useMemo } from 'react';
import { FormRenderer } from 'form0-react-native';
import form0Config from '../../form0.config.js';
import { resolveRenderer } from '../field-renderers/resolver.js';
import { resolveSupportingImage } from '../supporting-images/index.js';
import {
  ensureRecordOptionIds,
  regenerateRepeatableRecordIds,
} from '../lib/record-utils.js';
import { isLocalStorageEnabled, storeStructuredRecord } from '../lib/local-record-store.js';

const FIELD_KEY_MODE = form0Config.output?.useKeys ? 'prefer-key' : 'data-name';
const cloneRecord = (value) => {
  if (value == null) {
    return value;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export default function Form0Form({
  schema,
  initialValues,
  initialSnapshot,
  overrideValues,
  mode,
  labelPosition,
  labelWidthPercent,
  colorMode,
  customTheme,
  showPrimaryActionsInViewMode,
  imageResolver,
  onSubmit,
  onSnapshotChange,
  ...props
}) {
  const resolveMode = (value) => {
    if (!value) return null;
    if (value === 'readonly' || value === 'view') {
      return 'readonly';
    }
    return 'edit';
  };

  const renderers = useMemo(() => {
    const resolved = {};
    if (form0Config.fieldRenderers) {
      Object.entries(form0Config.fieldRenderers).forEach(([fieldType, rendererId]) => {
        const component = resolveRenderer(rendererId);
        if (component) {
          resolved[fieldType] = component;
        }
      });
    }
    return resolved;
  }, []);

  const schemaElements = useMemo(() => schema?.form?.elements ?? [], [schema]);

  // Resolve effective values from props or config
  const effectiveMode =
    resolveMode(mode) || resolveMode(form0Config.interaction?.defaultMode) || 'edit';
  const effectiveLabelPosition = labelPosition || form0Config.layout?.labelPosition || 'top';
  const effectiveLabelWidthPercent =
    labelWidthPercent ?? form0Config.layout?.labelWidthPercent ?? 30;
  const keyboardScrollOffset = form0Config.keyboard?.scrollOffset;

  // Theme configuration
  const effectiveColorMode = colorMode || form0Config.theme?.mode || 'light';
  const effectiveCustomTheme = customTheme || form0Config.theme?.customTheme || null;

  // Interaction configuration
  const effectiveShowPrimaryActionsInViewMode =
    showPrimaryActionsInViewMode ?? form0Config.interaction?.showPrimaryActionsInViewMode ?? true;

  // Image resolver - use provided resolver or default to the app's supporting images
  const effectiveImageResolver = imageResolver || resolveSupportingImage;

  const persistEnabled = isLocalStorageEnabled(form0Config.storage || {});

  const defaultStructuredSubmit = useCallback(
    async (structuredRecord, meta = {}) => {
      if (!persistEnabled) {
        if (form0Config.storage?.debug) {
          console.info('[form0] Local storage disabled; skipping SQLite save.');
        }
        return;
      }

      if (!schema?.form) {
        console.info('[form0] Schema not available; storing raw values only.');
        console.log(structuredRecord);
        return;
      }

      try {
        const baseRecord =
          structuredRecord &&
          typeof structuredRecord === 'object' &&
          !Array.isArray(structuredRecord)
            ? cloneRecord(structuredRecord)
            : null;
        if (!baseRecord) {
          throw new Error('form0-react-native onSubmit did not return a structured record.');
        }
        const recordOptions = ensureRecordOptionIds({
          mainRecordId: baseRecord.id || baseRecord.record_id || null,
          changeset_id: baseRecord.changeset_id || null,
          fieldKeyMode: FIELD_KEY_MODE,
          originalElements: schemaElements,
          title_field: schema.form.title_field || null,
          status_field: schema.form.status_field || null,
          form_id: schema.form.id || null,
        });

        const preparedRecord = {
          ...baseRecord,
          id: baseRecord.id || recordOptions.mainRecordId,
          changeset_id: baseRecord.changeset_id || recordOptions.changeset_id,
          form_id: baseRecord.form_id || schema.form.id || null,
        };

        if (!preparedRecord.record_id) {
          preparedRecord.record_id = preparedRecord.id || null;
        }

        regenerateRepeatableRecordIds(preparedRecord);

        const result = await storeStructuredRecord(preparedRecord, {
          config: form0Config.storage || {},
        });

        if (form0Config.storage?.debug) {
          console.info('[form0] Stored record locally:', result);
          console.log(preparedRecord);
          if (meta?.rawValues) {
            console.log('📤 Submitted raw values:', meta.rawValues);
          }
        }
      } catch (error) {
        console.error('[form0] Failed to store record locally.', error);
        if (form0Config.storage?.debug) {
          console.log('[form0] Structured record:', structuredRecord);
          if (meta?.rawValues) {
            console.log('[form0] Raw values:', meta.rawValues);
          }
        }
      }
    },
    [persistEnabled, schema, schemaElements]
  );

  const handleSubmit = useCallback(
    async (structuredRecord, meta) => {
      await defaultStructuredSubmit(structuredRecord, meta);

      if (typeof onSubmit === 'function') {
        return onSubmit(structuredRecord, meta);
      }

      return undefined;
    },
    [defaultStructuredSubmit, onSubmit]
  );

  return (
    <FormRenderer
      schema={schema}
      initialValues={initialValues}
      initialSnapshot={initialSnapshot}
      overrideValues={overrideValues}
      onSubmit={handleSubmit}
      onSnapshotChange={onSnapshotChange}
      fieldKeyMode={FIELD_KEY_MODE}
      mode={effectiveMode}
      labelPosition={effectiveLabelPosition}
      labelWidthPercent={effectiveLabelWidthPercent}
      keyboardScrollOffset={keyboardScrollOffset}
      colorMode={effectiveColorMode}
      customTheme={effectiveCustomTheme}
      showPrimaryActionsInViewMode={effectiveShowPrimaryActionsInViewMode}
      imageResolver={effectiveImageResolver}
      renderers={renderers}
      {...props}
    />
  );
}
