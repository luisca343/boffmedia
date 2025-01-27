import { Module } from "@nestjs/common"
import { LoggerModule } from "@/logger/logger.module"
import { ResponseModule } from "@/response/response.module"
import { DrizzleModule } from "@/drizzle/drizzle.module"
import { PlayerController } from "./player.controller"
import { PlayerService } from "./player.service"

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}

