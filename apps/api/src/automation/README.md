# Twitch Stream Automation

This module provides automated monitoring of Twitch streams with configurable notifications.

## How It Works

The system monitors **specific Twitch users** you configure and checks if their streams contain "wingull" in:
- Stream title
- Stream tags
- **OR** if the game category is exactly **"Pixelmon Wingull 2"**

Only streams that contain "wingull" content will trigger notifications.

## Setup

1. **Environment Variables**
   Add these to your `.env` file:
   ```env
   # Required for Twitch API access
   TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret
   
   # Optional: Discord webhook for notifications
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
   ```

2. **Getting Twitch Credentials**
   - Go to https://dev.twitch.tv/console/apps
   - Create a new application
   - Set OAuth Redirect URLs to `http://localhost:3000` (or your domain)
   - Copy the Client ID and generate a Client Secret

## Features

### Automatic Monitoring
- **Users**: Monitors specific Twitch usernames you configure
- **Content Filter**: Only sends notifications for streams containing "wingull" in title/tags OR streaming "Pixelmon Wingull 2"
- **Schedule**: Checks every 2 minutes for new streams
- **Notifications**: Sends alerts when monitored users go live with wingull content

### API Endpoints

#### Get Status
```http
GET /automation/twitch/status
```
Returns current monitoring status, including:
- Monitored users
- Number of cached streams
- Currently live streams with wingull content
- Configured notification targets

#### Manual Check
```http
POST /automation/twitch/check-now
```
Triggers an immediate check for new streams (bypasses the 2-minute schedule).

#### Check Specific User
```http
GET /automation/twitch/streams/user/username
```
Get current stream information for a specific user and check if it contains wingull content.

#### Debug User Stream
```http
GET /automation/twitch/debug/check-user/username
```
Debug endpoint to analyze a specific user's stream and show detailed wingull content analysis.

#### Manage Monitored Users
```http
POST /automation/twitch/monitor/user/username
DELETE /automation/twitch/monitor/user/username
```
Add or remove users from the monitoring list.

#### Manage Notification Targets
```http
POST /automation/twitch/notifications/target
DELETE /automation/twitch/notifications/target/webhook
```

Example notification target:
```json
{
  "type": "webhook",
  "config": {
    "url": "https://your-webhook-url.com",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer your-token"
    },
    "template": "discord"
  }
}
```

## Notification Types

### 1. Discord Webhook
Sends rich embeds to Discord channels:
- Stream thumbnail
- Game information
- Viewer count
- Stream tags
- Direct link to stream

### 2. Custom Webhook
Sends JSON payload to any webhook URL:
```json
{
  "message": "🔴 Username just went live!",
  "stream": {
    "id": "stream_id",
    "user_name": "Username",
    "title": "Stream Title",
    "game_name": "Game Name",
    "viewer_count": 42,
    "started_at": "2025-01-01T00:00:00Z",
    "thumbnail_url": "https://...",
    "tags": ["tag1", "tag2"]
  },
  "metadata": {
    "isLive": true,
    "isNewStream": true,
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### 3. Database Logging
Logs notifications to console (can be extended to save to database).

## Customization

### Add Monitored Users
You can add users to monitor via the API or by editing the `monitoredUsers` array in `twitch-monitor.service.ts`:
```typescript
private readonly monitoredUsers: string[] = ['username1', 'username2'];
```

### Change Search Term
To monitor for something other than "wingull", update the `streamContainsWingull` method in `twitch-monitor.service.ts`:
```typescript
private streamContainsWingull(stream: TwitchStream): boolean {
  const searchTerm = 'your-term-here'; // Change this
  // ... rest of the method
}
```

### Modify Check Frequency
Change the cron expression in `twitch-monitor.service.ts`:
```typescript
@Cron('0 */5 * * * *') // Every 5 minutes instead of 2
```

### Add Custom Notifications
Extend the `NotificationService` to add new notification types:
1. Add new target type to `NotificationTarget` interface
2. Implement the handler in `sendToTarget()` method
3. Create the formatting logic

## Example Usage

1. **Start monitoring a specific user:**
   ```bash
   curl -X POST http://localhost:34301/automation/twitch/monitor/user/pokimane
   ```

2. **Check current status:**
   ```bash
   curl http://localhost:34301/automation/twitch/status
   ```

3. **Check if a specific user is streaming wingull content:**
   ```bash
   curl http://localhost:34301/automation/twitch/debug/check-user/pokimane
   ```

4. **Trigger immediate check:**
   ```bash
   curl -X POST http://localhost:34301/automation/twitch/check-now
   ```

## Troubleshooting

1. **"Twitch credentials not configured"**
   - Ensure `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are in your `.env` file
   - Restart the application after adding environment variables

2. **No notifications received**
   - Check if notification targets are configured: `GET /automation/twitch/status`
   - Verify the webhook URL is accessible
   - Check application logs for error messages

3. **Streams not detected**
   - Verify the monitored users are actually streaming
   - Check if their streams contain "wingull" in title, tags, or game: `GET /automation/twitch/debug/check-user/username`
   - Use manual check to test: `POST /automation/twitch/check-now`

## Performance Notes

- The service only checks streams from users you specifically monitor
- Stream information is cached to avoid duplicate notifications
- Old cache entries are cleaned up automatically after 30 minutes
- API calls to Twitch are rate-limited and use OAuth tokens
- Much more efficient than scanning thousands of streams
