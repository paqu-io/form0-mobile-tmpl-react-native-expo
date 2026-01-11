import React, { useCallback, useMemo } from 'react';
import { FormRenderer } from 'form0-react-native';
import { createStructuredRecord, flattenFields } from 'form0-core';
import form0Config from '../../form0.config.js';
import { resolveRenderer } from '../field-renderers/resolver.js';
import { resolveSupportingImage } from '../supporting-images/index.js';
import {
  ensureRecordOptionIds,
  injectMediaFieldUUIDs,
  regenerateRepeatableRecordIds,
} from '../lib/record-utils.js';
import { isLocalStorageEnabled, storeStructuredRecord } from '../lib/local-record-store.js';

const FIELD_KEY_MODE = form0Config.output?.useKeys ? 'prefer-key' : 'data-name';

export default function Form0Form({
  schema,
  initialValues,
  overrideValues,
  mode,
  labelPosition,
  labelWidthPercent,
  colorMode,
  customTheme,
  showPrimaryActionsInViewMode,
  imageResolver,
  onSubmit,
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
  const flattenedFields = useMemo(() => flattenFields(schemaElements), [schemaElements]);

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
    async (values, meta = {}) => {
      if (!persistEnabled) {
        if (form0Config.storage?.debug) {
          console.info('[form0] Local storage disabled; skipping SQLite save.');
        }
        return;
      }

      if (!schema?.form) {
        console.info('[form0] Schema not available; storing raw values only.');
        console.log(values);
        return;
      }

      try {
        const statusFieldName = schema.form.status_field?.data_name ?? null;
        const valuesWithMediaIds = injectMediaFieldUUIDs(values, flattenedFields);

        const recordOptions = ensureRecordOptionIds({
          fieldKeyMode: FIELD_KEY_MODE,
          originalElements: schemaElements,
          title_field: schema.form.title_field || null,
          status_field: schema.form.status_field || null,
          form_id: schema.form.id || null,
        });

        if (statusFieldName) {
          recordOptions['@status'] = valuesWithMediaIds[statusFieldName] ?? null;
          delete valuesWithMediaIds[statusFieldName];
        }

        const structuredRecord = createStructuredRecord(
          {
            values: valuesWithMediaIds,
            repeatable: meta?.repeatable || {},
          },
          flattenedFields,
          recordOptions
        );

        regenerateRepeatableRecordIds(structuredRecord);

        const result = await storeStructuredRecord(structuredRecord, {
          config: form0Config.storage || {},
        });

        if (form0Config.storage?.debug) {
          console.info('[form0] Stored record locally:', result);
          console.log(structuredRecord);
        }
      } catch (error) {
        console.error('[form0] Failed to store record locally.', error);
        if (form0Config.storage?.debug) {
          console.log('[form0] Raw values:', values);
        }
      }
    },
    [persistEnabled, schema, schemaElements, flattenedFields]
  );

  const handleSubmit = useCallback(
    (values, meta) => {
      defaultStructuredSubmit(values, meta);
      if (typeof onSubmit === 'function') {
        onSubmit(values, meta);
      }
    },
    [defaultStructuredSubmit, onSubmit]
  );

  return (
    <FormRenderer
      schema={schema}
      initialValues={initialValues}
      overrideValues={overrideValues}
      onSubmit={handleSubmit}
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
