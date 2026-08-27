import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PublicProfileController } from './public-profile.controller';
import { PublicProfileService } from './public-profile.service';
import { PublicProfileRepository } from './repositories/public-profile.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [PublicProfileController],
  providers: [PublicProfileService, PublicProfileRepository],
  exports: [PublicProfileService],
})
export class PublicProfileModule {}
