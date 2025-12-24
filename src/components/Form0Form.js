import React, { useMemo } from 'react';
import { FormRenderer } from 'form0-react-native';
import form0Config from '../../form0.config.js';
import { resolveRenderer } from '../field-renderers/resolver.js';

export default function Form0Form({
  schema,
  initialValues,
  overrideValues,
  mode,
  labelPosition,
  labelWidthPercent,
  onSubmit,
  ...props
}) {
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

  const effectiveMode = mode || form0Config.interaction?.defaultMode || 'edit';
  const effectiveLabelPosition = labelPosition || form0Config.layout?.labelPosition || 'top';
  const effectiveLabelWidthPercent =
    labelWidthPercent ?? form0Config.layout?.labelWidthPercent ?? 30;

  return (
    <FormRenderer
      schema={schema}
      initialValues={initialValues}
      overrideValues={overrideValues}
      onSubmit={onSubmit}
      mode={effectiveMode}
      labelPosition={effectiveLabelPosition}
      labelWidthPercent={effectiveLabelWidthPercent}
      renderers={renderers}
      {...props}
    />
  );
}
