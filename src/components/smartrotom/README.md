# Shared Component System

This directory contains the unified component system that is shared between YouTube and Twitch applications while maintaining platform-specific branding and functionality.

## Architecture Overview

### 1. **Shared Base Components** (`/shared/`)
These are platform-agnostic components that handle common functionality:

- `BaseCard.tsx` - Universal card component for videos/streams/channels
- `BaseContentGrid.tsx` - Grid layout with loading and empty states
- `BaseDetails.tsx` - Detail page layout with stats and description
- `BaseHistory.tsx` - Generic history management component
- `BaseSearch.tsx` - Search input with platform theming
- `BaseStats.tsx` - Statistics display component
- `BaseTabs.tsx` - Tab navigation component
- `LoadingSpinner.tsx` - Loading indicator with platform colors

### 2. **Platform-Specific Wrappers** (`/youtube/`, `/twitch/`)
These components wrap the base components with platform-specific logic:

- `VideoCard.tsx` - YouTube-specific video card
- `ChannelCard.tsx` - YouTube-specific channel card
- `StreamCard.tsx` - Twitch-specific stream/video/clip card
- `GameCard.tsx` - Twitch-specific game card
- `ContentGrid.tsx` - Platform-specific content grids

### 3. **Theme System** (`/themes/`)
Centralized theming that allows easy platform distinction:

```typescript
const themes = {
  youtube: {
    primary: "red-500",
    secondary: "red-600", 
    accent: "red-400",
    hover: "red-500"
  },
  twitch: {
    primary: "purple-500",
    secondary: "purple-600",
    accent: "purple-400", 
    hover: "purple-500"
  }
};
```

### 4. **Internationalization** (`/locales/`)
Shared translation keys in `common.json` that work across platforms:

- `common.search.*` - Search-related translations
- `common.loading.*` - Loading messages
- `common.history.*` - History management
- `common.content.*` - Content-related terms
- `common.actions.*` - Action buttons and controls

## Benefits

### ✅ **Code Reuse**
- Single implementation for common UI patterns
- Reduced duplication between YouTube and Twitch apps
- Easier maintenance and bug fixes

### ✅ **Consistent UX**
- Unified behavior across platforms
- Consistent animations and interactions
- Standardized layouts and spacing

### ✅ **Platform Identity**
- Maintains YouTube's red branding
- Preserves Twitch's purple identity
- Platform-specific features remain intact

### ✅ **Internationalization**
- Shared translation keys reduce duplication
- Easier to add new languages
- Consistent terminology across platforms

### ✅ **Type Safety**
- Shared TypeScript interfaces
- Platform-specific type extensions
- Compile-time validation

## Usage Examples

### Basic Card Component
```tsx
// YouTube Video Card
<BaseCard
  id="video123"
  title="Amazing Video"
  creator="Channel Name"
  platform="youtube"
  type="video"
  linkPath="youtube/video/123"
/>

// Twitch Stream Card  
<BaseCard
  id="stream456"
  title="Epic Stream"
  creator="Streamer Name"
  platform="twitch"
  type="stream"
  linkPath="twitch/stream/username"
/>
```

### Content Grid
```tsx
// YouTube
<BaseContentGrid platform="youtube" title="Trending Videos">
  {videos.map(video => <VideoCard key={video.id} {...video} />)}
</BaseContentGrid>

// Twitch
<BaseContentGrid platform="twitch" title="Live Streams">
  {streams.map(stream => <StreamCard key={stream.id} {...stream} />)}
</BaseContentGrid>
```

### History Component
```tsx
// YouTube History
<BaseHistory
  platform="youtube"
  getHistory={() => getYouTubeHistory()}
  clearHistory={() => clearYouTubeHistory()}
  renderItem={(video) => <VideoCard {...video} allowRemove />}
/>

// Twitch History
<BaseHistory
  platform="twitch"  
  getHistory={() => getTwitchHistory()}
  clearHistory={() => clearTwitchHistory()}
  renderItem={(item) => <StreamCard {...item} allowRemove />}
/>
```

## Migration Guide

### For Existing Components

1. **Replace loading spinners:**
   ```tsx
   // Before
   <LoadingSpinner message="Loading..." />
   
   // After  
   <LoadingSpinner platform="youtube" message="Loading..." />
   ```

2. **Update card components:**
   ```tsx
   // Before - Custom VideoCard
   <VideoCard id={video.id} title={video.title} /* ... */ />
   
   // After - BaseCard wrapper
   <BaseCard platform="youtube" type="video" /* ... */ />
   ```

3. **Migrate translations:**
   ```tsx
   // Before
   const t = useTranslations("youtube");
   t("search.placeholder")
   
   // After - Use shared keys where possible
   const t = useTranslations("common");
   t("search.placeholder")
   ```

### Adding New Platforms

1. Add platform theme to `themes/index.ts`
2. Create platform-specific wrapper components
3. Add platform-specific translations
4. Extend base components as needed

## File Structure

```
src/components/smartrotom/
├── shared/           # Platform-agnostic base components
│   ├── BaseCard.tsx
│   ├── BaseContentGrid.tsx
│   ├── BaseDetails.tsx
│   ├── BaseHistory.tsx
│   ├── BaseSearch.tsx
│   ├── BaseStats.tsx
│   ├── BaseTabs.tsx
│   ├── LoadingSpinner.tsx
│   └── index.ts
├── themes/           # Centralized theming
│   └── index.ts
├── youtube/          # YouTube-specific wrappers
│   ├── VideoCard.tsx
│   ├── ChannelCard.tsx
│   └── VideoGrid.tsx
└── twitch/           # Twitch-specific wrappers
    ├── StreamCard.tsx
    ├── GameCard.tsx
    └── ContentGrid.tsx
```

## Future Enhancements

- **Dark/Light Mode**: Extend theme system for multiple color schemes
- **Mobile Responsiveness**: Add responsive breakpoint management
- **Accessibility**: Enhance ARIA support and keyboard navigation
- **Performance**: Add virtualization for large lists
- **Analytics**: Integrate tracking for shared components
