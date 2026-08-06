import { configureCatalog } from '@boffmedia/ui';

import { PacksService } from '@/services/api/boffmedia/packsService';

// Wires <ModBrowser> to the admin catalog routes. The API is the only path to
// CurseForge from a browser: its key is server-side, and an embedded one gets
// extracted (see FileSource in @boffmedia/pack-schema).
//
// Every adapter unwraps the {success, data} envelope and degrades to an empty
// result, because the browser renders one shape and treats failure as "nothing
// matched" rather than carrying a second error branch through three panes.
configureCatalog({
  search: async (input) => {
    const res = await PacksService.searchMods(input);
    return res.success && res.data ? res.data : { hits: [], total: 0 };
  },
  categories: async (platform, projectType) => {
    const res = await PacksService.categories(platform, projectType);
    return res.success && res.data ? res.data : [];
  },
  project: async (platform, projectId) => {
    const res = await PacksService.project(platform, projectId);
    return res.success && res.data ? res.data : null;
  },
  files: async (platform, projectId, filters) => {
    const res =
      platform === 'curseforge'
        ? await PacksService.curseforgeFiles(projectId, filters)
        : await PacksService.modrinthVersions(projectId, filters);
    return res.success && res.data ? res.data : [];
  },
  projectSummaries: async (platform, ids) => {
    const res = await PacksService.projectSummaries(platform, ids);
    return res.success && res.data ? res.data : [];
  },
  resolve: async (source) => {
    const res = await PacksService.resolveFile(source);
    return res.success && res.data ? res.data : null;
  },
});
