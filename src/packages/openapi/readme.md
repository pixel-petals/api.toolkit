# @package/openapi

The OpenAPI JSON Schema, vendored per version, plus one fragment schema for every object a `$ref` can point at.

```sh
openapi fetch 3.2 2025-11-23     # vendor schema/3.2/schema.json
openapi split 3.2                # generate the fragments beside it
openapi generate 3.2 2025-11-23  # both, in one step
openapi list                     # versions already vendored
```

`split` reads only what is on disk, so it works offline and always matches the vendored copy. `fetch` is the one command that touches the network.

## Versions

| version | release | fragments | placed by shape |
| --- | --- | --- | --- |
| 2.0 | 2017-08-27 | 46 | 16 |
| 3.0 | 2024-10-18 | 36 | 20 |
| 3.1 | 2025-11-23 | 28 | 16 |
| 3.2 | 2025-11-23 | 29 | 17 |

One dated release is vendored per version — the newest at the time of writing. `openapi fetch 3.1 2022-10-07` replaces it with any other; the spec lists them under [Schema Iterations](https://spec.openapis.org/oas/).

## Layout

```text
schema/3.2/
  schema.json  schema.yaml         the published schema, verbatim
  defs/
    info.json  paths.json  components.json  externalDocs.json
    servers/server.json
    security/securityRequirement.json
    tags/tag.json
    components/
      schemas.json  responses.json  parameters.json  examples.json
      requestBodies.json  headers.json  securitySchemes.json
      links.json  callbacks.json  mediaTypes.json
    fragments/
      contact.json  license.json  serverVariable.json  operation.json
      pathItem.json  parameters.json  content.json  encoding.json
      responses.json  oauthFlows.json  reference.json  mapOfStrings.json
```

The fetched schema sits alone at the version root, written in both formats. Everything under `defs/` is generated, also in both, with each format pointing at its own copy of the source.

Directories mirror the document: a fragment sits where a bundle author could point at that location and say the file goes there. An object with no such location — or with several, like a Path Item, which is equally at home under `webhooks` and `components.pathItems` — sits flat in `fragments/` instead. One file per object, always. The full rule is in [the shared docs](../../utils/api/readme.md).

Everything is derived from the schema — root keys, component groups, which objects tolerate a `$ref`, and the dialect. A version bump changes the list upstream rather than drifting against a literal here.

## Why fragments exist

Each file in a bundle is a single *component object*, not a document, so the document-level schema rejects it outright.

OpenAPI publishes only four URLs per version — `meta`, `dialect`, `schema`, `schema-base` — and none addresses an individual component. The component types exist only as defs inside the schema document, reachable by JSON pointer.

A pointer cannot go in a `json.schemas` association URL: VS Code loads that URL and parses the response body as the root schema, dropping the fragment, so `…/schema#/$defs/response` silently validates the file as a whole OpenAPI document. `$ref` *does* resolve pointers — hence one wrapper file per object type.

Each wrapper points at the vendored copy rather than the published URL, so editor validation needs no network and stays pinned to the schema in the repo:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$ref": "../../schema.json#/$defs/response-or-reference"
}
```

A bundle file is often itself a bare `{"$ref": "./other.json"}`, so fragments use whichever reference-tolerant form their version offers — a `-or-reference` def in 3.1+, an inline `oneOf` against the Reference Object in 3.0. In 3.1+, `components/schemas.json` is a further exception: its def is a deliberately empty stub, because those versions let a document pick its own dialect, so the fragment targets the dialect URL instead. See [the shared docs](../../utils/api/readme.md).

## Use

Fragments resolve through the package exports, so an editor association can name one directly:

```json
{ "fileMatch": ["**/bundle/responses/*.json"], "url": "./node_modules/@package/openapi/src/schema/3.2/defs/components/responses.json" }
```

Generated files are overwritten without asking. Nothing in them is hand-written, and refusing to overwrite would only make version bumps annoying.

## Layout of the tool

There is barely any. Fetching, normalizing, laying out fragments and the CLI all live in [utils](../../utils/api/readme.md); this package is a descriptor naming the release URL, and a `schema/` directory.

Only `@util/api/schema/` knows that 2.0 and 3.0 are draft-04 while 3.1 and 3.2 are 2020-12. Everything downstream works on the normalized shape, which is why the same code serves Swagger 2.0, AsyncAPI and MCP.

## Limits

Validation sees each file alone. It cannot tell that a `$ref` target is missing or is the wrong kind of object, and it stays silent on an empty file rather than flagging it. That needs a resolving linter:

```sh
npx @redocly/cli lint bundle/spec.json
```

In 3.1+, `components.json` — the whole Components map — cannot validate inline schema objects. `components.schemas` reaches the Schema Object through `$dynamicRef: "#meta"`, which falls back to the empty stub, and the surrounding `unevaluatedProperties: false` then rejects every real schema keyword. Keeping schema objects in their own files under `components/schemas.json` sidesteps this, because that fragment targets the dialect and validates them properly. 3.0 and 2.0 are unaffected — they define a real Schema Object.
