import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WigglypopOrdersService } from './wigglypop-orders.service';
import {
  WigglypopOrdersRepository,
  OrderWithLines,
} from '../repositories/wigglypop-orders.repository';
import {
  WigglypopListingsRepository,
  ListingWithContents,
} from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import { WigglypopListingsService } from './wigglypop-listings.service';
import { WigglypopCustodyService } from './wigglypop-custody.service';
import { WigglypopNotifyService } from './wigglypop-notify.service';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { CreateOrderDto } from '../dto/wigglypop.dto';

describe('WigglypopOrdersService', () => {
  let service: WigglypopOrdersService;
  let ordersRepository: jest.Mocked<WigglypopOrdersRepository>;
  let listingsRepository: jest.Mocked<WigglypopListingsRepository>;
  let tradingRepository: jest.Mocked<WigglypopTradingRepository>;
  let listingsService: jest.Mocked<WigglypopListingsService>;
  let custody: jest.Mocked<WigglypopCustodyService>;
  let notify: jest.Mocked<WigglypopNotifyService>;
  let outbox: jest.Mocked<OutboxRepository>;

  const mockListing = (id: number): ListingWithContents => ({
    id,
    code: `LIST-${id}`,
    sellerUuid: 'seller-uuid',
    kind: 'pokemon',
    format: 'fixed',
    title: `Listing ${id}`,
    note: null,
    status: 'activo',
    price: 1000,
    value: 1000,
    escrow: true,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    soldAt: null,
    soldFor: null,
    soldOrderId: null,
    startsAt: null,
    endsAt: null,
    currentBid: 0,
    bids: 0,
    minIncrement: 50,
    buyNow: null,
    wants: null,
    tradePlus: false,
    mons: [],
    items: [],
    watchers: 0,
    offers: 0,
  });

  const mockOrder = (id: number): OrderWithLines => ({
    id,
    code: `ORD-${id}`,
    buyerUuid: 'buyer-uuid',
    subtotal: 1000,
    fee: 25,
    total: 1025,
    status: 'escrow',
    escrowTxId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    idempotencyKey: null,
    lines: [
      {
        id: 1,
        orderId: id,
        listingId: 1,
        sellerUuid: 'seller-uuid',
        kind: 'pokemon',
        qty: 1,
        unitPrice: 1000,
        lineTotal: 1000,
        deliveryStatus: 'pendiente',
        settleTxId: null,
        takenPayload: null,
        confirmedAt: null,
      },
    ],
  });

  beforeEach(async () => {
    ordersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBuyer: jest.fn(),
      findBySeller: jest.fn(),
      setStatus: jest.fn(),
      setEscrowTx: jest.fn(),
      setAllLinesDelivery: jest.fn(),
      setLineDelivery: jest.fn(),
    } as any;

    listingsRepository = {
      findManyByIds: jest.fn(),
      findById: jest.fn(),
      findSellerUsername: jest.fn(),
      markSold: jest.fn(),
      setStatus: jest.fn(),
    } as any;

    tradingRepository = {
      findExistingReview: jest.fn(),
      createReview: jest.fn(),
    } as any;

    listingsService = {
      toEntities: jest.fn(),
    } as any;

    custody = {
      settleNewOrder: jest.fn(),
      confirmOrder: jest.fn(),
      cancelOrder: jest.fn(),
      markTransferred: jest.fn(),
      isAtomic: jest.fn().mockReturnValue(false),
    } as any;

    notify = {
      sale: jest.fn(),
      orderConfirmed: jest.fn(),
      orderCancelled: jest.fn(),
      orderTransferred: jest.fn(),
    } as any;

    outbox = {
      enqueue: jest.fn().mockResolvedValue(1),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WigglypopOrdersService,
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: WigglypopOrdersRepository, useValue: ordersRepository },
        {
          provide: WigglypopListingsRepository,
          useValue: listingsRepository,
        },
        { provide: WigglypopTradingRepository, useValue: tradingRepository },
        { provide: WigglypopListingsService, useValue: listingsService },
        { provide: WigglypopCustodyService, useValue: custody },
        { provide: WigglypopNotifyService, useValue: notify },
        { provide: OutboxRepository, useValue: outbox },
      ],
    }).compile();

    service = module.get<WigglypopOrdersService>(WigglypopOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createOrderDto: CreateOrderDto = {
      buyerUuid: 'buyer-uuid',
      lines: [{ listingId: 1, qty: 1 }],
    };

    it('should create an order with no idempotency key', async () => {
      const order = mockOrder(1);
      ordersRepository.create.mockResolvedValue(order);
      listingsRepository.findManyByIds.mockResolvedValue([mockListing(1)]);
      listingsService.toEntities.mockResolvedValue([]);
      listingsRepository.findSellerUsername.mockResolvedValue('seller-name');
      ordersRepository.findById.mockResolvedValue(order);
      // settleNewOrder is the synchronous escrow charge; create() returns what
      // it produces, so it must hand back a fully-shaped order.
      custody.settleNewOrder.mockResolvedValue(order as never);

      await service.create(createOrderDto);

      expect(ordersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerUuid: 'buyer-uuid',
          idempotencyKey: undefined,
        }),
        expect.any(Array),
        expect.any(Array),
      );
      expect(custody.settleNewOrder).toHaveBeenCalled();
    });

    it('should accept idempotency key and pass to repository', async () => {
      const order = mockOrder(1);
      order.idempotencyKey = 'order:buyer-uuid:12345';
      ordersRepository.create.mockResolvedValue(order);
      listingsRepository.findManyByIds.mockResolvedValue([mockListing(1)]);
      listingsService.toEntities.mockResolvedValue([]);
      listingsRepository.findSellerUsername.mockResolvedValue('seller-name');
      ordersRepository.findById.mockResolvedValue(order);
      // settleNewOrder is the synchronous escrow charge; create() returns what
      // it produces, so it must hand back a fully-shaped order.
      custody.settleNewOrder.mockResolvedValue(order as never);

      const idempotencyKey = 'order:buyer-uuid:12345';
      await service.create(createOrderDto, { idempotencyKey });

      expect(ordersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerUuid: 'buyer-uuid',
          idempotencyKey,
        }),
        expect.any(Array),
        expect.any(Array),
      );
      // Outbox should use dedupeKey scoped to the order
      expect(custody.settleNewOrder).toHaveBeenCalled();
    });

    it('should replay identical order creation with same idempotency key', async () => {
      const order = mockOrder(1);
      order.idempotencyKey = 'order:replay-key';
      ordersRepository.create.mockResolvedValue(order);
      listingsRepository.findManyByIds.mockResolvedValue([mockListing(1)]);
      listingsService.toEntities.mockResolvedValue([]);
      listingsRepository.findSellerUsername.mockResolvedValue('seller-name');
      ordersRepository.findById.mockResolvedValue(order);
      // settleNewOrder is the synchronous escrow charge; create() returns what
      // it produces, so it must hand back a fully-shaped order.
      custody.settleNewOrder.mockResolvedValue(order as never);

      const idempotencyKey = 'order:replay-key';
      const result1 = await service.create(createOrderDto, { idempotencyKey });
      const result2 = await service.create(createOrderDto, { idempotencyKey });

      // Both calls should succeed
      expect(ordersRepository.create).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
      // Outbox enqueued twice with the same dedupeKey
      expect(custody.settleNewOrder).toHaveBeenCalledTimes(2);


    });

    it('should not create duplicate orders on replay (repository level idempotency)', async () => {
      const order = mockOrder(1);
      order.idempotencyKey = 'order:dup-key';
      ordersRepository.create.mockResolvedValue(order);
      listingsRepository.findManyByIds.mockResolvedValue([mockListing(1)]);
      listingsService.toEntities.mockResolvedValue([]);
      listingsRepository.findSellerUsername.mockResolvedValue('seller-name');
      ordersRepository.findById.mockResolvedValue(order);
      // settleNewOrder is the synchronous escrow charge; create() returns what
      // it produces, so it must hand back a fully-shaped order.
      custody.settleNewOrder.mockResolvedValue(order as never);

      const idempotencyKey = 'order:dup-key';
      await service.create(createOrderDto, { idempotencyKey });
      await service.create(createOrderDto, { idempotencyKey });

      // Repository is called twice, but returns the same orderId both times
      expect(ordersRepository.create).toHaveBeenCalledTimes(2);
      // Both calls have the same idempotency key
      expect(ordersRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ idempotencyKey }),
        expect.any(Array),
        expect.any(Array),
      );
      expect(ordersRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ idempotencyKey }),
        expect.any(Array),
        expect.any(Array),
      );
    });

    it('should return original result on replay with idempotency key', async () => {
      const order = mockOrder(2);
      order.idempotencyKey = 'order:result-key';
      ordersRepository.create.mockResolvedValue(order);
      listingsRepository.findManyByIds.mockResolvedValue([mockListing(1)]);
      listingsService.toEntities.mockResolvedValue([]);
      listingsRepository.findSellerUsername.mockResolvedValue('seller-name');
      ordersRepository.findById.mockResolvedValue(order);
      // settleNewOrder is the synchronous escrow charge; create() returns what
      // it produces, so it must hand back a fully-shaped order.
      custody.settleNewOrder.mockResolvedValue(order as never);

      const idempotencyKey = 'order:result-key';
      const result1 = await service.create(createOrderDto, { idempotencyKey });
      const result2 = await service.create(createOrderDto, { idempotencyKey });

      // Both results should be identical
      expect(result1.code).toEqual(result2.code);
      expect(result1.id).toEqual(result2.id);
      expect(result1).toEqual(result2);
    });
  });
});
