import { EventsController } from './events.controller';
import { EventsFacadeService } from './events.facade.service';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ListEventsQueryDto } from './dto/list-events-query.dto';

describe('EventsController — getEvents visibility', () => {
  let controller: EventsController;
  let facade: { getEvents: jest.Mock };

  beforeEach(() => {
    facade = { getEvents: jest.fn().mockResolvedValue([]) };
    controller = new EventsController(facade as unknown as EventsFacadeService);
  });

  const query = (): ListEventsQueryDto => ({ status: 'active' });

  it('includes private events for an admin caller', async () => {
    await controller.getEvents(query(), {
      user: { roles: [USER_ROLES.BOFF_ADMIN] },
    });

    expect(facade.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ includePrivate: true, status: 'active' }),
    );
  });

  it('excludes private events for a non-admin authenticated caller', async () => {
    await controller.getEvents(query(), { user: { roles: ['SOME_USER'] } });

    expect(facade.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ includePrivate: false }),
    );
  });

  it('excludes private events for an anonymous caller (no user)', async () => {
    await controller.getEvents(query(), {});

    expect(facade.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ includePrivate: false }),
    );
  });
});

describe('EventsController — getEvent (by id) visibility', () => {
  let controller: EventsController;
  let facade: { getEvent: jest.Mock };

  beforeEach(() => {
    facade = { getEvent: jest.fn().mockResolvedValue({ id: 1 }) };
    controller = new EventsController(facade as unknown as EventsFacadeService);
  });

  it('passes includePrivate=true for an admin caller', async () => {
    await controller.getEvent(1, {
      user: { roles: [USER_ROLES.BOFF_ADMIN], userId: 42 },
    });
    expect(facade.getEvent).toHaveBeenCalledWith(1, true, 42);
  });

  it('passes includePrivate=false + userId for a non-admin authenticated caller (participant sees their private event)', async () => {
    await controller.getEvent(1, { user: { roles: ['SOME_USER'], userId: 7 } });
    expect(facade.getEvent).toHaveBeenCalledWith(1, false, 7);
  });

  it('passes includePrivate=false and no userId for an anonymous caller (no user)', async () => {
    await controller.getEvent(1, {});
    expect(facade.getEvent).toHaveBeenCalledWith(1, false, undefined);
  });
});

describe('EventsController — event sub-resource visibility', () => {
  // The :eventId sub-resources (leaderboard/participants/teams/achievements/
  // progress) all use the same role→includePrivate expression; getLeaderboard
  // is representative.
  let controller: EventsController;
  let facade: { getLeaderboard: jest.Mock };

  beforeEach(() => {
    facade = { getLeaderboard: jest.fn().mockResolvedValue([]) };
    controller = new EventsController(facade as unknown as EventsFacadeService);
  });

  it('admin caller → includePrivate=true (private event visible)', async () => {
    await controller.getLeaderboard(5, {
      user: { roles: [USER_ROLES.BOFF_ADMIN], userId: 42 },
    });
    expect(facade.getLeaderboard).toHaveBeenCalledWith(5, true, 42);
  });

  it('non-admin participant → includePrivate=false but userId forwarded (their private event visible)', async () => {
    await controller.getLeaderboard(5, {
      user: { roles: ['SOME_USER'], userId: 7 },
    });
    expect(facade.getLeaderboard).toHaveBeenCalledWith(5, false, 7);
  });

  it('anonymous caller → includePrivate=false, no userId (private event hidden)', async () => {
    await controller.getLeaderboard(5, {});
    expect(facade.getLeaderboard).toHaveBeenCalledWith(5, false, undefined);
  });
});
