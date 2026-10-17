# @package/mcp

The Model Context Protocol schema, vendored per release, plus one fragment schema for every object a `$ref` can point at.

```sh
mcp fetch 2026-07-28
mcp split 2026-07-28
mcp generate 2026-07-28
mcp list
```

MCP versions *are* dates, so a release takes no second argument.

## Versions

All six: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28, and `draft`, which tracks main and therefore moves.

## The dialect changes mid-history

Releases up to and including `2025-06-18` are draft-07 with `definitions`. From `2025-11-25` onward they are 2020-12 with `$defs`. Both are read without configuration — the normalizer picks its rules off the document's own `$schema` — so the two eras split with the same command.

## Why the hierarchy comes from unions

MCP has no document root. The whole schema is two keys, `$schema` and `$defs`, with no `properties`, no `required` and no root constraint: it is a definition bag, and a consumer points at a named object itself.

That leaves the usual sources of hierarchy empty — there are no root keys and no components map. What MCP does have is unions: `ClientRequest` is an `anyOf` over ten request types, `JSONRPCMessage` over four message kinds. Those are the document naming its own groups, so they become directories, and everything else sits flat in `fragments/`.

The union set is not stable across versions. `ServerRequest` disappears in 2026-07-28, replaced by `InputRequest` and `InputResponse`, and `ClientNotification` stops being a union at all. Nothing here hardcodes the list — a group exists because the document says so in that release.

## Limits

`Tool.inputSchema` is an open hole: `{"additionalProperties": {}}` with a prose description saying any 2020-12 keyword may appear. MCP embeds no metaschema and references none, so a tool's input schema is unvalidated here.

See [the shared docs](../../utils/api/readme.md) for how fragments are laid out and why.
