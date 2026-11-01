import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createFormEngine, validateSchema } from "form0-core";
import { starterForms } from "../src/forms/catalog.js";

const schemas = new Map();
for (const form of starterForms) {
  schemas.set(
    form.id,
    JSON.parse(await readFile(new URL(`../src/forms/${form.id}/schema.json`, import.meta.url))),
  );
}

function engineFor(id, initialValues = {}, path = []) {
  const engine = createFormEngine({
    schema: schemas.get(id),
    initialValues,
    eventScope: { instancePath: path },
  });
  engine.eval();
  return engine;
}

function dispatch(engine, type, field) {
  const result = engine.triggerDetailed(type, field);
  assert.deepEqual(result.issues, []);
  return result;
}

const row = (key, index = 0) => ({
  repeatableKey: key,
  instanceId: `test-${key}-${index}`,
  index,
  identity: "id",
});

test("three distinct starter schemas validate, match the catalogue, and evaluate cleanly", () => {
  assert.equal(schemas.size, 3);
  for (const form of starterForms) {
    const schema = schemas.get(form.id);
    assert.equal(schema.form.id, form.id);
    assert.equal(schema.form.name, form.title);
    assert.doesNotThrow(() => validateSchema(schema.form));
    assert.deepEqual(engineFor(form.id).getDiagnostics(), []);
    assert.deepEqual(dispatch(engineFor(form.id), "load-record").operations, []);
  }
});

test("uncertain nature identification reveals required notes and presents guidance", () => {
  const engine = engineFor("nature-observation", { identification_confidence: "uncertain" });
  const state = engine.getState();
  assert.equal(state.visible.identification_notes, true);
  assert.equal(state.required.identification_notes, true);
  const { operations } = dispatch(engine, "change", "identification_confidence");
  assert.equal(operations.length, 1);
  assert.equal(operations[0].operation, "ALERT");
  assert.equal(operations[0].params.title, "Identification notes");
  engine.setValue("identification_notes", "Small brown bird with a pale stripe above the eye.");
  assert.equal(engine.getState().errors.identification_notes, undefined);
  engine.setValue("identification_confidence", "confident");
  assert.equal(engine.getState().visible.identification_notes, false);
  assert.deepEqual(dispatch(engine, "change", "identification_confidence").operations, []);
});

test("equipment copies a contact only on request and keeps it editable", () => {
  const engine = engineFor("equipment-checkout", {
    borrower_name: "Alex Morgan",
    copy_borrower: "no",
    collection_contact: "Sam Rivera",
  });
  assert.deepEqual(dispatch(engine, "change", "copy_borrower").operations, []);
  engine.setValue("copy_borrower", "yes");
  const { operations } = dispatch(engine, "change", "copy_borrower");
  assert.deepEqual(
    operations.map((op) => op.params),
    [{ fieldDataName: "collection_contact", valueToSet: "Alex Morgan" }],
  );
  engine.setValue(operations[0].params.fieldDataName, operations[0].params.valueToSet);
  engine.setValue("collection_contact", "Pat Lee");
  assert.equal(engine.getState().values.collection_contact, "Pat Lee");
});

test("equipment duration and date validation recover after correcting the return date", () => {
  const engine = engineFor("equipment-checkout", {
    checkout_on: "2026-01-10",
    expected_return_on: "2026-01-09",
  });
  assert.equal(dispatch(engine, "validate-record").validationIssues.length, 1);
  engine.setValue("expected_return_on", "2026-01-13");
  assert.equal(engine.getState().values.planned_loan_days, 3);
  assert.deepEqual(dispatch(engine, "validate-record").validationIssues, []);
  assert.deepEqual(engine.getDiagnostics(), []);
});

test("equipment item events run in row scope and require a damage description", () => {
  const engine = engineFor("equipment-checkout", { item_condition: "damaged", damage_notes: "" }, [
    row("equipment_items"),
  ]);
  assert.equal(dispatch(engine, "change", "item_condition").operations[0].operation, "ALERT");
  assert.equal(
    dispatch(engine, "validate-repeatable", "equipment_items").validationIssues.length,
    1,
  );
  engine.setValue("damage_notes", "Existing scratch on the case.");
  assert.deepEqual(dispatch(engine, "validate-repeatable", "equipment_items").validationIssues, []);
});

test("building survey condition, contact action, optional plan, and dates behave together", () => {
  const engine = engineFor("building-condition-survey", {
    overall_condition: "urgent",
    assessor: "Alex Morgan",
    copy_assessor: "yes",
    inspection_on: "2026-01-10",
    follow_up_on: "2026-01-09",
  });
  assert.equal(engine.getState().visible.urgent_details, true);
  assert.equal(engine.getState().required.urgent_details, true);
  assert.equal(engine.getState().visible.building_plan, false);
  assert.equal(dispatch(engine, "change", "overall_condition").operations[0].operation, "ALERT");
  assert.equal(
    dispatch(engine, "change", "copy_assessor").operations[0].params.valueToSet,
    "Alex Morgan",
  );
  assert.equal(dispatch(engine, "validate-record").validationIssues.length, 1);
  engine.setValue("follow_up_on", "2026-01-11");
  assert.deepEqual(dispatch(engine, "validate-record").validationIssues, []);
  engine.setValue("include_plan", "yes");
  assert.equal(engine.getState().visible.building_plan, true);
});

test("room calculations use parent references and urgent nested observations validate locally", () => {
  const roomEngine = engineFor(
    "building-condition-survey",
    { building_ref: "BLD-001", room_reference: "Kitchen", room_length_m: 4, room_width_m: 3 },
    [row("rooms")],
  );
  assert.equal(roomEngine.getState().values.room_area_m2, 12);
  assert.equal(roomEngine.getState().values.survey_reference, "BLD-001 / Kitchen");
  assert.deepEqual(roomEngine.getDiagnostics(), []);
  const finding = engineFor(
    "building-condition-survey",
    { finding_priority: "urgent", next_action: "" },
    [row("rooms"), row("findings")],
  );
  assert.equal(dispatch(finding, "change", "finding_priority").operations[0].operation, "ALERT");
  assert.equal(dispatch(finding, "validate-repeatable", "findings").validationIssues.length, 1);
  finding.setValue("next_action", "Arrange a follow-up visit.");
  assert.deepEqual(dispatch(finding, "validate-repeatable", "findings").validationIssues, []);
});

test("all supporting-image references resolve to bundled PNG assets", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  const directory = manifest.name.includes("mobile") ? "assets" : "public";
  const references = new Set();
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (value.supporting_image) references.add(value.supporting_image_path);
    Object.values(value).forEach(visit);
  }
  for (const schema of schemas.values()) visit(schema);
  assert.ok(references.size);
  for (const reference of references) {
    const bytes = await readFile(
      new URL(`../${directory}/supporting-images/${reference}`, import.meta.url),
    );
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
});
