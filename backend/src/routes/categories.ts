import { Router } from "express";
import { NotFoundError } from "../errors.js";
import type { CatalogueService } from "../services/catalogue.js";

export function createCategoriesRouter(catalogue: CatalogueService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json({ categories: await catalogue.listCategories() });
  });

  router.get("/:slug", async (req, res) => {
    const view = await catalogue.getCategory(req.params.slug);
    if (!view) {
      throw new NotFoundError("Category not found");
    }
    res.json(view);
  });

  return router;
}
