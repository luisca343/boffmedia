import { Injectable } from '@nestjs/common';
import { CountersRepository } from './counters.repository';
import { GobiernoCountersEntity } from './entities/counters.entity';

// Backs the sidebar's four pending-work badges in a single round trip, instead of the
// frontend fetching and counting four full lists.
@Injectable()
export class CountersService {
  constructor(private readonly countersRepository: CountersRepository) {}

  async getCounters(): Promise<GobiernoCountersEntity> {
    return this.countersRepository.countPendingWork();
  }
}
