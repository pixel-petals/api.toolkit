# utils

Shared machinery for the specification packages. Every package under `src/packages/` is a descriptor plus a `schema/` directory; everything else lives here.

## The pipeline

```text
external source  ->  normalize  ->  process
   source/            schema/        fragments/
```

- **`source/`** — fetch a published document, vendor it, read it back, and locate the version tree. Knows nothing about what the document contains.
- **`schema/`** — turn a JSON Schema document into one version-agnostic shape. The only place that knows which draft it is looking at.
- **`fragments/`** — decide where each fragment goes and write it. Works purely on the normalized shape, so the same code serves Swagger 2.0 and MCP.
- **`serialize/`** — render a document as JSON, YAML, or verbatim text.
- **`spec/`** — build a CLI from a descriptor. Four commands, one implementation.

## Normalizing

The modules split on the axis that actually differs, not one per draft:

- **`schema.defs.js`** — documents whose object library is `$defs` (2019-09, 2020-12). These drafts let a `$ref` carry siblings, so a reference beside `properties` is composition rather than containment. Reference tolerance is a named `-or-reference` object.
- **`schema.definitions.js`** — documents whose library is `definitions` (draft-04 through draft-07). A `$ref` here has no siblings, so there is no composition case to guard. Reference tolerance is an inline `oneOf: [Reference, X]`, matched by identity because argument order is not consistent.

Splitting this way meant draft-06 and draft-07 arrived for free, which is what AsyncAPI and pre-2025-11 MCP needed.

A normalizer returns `{ id, draft, pointer, dialect, isDelegated, objects, roots, components, unions }`. Nothing downstream knows more than that.

## Where a fragment goes

A fragment file belongs somewhere only if the document itself puts it there. Three things qualify:

- **a key of the document root** — `servers`, `paths`, `tags`
- **a key of the reusable-object map** the root points at — `components.schemas`, `components.responses`
- **a union the document names** — MCP's `ClientRequest`, OpenAPI 3.0's `SecurityScheme`

Everything else is only reachable through a parent that is itself inline, so any directory chosen for it would be a guess dressed up as structure. Those sit flat in `fragments/`.

An object reached from **more than one** of those homes is the same problem in a different coat — two guesses wearing a directory name — so it falls through to `fragments/` as well. That is why 3.2 has no `defs/webhooks/` and no `defs/components/pathItems.json`: a Path Item is equally at home in both. Every fragment file corresponds to exactly one object, and every object to exactly one file.

A root key holding a collection becomes a directory, because the files under it are named by the author. A root key holding a single object becomes a file, because there is only ever one.

## Formats

A format is two-way. `serialize.format.js` holds one entry per object encoding, each with a `parse` and a `render`, and every crossing of the boundary goes through it:

```text
fetch  ->  parse   ->  a plain object  ->  render  ->  disk
read   ->  parse   ->                                       
```

That is the normalize step for formats, and it is why `sourceFormat` (what upstream publishes) and `formats` (what we republish it as) are independent settings on a descriptor. A specification that served YAML would need no new code path — only `sourceFormat: 'yaml'`.

Languages are deliberately not formats in this sense. GraphQL SDL and protobuf IDL carry no object to normalize into, so they live in `serialize.text.js`, which writes verbatim and never parses. Turning SDL into an object is a package's own concern, not an encoding.

Every document is written in each format a specification accepts — JSON and YAML for the JSON Schema ones. Each format points at its own copy of the source, so `defs/paths.yaml` references `../schema.yaml` while `defs/paths.json` references `../schema.json`, and a toolchain never crosses formats to resolve a pointer.

A fragment declares the draft of the document it points into, not a fixed one: a 2020-12 wrapper around a draft-04 target is a cross-draft reference, and validators disagree about what that means.

## Naming

Object names arrive kebab-cased, Pascal-cased or snake_cased depending on the specification; files are camelCase either way. A leading run of capitals is an acronym and lowercases whole, so `XML` becomes `xml` and `HTTPSecurityScheme` becomes `httpSecurityScheme`.

`OAuthFlows` is the one name no rule gets right — it lands on `oAuthFlows` where OpenAPI 3.1+ spells the same object `oauth-flows` and so gets `oauthFlows`. Nothing in the string says whether the leading `OA` is an acronym or the start of a word.

## Adding a specification

If it publishes a JSON Schema, add a descriptor and nothing else — see `src/packages/arazzo` (about thirty lines). If it does not, the package brings its own pipeline and reuses `source/` and `serialize/`; see `src/packages/typeapi`.
