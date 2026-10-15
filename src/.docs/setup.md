# Setup

1. Install the [Yaak](https://yaak.app) desktop app.
2. `npm install` at the repo root, then `npm run plugin:yaak-human-ids build`.
3. Point Yaak at the plugin folder, [src/plugins/yaak-human-ids](../plugins/yaak-human-ids), with `npx yaak plugin install src/plugins/yaak-human-ids`, or by adding that directory as a local plugin in the app's plugin settings.
4. Keep `npm run plugin:yaak-human-ids dev` running while editing; Yaak reloads the rebuilt bundle.

npm warns that `@yaakapp/cli`'s postinstall script was blocked. It is safe to ignore: the script only downloads the CLI binary when the platform package (`@yaakapp/cli-<os>-<arch>`) is missing, and npm installs that package as an optional dependency.
