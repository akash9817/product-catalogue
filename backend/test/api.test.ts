import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { EmailSender } from "../src/email/EmailSender.js";
import { EnquiryService } from "../src/enquiries/EnquiryService.js";
import { InMemoryEnquiryRepository } from "../src/enquiries/EnquiryRepository.js";
import { ProductSourceError } from "../src/products/errors.js";
import { CatalogueService } from "../src/services/catalogue.js";
import { fakeSource } from "./fixtures.js";

const SALES_INBOX = "sales@test.local";

function buildApp() {
  const source = fakeSource();
  const catalogue = new CatalogueService(source);
  const email = { send: vi.fn(async () => {}) } satisfies EmailSender;
  const repository = new InMemoryEnquiryRepository();
  const enquiries = new EnquiryService({
    catalogue,
    repository,
    email,
    salesInbox: SALES_INBOX,
    now: () => new Date("2026-01-01T00:00:00.000Z"),
  });
  const app = createApp({ catalogue, enquiries, corsOrigin: "http://localhost:5173" });
  return { app, source, email, repository };
}

const validEnquiry = {
  productId: 2,
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+44 20 7946 0000",
  message: "Is this available in stock?",
};

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("products API", () => {
  let ctx: ReturnType<typeof buildApp>;
  beforeEach(() => {
    ctx = buildApp();
  });

  it("GET /api/products/featured returns the five top rated products", async () => {
    const res = await request(ctx.app).get("/api/products/featured");
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { id: number }) => p.id)).toEqual([2, 3, 6, 5, 10]);
  });

  it("GET /api/products?q= returns only matching products", async () => {
    const res = await request(ctx.app).get("/api/products").query({ q: "monitor" });
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { id: number }) => p.id)).toEqual([6]);
  });

  it("GET /api/products without a search term is a 400", async () => {
    const res = await request(ctx.app).get("/api/products").query({ q: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Search term is required/);
  });

  it("GET /api/products/:id returns a product", async () => {
    const res = await request(ctx.app).get("/api/products/2");
    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe("Gold ring");
  });

  it("GET /api/products/:id returns 404 for an unknown product", async () => {
    const res = await request(ctx.app).get("/api/products/9999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Product not found" });
  });

  it("GET /api/products/:id rejects a non-numeric id", async () => {
    const res = await request(ctx.app).get("/api/products/abc");
    expect(res.status).toBe(400);
  });

  it("returns a 502 JSON error when the product source fails", async () => {
    ctx.source.listProducts.mockRejectedValueOnce(new ProductSourceError("boom"));
    const res = await request(ctx.app).get("/api/products/featured");
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/temporarily unavailable/);
    expect(JSON.stringify(res.body)).not.toMatch(/boom/);
  });
});

describe("categories API", () => {
  let ctx: ReturnType<typeof buildApp>;
  beforeEach(() => {
    ctx = buildApp();
  });

  it("GET /api/categories lists names and slugs", async () => {
    const res = await request(ctx.app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toContainEqual({ name: "jewelery", slug: "jewelery" });
  });

  it("GET /api/categories/:slug returns top rated and additional products", async () => {
    const res = await request(ctx.app).get("/api/categories/mens-clothing");
    expect(res.status).toBe(200);
    expect(res.body.category).toEqual({ name: "men's clothing", slug: "mens-clothing" });
    expect(res.body.topRated.length + res.body.additional.length).toBe(4);
  });

  it("GET /api/categories/:slug returns 404 for an unknown slug", async () => {
    const res = await request(ctx.app).get("/api/categories/nope");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/enquiries", () => {
  let ctx: ReturnType<typeof buildApp>;
  beforeEach(() => {
    ctx = buildApp();
  });

  it("emails the sales inbox, stores the enquiry and returns a thank you", async () => {
    const res = await request(ctx.app).post("/api/enquiries").send(validEnquiry);

    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.message).toMatch(/Thank you/);

    expect(ctx.email.send).toHaveBeenCalledTimes(1);
    const sent = ctx.email.send.mock.calls[0]![0];
    expect(sent.to).toBe(SALES_INBOX);
    expect(sent.replyTo).toBe("ada@example.com");
    expect(sent.subject).toBe("New enquiry: Gold ring");
    expect(sent.text).toContain("Name: Ada Lovelace");
    expect(sent.text).toContain("Is this available in stock?");

    const stored = await ctx.repository.list();
    expect(stored).toHaveLength(1);
    expect(stored[0]!.productTitle).toBe("Gold ring");
  });

  it("accepts an enquiry without a phone number", async () => {
    const { phone: _phone, ...withoutPhone } = validEnquiry;
    const res = await request(ctx.app).post("/api/enquiries").send(withoutPhone);
    expect(res.status).toBe(201);
    expect(ctx.email.send.mock.calls[0]![0].text).toContain("Phone: not provided");
  });

  it("returns field-level validation errors and sends nothing", async () => {
    const res = await request(ctx.app)
      .post("/api/enquiries")
      .send({ ...validEnquiry, email: "not-an-email", message: "   " });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "message"]));
    expect(ctx.email.send).not.toHaveBeenCalled();
  });

  it("rejects phone numbers with invalid characters", async () => {
    const res = await request(ctx.app).post("/api/enquiries").send({ ...validEnquiry, phone: "call me <b>" });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("phone");
  });

  it("returns 404 and sends nothing when the product does not exist", async () => {
    const res = await request(ctx.app).post("/api/enquiries").send({ ...validEnquiry, productId: 4242 });
    expect(res.status).toBe(404);
    expect(ctx.email.send).not.toHaveBeenCalled();
    expect(await ctx.repository.list()).toHaveLength(0);
  });

  it("returns 502 and does not store the enquiry when email delivery fails", async () => {
    ctx.email.send.mockRejectedValueOnce(new Error("SMTP connection refused"));
    const res = await request(ctx.app).post("/api/enquiries").send(validEnquiry);

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/try again/);
    expect(JSON.stringify(res.body)).not.toMatch(/SMTP/);
    expect(await ctx.repository.list()).toHaveLength(0);
  });

  it("rejects malformed JSON with a 400", async () => {
    const res = await request(ctx.app)
      .post("/api/enquiries")
      .set("Content-Type", "application/json")
      .send("{ bad json");
    expect(res.status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404 for unknown API paths", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});