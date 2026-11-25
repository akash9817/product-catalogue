# Product Catalogue (PoC)

A small product catalogue: home page with top rated products, category pages, search, product details and an enquiry form that emails the sales inbox.

Built as a proof of concept that is meant to grow. The product data source, the email provider and the look and feel are all expected to change, so each one sits behind its own interface. See [DECISIONS.md](DECISIONS.md) for the reasoning, and [AI_USAGE.md](AI_USAGE.md) for how AI tools were used.

## Stack

- **Client:** React + TypeScript (Vite, React Router). Talks only to our backend, through `/api`.
- **Backend:** Node.js + TypeScript (Express 5, zod validation, helmet, nodemailer).
- **Data:** Fake Store API, fetched by the backend only and cached in memory.
- **Email:** SMTP. Locally this goes to [Mailpit](https://mailpit.axllent.org/), a free capture inbox with a web UI.

Why this stack: React and TypeScript are the simplest to run anywhere with a browser, and Node + TypeScript keeps one language across the stack. Both are on the brief's preferred list. No paid services or accounts are needed.

## Run it (one command)

Prerequisites: Docker Desktop (or any Docker engine with Compose v2).

```bash
docker compose up --build
```

Then open:

| What | URL |
| --- | --- |
| Web app | http://localhost:8080 |
| Sales inbox (Mailpit) | http://localhost:8025 |
| API health check | http://localhost:4000/api/health |

Submit an enquiry on any product page. The email appears in Mailpit with the customer's address as Reply-To.

Optional settings go in a `.env` file next to `docker-compose.yml`. See [.env.example](.env.example). Everything has a default, so you can skip this step.

## Run the tests

```bash
cd backend && npm install && npm test
cd web && npm install && npm test
```

## Run locally without Docker

Start Mailpit (or any SMTP server on port 1025), then:

```bash
# terminal 1
cd backend && npm install && CORS_ORIGIN=http://localhost:5173 npm run dev

# terminal 2
cd web && npm install && npm run dev
```

The web app runs at http://localhost:5173 and proxies `/api` to port 4000.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/products/featured` | The 5 highest rated products (home page) |
| GET | `/api/products?q=term` | Products whose title or description contains the term (case-insensitive) |
| GET | `/api/products/:id` | One product |
| GET | `/api/categories` | Category names and URL slugs |
| GET | `/api/categories/:slug` | Top rated products in the category, plus the rest |
| POST | `/api/enquiries` | Body: `productId`, `name`, `email`, `phone?`, `message`. Emails the sales inbox and returns 201 with a thank-you message |

Errors come back as JSON: `400` with `details` for validation problems, `404` for unknown products or categories, `502` when Fake Store or email is unavailable.

## Layout

```
backend/
  src/
    products/       ProductSource interface, Fake Store adapter, TTL cache decorator
    services/       catalogue rules: featured, category split, search
    enquiries/      enquiry schema, service, repository interface
    email/          EmailSender interface, SMTP implementation
    routes/         HTTP routes (thin)
    middleware/     error handling
    index.ts        composition root (the only place adapters are chosen)
  test/             vitest + supertest
web/
  src/
    api/            typed API client and response types
    pages/          home, category, search, product, not found
    components/     layout, product tiles, search bar, enquiry form
  src/**/*.test.tsx vitest + React Testing Library
docker-compose.yml  web, backend, mailpit
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `FAKESTORE_BASE_URL` | `https://fakestoreapi.com` | Product data source |
| `CACHE_TTL_MS` | `300000` | How long product data is cached |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin for the API (Docker serves the web app on 8080) |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | SMTP server (Docker points this at Mailpit) |
| `SMTP_FROM` | `Catalogue <no-reply@catalogue.local>` | Sender address |
| `SALES_INBOX` | `sales@catalogue.local` | Where enquiries are sent |

No secrets are used.
