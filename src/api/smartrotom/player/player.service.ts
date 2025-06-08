import { Inject, Injectable } from "@nestjs/common"
import { DRIZZLE } from "@api/_utils/drizzle/drizzle.module"
import type { MySql2Database } from "drizzle-orm/mysql2"
import axios from "axios";

@Injectable()
export class PlayerService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async getStats(uuid: string) {
    return axios
      .post(`${process.env.WINGULL_API}/stats`, { uuid })
      .then((res) => res.data);
  }
  getTeam(uuid: string) {
    return axios
      .post(`${process.env.WINGULL_API}/equipo`, { uuid })
      .then((res) => res.data);
  }
}

