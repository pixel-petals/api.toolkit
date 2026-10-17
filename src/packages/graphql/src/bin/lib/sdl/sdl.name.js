/**
 * Turning an introspection type name into a file name.
 *
 * The `__` prefix is part of the name and stays: a file called `schema` would
 * read like a type the specification does not define. Only the first letter
 * after it is lowered, which lands on the same camelCase the sibling packages
 * name their fragments with — `__Schema` on `__schema`, `__TypeKind` on
 * `__typeKind`.
 */
export function fileStem(name) {
  return name.replace(/^(_*)([A-Z])/, (_, prefix, first) => prefix + first.toLowerCase())
}
