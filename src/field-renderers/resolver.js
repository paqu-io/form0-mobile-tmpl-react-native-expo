/**
 * Field Renderer Resolver (Mobile)
 *
 * Map string identifiers from form0.config.js to React Native components.
 */

const RENDERER_MAP = {
  // 'date-field-custom': CustomDateField,
};

export function resolveRenderer(name) {
  const renderer = RENDERER_MAP[name];
  if (!renderer) {
    console.warn(
      `[form0-mobile] Renderer "${name}" not found. Available renderers: ${Object.keys(RENDERER_MAP).join(', ')}`
    );
  }
  return renderer;
}

export function getAvailableRenderers() {
  return Object.keys(RENDERER_MAP);
}
