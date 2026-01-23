# form0-mobile-tmpl-react-native-expo (WIP Notes)

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
