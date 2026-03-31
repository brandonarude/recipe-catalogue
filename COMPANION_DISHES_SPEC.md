---
  Feature Spec: Recipe Companion Dish Chat

  Overview

  A contextual AI chat assistant accessible from the recipe detail page. It recommends companion dishes from the app's
  recipe database, using flavour and cuisine pairing logic. Recommendations link directly to matching recipes. The chat
  is ephemeral — persisted in React state while the page is open.

  ---
  UI/UX

  Floating Action Button (FAB)

  - Fixed position, bottom-right corner of the screen on the recipe detail page
  - Icon: MessageCircle (lucide-react), with a label "Suggest Pairings" or tooltip on hover
  - On mobile, the FAB sits above the bottom navigation bar
  - Built with shadcn/ui Button — no additional package needed; the Sheet component handles the panel cleanly without
  introducing new dependencies

  Chat Panel

  - Opens as a Sheet (shadcn/ui) anchored to the right on desktop, sliding up from the bottom on mobile
  - Desktop width: ~400px; full-width on mobile
  - Header: recipe title + a large, clearly labelled "Close" button (X icon + "Close" text) in the top-right
  - Panel is scrollable; input stays pinned to the bottom

  Initial State

  Two quick-action buttons displayed above the text input when the chat is empty:

  ┌──────────────────────────┬───────────────────────────────────────────────────┐
  │          Button          │                    Prompt sent                    │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Suggest a companion dish │ "What dishes would pair well with [recipe name]?" │
  ├──────────────────────────┼───────────────────────────────────────────────────┤
  │ Suggest a drink          │ "What drinks would pair well with [recipe name]?" │
  └──────────────────────────┴───────────────────────────────────────────────────┘

  Below the quick-action buttons: a free-text input with a send button.

  Message Display

  - User messages: right-aligned, accent background
  - Assistant messages: left-aligned, muted background
  - Recommended recipes rendered as inline links (e.g. "/recipes/abc123") using Next.js <Link>
  - If a recommendation has no matching recipe: rendered as plain text with a note — e.g. "Caesar Salad (no recipe in
  your collection — you may want to search for one)"
  - Loading state: typing indicator (three animated dots) while awaiting response

  ---
  Data Flow

  Context Injection (no RAG needed)

  On chat open, the API fetches all recipes from the database (id, name, description, tags, main ingredients) and
  injects them into the system prompt. This is sufficient for the expected dataset size.

  System Prompt Design

  You are a culinary assistant helping users of a family recipe app find companion dishes.

  The user is currently viewing: [Recipe Name]
  [Optional: brief description/tags of the current recipe]

  The following recipes are available in the user's collection:
  [id: abc123] Garlic Bread — Tags: Italian, Side. Ingredients: bread, butter, garlic.
  [id: def456] Caesar Salad — Tags: Salad, Side. Ingredients: romaine, parmesan, croutons.
  ... (all recipes)

  Rules:
  - Recommend up to 3 companion dishes from the list above when relevant.
  - Format recipe recommendations as: **Recipe Name** [id:abc123]
  - If a good pairing exists but is not in the collection, recommend it anyway and note it is not available in the
  collection.
  - Base recommendations on flavour and cuisine pairings unless the user specifies dietary needs.
  - Support follow-up clarifications naturally.

  The API route replaces [id:abc123] markers with actual /recipes/[id] links before returning the response to the
  client.

  API Route

  POST /api/chat/recipe-companion-dish

  Request body:
  {
    "recipeId": "...",
    "messages": [{ "role": "user", "content": "..." }]
  }

  - Fetches current recipe + all recipes from Prisma
  - Builds system prompt
  - Calls Claude API (streaming optional)
  - Returns assistant message with recipe IDs resolved to links

  ---
  Model

  claude-haiku-4-5-20251001 — lowest cost, fast enough for conversational use, accurate for culinary reasoning. Fits the
   requirement: not speed-critical, but accurate.

  ---
  Implementation Plan

  New files

  ┌───────────────────────────────────────────────┬───────────────────────────────────────┐
  │                     File                      │                Purpose                │
  ├───────────────────────────────────────────────┼───────────────────────────────────────┤
  │ src/app/api/chat/recipe-companion-dish/route.ts    │ API route                             │
  ├───────────────────────────────────────────────┼───────────────────────────────────────┤
  │ src/components/recipes/companion-dish-chat.tsx     │ Chat panel (Sheet + messages + input) │
  ├───────────────────────────────────────────────┼───────────────────────────────────────┤
  │ src/components/recipes/companion-dish-chat-fab.tsx │ FAB button                            │
  └───────────────────────────────────────────────┴───────────────────────────────────────┘

  Modified files

  ┌──────────────────────────────────────┬─────────────────────────────────────────────┐
  │                 File                 │                   Change                    │
  ├──────────────────────────────────────┼─────────────────────────────────────────────┤
  │ src/app/(main)/recipes/[id]/page.tsx │ Mount FAB + chat panel, pass recipe context │
  └──────────────────────────────────────┴─────────────────────────────────────────────┘

  Dependencies to add

  - @anthropic-ai/sdk — Claude API client

  ---
  Out of Scope

  - Persisting chat history across page loads or sessions
  - User dietary profile integration (user can specify in chat if needed)
  - Streaming responses (standard request/response is sufficient)
  - Admin controls over the assistant