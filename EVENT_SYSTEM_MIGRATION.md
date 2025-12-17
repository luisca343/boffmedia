# SmartRotom Event System Migration

## Overview
Migrated the SmartRotom millionaire system to a generic event architecture that supports multiple event types.

## New Schema Files

### Core Event System
- **[SmartRotomEvents.ts](src/_db/schema/SmartRotomEvents.ts)** - Core event tables
  - `rotom_events` - Main event registry with types (MILLIONAIRE, TOURNAMENT, BUILDING_COMPETITION, BUG_HUNT, etc.)
  - `rotom_event_participants` - Generic participant tracking with roles (CONDUCTOR, PARTICIPANT, SPECTATOR, JUDGE)
  - `rotom_event_states` - Event state snapshots and progression tracking
  - `rotom_event_rewards` - Reward distribution system

### Event-Specific Schemas
- **[SmartRotomMillionaire.ts](src/_db/schema/SmartRotomMillionaire.ts)** - Migrated millionaire system
  - `millionaire_event_data` - NEW: Millionaire-specific data linked to events
  - Legacy tables marked `@deprecated` with `migratedToEventId` field for backwards compatibility
  
- **[SmartRotomTournament.ts](src/_db/schema/SmartRotomTournament.ts)** - Battle tournaments
  - `tournament_event_data` - Tournament configuration (format, rounds, bracket)
  - `tournament_matches` - Individual match tracking with replay URLs

- **[SmartRotomBuilding.ts](src/_db/schema/SmartRotomBuilding.ts)** - Building competitions
  - `building_competition_data` - Competition theme, time limits, judging criteria
  - `build_submissions` - Player submissions with coordinates and screenshots
  - `build_votes` - Voting system with multiple score categories

- **[SmartRotomBugHunt.ts](src/_db/schema/SmartRotomBugHunt.ts)** - Bug hunting events
  - `bughunt_event_data` - Event configuration and rewards
  - `bug_reports` - Submitted bugs with verification status
  - `bug_report_comments` - Discussion threads on reports

## Migration Strategy

### Phase 1: Dual-Write (Current)
- Old millionaire tables remain functional
- New code can use `rotom_events` for new sessions
- `millionaireSessions.migratedToEventId` links old to new

### Phase 2: Data Migration (Future)
```sql
-- Example migration query to move existing sessions to events
INSERT INTO rotom_events (event_code, event_type, conductor_uuid, status, created_at)
SELECT session_code, 'MILLIONAIRE', conductor_uuid, status, created_at
FROM rotom_millionaire_sessions
WHERE migrated_to_event_id IS NULL;

-- Update old sessions with new event IDs
UPDATE rotom_millionaire_sessions ms
JOIN rotom_events e ON e.event_code = ms.session_code
SET ms.migrated_to_event_id = e.id
WHERE ms.migrated_to_event_id IS NULL;
```

### Phase 3: Deprecation
- Remove old millionaire-specific tables after full migration
- Keep only event-based system

## Usage Examples

### Creating a New Event
```typescript
// Create a millionaire event
const event = await db.insert(rotomEvents).values({
  eventCode: 'ABC123',
  eventType: 'MILLIONAIRE',
  title: 'Weekly Trivia Night',
  conductorUuid: hostUuid,
  status: 'WAITING'
});

// Add millionaire-specific data
await db.insert(millionaireEventData).values({
  eventId: event.id,
  currentQuestion: 0,
  prizePool: 1000000
});
```

### Creating a Tournament
```typescript
const event = await db.insert(rotomEvents).values({
  eventCode: 'TOUR01',
  eventType: 'TOURNAMENT',
  title: 'Summer Battle Tournament',
  conductorUuid: organizerUuid,
  maxParticipants: 16
});

await db.insert(tournamentEventData).values({
  eventId: event.id,
  tournamentFormat: 'SINGLE_ELIMINATION',
  battleFormat: 'OU'
});
```

## Benefits

1. **Unified Discovery**: All events in one table, easy to list/filter
2. **Shared Infrastructure**: Common participant, state, and reward systems
3. **Type Safety**: Event-specific data in dedicated tables
4. **Scalable**: Add new event types without touching core tables
5. **Backwards Compatible**: Legacy code continues to work during migration

## Next Steps

1. Generate Drizzle migration: `pnpm drizzle-kit generate`
2. Review and run migration: `pnpm drizzle-kit migrate`
3. Update millionaire service/repository to use new tables
4. Implement tournament/building/bughunt services
5. Create admin UI for event management
