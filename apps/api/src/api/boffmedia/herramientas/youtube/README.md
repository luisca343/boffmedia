# YouTube API Module

This module provides YouTube video transcription and information retrieval functionality using `youtubei.js`.

## File Structure

Following the wingull pattern:

```
youtube/
├── youtube.controller.ts          # Controller with API endpoints
├── youtube.facade.service.ts      # Facade service orchestrating domain services
├── youtube.module.ts              # NestJS module definition
└── services/
    └── transcription.service.ts   # Domain service for transcription logic
```

## Endpoints

### 1. Get Transcription
- **Endpoint**: `GET /boffmedia/herramientas/youtube/transcription/:videoId`
- **Description**: Retrieves the transcription/subtitles from a YouTube video
- **Parameters**: 
  - `videoId`: YouTube video ID or full URL (e.g., `dQw4w9WgXcQ`)
- **Response**:
  ```json
  {
    "success": true,
    "videoId": "dQw4w9WgXcQ",
    "title": "Video Title",
    "author": "Channel Name",
    "duration": 213,
    "transcript": [
      {
        "text": "Transcript text",
        "startMs": "0",
        "endMs": "5000",
        "startTime": "0:00",
        "endTime": "0:05"
      }
    ]
  }
  ```

### 2. Get Video Info
- **Endpoint**: `GET /boffmedia/herramientas/youtube/video-info/:videoId`
- **Description**: Retrieves basic information about a YouTube video
- **Parameters**: 
  - `videoId`: YouTube video ID or full URL
- **Response**:
  ```json
  {
    "success": true,
    "videoId": "dQw4w9WgXcQ",
    "title": "Video Title",
    "author": "Channel Name",
    "duration": 213,
    "description": "Video description...",
    "viewCount": "1000000",
    "uploadDate": "2021-01-01",
    "thumbnails": [...]
  }
  ```

## Architecture

### Controller Layer (`youtube.controller.ts`)
- Handles HTTP requests and responses
- Uses NestJS decorators for routing and documentation
- Delegates business logic to facade service

### Facade Layer (`youtube.facade.service.ts`)
- Orchestrates calls to domain services
- Handles high-level error management
- Provides a simplified interface for the controller

### Domain Layer (`services/transcription.service.ts`)
- Contains the core business logic
- Manages YouTube API client initialization
- Handles video ID extraction from URLs
- Formats timestamps and retrieves transcriptions

## Dependencies

- `youtubei.js` (v16.0.1): YouTube API wrapper
- `@nestjs/common`: NestJS core functionality
- `@nestjs/swagger`: API documentation

## Usage Example

```typescript
// Import the module in your app.module.ts
import { YoutubeModule } from '@api/boffmedia/herramientas/youtube/youtube.module';

@Module({
  imports: [
    // ... other modules
    YoutubeModule,
  ],
})
export class AppModule {}
```

Then you can access the endpoints:
- `http://localhost:3000/boffmedia/herramientas/youtube/transcription/dQw4w9WgXcQ`
- `http://localhost:3000/boffmedia/herramientas/youtube/video-info/dQw4w9WgXcQ`
