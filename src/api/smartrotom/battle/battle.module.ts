import { Module } from "@nestjs/common"
import { LoggerModule } from "@/logger/logger.module"
import { ResponseModule } from "@/response/response.module"
import { DrizzleModule } from "@/drizzle/drizzle.module"
import { BattleController } from "./battle.controller"
import { BattleService } from "./battle.service"

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}

