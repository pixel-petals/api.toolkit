# @package/protobuf

Protobuf's self-describing schema, vendored per release, plus one JSON fragment for every declaration it makes at the top level.

```sh
protobuf fetch 36.1     # vendor schema/36.1/schema.proto and the well-known types
protobuf split 36.1     # parse it into schema.json and the fragments
protobuf generate 36.1  # both, in one step
protobuf list           # releases already vendored

protobuf bundle ./api.proto --out ./api.json  # the file and all it imports, as one descriptor
protobuf unbundle ./api.json --out ./tree/    # that descriptor, one file per declaration
```

`split` reads only what is on disk, so it works offline and always matches the vendored copy. `fetch` is the one command that touches the network.

## Versions

| release | messages | enums | fragments |
| --- | --- | --- | --- |
| 36.1 | 23 top-level, 12 nested | 2 top-level | 25 |

A version is a protobuf release tag without its `v`, so `36.1` addresses `v36.1` in the compiler's repository. Anything that does not start with a digit is passed through as a git ref, which is how `protobuf fetch main` vendors a schema change that has not been tagged yet.

One release is vendored — the newest at the time of writing. `protobuf fetch 32.0` replaces it with any other; the tags are listed under [releases](https://github.com/protocolbuffers/protobuf/releases).

## Bundling

`bundle` and `unbundle` take paths rather than versions, the same as their siblings in the other specification packages. They work on whatever you point them at, which includes a vendored release but is mostly somebody's own schema.

```sh
protobuf bundle ./proto/api.proto --out ./api.json
protobuf unbundle ./api.json --out ./tree/
```

`--out` is optional both ways: a bundle defaults to `<entry>.bundled.json` beside the entry file, a tree to `<descriptor>.unbundled/`. `unbundle` also accepts a `.proto` directly and bundles it first, so `protobuf unbundle ./proto/api.proto -o ./tree/` is the two steps in one.

### Why a bundle is JSON and not a merged `.proto`

`import` *is* protobuf's bundling mechanism. It is not a convenience a tool can inline away: a `.proto` carries its own `syntax`, `package` and `option` headers, and every unqualified name in it resolves through the package that file declares. Concatenating the files an import graph names would give one file several conflicting headers, and would silently re-resolve names that used to point across a package boundary. The merged file would compile — into a different schema.

So `bundle` writes the descriptor instead: the compiler's finished reading of the whole import graph, as one JSON namespace tree. That is the artefact a merged `.proto` was reaching for, and it is the one protobuf actually defines. `protobuf.Root.fromJSON(bundle)` followed by `resolveAll()` succeeds with nothing left to import, and that is checked before the file is written — a bundle that is not self-contained is an error rather than a file.

This is the same reasoning as [why there are no `.proto` fragments](#why-there-are-no-proto-fragments), one level up: a set of files is a compilation unit, and a single file cut out of it is not.

Imports resolve against the entry file's own directory as the include root, which is how `protoc -I` reads them — `sub/beta.proto` importing `sub/gamma.proto` means the same file both times. If nothing is found there the importing file's directory is tried, for a tree that really does import by relative path. `google/protobuf/*.proto` comes from the copies `protobufjs` carries, so a schema importing `timestamp.proto` bundles without a protobuf checkout on disk; those copies are the library's rather than the ones vendored under `schema/`, and they carry no comments.

### What an unbundled tree looks like

```text
tree/
  spec.json                     the index
  demo/
    alpha.json  main.json  mainService.json  mode.json
    sub/
      beta.json  gamma.json
  google/protobuf/
    timestamp.json
```

One file per top-level declaration — message, enum or service — laid out under the package that declares it. Package segments keep the spelling the schema gives them, because that spelling is what a `.proto` resolves against; only the declaration's own name becomes a file name, camelCased the way every other fragment in the repo is. Nested declarations stay inside their parent's file, which is the rule the fragments follow too: a nested message is reachable only through its parent, so it has no address of its own.

`spec.json` is an index, not a schema:

```json
{
  "tree": "protobuf-descriptor",
  "source": "api.json",
  "declarations": [
    { "name": "Main", "fullName": "demo.Main", "kind": "message", "file": "./demo/main.json" }
  ]
}
```

It records the mapping and nothing else. A descriptor with holes punched in it where the declarations used to be would still parse, and would be a lie about what the schema says, so the root document does not pretend to be one. Declarations are listed sorted by full name.

Each piece is a namespace document carrying its declaration inside the packages it is declared in:

```json
{
  "name": "Main",
  "fullName": "demo.Main",
  "kind": "message",
  "package": "demo",
  "nested": {
    "demo": {
      "options": { "java_package": "com.demo" },
      "nested": { "Main": { "fields": { "alpha": { "type": "Alpha", "id": 1 } } } }
    }
  }
}
```

The enclosing packages come along because they carry the file's options — `java_package` and its neighbours land on the namespace, not on the message — and a piece without them would describe the declaration in the wrong package.

### Reading a piece

```js
new protobuf.Root().addJSON(piece.nested)
```

`addJSON`, not `Root.fromJSON`. `fromJSON` resolves as it loads, and `demo.Main` names `Alpha`, which lives in the next file along — there is nothing to resolve against until the tree is back together. That is not a defect in the layout; it is the same fact as everywhere else on this page, which is that a declaration is a description on its own and a compilation unit only in company.

Adding every piece into one root and calling `resolveAll()` reconstitutes the bundle exactly, down to the comments, differing only in the order declarations are listed. That round trip is the guarantee the tree offers: nothing is dropped on the way apart.

## Layout

```text
schema/36.1/
  schema.proto              descriptor.proto, verbatim
  schema.json               the same schema, parsed
  defs/
    type.proto              runtime reflection
    any.proto  api.proto  duration.proto  empty.proto  field_mask.proto
    source_context.proto  struct.proto  timestamp.proto  wrappers.proto
    fragments/
      descriptorProto.json  edition.json  enumDescriptorProto.json
      enumOptions.json  enumValueDescriptorProto.json  enumValueOptions.json
      extensionRangeOptions.json  featureSet.json  featureSetDefaults.json
      fieldDescriptorProto.json  fieldOptions.json  fileDescriptorProto.json
      fileDescriptorSet.json  fileOptions.json  generatedCodeInfo.json
      messageOptions.json  methodDescriptorProto.json  methodOptions.json
      oneofDescriptorProto.json  oneofOptions.json  serviceDescriptorProto.json
      serviceOptions.json  sourceCodeInfo.json  symbolVisibility.json
      uninterpretedOption.json
```

`schema.proto` is the only fetched file that sits at the version root. The `.proto` files under `defs/` are fetched too, and everything else is generated.

The vendored `.proto` files keep their upstream basenames. A `.proto` names itself in the `import` statements of every file that uses it — `import "google/protobuf/any.proto"` — so renaming one to camelCase, the way a fragment is named, would break the imports it exists to satisfy.

## Why this package has its own pipeline

Every other specification in this repo publishes a JSON Schema, so the shared tooling can fetch a document, normalize it against its draft, and derive fragments that `$ref` back into it. Protobuf publishes none. Its schema is `descriptor.proto`, a proto2 source file in the compiler's own repository, and the language it is written in is protobuf IDL rather than JSON.

That changes what each stage means, not what the stages are. `@util/api/schema` and `@util/api/fragments` do not apply, because there is no draft to normalize and no `$ref` to point with. Everything that is not about JSON Schema — where a version lives, how a document is written, how names become file names, how the CLI reads — is still the shared code.

The parse *is* the normalization here. `protobufjs` is the reference JavaScript implementation of the language, so `schema.json` is the compiler's reading of the file rather than a translation of it, and `protobuf.Root.fromJSON` reads it back into the same object graph.

## Why there are no `.proto` fragments

A protobuf message is not a compilation unit. It inherits its file's `syntax`, `package` and `option` headers, and it names its neighbours by bare identifier — `FieldDescriptorProto` inside `DescriptorProto` resolves through the enclosing package, not through anything written in the message itself. Cut one message into a file of its own and the result either fails to compile for want of the headers, or compiles into a *different* type in a different package. Either way the file would be a lie about the schema.

So the split emits JSON only. The parsed JSON has no such problem: it describes a declaration rather than translating one, and each node already carries its resolved name, its field numbers, its types and its documentation. A single declaration lifted out of it is exactly as true as the whole document. That is the honest limit of splitting protobuf, and the reason a `defs/fragments/*.proto` you might expect from the sibling packages is absent rather than broken.

## What a fragment holds

```json
{
  "name": "FileDescriptorProto",
  "fullName": "google.protobuf.FileDescriptorProto",
  "kind": "message",
  "pointer": "../../schema.json#/nested/google/nested/protobuf/nested/FileDescriptorProto",
  "descriptor": {
    "edition": "proto2",
    "fields": {
      "name": { "type": "string", "id": 1, "comment": "file name, relative to root of source tree" }
    }
  }
}
```

`descriptor` is the declaration's own JSON, comments included — the schema's `//` comments are the only prose describing what each field means, and a fragment without them is unreadable next to the IDL. `pointer` locates the identical node in `schema.json`, which is the cross-reference the sibling packages get from a `$ref`.

Both messages and enums are fragmented. Either can be named from another file, so a consumer looking one up should find a file rather than a gap. Nested declarations are not: a nested message is reachable only through its parent, so it has no address of its own and travels inside its parent's fragment — the same rule the sibling packages apply to inline objects.

## Formats

Two, and only two. `.proto` is protobuf's first-class format and is written verbatim, byte for byte as published. JSON is the one other rendering with a defined meaning, because `protobufjs` round-trips it. There is no YAML twin here as there is in the sibling packages: nothing in the protobuf toolchain reads a YAML descriptor, so it would be a file format with no reader.

Everything generated is JSON, bundling included. `bundle --out api.yaml` writes `api.json`: the extension on `--out` names a file, not a format, and there is only the one format to name.

## Limits

`schema.json` describes the schema; it does not validate a `.proto` file, and nothing in this package does. Protobuf has no validator separate from its compiler — `protoc` compiling a file against an include root is the check, and that is a toolchain step rather than something a vendored schema can perform.

A bundle is a descriptor, so it carries what a descriptor carries. Field numbers, types, options and `//` comments survive; the source layout does not — which file a declaration came from, and the order the imports were written in, are gone once the graph is resolved. `unbundle` places a declaration by its package, so two schemas declaring the same package land in the same directory with their declarations side by side, and names that collide there are suffixed rather than overwritten.

The well-known types under `defs/` are vendored for reference and are not wired into an import path. `import "google/protobuf/any.proto"` will not resolve against this directory as it stands, because that import spells out a nesting under an include root and the files sit flat.

Generated files are overwritten without asking. Nothing in them is hand-written, and refusing to overwrite would only make version bumps annoying.

## Layout of the tool

`external source -> normalize -> process`, one directory per stage:

```text
src/bin/
  cmd.js                   the entry point
  lib/protobuf.spec.js     what protobuf publishes, and where a release lives
  lib/protobuf.cli.js      commander wiring
  lib/protobuf.commands.js fetch, split and list
  lib/protobuf.bundle.js   bundle and unbundle
  lib/protobuf.report.js   terminal output
  lib/source/              fetching, locating and reading a vendored release
  lib/proto/               parsing IDL, and the declarations that come out
  lib/bundle/              resolving an import graph, and taking one apart
```

The CLI is wired here rather than built by `@util/api/spec/spec.cli`, which is driven by a descriptor whose every stage assumes a JSON Schema document. The commands, their arguments and their output are still the siblings' — same names, same `-q, --quiet` and `-o, --out`, same summary — so the package behaves like one from the outside.

`lib/bundle/` stays separate from `lib/proto/proto.fragments.js` although both write one JSON file per declaration. A fragment describes a vendored release and points back into the `schema.json` beside it; a piece of an unbundled tree has no such document to point at, and reconstructs its own packages instead. The declaration walk is shared — `lib/proto/proto.declarations.js` answers both — but the files they write are different documents for different readers.

## Versions

All 83 `vMAJOR.MINOR` releases the repository publishes, from 16.2 to 36.1.

Protobuf has no patch component — `v33.6` is major 33, minor 6 — so every one of these is a distinct minor version rather than a rebuild of its neighbour. The descriptor grows across them: 21 declarations at 16.2, 24 by 25.0, 25 by 33.0.

`protobuf releases` lists them against what is on disk.
