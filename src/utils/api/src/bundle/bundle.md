# Bundling and unbundling

Two inverse operations on a document that references other files.

```sh
<name> unbundle ./api.yaml --out ./tree/        # one document -> a tree
<name> bundle ./tree/spec.yaml --out ./api.yaml # a tree -> one document
```

Unlike the rest of the CLI these take paths, not versions. They work on whatever you point them at — usually someone's own API description, though a vendored copy works too.

## Bundling

Resolving references is a solved problem, so it is not solved again here.

`@apidevtools/json-schema-ref-parser` handles the generic case: it inlines every external reference and leaves internal ones alone. `bundle` rather than `dereference` — an internal reference is how a document says two places share one definition, and resolving those would both inflate the output and turn a cycle into an infinite one.

`@redocly/openapi-core` handles the OpenAPI Initiative documents. It knows the shape it is working on, so instead of copying a referenced file inline at each use it lifts the file into the reusable-object map and leaves an internal reference behind. That is how these documents are written by hand, and it is what makes a round trip stable: a file at `components/schemas/Pet.yaml` goes back to `components.schemas.Pet` rather than to a generated name.

A specification supplies its own bundler through the descriptor's `bundle`; anything without one gets the generic inliner.

## Unbundling

A piece is lifted out where the document itself names it — an entry of a top-level collection, or of a group inside the reusable-object map. Everything else stays in the root document.

### Which keys hold pieces

Not decidable from a document alone. `paths` is a map whose keys the author chose; `info` is one object whose keys the specification chose. An `info` carrying only `contact` and `license` looks exactly like a map of two objects.

So the vendored schema is asked instead, via the descriptor's `versionOf`. The map-ness is often a reference away — OpenAPI's root `paths` is a bare `$ref`, and only the definition behind it carries the `patternProperties` that make it a map — so references are followed rather than treated as opaque. A version that is not vendored falls back to a guess: every value being an object.

### Repointing

This is the part that is easy to get wrong. A lifted piece keeps pointers like `#/components/responses/PetList`, which were meaningful while the document was one file. The moment the piece is its own file, `#` means *that* file's root and the pointer resolves to nothing.

Every reference is therefore rewritten relative to where it now lives:

- at a piece that was also lifted, it becomes that file — `../components/responses/PetList.yaml`
- at anything else, it stays a pointer but against the root document — `../spec.yaml#/info/title`

### Names

A key in a document is arbitrary text: an OpenAPI path is `/pets/{petId}`, a channel address can hold dots and slashes. Unsafe characters collapse to `_`, and a collision within one directory takes a numeric suffix.

Nothing has to reverse this. The parent keeps the mapping in the reference it writes, so a slug only has to be stable, readable and unique among its siblings.

## Formats

Each format gets its own copy of every file, and its references name that format's files — `spec.yaml` points at `.yaml` pieces, `spec.json` at `.json` ones. A toolchain never has to cross formats to resolve a reference.

`--out` decides: name a file with a known extension and only that format is written, name a directory and the specification's own formats are used.

## The specifications without references

GraphQL and protobuf have no `$ref`, so bundling means something else for each and neither uses this code. See their packages: GraphQL merges and splits SDL type definitions, and protobuf bundles to a self-contained JSON descriptor because a merged `.proto` would not compile.
