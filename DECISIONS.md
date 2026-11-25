# Decisions and assumptions

## Client and backend choice

- **React + TypeScript web app, Node.js + TypeScript backend.** Both are the preferred options on the brief. A browser app runs with one command and needs no simulator or emulator. One language across the stack keeps the review simple.
- **Express 5** for the API. It is small and familiar, and its async error handling works with the centralised error middleware.
- **Vite** for the web app. Fast dev server, and a static build that nginx serves in Docker.

## Assumptions where the criteria were unclear

| Area | Assumption |
| --- | --- |
| Home page "5 top rated" | The 5 products with the highest `rating.rate` are the chosen top rated set. 
| Category "top rated" | Each category shows its top 4 products by rating under "Top rated in X", and the rest under "More in X". The split size is a constant. |
| Search | Case-insensitive substring match on **title and description**. Category name is not searched. Empty input is rejected, and the search button is disabled until a term is typed. |
| Search results order | Same rating order as elsewhere, so results are stable. |
| Enquiry fields | `name`, `email` and `message` are required. `phone` is optional. Field lengths are capped, and the phone field allows digits, spaces, `+`, `-` and brackets only. |
| Enquiry for an unknown product | Rejected with 404, so the sales inbox only receives real product enquiries. |
| Enquiry email | Sent to `SALES_INBOX`. Reply-To is the customer's address, so sales can reply straight from their mail client. The customer sees the thank-you message only after the email is sent. |
| Email failure | Returns 502 with a retry message. The enquiry is not stored, so a retry does not create duplicates. Email is sent before storage for this reason. |
| Enquiry persistence | In memory. The brief says the sales inbox receives the email, which is the business requirement. Storage is a PoC convenience and sits behind `EnquiryRepository`. |
| Accounts and auth | None. The brief does not ask for them, and the enquiry form is public. |
| Currency | USD, because Fake Store prices carry no currency. |
| Product images | Shown as provided by Fake Store. |
| Category slugs | Generated from the category name, e.g. `men's clothing` to `mens-clothing`. The same rule runs on both sides. |

## Requirements dropped or simplified

- **Pagination.** Fake Store returns about 20 products, so a full list is fine. A cursor or page parameter is a small change once the source has more data.
- **Automated browser end-to-end tests.** Unit and route tests cover the critical path. Playwright would add setup time and a browser install for little extra confidence at this size. I checked the full flow by hand in a browser instead.
- **Shared types package.** The web app duplicates the response types in `web/src/api/types.ts`. A shared package is the right step once the API grows.
- **Auth on the enquiry endpoint.** Not needed for a public enquiry form. Rate limiting belongs at the edge (a gateway or nginx) before launch.
- **Persistent database.** Dropped, as noted above.

## How the design supports growth

Boundaries are explicit, so each part can change without touching the others.

- **Product data:** `ProductSource` is the only interface the services know about. Fake Store lives in one adapter, and `CachedProductSource` is a decorator on top. Moving to a real catalogue database means a new adapter, with no changes to routes or pages.
- **Email:** `EmailSender` is the interface. Mailpit is used locally through SMTP. Switching to SES or SendGrid means a new implementation and a config change.
- **Enquiries:** `EnquiryService` holds the business rules and depends only on interfaces. `EnquiryRepository` moves to a database table without touching the route.
- **Routes stay thin.** Validation with zod, call a service, map the result to HTTP. Services import no Express types, so they can be reused by a queue worker or a CLI.
- **Composition root.** `backend/src/index.ts` is the only file that chooses concrete adapters. Tests build the app with fakes through `createApp`.
- **Web:** pages call one typed API client. Swapping the look and feel means changing components and CSS, not data code.

## What I would do next with another day

1. Shared API contract package (zod schemas in one place, used by both client and server).
2. Pagination and server-side filtering on category pages.
3. Run the backend and web tests and typechecks on every PR
4. Enquiry storage and a sales admin view
5. Add rate limitting