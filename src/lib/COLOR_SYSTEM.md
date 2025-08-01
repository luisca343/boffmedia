# Pokemon Color System

A standardized color system for Pokemon statistics and UI components across the application.

## Overview

The `pokemonColors.ts` utility provides consistent color schemes for:
- Individual Pokemon stat values (0-255 range)
- Total base stat values (300-700+ range)
- Pokemon-specific stat colors (HP, Attack, Defense, etc.)
- Automatic contrast text color calculation

## Color Ranges

### Individual Stats (0-255)
- **Very Low (0-49)**: `#ff4d4d` - Deep Red
- **Low (50-74)**: `#ff7c4d` - Orange-Red
- **Below Average (75-89)**: `#ffb14d` - Orange
- **Average (90-109)**: `#ffea4d` - Yellow
- **Above Average (110-129)**: `#b1ff4d` - Lime Green
- **High (130-149)**: `#4dffa6` - Teal
- **Very High (150+)**: `#4d8aff` - Blue

### Total Stats (BST)
- **Very Low (0-299)**: `#ff4d4d` - Base muy baja
- **Low (300-399)**: `#ff7c4d` - Base baja
- **Below Average (400-499)**: `#ffb14d` - Base media
- **Average (500-539)**: `#ffea4d` - Base media
- **Above Average (540-579)**: `#b1ff4d` - Base alta
- **High (580-619)**: `#4dffa6` - Base muy alta
- **Very High (620+)**: `#4d8aff` - Base legendaria

### Pokemon Stat Colors
- **HP**: `#ff6b6b` - Red
- **Attack**: `#ff8c42` - Orange
- **Defense**: `#ffd93d` - Yellow
- **Special Attack**: `#6bcf7f` - Green
- **Special Defense**: `#4dabf7` - Blue
- **Speed**: `#9775fa` - Purple

## Usage

### Basic Functions

```typescript
import { 
  getStatColor, 
  getTotalStatColor, 
  getPokemonStatColor,
  getContrastingTextColor,
  statToPercentage
} from '@/lib/pokemonColors';

// Get color for individual stat
const attackColor = getStatColor(120); // Returns '#b1ff4d' (Above Average)

// Get color for total stats
const totalColor = getTotalStatColor(580); // Returns '#4dffa6' (High)

// Get Pokemon-specific stat color
const hpColor = getPokemonStatColor('hp'); // Returns '#ff6b6b'

// Get contrasting text color
const textColor = getContrastingTextColor('#ff4d4d'); // Returns '#ffffff'

// Convert stat to percentage
const percentage = statToPercentage(127); // Returns 49.8 (127/255 * 100)
```

### In Components

#### StatsTable Component
```typescript
// Color the stat bar
<div
  style={{
    backgroundColor: getStatColor(statValue),
    color: getContrastingTextColor(getStatColor(statValue))
  }}
>
  {statValue}
</div>

// Color the total stats badge
<div
  style={{
    backgroundColor: getTotalStatColor(statTotal),
    color: getContrastingTextColor(getTotalStatColor(statTotal))
  }}
>
  Total: {statTotal}
</div>
```

#### PokemonStatsCard Component
```typescript
// Color progress bars by stat type
<div
  style={{
    backgroundColor: getPokemonStatColor('attack'),
    width: `${statToPercentage(attackValue)}%`
  }}
/>
```

## Migration Guide

### From Old StatsTable
Replace these functions:
```typescript
// Old
function getStatColor(stat: number): string { ... }
function getTotalColor(total: number): string { ... }

// New
import { getStatColor, getTotalStatColor } from '@/lib/pokemonColors';
```

### From Old PokemonStatsCard
Replace hardcoded colors:
```typescript
// Old
{ label: "PS", value: stats.hp, color: "bg-red-500" }

// New
{ label: "PS", value: stats.hp, key: "hp" }
const color = getPokemonStatColor(stat.key);
```

## Benefits

1. **Consistency**: Same colors across all components
2. **Maintainability**: Single source of truth for colors
3. **Accessibility**: Automatic contrast calculation
4. **Flexibility**: Easy to modify ranges and colors
5. **Type Safety**: Full TypeScript support
6. **Localization**: Built-in Spanish descriptions

## Components Using This System

- `StatsTable.tsx` - Pokedex stat display table
- `PokemonStatsCard.tsx` - FicusAI chat Pokemon stats
- Any future Pokemon stat visualizations

## Customization

To modify color ranges, edit the arrays in `pokemonColors.ts`:
- `STAT_COLOR_RANGES` - Individual stat colors
- `TOTAL_STAT_COLOR_RANGES` - Total stat colors  
- `POKEMON_STAT_COLORS` - Pokemon-specific colors

The system automatically handles edge cases and provides fallbacks for unknown values.
