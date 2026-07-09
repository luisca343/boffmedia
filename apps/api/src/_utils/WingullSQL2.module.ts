import { Module } from '@nestjs/common';
import { WingullSQL2Service } from './WingullSQL2Service';

@Module({
  providers: [WingullSQL2Service],
  exports: [WingullSQL2Service],
})
export class WingullSQL2Module {}
