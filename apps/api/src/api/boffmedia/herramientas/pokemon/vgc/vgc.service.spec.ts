import { VgcRegulationsRepository } from './meta/repositories/regulations.repository';
import { VgcService } from './vgc.service';

describe('VgcService.getChampionsGameData', () => {
  it('uses the format-aware item pool for every Champions regulation', () => {
    const service = new VgcService({} as VgcRegulationsRepository);

    const regMc = service.getChampionsGameData('gen9championsvgc2026regmc');
    expect(regMc.items).toContain('Golisopite');
    expect(regMc.items).not.toContain('Assault Vest');

    for (const format of ['gen9championsvgc2026regma', 'gen9championsvgc2026regmb']) {
      const data = service.getChampionsGameData(format);
      expect(data.items).not.toContain('Golisopite');
      expect(data.items).not.toContain('Assault Vest');
    }
  });
});
