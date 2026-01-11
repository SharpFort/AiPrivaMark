# SmartBookmark Project Analysis

This document provides a detailed analysis of the `SmartBookmark` project to serve as a reference for `AiPrivaMark` development.

## 1. File Functionality Analysis

### Core Logic
*   **`api.js`**: Handles all AI interactions.
    *   `getEmbedding(text)`: Calls specific embedding API endpoint.
    *   `getChatCompletion(systemPrompt, userPrompt)`: Generic chat completion wrapper.
    *   `generateTags(pageContent, tab)`: Uses specific prompts to generate 5-8 tags, filters by length and regex.
    *   `generateExcerpt(pageContent, tab)`: Generates ~100 word summary.
    *   `makeEmbeddingText`: Prepares text for embedding (title + keywords + excerpt).
*   **`config.js`**: Central configuration management.
    *   Defines `API_SERVICES` (OpenAI, SiliconFlow, Aliyun, etc.) with metadata (pricing URL, model names).
    *   `ConfigManager` class: Manages active service, API keys, and service-specific settings.
    *   Supports distinct services for Chat vs Embedding tasks.
*   **`background.js`**: Extension background service worker.
    *   Initializes all managers (`SettingsManager`, `StorageManager`, etc.).
    *   Handles extension lifecycle events (install, update).
    *   Manages context menus and side panel behavior.
    *   Listeners for tab activation, URL updates, and omnibox input.
*   **`contentScript.js`**: Runs in the context of web pages.
    *   `extractContent()`: Uses `Readability` library to parse article content.
    *   `extractMetadata()`: Scrapes `<meta>` tags (keywords, description) and JSON-LD schema.
    *   `fallbackExtraction()`: Simple DOM stripping if Readability fails.
    *   Communicates with background script via message passing.

### Data & State Management
*   **`storageManager.js` (`LocalStorageMgr`)**:
    *   Wrapper around `chrome.storage.local`.
    *   Implements caching (`_bookmarksCache`) to reduce I/O.
    *   `_debouncedUpdateBookmarks`: Batches write operations.
    *   Manages bookmarks, tags, and cached embeddings.
*   **`settingsManager.js`**:
    *   Wrapper around `chrome.storage.sync` for user preferences.
    *   Handles default settings merging (`deepMerge`).
    *   Manages UI preferences (theme, display modes).
*   **`models.js`**:
    *   Defines `UnifiedBookmark` class to normalize data from different sources (Chrome native vs Extension managed).
*   **`requestManager.js`**:
    *   Global request controller using `AbortController`.
    *   Allows cancelling pending AI requests when closing UI or switching tasks.

### Features & UI Components
*   **`popup.js`**: Main entry point for the popup UI.
    *   Orchestrates `BookmarkManager` (for managing the list) and `SyncStatusDialog`.
    *   Handles keyboard shortcuts (`Ctrl+B`, `Ctrl+K`).
    *   Manages UI state (Save/Processing mode).
*   **`quickSave.js`**: Logic for the "Quick Save" popup.
    *   Handles tag management (add/remove/recommend).
    *   Editable summary and title.
    *   Immediate validation of URL and API keys.
*   **`search.js`**: Advanced search implementation.
    *   Vector search logic using Cosine Similarity.
    *   Hybrid search (keyword + semantic).
    *   `SearchHistoryManager` for caching recent queries.
*   **`filterManager.js`**:
    *   Abstract `BookmarkFilter` base class.
    *   `TagFilter`: Filters bookmarks by generated tags.
    *   `CustomTagFilter`: Allows complex rule-based filtering (e.g., "contains keyword X").
*   **`util.js`**: Huge collection of utility functions.
    *   `smartTruncate`: Text truncation preserving readability.
    *   `checkUrlAccessibility`: Validates URLs.
    *   `containsPrivateContent`: Privacy protection logic (blocks localhost, internal IPs).
    *   `getFaviconUrl`: Retrieves high-quality favicons.

---

## 2. Project Highlights (for Reference)

### A. Configuration & Provider Management (`config.js`)
*   **Granular Service Control**: Separates "Chat Service" from "Embedding Service". A user can use OpenAI for Chat and a cheaper provider for Embeddings.
*   **Rich Provider Metadata**: Each provider entry in `API_SERVICES` includes:
    *   `getKeyUrl`: Direct link to get API Key.
    *   `pricingUrl`: Link to pricing.
    *   `recommendTags`: Helpers like "Free Model", "Stable".
    *   `defaultEmbedModel`: Specific default model for that provider.
*   **Smart Defaults**: `AppConfig` automatically manages defaults and validation.

### B. Robust Content Extraction (`contentScript.js`)
*   **Three-Layer Strategy**:
    1.  **Readability**: Best for articles/blogs.
    2.  **Schema.org/Meta**: Uses `application/ld+json` and meta tags for structured data.
    3.  **Fallback**: Raw DOM text cleaning for non-standard pages.
*   **Clean Output**: `cleanContent` regex helpers remove excess whitespace/newlines before AI processing to save tokens.

### C. AI Processing & Prompts (`api.js`)
*   **Task-Specific Prompts**:
    *   **Tags**: Explicit instructions for tag count (5-8), length (2-20 chars), and forbidden characters.
    *   **Excerpt**: Explicit constraint "100 words", "objective tone", "no self-reference".
*   **Pre-processing**: `makeEmbeddingText` combines title, tags, and description intelligently to create a rich context for vectorization.
*   **Error Handling**: Detailed parsing of different provider error formats.

### D. User Experience (UX)
*   **Request Cancellation**: `requestManager.js` ensures that closing a popup immediately cancels expensive AI API calls.
*   **Privacy Mode**: `util.js` has logic to detect "Private" URLs (localhost, internal IPs, banking sites) and warns/blocks AI processing automatically.
*   **Omnibox Integration**: Search directly from the browser address bar (`L` + Space).
*   **UI Managers**: The project splits UI logic into dedicated managers (`BookmarkEditManager`, `FilterManager`) to keep `popup.js` cleaner.

### E. Data Handling
*   **Unified Model**: `UnifiedBookmark` class ensures that whether a bookmark comes from Chrome or the extension, it has a consistent interface for the UI.
*   **Debounced Storage**: Prevents hitting Chrome storage write limits during bulk operations.

## 3. Recommendations for AiPrivaMark

1.  **Adopt the `API_SERVICES` structure**: Add metadata like `getKeyUrl` and `pricingUrl` to our service cards for better UX. (Reference: `config.js`)
2.  **Enhance Content Extraction**: Integrate the `Readability` + `Metadata` + `Fallback` strategy into our `extractContentInBg`. (Reference: `contentScript.js`)
3.  **Refine Systems Prompts**: Copy the specific constraints (100 words, objective tone) to improve our summary quality. (Reference: `api.js`)
4.  **Implement Request Cancellation**: Use `AbortController` in our `AIService` to prevent zombie requests. (Reference: `requestManager.js`)
5.  **Smart Provider Logic**: We started this with `getEffectiveProvider`, but can expand it to support separate Chat/Embedding providers if needed later.
