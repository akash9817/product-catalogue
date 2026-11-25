import { randomUUID } from "node:crypto";
import type { EmailSender } from "../email/EmailSender.js";
import { NotFoundError, UpstreamError } from "../errors.js";
import type { CatalogueService } from "../services/catalogue.js";
import type { EnquiryRepository, StoredEnquiry } from "./EnquiryRepository.js";
import type { EnquiryInput } from "./enquirySchema.js";

export interface EnquiryServiceOptions {
  catalogue: CatalogueService;
  repository: EnquiryRepository;
  email: EmailSender;
  salesInbox: string;
  now?: () => Date;
}

export interface SubmittedEnquiry {
  id: string;
}

export class EnquiryService {
  constructor(private readonly options: EnquiryServiceOptions) {}

  /**
   * Validates the product, emails the sales inbox, then stores the enquiry.
   * Email goes first so a failed send returns an error the customer can retry
   * without leaving a stored enquiry behind.
   */
  async submit(input: EnquiryInput): Promise<SubmittedEnquiry> {
    const product = await this.options.catalogue.getProduct(input.productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const id = randomUUID();
    const createdAt = (this.options.now?.() ?? new Date()).toISOString();

    try {
      await this.options.email.send({
        to: this.options.salesInbox,
        replyTo: input.email,
        subject: `New enquiry: ${product.title}`,
        text: formatSalesEmail({ id, createdAt, productTitle: product.title, productId: product.id, input }),
      });
    } catch (error) {
      throw new UpstreamError("We could not send your enquiry. Please try again.", { cause: error });
    }

    const stored: StoredEnquiry = { ...input, id, createdAt, productTitle: product.title };
    await this.options.repository.save(stored);
    return { id };
  }
}

interface EmailContext {
  id: string;
  createdAt: string;
  productTitle: string;
  productId: number;
  input: EnquiryInput;
}

export function formatSalesEmail({ id, createdAt, productTitle, productId, input }: EmailContext): string {
  return [
    `Enquiry ID: ${id}`,
    `Received: ${createdAt}`,
    "",
    `Product: ${productTitle} (#${productId})`,
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "not provided"}`,
    "",
    "Message:",
    input.message,
  ].join("\n");
}
