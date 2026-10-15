# @px-petals/api.toolkit

Tooling for working with HTTP APIs.

## Packages

| package | what it is |
| --- | --- |
| [@plugin/yaak-human-ids](src/plugins/yaak-human-ids) | A [Yaak](https://yaak.app) plugin that gives folders readable IDs. |

Setting up Yaak and loading the plugin is covered in [src/.docs/setup.md](src/.docs/setup.md).

## Git Ignore

Instead of guessing and reactively excluding folders and files from git, [.gitignore](.gitignore) begins by excluding everything, and only includes what has been explicitly, intentionally added to it. This makes it much less likely for files and folders to be accidentally committed to the repository history.

### Pattern Matching

| target | how to
|:-------|:-------
| root   | begin with `/`
| folder | end with `/`
| file   | combine file path with folder negation

### Wildcards

| target   | how to
|:---------|:-------
| `?`      | match any ONE character except slash
| `*`      | matches any set of characters except slash
| `**/`    | match any depth of folders
| `/**`    | match everything inside
| `a/**/b` | match anything between a and b
