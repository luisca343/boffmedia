import { configureCatalog } from "@boffmedia/ui"

import {
  catalogCategories,
  catalogProject,
  catalogProjectSummaries,
  catalogResolve,
  catalogSearch,
  catalogVersions,
  iconSrc,
  reportIconFailure,
} from "../runtime"

// Wires <ModBrowser> to Modrinth. `platform` is ignored throughout: the browser
// is mounted with `platforms={["modrinth"]}`, so nothing else can ever arrive
// here — and if it somehow did, CurseForge has no key on this side and would
// have nothing to answer with.

configureCatalog({
  search: (input) =>
    catalogSearch({
      query: input.query,
      gameVersion: input.gameVersion,
      loader: input.loader,
      projectType: input.projectType,
      sort: input.sort,
      category: input.category,
      page: input.page,
      pageSize: input.pageSize,
    }),
  categories: (_platform, projectType) => catalogCategories(projectType),
  project: (_platform, projectId) => catalogProject(projectId),
  files: (_platform, projectId, filters) =>
    catalogVersions(projectId, { gameVersion: filters.gameVersion, loader: filters.loader }),
  projectSummaries: (_platform, ids) => catalogProjectSummaries(ids),
  resolve: (source) => catalogResolve(source),
  // The webview's CSP will not load arbitrary remote art; icons.rs caches the
  // bytes and this hands back a data: URL for the cached copy.
  iconSrc: (url) => iconSrc(url),
  // The other half of the diagnosis: `iconSrc` succeeding only proves the file
  // was written, not that the webview will render it. This fires when the <img>
  // itself rejects the URL, which is the failure the disk cache cannot see.
  onIconRenderFailure: (attempted, remote) => reportIconFailure(attempted, remote),
})
