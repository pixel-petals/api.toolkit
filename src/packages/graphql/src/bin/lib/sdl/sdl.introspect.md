# Introspecting the introspection schema

`schema.json` is the vendored SDL rendered as an introspection result — the form `buildClientSchema` and most client-side tooling read. Producing it is not the one-liner it looks like, and the detours are here rather than in the module.

## Why the names are stripped

Every name in Section 4 begins with `__`, which the specification reserves for the introspection system. graphql-js enforces that reservation by owning those names: a schema always carries the meta-types of the implementation that answered it, and introspection resolves out of those rather than out of anything a document declared under the same name.

`buildSchema` accepts the SDL verbatim and `validateSchema` reports nothing, so the failure is silent. The result simply describes graphql-js. Vendoring 2015-10 that way produced a `__Directive` with `isRepeatable`, `isDeprecated` and `deprecationReason` — fields that release does not define, in place of the `onOperation`, `onFragment` and `onField` it does. Every release came back byte-identical, which is the tell.

Building under unprefixed names keeps the two apart. The prefix goes back on afterwards, and only where the result names a type: fields are camelCase and enum values are upper-case, so no other name in an introspection result can collide with a stripped one.

## Why there is a query root

A schema cannot be introspected without a query root type, and Section 4 declares none — it describes a meta-system, not a service. `__Schema` is used, because that is exactly what it is: the object a `__schema` meta-field returns. The result then reports `queryType: __Schema`, which reads as the entry point it is.

## What is dropped

Two things in the result describe the host rather than the release:

- the meta-types graphql-js adds to every schema, which after the rename are the only remaining `__`-prefixed entries in `types`
- the built-in directives — `@include`, `@skip`, `@deprecated`, `@specifiedBy`, `@oneOf` — which belong to Section 3, not Section 4

Both would drift with the dependency instead of with the vendored release, so `types` keeps only what the section declares and `directives` is empty.

`String` and `Boolean` stay. The section's own fields reference them, and a result that omitted them would not resolve.
