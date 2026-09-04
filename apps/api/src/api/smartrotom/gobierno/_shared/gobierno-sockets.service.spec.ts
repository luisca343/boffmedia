import { GobiernoSocketsService } from './gobierno-sockets.service';

function make() {
  const emit = jest.fn();
  const warn = jest.fn();
  const gateway = { server: { emit } } as never;
  const logger = { warn } as never;
  return {
    service: new GobiernoSocketsService(logger, gateway),
    emit,
    warn,
  };
}

describe('GobiernoSocketsService', () => {
  it('names the event after its type and carries the id', () => {
    const { service, emit } = make();
    service.emit({ type: 'denuncia:created', denunciaId: 7 });
    expect(emit).toHaveBeenCalledWith('gobierno:denuncia:created', {
      type: 'denuncia:created',
      denunciaId: 7,
    });
  });

  // The gateway is injected with forwardRef and has no `server` until socket.io
  // has attached. A mutation during that window must not take the request down
  // with it: the realtime hint is a convenience, the write already succeeded.
  it('drops the event rather than throwing when the gateway is not up yet', () => {
    const warn = jest.fn();
    const service = new GobiernoSocketsService({ warn } as never, {} as never);
    expect(() =>
      service.emit({ type: 'multa:created', multaId: 1 }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
