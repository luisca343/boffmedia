import { sharexImages } from '@/_db/schema/Sharex';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SharexService {
  constructor(private db: MySQL2Service) {}

  createImage(app: string, name: string, extension: string, key: string) {
    this.db
      .getDrizzle()
      .insert(sharexImages)
      .values({ app, name, extension, key })
      .execute();
  }
}
