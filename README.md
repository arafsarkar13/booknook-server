# BookNook Server

Express and MongoDB API for **BookNook**, a small online library.

**Live API:** https://booknook-server-chi.vercel.app

**Client repository:** https://github.com/arafsarkar13/booknook-client

## API routes

| Method | Route          | Access | What it does                                                          |
| ------ | -------------- | ------ | --------------------------------------------------------------------- |
| GET    | `/books`       | Public | Get all books, newest first. Supports `?limit=6` and `?addedBy=email` |
| GET    | `/books/:id`   | Login  | Get one book                                                          |
| POST   | `/books`       | Login  | Add a book                                                            |
| PATCH  | `/books/:id`   | Owner  | Update a book                                                         |
| DELETE | `/books/:id`   | Owner  | Delete a book (blocked while it is borrowed)                          |
| POST   | `/borrows`     | Login  | Borrow a book for seven days                                          |
| GET    | `/borrows`     | Login  | Get the logged in user's borrows                                      |
| DELETE | `/borrows/:id` | Login  | Return a book                                                         |

## How security works

Logged-in users receive a short-lived JWT from BetterAuth on the website. The server verifies each token against the website's public keys (JWKS), so it never sees passwords or cookies.

## Run it on your computer

```bash
npm install
npm run dev
```

Create a `.env` file (see `.env.example`):

```
MONGODB_URI=your MongoDB connection string
CLIENT_URL=http://localhost:3000
PORT=5000
```
