# Recipe Catalogue — Project Specification

## Overview

A mobile-first web application for a family (~8 users) to collaboratively browse, rate, tag, favorite, and enter recipes from a shared pool. Supports recipe import from URLs, auto-generated shopping lists, and weekly meal planning.

---

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Framework    | Next.js (App Router, SSR)         |
| Language     | TypeScript                        |
| UI           | React (mobile-first responsive)   |
| Database     | PostgreSQL                        |
| ORM          | Prisma                            |
| Auth         | Email magic links (custom or next-auth) |
| File Storage | AWS S3 (recipe photos)            |
| Deployment   | Cloud provider (TBD)              |

---

## Data Model

### Users

| Field      | Type     | Notes                              |
| ---------- | -------- | ---------------------------------- |
| id         | UUID     | Primary key                        |
| email      | String   | Unique, used for magic link auth   |
| name       | String   | Display name                       |
| role       | Enum     | `ADMIN` or `USER`                  |
| createdAt  | DateTime |                                    |
| updatedAt  | DateTime |                                    |

### Recipes

| Field        | Type     | Notes                                        |
| ------------ | -------- | -------------------------------------------- |
| id           | UUID     | Primary key                                  |
| title        | String   | Required                                     |
| description  | Text     | Optional summary                             |
| steps        | Text     | Preparation instructions (stored as JSON array of steps) |
| prepTime     | Int      | Minutes                                      |
| cookTime     | Int      | Minutes                                      |
| servings     | Int      |                                               |
| notes        | Text     | Additional notes from the author             |
| sourceUrl    | String   | Original URL if imported                     |
| createdById  | UUID     | FK → Users                                   |
| createdAt    | DateTime |                                               |
| updatedAt    | DateTime |                                               |

### Ingredients

A normalized table for deduplication across recipes and shopping list aggregation.

| Field    | Type   | Notes                                                  |
| -------- | ------ | ------------------------------------------------------ |
| id       | UUID   | Primary key                                            |
| name     | String | Unique, canonical lowercase name for matching          |
| category | Enum   | `PRODUCE`, `DAIRY`, `MEAT`, `SEAFOOD`, `BAKERY`, `PANTRY`, `FROZEN`, `BEVERAGES`, `CONDIMENTS`, `SPICES`, `OTHER` |

### RecipeIngredients (join table)

| Field        | Type   | Notes                                      |
| ------------ | ------ | ------------------------------------------ |
| id           | UUID   | Primary key                                |
| recipeId     | UUID   | FK → Recipes                               |
| ingredientId | UUID   | FK → Ingredients                           |
| quantity     | Float  | Nullable (e.g., "salt to taste")           |
| unit         | String | Nullable (e.g., "cups", "tbsp", "lbs")    |
| preparation  | String | Optional (e.g., "diced", "minced")         |

### Tags

Free-form, user-created. Stored lowercase for matching, displayed with Title Case.

| Field | Type   | Notes                          |
| ----- | ------ | ------------------------------ |
| id    | UUID   | Primary key                    |
| name  | String | Unique, stored in lowercase    |

### RecipeTags (join table)

| Field    | Type | Notes        |
| -------- | ---- | ------------ |
| recipeId | UUID | FK → Recipes |
| tagId    | UUID | FK → Tags    |

### DietaryTags

Predefined set of dietary classifications.

| Field | Type   | Notes                                          |
| ----- | ------ | ---------------------------------------------- |
| id    | UUID   | Primary key                                    |
| name  | String | e.g., Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo |

### RecipeDietaryTags (join table)

| Field        | Type | Notes              |
| ------------ | ---- | ------------------ |
| recipeId     | UUID | FK → Recipes       |
| dietaryTagId | UUID | FK → DietaryTags   |

### RecipePhotos

| Field    | Type   | Notes                          |
| -------- | ------ | ------------------------------ |
| id       | UUID   | Primary key                    |
| recipeId | UUID   | FK → Recipes                   |
| url      | String | S3 URL                         |
| order    | Int    | Display order                  |

### Ratings

Per-user, 5-star system.

| Field    | Type | Notes                   |
| -------- | ---- | ----------------------- |
| id       | UUID | Primary key             |
| recipeId | UUID | FK → Recipes            |
| userId   | UUID | FK → Users              |
| score    | Int  | 1–5                     |
| unique   |      | (recipeId, userId) pair |

### Favorites

| Field    | Type | Notes                   |
| -------- | ---- | ----------------------- |
| id       | UUID | Primary key             |
| recipeId | UUID | FK → Recipes            |
| userId   | UUID | FK → Users              |
| unique   |      | (recipeId, userId) pair |

### ShoppingList

Single active list per user, replaced when a new one is generated.

| Field     | Type     | Notes           |
| --------- | -------- | --------------- |
| id        | UUID     | Primary key     |
| userId    | UUID     | FK → Users, unique (one active list per user) |
| createdAt | DateTime |                 |

### ShoppingListItems

| Field          | Type    | Notes                               |
| -------------- | ------- | ----------------------------------- |
| id             | UUID    | Primary key                         |
| shoppingListId | UUID    | FK → ShoppingList                   |
| ingredientId   | UUID    | FK → Ingredients                    |
| quantity       | Float   | Aggregated across selected recipes  |
| unit           | String  |                                     |
| checked        | Boolean | Default false, for interactive use  |

### MealPlan

Weekly meal planning. Assigns recipes to specific days. Multiple recipes allowed per meal slot (e.g., a main dish + sides).

| Field      | Type     | Notes                                    |
| ---------- | -------- | ---------------------------------------- |
| id         | UUID     | Primary key                              |
| userId     | UUID     | FK → Users                               |
| recipeId   | UUID     | FK → Recipes                             |
| date       | Date     | The day this meal is planned for         |
| mealType   | Enum     | `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`  |
| courseType  | Enum     | `MAIN`, `SIDE`                           |
| unique     |          | (userId, date, mealType, recipeId) pair  |

