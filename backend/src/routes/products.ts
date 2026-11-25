import { Router } from "express";
import { z } from "zod";
import { NotFoundError, ValidationError } from "../errors.js";
import type { CatalogueService } from "../services/catalogue.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search term is required").max(200),
});

const idParamSchema = z.coerce.number().int().positive();

export function createProductsRouter(catalogue: CatalogueService): Router {
  const router = Router();

  router.get("/featured", async (_req, res) => {
    res.json({ products: await catalogue.getFeatured() });
  });

  router.get("/", async (req, res) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid search");
    }
    res.json({ products: await catalogue.search(parsed.data.q) });
  });

  router.get("/:id", async (req, res) => {
    const parsed = idParamSchema.safeParse(req.params.id);
    if (!parsed.success) {
      throw new ValidationError("Product id must be a positive integer");
    }
    const product = await catalogue.getProduct(parsed.data);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.json({ product });
  });

  return router;
}
