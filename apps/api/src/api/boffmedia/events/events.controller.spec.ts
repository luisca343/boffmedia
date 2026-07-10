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
