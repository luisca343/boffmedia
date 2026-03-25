# FicusAI Chat Component

A modern, modular chat interface for the FicusAI virtual assistant with improved visuals and reusable components.

## Components Structure

### Main Component
- **`FicusAI.tsx`** - Main chat container component that orchestrates the entire chat experience

### Custom Hook
- **`useFicusChat.ts`** - Custom hook that manages chat state, message handling, and API interactions

### UI Components
- **`ChatHeader.tsx`** - Header with bot avatar and branding
- **`ChatMessages.tsx`** - Scrollable message container with auto-scroll
- **`ChatInput.tsx`** - Input field with send button and keyboard shortcuts
- **`MessageBubble.tsx`** - Individual message bubble with sender styling

### Content Components
- **`PokemonStatsCard.tsx`** - Displays Pokemon statistics with progress bars using standardized colors
- **`PokemonMovesCard.tsx`** - Shows Pokemon moves organized by type
- **`BiomeListCard.tsx`** - Lists biomes with styled badges

### Types
- **`types.ts`** - TypeScript type definitions for messages and Pokemon data

### Color System Integration
The components use the standardized Pokemon color system from `@/lib/pokemonColors` for consistent stat visualization across the application.

## Features

### Visual Improvements
- **Modern Design**: Gradient backgrounds, improved shadows, and better spacing
- **Message Bubbles**: Chat-style bubbles with avatars and proper alignment
- **Responsive Layout**: Works well on different screen sizes
- **Enhanced Cards**: Better visual presentation for Pokemon stats and moves
- **Typing Animation**: Smooth character-by-character text animation
- **Loading States**: Visual feedback during message sending

### User Experience
- **Keyboard Shortcuts**: Press Enter to send messages
- **Auto-scroll**: Messages automatically scroll into view
- **Input Validation**: Prevents sending empty messages
- **Disabled States**: Input disabled while typing animation is active
- **Error Handling**: Graceful error handling for API failures

### Technical Improvements
- **Modular Architecture**: Each component has a single responsibility
- **Type Safety**: Full TypeScript support with proper type definitions
- **Reusable Components**: Components can be easily reused or extended
- **Clean Code**: Better separation of concerns and maintainability

## Usage

```tsx
import { FicusAI } from '@/components/smartrotom/ficusai';

export default function MyPage() {
  return (
    <div className="h-screen">
      <FicusAI />
    </div>
  );
}
```

## Component Props

### ChatInput
- `value: string` - Current input value
- `onChange: (value: string) => void` - Input change handler
- `onSend: () => void` - Send message handler
- `disabled?: boolean` - Disable input during loading

### MessageBubble
- `message: Mensaje` - Message object with sender and parts
- `isTyping?: boolean` - Show typing animation

### PokemonStatsCard
- `stats: PokemonStats` - Pokemon statistics data

### PokemonMovesCard
- `moves: Record<string, any>` - Pokemon moves organized by type

### BiomeListCard
- `biomes: string[]` - Array of biome names

## Custom Hook

### useFicusChat
Returns an object with:
- `messages: Mensaje[]` - Array of chat messages
- `isTyping: boolean` - Whether the bot is currently typing
- `isLoading: boolean` - Whether initial messages are loading
- `sendMessage: (text: string) => Promise<void>` - Function to send a message
- `canSend: boolean` - Whether a message can be sent (not typing/loading)

## Styling

The component uses Tailwind CSS with a custom surface color palette:
- `surface-900` to `surface-50` for backgrounds and text
- `primary-600` for user messages and accents
- `green-600` for bot messages
- Gradient backgrounds for visual appeal

## Animation

- **Typing Effect**: Character-by-character text animation at 20ms intervals
- **Smooth Scrolling**: Auto-scroll with smooth behavior
- **Loading Dots**: Animated dots during bot response
- **Hover Effects**: Interactive feedback on buttons and cards
