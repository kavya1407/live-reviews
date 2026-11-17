# Live Reviews

A full-stack live review application that enables users to view, create, edit, and delete reviews in real time using WebSockets and REST APIs.

## Getting Started

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

Backend will run on `http://localhost:5000` (API & WebSocket server).
Frontend will run on `http://localhost:3000` (or `http://localhost:5173`).

---

## Problem Statement

### Live Reviews
Live Reviews allows users to add/edit/remove review and view all reviews with live feeding.

### Must Haves

#### Backend
- Use any DB and NodeJS framework of your choice
- Create REST APIs to perform CRUD operations of notes/reviews
- Store each review with id, title, content and date-time
- Implement web-socket, which should broadcast whenever any review is getting added/edited/deleted

#### Frontend
- Plain HTML & CSS, decent UI that works
- No CSS frameworks like Bootstrap, Tailwind, etc.
- Vanilla HTML/CSS/JS or React/Vue/Angular
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
- Live list view with implementation of web-socket: whenever any review is added/edited/deleted, it immediately updates the table without user needing to refresh the page

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

### Nice to have (Bonus Features)
- Highlight different live events in different colors:
  - When new review is added, highlight it with green color in table for 3 seconds
  - When any review is edited, highlight it with blue color in table for 3 seconds
  - When any review is deleted, highlight it with red color in table for 3 seconds and then disappear
- Undo functionality:
  - Once user deletes the note, show a snackbar/toastr with success message and an undo button
  - Snackbar/toastr visible for 5 seconds
  - User can undo the deletion by clicking on undo button
- Unit testing
- Sorting functionality based on title and date-time in both ascending and descending order
- Search functionality

---

## Completed

*(Will be updated as features are implemented)*
