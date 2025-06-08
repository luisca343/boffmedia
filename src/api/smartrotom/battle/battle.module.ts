import { Module } from "@nestjs/common"
import { LoggerModule } from "@api/_utils/logger/logger.module"
import { ResponseModule } from "@api/_utils/response/response.module"
import { DrizzleModule } from "@api/_utils/drizzle/drizzle.module"
import { BattleController } from "./battle.controller"
import { BattleService } from "./battle.service"

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}

