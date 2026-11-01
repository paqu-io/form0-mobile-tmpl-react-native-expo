# Review the starter forms

The web and mobile starters contain the same three schemas:

| Form                      | Level        | Main things to try                                                        |
| ------------------------- | ------------ | ------------------------------------------------------------------------- |
| Nature Observation        | Simple       | Conditional notes, identification alert, photo guide                      |
| Equipment Checkout        | Intermediate | Contact copying, date calculations, repeated equipment and row validation |
| Building Condition Survey | Advanced     | Building layout, rooms, nested observations, media and follow-up          |

## Open the web starter

1. Open a terminal in `form0-web-tmpl-react-vite`.
1. Run `npm run dev`.
1. Open the local URL printed by Vite, usually `http://localhost:5173`.
1. Click **Standard Page** in the **Nature Observation** card. Expect the form to open in view mode with empty answers.
1. Click **Edit** in the form toolbar. Expect editable fields and today's date as the default observation date.

For this visual review, use the field interactions below and stop before a successful root submission. The web starter's existing `devServer.submitToConnector` setting is enabled; a successful **Submit** follows that project's connector configuration. The standard CLI walkthrough tests local record preparation in an isolated project.

## Nature Observation

Start in a new, editable Nature Observation form.

1. Enter `Beside the pond on the north trail` in **Where did you see it?**
1. Select **Bird** in **Organism group**.
1. Select **Uncertain** in **Identification confidence**. Expect an **Identification notes** alert.
1. Click **OK** in the alert. Expect **Identification notes** to be visible and marked required.
1. Enter `Small brown bird with a pale stripe above the eye` in **Identification notes**.
1. Click the small image icon beside **Identification notes**. Expect the bundled evidence-photo checklist to open.
1. Close the image dialog using its close control.
1. Select **Wetland** in **Habitat**.
1. Select a local test image in **Observation photos**. Expect an image preview.
1. Select **Confident** in **Identification confidence**. Expect the conditional identification notes to disappear.

Reset: use **All forms** and open a fresh form before testing another presentation. Repeat this form in **Simplified Page**, **Modal Overlay**, and **Spotlight Overlay** to compare the same schema across the existing web presentations.

## Equipment Checkout

1. Open **Equipment Checkout → Standard Page** from the home screen.
1. Click **Edit** in the form toolbar.
1. Enter `Alex Morgan` in **Borrower name**.
1. Enter `Community garden survey` in **Purpose of the loan**.
1. Choose **Yes** for **Use borrower as collection contact**. Expect **Collection contact** to become `Alex Morgan`.
1. Replace **Collection contact** with `Sam Rivera`. Expect it to remain editable.
1. Set **Checkout date** to today using its date control.
1. Set **Expected return date** to three days after checkout. Expect **Planned loan duration (days)** to show `3`.
1. Click **View** beside **Equipment items**. Expect an empty item list.
1. Click **Add** in the item-list toolbar. Expect a new item editor.
1. Enter `EQ-014` in **Asset reference**.
1. Enter `Laser distance meter` in **Item description**.
1. Select **Existing damage** in **Condition at checkout**. Expect the damage guidance alert.
1. Click **OK** in the alert. Expect **Existing damage notes** to appear.
1. Click **Save** without entering damage notes. Expect `Describe the existing damage before saving this item.` and an open editor.
1. Enter `Existing scratch on the case` in **Existing damage notes**.
1. Click **Save** again. Expect the item to appear in the equipment list with its asset reference and description.
1. Close the item editor if it remains open.
1. Use **Back** to return to the main form.
1. Open **Handover** with its **View** control. Expect accessory confirmation, notes, and an optional signature field.

Reset: return to **All forms** and open a fresh Equipment Checkout before another run. The root date rule also rejects a return date before checkout; use the isolated CLI preview if you want to submit and then correct that case without invoking the app's connector submission.

## Building Condition Survey

1. Open **Building Condition Survey → Standard Page** from the home screen.
1. Click **Edit** in the form toolbar.
1. Enter `BLD-001` in **Building reference**.
1. Enter `Riverside Community Hall` in **Building name**.
1. Enter `Alex Morgan` in **Assessor**.
1. Select **Urgent follow-up** in **Overall observed condition**. Expect a guidance alert.
1. Click **OK** in the alert. Expect **Urgent observation details** and a required follow-up contact.
1. Enter `Water staining around the north window` in **Urgent observation details**.
1. Choose **Yes** for **Use assessor as follow-up contact**. Expect `Alex Morgan` in **Follow-up contact**.
1. Choose **Yes** for **Add a building layout**. Expect **Building layout** to appear.
1. Click **View** beside **Building layout**. Expect a canvas and **Add Floor** control.
1. Use **Back** to return to the main form.
1. Click **View** beside **Rooms surveyed**.
1. Click **Add** in the room-list toolbar.
1. Enter `Kitchen` in **Room reference**.
1. Select **Kitchen** in **Room use**.
1. Enter `4` in **Room length (m)**.
1. Enter `3` in **Room width (m)**. Expect **Room floor area (m²)** to become `12` and **Survey reference** to include `BLD-001 / Kitchen`.
1. Select **Needs attention** in **Room condition**.
1. Open **Observations** using its **View** control.
1. Click **Add** in the observation-list toolbar.
1. Enter `Damp patch below the window` in **Observation**.
1. Select **Urgent follow-up** in **Follow-up priority**. Expect a guidance alert.
1. Click **OK** in the alert.
1. Click **Save** without a next action. Expect `Record a next action for this urgent observation.`
1. Enter `Arrange a follow-up visit` in **Proposed next action**.
1. Click **Save** again. Expect the observation to be accepted.

Continue: close the observation editor and return through its list to the room editor. Save the room, then return to the main form. Open **Survey evidence** and **Sign-off** to review photo/video and signature controls. Keep the building layout optional while reviewing the rest of the form.

## Repeat on mobile

1. Open a terminal in `form0-mobile-tmpl-react-native-expo`.
1. Run `npm start`.
1. Open the project in your existing compatible Expo Go or development-build setup.
1. Tap **Nature Observation** on the **Forms** screen.
1. Tap **Edit** if the form opens in view mode.
1. Repeat the Nature Observation actions above, using the native date and media controls.
1. Return to **Forms** using the screen's back control.
1. Repeat the Equipment Checkout actions.
1. Return to **Forms** using the screen's back control.
1. Repeat the Building Condition Survey actions.

Check the alert text, copied values, conditional fields, calculations, and row validation against web. Native media capture, touch interactions, layout, and keyboard behavior need a physical-device review even after bundles export successfully.

## Maintaining parity

The web template owns the app schema JSON, catalogue, shared tests, and photo guide. From a sibling `form0-cli` checkout:

```bash
node scripts/sync-starter-forms.mjs
node scripts/sync-starter-forms.mjs --check
```

The script copies into the mobile checkout and regenerates its image registry. Use `--web-root` and `--mobile-root` when the checkouts are elsewhere. Each app also runs its local schema/event tests with `npm run test:schemas` and as part of `npm run check`.

The originals and their images remain in `archive/starter-schemas/2026-10-31/`, with source commits and SHA-256 manifests. Archives are omitted from npm packing and CLI scaffolding. No shared npm package is required.
