# Live Reviews

A full-stack real-time review application that enables users to view, create, edit, and delete reviews with live updates powered by WebSockets, REST APIs, and SQLite.

---

# Getting Started

Minimum steps and configurations needed to run the project in a local machine:

```bash
# after cloning the repo
cd backend
npm i
npm start

# new terminal
cd frontend
npm i
npm start
```

### URLs & Ports
- **Backend API & WebSocket Server**: `http://localhost:5000` (WebSocket: `ws://localhost:5000`)
- **Frontend Application**: `http://localhost:3000`

### Optional Helper Commands
- **Seed Sample Data (Backend)**:
  ```bash
  cd backend
  npm run seed
  ```
- **Run Backend Unit Tests**:
  ```bash
  cd backend
  npm test
  ```
- **Run Frontend Unit Tests**:
  ```bash
  cd frontend
  npm test
  ```
- **Build Frontend for Production**:
  ```bash
  cd frontend
  npm run build
  ```

---

# Problem Statement

### Live Reviews
Live Reviews allows users to add/edit/remove review and view all reviews with live feeding.

### Must Haves

#### Backend
- Use any DB and NodeJS framework of your choice
- Create REST APIs to perform CRUD operations of notes/reviews
- Store each review with id, title, content and date-time
- Implement web-socket, which should broadcast whenever any review is getting added/edited/deleted

#### Frontend
- Plain HTML first, decent UI that works
- Please do not use any CSS framework like bootstrap, tailwind, etc.
- You can use either React, Vue, Angular or vanilla HTML/CSS/JavaScript
- Inline styles not allowed

#### Reviews List View (Default View, route = /)
- A button to create new review - clicking on which user will be redirected to `/new` route
- Basic Table layout with all reviews
- Table should have 6 columns: `#`, `Title`, `Content`, `Date-time`, `Edit`, `Delete`
  - `#` - Static count number starting with 1
  - `Edit` - an edit button, clicking on which user will be redirected to `/:id` route
  - `Delete` - a delete button, clicking on which review will be deleted
- Show each review in separate row
- Latest review should be displayed first
- This should be a live list view with implementation of web-socket, so whenever any review is added/edited/deleted, it should immediately update the table without user needing to refresh the page

#### New Review (route = /new)
- 1 input for title
- 1 textarea for content
- Save button - saves the review, and redirects user back to list view, i.e. route `/`
- Reset button - resets the review content and title
- Cancel button - redirects user back to list view, i.e. route `/`

#### Edit Review (route = /:id)
- Re-use the same component from New Review
- Pre-fill the title and content from the existing review
- Delete button - deletes the review, and redirects user back to list view, i.e. route `/`

### Nice to have
- Highlight different live events in different colors:
  - When new review is added, highlight it with green color in table for 3 seconds
  - When any review is edited, highlight it with blue color in table for 3 seconds
  - When any review is deleted, highlight it with red color in table for 3 seconds and then it should disappear
- Once user deletes the note, either from list or from note itself, show a snackbar/toastr with success message and an undo button
  - Snackbar/toastr should be visible for 5 seconds
  - User can undo the deletion by clicking on undo button
- Unit testing
- Sorting functionality based on title and date-time in both, ascending and descending order
- Search functionality

---

# Completed

All Must Haves and all Nice to Have bonus features have been completed:

### 1. Backend Implementation
- [x] **Node.js & Express Framework**: Lightweight, clean architecture keeping 3rd-party dependencies minimal (`express`, `ws`, `cors`).
- [x] **Database & Schema**: SQLite database utilizing Node's built-in `node:sqlite` (`DatabaseSync`), requiring zero C++ compiler binaries or native compilation issues. Automatically creates table with schema `id`, `title`, `content`, and `date_time`. Includes fallback JSON persistence for compatibility across Node runtimes.
- [x] **REST APIs for CRUD Operations**:
  - `GET /api/reviews`: Returns all reviews sorted by `date_time` descending (latest first).
  - `GET /api/reviews/:id`: Returns a specific review by ID (returns 404 if not found).
  - `POST /api/reviews`: Validates title and content, creates review, broadcasts via WebSocket, and returns 201 Created.
  - `PUT /api/reviews/:id`: Validates title and content, updates review and timestamp, broadcasts via WebSocket, and returns updated review.
  - `DELETE /api/reviews/:id`: Deletes review, broadcasts via WebSocket, and returns deleted review.
