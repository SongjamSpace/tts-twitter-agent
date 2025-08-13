# Twitter Bot Node

A Node.js application for analyzing Twitter Spaces and creating automated tweets.

## API Endpoints

### Analyze Songjam Mentions

**Endpoint:** `POST /api/analyze-songjam-mentions`

**Description:** Analyzes a given space's transcript for mentions of "Songjam" or "sang" and returns statistics about mentions and which speakers mentioned them.

**Request Body:**

```json
{
  "spaceId": "string"
}
```

**Response:**

```json
{
  "spaceId": "string",
  "spaceTitle": "string",
  "analysis": {
    "noOfMentions": 5,
    "breakdown": {
      "songjam": 3,
      "sang": 2
    },
    "speakerMentions": [
      {
        "username": "@speaker1",
        "count": 2
      },
      {
        "username": "@speaker2",
        "count": 1
      }
    ],
    "allSpeakers": [
      {
        "username": "@speaker1",
        "name": "Speaker Name",
        "type": "admin"
      }
    ],
    "transcriptLength": 15000,
    "analysisMethod": "grok_ai_analysis" // or "keyword_matching_only" if no mentions found
  }
}
```

**Features:**

- Efficient two-step analysis: quick keyword check followed by AI analysis only when mentions are found
- Fast initial scan for "Songjam" and "sang" mentions using regex matching
- Uses Grok AI for accurate speaker attribution only when keywords are detected
- Provides total mention counts and breakdown by keyword type
- Identifies which specific speakers mentioned the keywords with precise counts
- Returns comprehensive analysis including all speakers in the space
- Optimized for performance - avoids unnecessary AI calls when no mentions exist

**Error Responses:**

- `400`: Missing spaceId
- `404`: Space or transcript not found
- `500`: Internal server error

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env`:

```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
X_GROK_API_KEY=your_grok_api_key
PORT=8080
```

3. Run the application:

```bash
npm run dev
```

The server will start on port 8080 (or the port specified in your environment variables).
