# api/spec

Vendored API specification schemas, split into per-object fragments an editor can validate against.

Each package downloads a published specification document, keeps it verbatim, and derives one small file per object a reference can point at — so a bundle file holding a single Response or Operation gets validated as what it is, rather than rejected as an incomplete document.

## Packages

| package | vendors | formats | fragments |
| --- | --- | --- | --- |
| [openapi](src/packages/openapi) | OpenAPI — 4 of 4 versions | JSON, YAML | pointers |
| [asyncapi](src/packages/asyncapi) | AsyncAPI — 14 of 14 | JSON, YAML | pointers |
| [arazzo](src/packages/arazzo) | Arazzo — 2 of 2 | JSON, YAML | pointers |
| [mcp](src/packages/mcp) | MCP — 6 of 6 | JSON, YAML | pointers |
| [typeapi](src/packages/typeapi) | TypeAPI — 1 of 2 | JSON, YAML | whole documents |
| [protobuf](src/packages/protobuf) | Protobuf — 83 of 83 | proto, JSON | JSON descriptors |
| [graphql](src/packages/graphql) | GraphQL — 8 of 8 | graphql, JSON | SDL + introspection |

Every package has the same four commands:

```sh
<name> fetch <version> [date]     # vendor a release
<name> split <version>            # derive fragments from it, offline
<name> generate <version> [date]  # both
<name> list                       # what is vendored
<name> releases                   # what upstream publishes, and which are vendored

<name> bundle <document>          # many files -> one
<name> unbundle <document>        # one -> many
```

`bundle` and `unbundle` take paths rather than versions: they work on any document of that specification, not only the vendored copies. What they mean depends on how the specification references other files — `$ref` for most, `import` for TypeAPI and protobuf, and plain concatenation for GraphQL, which has no reference mechanism at all. See [utils/bundle](src/utils/api/src/bundle/bundle.md).

`releases` is how the table above stays honest — it asks each specification's own registry, so a gap between what exists and what is vendored is visible rather than assumed.

## Not every specification fits

Four of these publish a JSON Schema describing themselves, so they share one pipeline and a package is barely thirty lines. The other three do not, and their differences are the interesting part:

- **TypeAPI** documents are TypeSchema, not JSON Schema — no `$schema`, no `$ref`, references are typed nodes. TypeSchema imports whole documents and cannot address a definition inside another file, so a pointer fragment would have nothing to point with. Each fragment is instead a valid standalone document carrying its own transitive closure.
- **Protobuf** has a genuine object library in `descriptor.proto`, but it is protobuf IDL. Fragments are JSON descriptors only: a message is not a compilation unit, so an extracted `.proto` would not compile.
- **GraphQL** publishes no schema of itself. Its specification is prose Markdown and its grammar a bespoke BNF notation; the introspection schema exists only as SDL inside code fences in `Section 4 -- Introspection.md`. SDL is GraphQL's first-class schema language, so that is what the package builds from — extracted per release, with the introspection result beside it.

## Shared machinery

Everything generic lives in [utils](src/utils/api/readme.md), on one axis: **external source → normalize → process**. That document covers where a fragment goes and why, how the JSON Schema drafts differ, and what to do when adding a specification.
