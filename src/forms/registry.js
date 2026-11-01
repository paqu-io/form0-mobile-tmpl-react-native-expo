import natureSchema from "./nature-observation/schema.json";
import equipmentSchema from "./equipment-checkout/schema.json";
import buildingSchema from "./building-condition-survey/schema.json";
import { starterForms } from "./catalog.js";

// Keep a literal forms array so the CLI can add, update, and remove registrations.
const forms = [
  {
    ...starterForms[0],
    id: "nature-observation",
    loadSchema: async () => natureSchema,
  },
  {
    ...starterForms[1],
    id: "equipment-checkout",
    loadSchema: async () => equipmentSchema,
  },
  {
    ...starterForms[2],
    id: "building-condition-survey",
    loadSchema: async () => buildingSchema,
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
