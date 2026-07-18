import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { env } from '@/config/env';

// Pure HTTP proxy to the Wingull API — no database access.
@Injectable()
export class PlayerService {
  async getStats(uuid: string) {
    return axios
      .post(`${env.WINGULL_API}/stats`, { uuid })
      .then((res) => res.data);
  }
  getTeam(uuid: string) {
    return axios
      .post(`${env.WINGULL_API}/equipo`, { uuid })
      .then((res) => res.data);
  }
}
