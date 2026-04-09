# form0-mobile-tmpl-react-native-expo (WIP Notes)

## Expo app dev server

- `form0 serve --app` now reads the Expo app dev server from `form0.config.js`.
- The template defaults to `host: 'lan'` and can advertise a public mobile URL through `.env.local`.
- Recommended `.env.local` entry:
  `FORM0_APP_PUBLIC_URL=https://your-assigned-name.ngrok-free.app`
- Start your tunnel separately, then run `form0 serve --app`.
- You can override the configured URL for one run with:
  `form0 serve --app --public-url https://your-assigned-name.ngrok-free.app`
- The ngrok free plan assigns a stable development domain to your account, which is a good fit for `.env.local`.
- Avoid tunnel providers that inject browser interstitials or access challenges in front of the Expo endpoint; Expo Go expects direct access to the manifest, bundle, assets, and websocket traffic.
- Prefer Node 22 LTS for Expo work.

## Connector install behavior (form0-cli)

- Running `form0 connector install form0-connector-pg` or `form0 connector install form0-connector-sqlite`
  in this Expo template is blocked.
- The CLI detects React Native/Expo via `package.json` dependencies and returns a "not supported in React Native
  projects" error.
- Connector installs are intended for non-React Native projects; the CLI uses `npm install` (or `file:` for local
  paths) when allowed.

## Local storage in this template

- Uses on-device SQLite via `expo-sqlite`.
- Default database name: `form0.db` (configurable in `form0.config.js`).
- Default table: `form0_submissions` (configurable in `form0.config.js`).
- The database file is created in the app sandbox default SQLite directory (platform-specific).
