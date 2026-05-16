import { ApiProperty } from '@nestjs/swagger';
import { CacheInfoEntity } from './cache-info.entity';

export class ResourceResponseEntity<T> {
  @ApiProperty({
    description: 'The requested data',
    type: [Object],
  })
  data: T[];

  @ApiProperty({
    description: 'Cache information for this request',
    type: CacheInfoEntity,
  })
  cacheInfo: CacheInfoEntity;
}
