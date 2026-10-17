/** Turning a specification's object names into file names. */

/**
 * Object names arrive kebab-cased, Pascal-cased or snake_cased depending on
 * the specification; files are camelCase either way.
 *
 * A leading run of capitals is an acronym and lowercases whole, so `XML`
 * becomes `xml` and `HTTPSecurityScheme` becomes `httpSecurityScheme` rather
 * than `hTTPSecurityScheme`. Nothing distinguishes an acronym from a word that
 * merely starts capitalised — `OAuthFlows` lands on `oAuthFlows` — so a name
 * that reads oddly is a naming collision in the source, not a bug here.
 */
export function camel(name) {
  return name
    .replace(/[-_](.)/g, (_, letter) => letter.toUpperCase())
    .replace(/^[A-Z]+(?![a-z])/, run => run.toLowerCase())
    .replace(/^[A-Z]/, first => first.toLowerCase())
}