---

## Features

### 1. Authentication

- **Magic link login**: User enters email → receives a link → clicks to authenticate.
- Email is the only channel needed (no password, no OAuth).
- Session managed via secure HTTP-only cookies (JWT or database sessions).
- Admin users can invite new family members by email.
- Admin users can promote/demote other users and remove accounts.

### 2. Recipe Management

#### Manual Entry (Form)
- Multi-step or single-page form with fields:
  - Title, description, steps (ordered list with add/remove/reorder)
  - Ingredients (with autocomplete against existing ingredient records)
  - Prep time, cook time, servings
  - Photos (multi-upload to S3, drag to reorder)
  - Tags (free-form input with autocomplete from existing tags, Title Case display)
  - Dietary tags (checkbox selection from predefined list)
  - Notes
- Any authenticated user can create recipes.
- Only the recipe creator or an admin can edit/delete a recipe.

#### Import from URL
- User pastes a URL.
- Backend scrapes the page for structured recipe data (JSON-LD / schema.org microdata).
- Parsed data pre-fills the recipe form for user review and editing before saving.
- Graceful fallback: if parsing fails, show the form empty with the source URL populated and a message indicating the import could not be completed.

### 3. Browsing & Search

- **Home/browse page**: displays recipe cards in a grid/list (photo, title, average rating, tags).
- **Filtered search** with the following filter options:
  - Text search (title, description, ingredient names)
  - Tags (multi-select)
  - Dietary tags (multi-select)
  - Rating (minimum star threshold)
  - Cook time (max minutes)
  - Favorites only (toggle)
- **Sort options**: newest, highest rated, cook time, alphabetical.
- Filters and sort can be combined.

### 4. Recipe Detail View

- Full recipe display: photos (carousel/gallery), title, description, ingredients list, steps, times, servings, tags, dietary tags, notes, source link.
- **Servings adjuster**: user can change serving count and ingredient quantities scale proportionally.
- Average rating displayed with count.
- User's own rating (editable inline).
- Favorite toggle button.
- "Add to meal plan" action.
- "Add to shopping list" action (adds this single recipe's ingredients).

### 5. Ratings

- Each user can rate each recipe 1–5 stars.
- A user can change their rating at any time.
- Average rating and count displayed on recipe cards and detail pages.

### 6. Favorites

- Toggle favorite on any recipe.
- "My Favorites" view (filterable subset of browse).

### 7. Tags

- Free-form text input with autocomplete populated from all existing tags.
- Tags stored lowercase, displayed as Title Case.
- Case-insensitive matching: entering "Italian" or "italian" maps to the same tag.
- Tags shown as chips/pills on recipe cards and detail pages, clickable to filter.

### 8. Shopping List

- **Generation flow**: User selects one or more recipes (from browse, favorites, or meal plan) → "Generate Shopping List."
- **Deduplication**: Ingredients shared across recipes are combined (quantities summed when units match).
- **Categorized display**: Items grouped by ingredient category (Produce, Dairy, Meat, etc.).
- **Interactive**: Checkboxes to mark items as acquired.
- **Export**: Plain text export (formatted with categories as headers). Architecture should allow adding other export formats (PDF, etc.) in the future.
- **Single active list**: Generating a new list replaces the previous one. Confirm before replacing if the current list has unchecked items.

### 9. Meal Planning

- **Weekly calendar view**: 7-day view (defaulting to current week, navigable).
- **Meal slots**: Breakfast, Lunch, Dinner, Snack for each day.
- **Multiple recipes per slot**: Each meal slot supports one main dish and multiple sides.
- **Assign recipes**: Search/browse and assign a recipe to a day + meal type, specifying whether it's a main or side.
- **Generate shopping list from meal plan**: One-click to generate a shopping list from all recipes in the current week's plan.
- **Drag-and-drop** (nice-to-have): Rearrange meals between days/slots.

### 10. User Management (Admin)

- View all users.
- Invite new users (sends magic link to email).
- Change user roles (Admin ↔ User).
- Remove users.

---

## Pages / Routes

| Route                     | Description                        | Auth     |
| ------------------------- | ---------------------------------- | -------- |
| `/`                       | Home / recipe browse with filters  | Required |
| `/login`                  | Magic link login form              | Public   |
| `/auth/verify`            | Magic link verification callback   | Public   |
| `/recipes/new`            | New recipe form                    | Required |
| `/recipes/import`         | Import recipe from URL             | Required |
| `/recipes/[id]`           | Recipe detail view                 | Required |
| `/recipes/[id]/edit`      | Edit recipe form                   | Required (owner or admin) |
| `/favorites`              | User's favorited recipes           | Required |
| `/shopping-list`          | Active shopping list               | Required |
| `/meal-plan`              | Weekly meal planner                | Required |
| `/admin/users`            | User management                    | Admin    |

---

## Non-Functional Requirements

- **Mobile-first**: Design for phone screens primarily, scale up to tablet/desktop.
- **Performance**: Recipes should load quickly; images served via S3 (consider CDN later).
- **Security**: Magic link tokens expire after 15 minutes and are single-use. All routes except login require authentication. Input sanitization on all forms. S3 uploads use presigned URLs.
- **Accessibility**: Semantic HTML, proper labels, sufficient color contrast.

---

## Out of Scope (for now)

- Email notifications (beyond magic link auth)
- AI/LLM-based recipe parsing
- Social features (comments, sharing outside the family)
- Nutritional information / calorie tracking
- Multiple active shopping lists
- Recipe versioning / edit history
- Public (unauthenticated) access to recipes
