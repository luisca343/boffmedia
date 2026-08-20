import { sharexImages } from '@/_db/schema/Sharex';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SharexService {
  constructor(private db: MySQL2Service) {}

  /**
   * `tokenId` is who uploaded it. It replaced a `key` column that stored the
   * raw shared secret the client sent — the same value on every row, so it
   * identified nobody.
   *
   * AWAITED on purpose. This used to be fire-and-forget with no `.catch()`, so
   * a failing insert became a swallowed unhandled rejection: the upload still
   * returned 200 with a URL and the file still landed on disk, while no row was
   * ever written. That is exactly how the dev database drifted to a table name
   * the schema had already renamed away from without anyone noticing.
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
