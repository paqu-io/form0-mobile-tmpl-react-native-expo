# form0 React Native + Expo Template

[![CI](https://github.com/paqu-io/form0-mobile-tmpl-react-native-expo/actions/workflows/ci.yml/badge.svg)](https://github.com/paqu-io/form0-mobile-tmpl-react-native-expo/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Docs](https://img.shields.io/badge/docs-docs.form0.dev-2563eb)](https://docs.form0.dev)
[![Website](https://img.shields.io/badge/site-form0.dev-0f172a)](https://form0.dev)

> [!NOTE]
> form0 is in active development and is available to use today. Its schema format and core
> concepts are stable in practice, but releases before 1.0 may include breaking changes. Pin your
> versions and review the release notes when upgrading. A formally stable release is coming.

A maintained React Native and Expo starter for building an offline-capable mobile form application
with [form0-react-native](https://github.com/paqu-io/form0-react-native). It includes example
schemas, native field renderers, theming, supporting images, and on-device SQLite persistence.

## 🚀 Create a project with `form0-cli`

[`form0-cli`](https://github.com/paqu-io/form0-cli) is the canonical way to create a form0 project:

```bash
npm install -g form0-cli
form0
```

Run `init`, choose **Mobile app**, and select the React Native and Expo template. Then enter the
generated directory and start Expo:

```bash
npm install
npm start
```

Use Expo Go or a compatible development build to open the application on a device or emulator.

You can also create a repository from this starter with GitHub's **Use this template** button. The
CLI remains the recommended route because it guides project selection and local setup.

## What is included

- Expo and React Native
- form0-core and form0-react-native
- Platform-native default field renderers
- Light, dark, and system theme support
- Example form selection and rendering screens
- Generated supporting-image registry
- Offline-first storage with `expo-sqlite`
- form0-cli application-server integration

## Project layout

```text
.
├── app.json
├── form0.config.js       # theme, schemas, storage, and dev-server integration
├── assets/               # app icons and supporting images
├── scripts/              # supporting-image registry generation
└── src/
    ├── components/       # application and form components
    ├── forms/            # form schemas
    ├── pages/            # home and form screens
    └── supporting-images/
```

## Configure form0

Edit `form0.config.js` to control the application theme, form behavior, supporting images, local
storage, and the Expo development server. Keep environment-specific public URLs in `.env.local`,
which is ignored by Git.

To add a supporting image:

1. Place the asset in `assets/supporting-images`.
2. Run `npm run generate-images`.
3. Commit the asset and the regenerated registry under `src/supporting-images`.

The start scripts generate the registry automatically before launching Expo.

## Expo app development server

`form0 serve --app` reads the Expo app-server configuration from `form0.config.js`. The template
defaults to LAN hosting. To advertise the server through a tunnel, add a public URL locally:

```dotenv
FORM0_APP_PUBLIC_URL=https://your-assigned-name.ngrok-free.app
```

Start the tunnel separately, then run `form0 serve --app`. For a one-off override:

```bash
form0 serve --app --public-url https://your-assigned-name.ngrok-free.app
```

Expo clients must be able to reach the manifest, JavaScript bundle, assets, and WebSocket endpoint
without a browser interstitial or access challenge. A stable development domain is therefore
preferable to a tunnel that inserts an HTML warning page.

## Local SQLite storage

Offline-first local persistence is enabled by default through `expo-sqlite`:

- Database name: `form0.db`
- Main table: `form0_submissions`
- Storage location: the platform-specific application sandbox

Change these values or disable local persistence in `form0.config.js`. Treat exported database
files as sensitive user data and define application-appropriate retention and synchronization
rules before production use.

## Connector behavior

Node.js connector packages such as `form0-connector-pg` and `form0-connector-sqlite` are not React
Native modules. `form0-cli` detects React Native and Expo projects and blocks installing those
packages into this template. Use the built-in `expo-sqlite` storage locally and connect to remote
services through an application API designed for mobile clients.

## Available scripts

- `npm start` — generate supporting-image metadata and start Expo.
- `npm run android` — start Expo and open Android.
- `npm run ios` — start Expo and open iOS.
- `npm run web` — start the Expo web target.
- `npm run generate-images` — regenerate the supporting-image registry.

## ✅ Requirements

- Node.js 22 or newer
- A supported Expo development environment
- Android Studio, Xcode, Expo Go, or another compatible target environment

## 📚 Documentation

- [form0 quickstart](https://docs.form0.dev/getting-started/quickstart)
- [Full form0 documentation](https://docs.form0.dev)
- [form0-react-native](https://github.com/paqu-io/form0-react-native)
- [form0-core](https://github.com/paqu-io/form0-core)

## 🔒 Security

Schema expressions are evaluated by `form0-core`. Only use schemas from trusted authors and review
the [form0-core security policy](https://github.com/paqu-io/form0-core/blob/main/SECURITY.md).
Report vulnerabilities according to this repository's [security policy](./SECURITY.md).

## 🤝 Support and contributing

See [SUPPORT.md](https://github.com/paqu-io/form0-mobile-tmpl-react-native-expo/blob/main/SUPPORT.md) for help and
[CONTRIBUTING.md](https://github.com/paqu-io/form0-mobile-tmpl-react-native-expo/blob/main/CONTRIBUTING.md) to contribute.

## 📄 License

[MIT](./LICENSE)
