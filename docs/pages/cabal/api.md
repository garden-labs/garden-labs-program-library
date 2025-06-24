# API

### Request Format

```
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://api.cabal.so/api/v1/feed

```

### Response Format

```json
{
  "data": {
    "insights": {
      "daily": [
        // Array of insights
        {
          "title": "string", // Headline
          "content": "string", // ~2 paragraphs in markdown format
          "tags": ["string"], // token", "business", "technology", "legal"
          "sources": [
            {
              "title": "string",
              "url": "string"
            }
          ],
          "engagement": {
            "score": "number" // Based on views, likes, and reposts
          }
        }
      ],
      "weekly": [
        // Same as daily
      ]
    }
  }
}
```
