# Leaderboard Components

This directory contains standardized leaderboard components that can be used across different parts of the application, specifically in `/eventos/[id]` and `/clasificacion` pages.

## Components

### `LeaderboardCard`
A standardized card component for displaying individual player rankings.

**Props:**
- `player`: BaseLeaderboardEntry - Player data
- `rank`: number | string - Player's rank/position
- `totalScore`: number (optional) - Custom score to display
- `showDetailedBreakdown`: boolean - Show detailed score breakdown
- `useProfileImage`: boolean - Use ProfileImage component vs Avatar
- `scoreType`: 'total' | 'medal' | 'achievement' - Type of score display
- `customScoreLabel`: string (optional) - Custom label for score

### `LeaderboardList`
A component that renders a list of LeaderboardCard components with empty state handling.

**Props:**
- `players`: BaseLeaderboardEntry[] - Array of players
- `getRank`: function (optional) - Custom rank calculation
- `calculateTotalScore`: function (optional) - Custom score calculation
- `showDetailedBreakdown`: boolean - Show detailed score breakdown
- `useProfileImage`: boolean - Use ProfileImage component vs Avatar
- `emptyState*`: Various props for customizing empty state
- `scoreType`: 'total' | 'medal' | 'achievement' - Type of score display
- `maxItems`: number (optional) - Limit number of items displayed

### `LeaderboardEmptyState`
A reusable empty state component for leaderboards.

**Props:**
- `title`: string (optional) - Custom title
- `description`: string (optional) - Custom description
- `searchTerm`: string (optional) - Current search term
- `onClearSearch`: function (optional) - Clear search callback
- `icon`: 'trophy' | 'medal' | 'award' - Icon type

## Types

### `BaseLeaderboardEntry`
Standardized interface that all leaderboard data must conform to:

```typescript
interface BaseLeaderboardEntry {
  userId: number
  nickname: string
  achievementPoints: number
  medalPoints: number
  totalPoints: number
  achievementCount: number
  medalCount: number
  avatar?: string
}
```

## Helper Functions

### `normalizeLeaderboardEntry(entry: LeaderboardEntry): BaseLeaderboardEntry`
Converts a LeaderboardEntry from `@/types/events` to BaseLeaderboardEntry.

### `normalizeEventosLeaderboardEntry(entry: any): BaseLeaderboardEntry`
Converts an eventos page leaderboard entry (which includes avatar) to BaseLeaderboardEntry.

## Usage Examples

### Basic Usage (eventos page)
```tsx
import { LeaderboardList, normalizeEventosLeaderboardEntry } from "@/components/leaderboard"

const normalizedData = leaderboard.map(normalizeEventosLeaderboardEntry)

<LeaderboardList
  players={normalizedData}
  useProfileImage={false}
  maxItems={10}
/>
```

### Advanced Usage (clasificacion page)
```tsx
import { LeaderboardList, normalizeLeaderboardEntry } from "@/components/leaderboard"

const normalizedPlayers = currentPlayers.map(normalizeLeaderboardEntry)

<LeaderboardList
  players={normalizedPlayers}
  getRank={customRankFunction}
  calculateTotalScore={customScoreFunction}
  showDetailedBreakdown={true}
  scoreType="medal"
  emptyStateTitle="No medals yet"
  searchTerm={searchTerm}
  onClearSearch={() => setSearchTerm('')}
/>
```

## Features

- **Consistent Styling**: All leaderboard displays use the same card design with proper gradients and hover effects
- **Flexible Ranking**: Support for crown/medal/award icons for top 3 positions
- **Score Type Display**: Different display modes for total points, medal counts, and achievement counts
- **Avatar Support**: Can use either ProfileImage component or fallback Avatar
- **Empty States**: Customizable empty states with search clearing
- **Type Safety**: Full TypeScript support with proper type normalization

## Migration

When migrating existing leaderboard displays:

1. Import the new components: `import { LeaderboardList, normalizeLeaderboardEntry } from "@/components/leaderboard"`
2. Normalize your data using the appropriate helper function
3. Replace table/custom rendering with `<LeaderboardList>`
4. Configure props based on your specific needs (scoreType, useProfileImage, etc.)
5. Remove old component code
