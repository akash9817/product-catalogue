import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { SmtpEmailSender } from "./email/SmtpEmailSender.js";
import { EnquiryService } from "./enquiries/EnquiryService.js";
import { InMemoryEnquiryRepository } from "./enquiries/EnquiryRepository.js";
import { CachedProductSource } from "./products/CachedProductSource.js";
import { FakeStoreProductSource } from "./products/FakeStoreProductSource.js";
import { CatalogueService } from "./services/catalogue.js";

// Composition root: the only place that knows which concrete adapters are used.
const config = loadConfig();

const productSource = new CachedProductSource(
  new FakeStoreProductSource({ baseUrl: config.FAKESTORE_BASE_URL }),
  config.CACHE_TTL_MS,
);
const catalogue = new CatalogueService(productSource);

const enquiries = new EnquiryService({
  catalogue,
  repository: new InMemoryEnquiryRepository(),
  email: new SmtpEmailSender({ host: config.SMTP_HOST, port: config.SMTP_PORT, from: config.SMTP_FROM }),
  salesInbox: config.SALES_INBOX,
});

const app = createApp({ catalogue, enquiries, corsOrigin: config.CORS_ORIGIN });

app.listen(config.PORT, () => {
  console.log(`Catalogue API listening on http://localhost:${config.PORT}`);
});
