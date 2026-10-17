# @package/arazzo

The Arazzo workflow schema, vendored per release, plus one fragment schema for every object a `$ref` can point at.

```sh
arazzo fetch 1.1 2026-04-15
arazzo split 1.1
arazzo generate 1.1 2026-04-15
arazzo list
```

## Releases

Arazzo publishes one resource per version, addressed by release date, the same way OpenAPI does. There is no `schema-base` variant and no `latest` alias, so every release is spelled out:

| version | release |
| --- | --- |
| 1.1 | 2026-04-15 |
| 1.0 | 2025-10-15, 2024-12-16 |

**Releases are keyed by URL, not by `$id`.** The 1.0 2024-12-16 document identifies itself as `https://spec.openapis.org/arazzo/1.0/schema/2024-08-01`, and that URL does not resolve. A resolver that trusts `$id` will look for a document that is not there.

## Notes

Arazzo has no `jsonSchemaDialect` and no Schema Object of its own — its `schema` definition is a one-line `$ref` straight to 2020-12, so there is no dialect delegation to work around.

Reference tolerance is spelled inline against a single `reusable-object`, which is a runtime-expression reference (`{reference, value}`) rather than a `$ref`. It is a normal object here and gets its own fragment.

See [the shared docs](../../utils/api/readme.md) for how fragments are laid out and why.
