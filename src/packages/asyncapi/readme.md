# @package/asyncapi

The AsyncAPI JSON Schema, vendored per version, plus one fragment schema for every object a `$ref` can point at.

```sh
asyncapi fetch 3.1.0
asyncapi split 3.1.0
asyncapi generate 3.1.0
asyncapi list
```

## Which document is vendored

AsyncAPI publishes every version twice, and only one of the two is usable here.

The default file — the one `asyncapi.com/definitions/<version>.json` also serves — stamps an `$id` on each of its definitions. That turns all 434 internal references into absolute `http://asyncapi.com/...` URLs and leaves nothing a local pointer can resolve. It also carries version-duplicated definitions, holding both `.../3.0.0/Reference.json` and `.../3.1.0/Reference.json`, which is why it reports 112 objects against the other file's 107.

So this vendors the `-without-$id` variant from the schema repository, whose definitions are plain names and whose 499 references are local `#/definitions/...` pointers.

## Versions

All 14 the schema repository publishes: 1.0.0–1.2.0 (draft-04), 2.0.0-rc1 through 2.6.0 and 3.0.0–3.1.0 (draft-07). `asyncapi releases` lists them against what is on disk.

## Notes

Versions 1.x are draft-04 and 2.x/3.x are draft-07. Both are read without configuration — the normalizer picks its rules off the document's own `$schema`.

Reference tolerance is spelled inline, `oneOf: [Reference, X]`, with no named `-or-reference` object. The argument order is not consistent across the document — the websockets binding puts `Reference` second — so it is matched by identity rather than position.

The embedded draft-07 metaschema (`json-schema-draft-07-schema`) is a full copy of the JSON Schema meta-schema, not a stub, and gets a fragment like any other object.

See [the shared docs](../../utils/api/readme.md) for how fragments are laid out and why.
