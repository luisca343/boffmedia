import { sharexImages } from '@/_db/schema/Sharex';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SharexService {
  constructor(private db: MySQL2Service) {}

  /**
   * `tokenId` is who uploaded it — not the raw shared secret the client sent,
   * which is the same value on every row and identifies nobody.
   *
   * AWAITED on purpose. Fire-and-forget with no `.catch()` turns a failing
   * insert into a swallowed unhandled rejection: the upload still returns 200
   * with a URL and the file still lands on disk, while no row is ever written.
   */
  async createImage(
    app: string,
    name: string,
    extension: string,
    tokenId: number,
  ): Promise<void> {
    await this.db
      .getDrizzle()
      .insert(sharexImages)
      .values({ app, name, extension, tokenId })
      .execute();
  }
}
