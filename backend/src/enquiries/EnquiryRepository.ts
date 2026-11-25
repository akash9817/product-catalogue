import type { EnquiryInput } from "./enquirySchema.js";

export interface StoredEnquiry extends EnquiryInput {
  id: string;
  createdAt: string;
  productTitle: string;
}

/** Persistence for enquiries. In-memory for the PoC; a database table later. */
export interface EnquiryRepository {
  save(enquiry: StoredEnquiry): Promise<void>;
  list(): Promise<StoredEnquiry[]>;
}

export class InMemoryEnquiryRepository implements EnquiryRepository {
  private readonly items: StoredEnquiry[] = [];

  async save(enquiry: StoredEnquiry): Promise<void> {
    this.items.push(enquiry);
  }

  async list(): Promise<StoredEnquiry[]> {
    return [...this.items];
  }
}
