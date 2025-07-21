import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { TcgService } from './services/tcg.service';
import { ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { TcgFacadeService } from './tcg.facade.service';

@ApiTags('BoffMedia 🛠 | Pokemon TCG Pocket')
@Controller('tools/ptcgp')
@UseInterceptors(ResponseInterceptor)
export class TcgController {
  constructor(private readonly tcgFacade: TcgFacadeService) {}

  @Get('series')
  async getAllSeries() {
    return this.tcgFacade.getAllSeries();
  }

  @Get('series/fetch')
  async fetchAndStoreSeries() {
    return this.tcgFacade.fetchAndStoreSeries();
  }

  @Get('series/:seriesId/sets')
  async getSetsForSeries(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ) {
    return this.tcgFacade.fetchSetsForSeries(seriesId, locale);
  }

  @Get('series/:seriesId/sets/all')
  async getSetsForSeriesBothLanguages(
    @Param('seriesId') seriesId: string,
  ) {
    return this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
  }
}
