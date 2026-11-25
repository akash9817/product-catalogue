import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { EnquiryService } from "./enquiries/EnquiryService.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createCategoriesRouter } from "./routes/categories.js";
import { createEnquiriesRouter } from "./routes/enquiries.js";
import { createProductsRouter } from "./routes/products.js";
import type { CatalogueService } from "./services/catalogue.js";

export interface AppDependencies {
  catalogue: CatalogueService;
  enquiries: EnquiryService;
  corsOrigin: string;
}

/** Builds the Express app from injected services so tests can supply fakes. */
export function createApp({ catalogue, enquiries, corsOrigin }: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/products", createProductsRouter(catalogue));
  app.use("/api/categories", createCategoriesRouter(catalogue));
  app.use("/api/enquiries", createEnquiriesRouter(enquiries));

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);
  return app;
}
