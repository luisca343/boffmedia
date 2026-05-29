import { PlotEntry } from '../../entities/plot.entity';

export interface IWingullRepository {
  getWorldGuardWorlds(): Promise<{ id: number; name: string }[]>;
  getPlayersOwnedRegions(uuid: string): Promise<
    {
      region_id: string;
      world_id: number;
      owner: boolean;
      name: string;
      uuid: string;
    }[]
  >;
  getAllRegions(): Promise<PlotEntry[]>;
}