- [x] **WebSocket Server & Live Broadcasting**:
  - Integrated on the HTTP server with client connection tracking and error resilience.
  - Broadcasts `REVIEW_ADDED` event when a review is created.
  - Broadcasts `REVIEW_EDITED` event when a review is updated.
  - Broadcasts `REVIEW_DELETED` event when a review is deleted.

### 2. Frontend Implementation
- [x] **No CSS Frameworks**: Built using 100% custom, semantic CSS (`index.css` and `App.css`). No Bootstrap, Tailwind, or external UI libraries used.
- [x] **Zero Inline Styles**: Completely adheres to the rule—no inline `style="..."` attributes anywhere.
- [x] **Minimal 3rd-Party Dependencies**: Built with React and Vite. Router and state management are custom-built without heavy external libraries.
- [x] **Reviews List View (Default View, route = /)**:
  - Button to create new review redirecting to `/new`.
  - 6-column table layout: `#`, `Title`, `Content`, `Date-time`, `Edit`, `Delete`.
  - Column 1 (`#`): Static count number starting with 1.
  - Column 2 (`Title`): Displays review title with live status badges.
  - Column 3 (`Content`): Displays review body with proper text formatting.
  - Column 4 (`Date-time`): Formatted localized timestamp.
  - Column 5 (`Edit`): Edit button navigating to `/:id` route.
  - Column 6 (`Delete`): Delete button that triggers review deletion and undo toastr.
  - Displays each review in a separate row.
  - Latest reviews displayed first by default.
  - Real-time live feed via WebSocket connection with automatic reconnection on disconnect.
- [x] **New Review (route = /new)**:
  - 1 input for title.
  - 1 textarea for content.
  - Save button: Validates inputs, saves review via API, and redirects to `/`.
  - Reset button: Clears input and textarea.
  - Cancel button: Redirects user back to list view (`/`).
- [x] **Edit Review (route = /:id)**:
  - Re-uses the exact same component (`ReviewForm.jsx`) from New Review.
  - Automatically pre-fills title and content from the existing review.
  - Delete button: Deletes the review, triggers 5-second undo toastr, and redirects to `/`.
  - Save button: Updates review and redirects to `/`.
  - Reset button: Resets title and content back to the pre-filled values.
  - Cancel button: Redirects user back to list view (`/`).

### 3. Nice to Have (Bonus Features)
- [x] **Color-Coded Live Event Highlights**:
  - When new review is added, highlighted with **green color** in table for 3 seconds (`row-highlight-add`).
  - When review is edited, highlighted with **blue color** in table for 3 seconds (`row-highlight-edit`).
  - When review is deleted, highlighted with **red color** in table for 3 seconds (`row-highlight-delete`), after which it is smoothly removed.
  - Visual legend bar provided above the table showing event indicator colors.
- [x] **Undo Deletion Functionality**:
  - When a review is deleted (from the table or edit page), a floating toastr appears with a success message and an **Undo** button.
  - Toastr is visible for 5 seconds with a real-time countdown indicator.
  - Clicking "Undo" immediately re-creates the deleted review with its original ID and content.
- [x] **Sorting Functionality**:
  - Supports sorting by **Title** (A → Z and Z → A).
  - Supports sorting by **Date-time** (Newest First and Oldest First).
  - Accessible via interactive table header clicks (toggles asc/desc) and toolbar dropdown selector.
- [x] **Search Functionality**:
  - Live search input box filtering reviews in real-time by title or content (case-insensitive) with a one-click clear button.
- [x] **Unit Testing Suite**:
  - **Backend**: 9 comprehensive automated tests using Node.js built-in test runner (`node --test`), verifying CRUD endpoints, input validation, 404 handling, and live WebSocket broadcasts.
  - **Frontend**: 12 automated unit tests verifying routing resolution, search filtering, and multi-field sorting logic.
  - Total: 21 passing unit tests with 0 failures.
