import React, { useMemo } from 'react';
import { FormRenderer } from 'form0-react-native';
import form0Config from '../../form0.config.js';
import { resolveRenderer } from '../field-renderers/resolver.js';
import { resolveSupportingImage } from '../supporting-images/index.js';

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

  return (
    <FormRenderer
      schema={schema}
      initialValues={initialValues}
      overrideValues={overrideValues}
      onSubmit={onSubmit}
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
