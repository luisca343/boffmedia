import { Module } from '@nestjs/common';
import { MySQL2Service } from './MySQL2Service';

@Module({
  providers: [MySQL2Service],
  exports: [MySQL2Service],
})
export class MySQL2Module {}
