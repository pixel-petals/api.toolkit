# @px-petals/yaak-human-ids

A [Yaak](https://yaak.app) plugin that gives folders readable IDs, so a workspace synced to disk or git references `folder-Users` rather than a random string.

## Actions

| where | action | what it does |
| --- | --- | --- |
| folder | Refresh Human ID | Re-keys the folder as `<model>-<name>` (suffixed `-01`, `-02`… when that ID is taken), repoints its child folders, then deletes the old folder. |
| workspace | Refresh Human IDs | Placeholder — shows a toast only. |
| request | Hello, From Plugin | Placeholder — shows a toast only. |

## Scripts

```sh
npm run build   # bundle src/index.ts into build/ with the Yaak CLI
npm run dev     # rebuild on every change
npm test        # vitest
```

Loading the plugin into Yaak is covered in [readme.setup.md](readme.setup.md).
