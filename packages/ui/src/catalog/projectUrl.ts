/** The public web page for a catalogue project, or null when there is none.
 *
 *  Lives here rather than in the launcher because both hosts show catalogue
 *  rows and both need the same two URL shapes — and because the shapes are not
 *  guessable: neither platform's project page sits under the path its API does.
 *
 *  `id` may be a project id or a slug. Both platforms resolve either:
 *  Modrinth's `/project/<id-or-slug>` is canonical for every project type
 *  (using `/mod/` breaks for shaders and resource packs), and CurseForge's
 *  `/projects/<id>` is a redirect stub that lands on the real page whatever the
 *  game and category turn out to be — which the caller does not know. */
export type ProjectUrlKind = string | null | undefined

export function projectUrl(
  kind: ProjectUrlKind,
  id: string | null | undefined,
): string | null {
  if (!id) return null
  const trimmed = id.trim()
  if (!trimmed) return null
  // Encoded because a slug is user-authored upstream. Ids are hex-ish and
  // unaffected; this only matters for the odd slug with a reserved character.
  const safe = encodeURIComponent(trimmed)
  if (kind === "modrinth") return `https://modrinth.com/project/${safe}`
  if (kind === "curseforge") return `https://www.curseforge.com/projects/${safe}`
  // `url`, `override` and `manual` have no project page. Returning null rather
  // than a guessed link is the point: a dead link that looks live is worse than
  // a row that simply is not clickable.
  return null
}
