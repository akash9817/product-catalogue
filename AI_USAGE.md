# AI usage notes

## Tools and models

- **Cursor** agent (plan mode, then agent mode) for planning, code generation, tests, and browser verification.
- Cursor's built-in browser tool, used to check the home page, the product page and the enquiry thank-you state against the running stack.
- No other AI services. Everything runs locally.

## Agent instruction files

- [AGENTS.md](AGENTS.md) in the repo root. It sets the architecture rules (the client never calls Fake Store, data and email go through interfaces, services do not import Express), the commands, and the conventions. It was written before the code, so the agent worked to those rules from the start.

## Plan or spec

- A written plan with the layout, the acceptance-criteria mapping, the testing approach, and a time-box. I reviewed it before any code was written. It is kept out of the repo, so the decisions it records are restated in [DECISIONS.md](DECISIONS.md).

## Key prompts and moments that shaped the solution

1. **"Ask whatever questions you have before building."** This made the agent surface the gaps in the brief first. The answers fixed the stack: React and TypeScript for the client, Node and TypeScript for the backend. Both are on the brief's preferred list.
2. **Plan review, then "implement the plan as specified."** The plan put the product source and the email provider behind interfaces, because the brief says both will change. That shaped every backend file: `ProductSource`, `EmailSender`, and `EnquiryRepository`.
3. **Email before storage (agent's decision).** The agent chose to send the email before storing the enquiry, so a failed send cannot leave a stored record and a retry cannot create duplicates. It is recorded in DECISIONS.md
4. **Browser check against the live stack (agent's initiative).** Unit tests alone would not show what the page looks like, so the agent checked the UI in a real browser.


## Verification

- Backend: 41 vitest and supertest tests, plus a clean `tsc` typecheck.
- Web: 13 vitest and React Testing Library tests, a clean typecheck, and a production build.
- Live: the API was run against a stub Fake Store server and a local SMTP sink. Enquiry validation, 404 and 201 responses, and the captured email (including Reply-To) were all checked by hand.
- Browser: the home page, a product page and the enquiry flow through the thank-you message were checked in a real browser.


## Time spent

| Phase | Estimate |
| --- | --- |
| Planning and clarifying questions | about 15 min |
| Building (backend, web, tests) | about 30 min |
| Verification (live API, browser, typecheck) | about 15 min |
| Review | about 45 Min | 
| Docs, git and PR | 15 Min |
| **Total** | 2 hour |

