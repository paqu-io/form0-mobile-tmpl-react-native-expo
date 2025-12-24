import demoSchema from './demo/schema.json';

const forms = [
  {
    id: 'demo-form',
    title: 'Demo Enrollment',
    description: 'A showcase schema with a bit of everything to exercise the renderer.',
    loadSchema: async () => demoSchema,
  },
  {
    id: 'demo-form-bis',
    title: 'Demo Enrollment Bis',
    description: 'A showcase schema with a bit of everything to exercise the renderer.',
    tags: ['demo', 'test'],
    loadSchema: () => import('./demo-bis/schema.json'),
  },
];

export const DEFAULT_FORM_ID = forms[0]?.id ?? null;

export function listForms() {
  return forms;
}

export function getFormById(formId) {
  return forms.find((form) => form.id === formId);
}

export async function loadSchemaForForm(formId) {
  const definition = getFormById(formId);
  if (!definition) {
    throw new Error(`Unknown form id: ${formId}`);
  }
  return definition.loadSchema();
}
