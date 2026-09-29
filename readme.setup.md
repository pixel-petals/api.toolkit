# Setup

1. Install the [Yaak](https://yaak.app) desktop app.
2. `npm install` then `npm run build`.
3. Point Yaak at this folder, with `npx yaak plugin install .`, or by adding this directory as a local plugin in the app's plugin settings.
4. Keep `npm run dev` running while editing; Yaak reloads the rebuilt bundle.

npm warns that `@yaakapp/cli`'s postinstall script was blocked. It is safe to ignore: the script only downloads the CLI binary when the platform package (`@yaakapp/cli-<os>-<arch>`) is missing, and npm installs that package as an optional dependency.
