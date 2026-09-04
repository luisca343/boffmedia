import { getTableConfig, MySqlDialect } from 'drizzle-orm/mysql-core';
import {
  boffMediaContentReports,
  REPORTABLE_CONTENT,
} from '@/_db/schema/BoffMediaModeration';
import {
  CONTENT_SURFACES,
  findSurface,
  isReportableContentType,
  notHidden,
  REPORTABLE_CONTENT_TYPES,
} from './content-registry';

/**
 * The registry is the whole architectural claim of W10: one queue over many
 * surfaces, addressed by `(content_type, content_id)`. These tests pin the
 * properties that claim rests on — none of them need a database.
 */
describe('content registry', () => {
  it('registers every content type exactly once', () => {
    const types = CONTENT_SURFACES.map((s) => s.contentType);
    expect(new Set(types).size).toBe(types.length);
    expect(REPORTABLE_CONTENT_TYPES).toEqual(types);
  });

  it('resolves a content type to the surface that owns it', () => {
    const post = findSurface(REPORTABLE_CONTENT.FORUM_POST);
    const rooker = findSurface(REPORTABLE_CONTENT.ROOKER_POST);

    expect(getTableConfig(post!.table).name).toBe('boffmedia_forum_posts');
    expect(getTableConfig(rooker!.table).name).toBe('rotom_rooker_posts');
  });

  it('rejects a content type nobody registered', () => {
    // The varchar column is only as closed as this check. If it ever returns a
    // surface for an unregistered string, the "closed set in code" argument in
    // the schema comment stops being true.
    expect(findSurface('rotom_chat_messages')).toBeUndefined();
    expect(isReportableContentType('rotom_chat_messages')).toBe(false);
    expect(isReportableContentType(REPORTABLE_CONTENT.FORUM_THREAD)).toBe(true);
  });

  it('parses only ids its surface could actually have', () => {
    const surface = findSurface(REPORTABLE_CONTENT.FORUM_POST)!;

    expect(surface.parseId('412')).toBe(412);
    // `Number('')` is 0 and `Number('12abc')` is NaN. A 0 matches nothing and a
    // NaN reaches the driver as a literal, failing the query rather than the
    // request — so both have to be rejected here.
    expect(surface.parseId('')).toBeNull();
    expect(surface.parseId('12abc')).toBeNull();
    expect(surface.parseId('0')).toBeNull();
    expect(surface.parseId('-3')).toBeNull();
  });

  it('gives every surface a way to be taken out of view', () => {
    for (const surface of CONTENT_SURFACES) {
      if (surface.hide === 'column') {
        // A 'column' surface with no column would throw only when an admin
        // clicks hide, which is the worst moment to find out.
        expect(surface.hideColumn).toBeDefined();
      } else {
        expect(surface.hideColumn).toBeUndefined();
      }
    }
  });

  it('gives every surface an author to hold responsible', () => {
    for (const surface of CONTENT_SURFACES) {
      expect(
        surface.authorUserIdColumn ?? surface.authorUuidColumn,
      ).toBeDefined();
      expect(surface.excerptColumns.length).toBeGreaterThan(0);
    }
  });

  it('builds a hide filter bound to the surface the column belongs to', () => {
    const rooker = findSurface(REPORTABLE_CONTENT.ROOKER_POST)!;
    const filter = notHidden(rooker.idColumn);

    const query = new MySqlDialect().sqlToQuery(filter);

    // The content type travels as a bound parameter, not as interpolated text,
    // and it is THIS surface's type — the filter must not be able to match
    // another surface's hide decisions.
    expect(query.params).toContain(REPORTABLE_CONTENT.ROOKER_POST);
    expect(query.params).not.toContain(REPORTABLE_CONTENT.FORUM_POST);
    expect(query.sql).toContain('boffmedia_content_moderation');
    // The cast is load-bearing: without it MySQL converts both sides to a
    // number and stops using the (content_type, content_id) index.
    expect(query.sql).toContain('CAST(');
  });

  it('refuses a column that belongs to no registered surface', () => {
    expect(() => notHidden(boffMediaContentReports.id)).toThrow(
      /no registered surface/,
    );
  });
});

describe('boffmedia_content_reports schema', () => {
  const config = getTableConfig(boffMediaContentReports);

  it('enforces one report per user per item in the database', () => {
    // The dedupe rule is a UNIQUE index, not a read-then-write: two rapid
    // clicks from the same person are the ordinary case, and a check-then-
    // insert loses that race.
    const unique = config.indexes.filter((i) => i.config.unique);
    const columns = unique.map((i) =>
      (i.config.columns as Array<{ name: string }>).map((c) => c.name),
    );

    expect(columns).toContainEqual([
      'content_type',
      'content_id',
      'reporter_user_id',
    ]);
  });

  it('keys on the content pair, not on a per-surface foreign key', () => {
    const names = config.columns.map((c) => c.name);
    expect(names).toContain('content_type');
    expect(names).toContain('content_id');
    // A `thread_id`/`post_id` here would be the per-surface design this change
    // exists to avoid.
    expect(names.filter((n) => n.endsWith('_id'))).toEqual(
      expect.not.arrayContaining(['thread_id', 'post_id']),
    );
  });
});
