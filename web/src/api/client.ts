import type {
  CategorySummary,
  CategoryView,
  EnquiryPayload,
  EnquiryResponse,
  FieldIssue,
  Product,
} from "./types";

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: FieldIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  error?: string;
  details?: FieldIssue[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  const body = (await response.json().catch(() => null)) as ErrorBody | T | null;
  if (!response.ok) {
    const errorBody = (body ?? {}) as ErrorBody;
    throw new ApiError(
      response.status,
      errorBody.error ?? `Request failed with status ${response.status}`,
      errorBody.details ?? [],
    );
  }
  return body as T;
}

export const api = {
  async getFeatured(): Promise<Product[]> {
    const data = await request<{ products: Product[] }>("/products/featured");
    return data.products;
  },

  async searchProducts(term: string): Promise<Product[]> {
    const data = await request<{ products: Product[] }>(`/products?q=${encodeURIComponent(term)}`);
    return data.products;
  },

  async getProduct(id: number): Promise<Product> {
    const data = await request<{ product: Product }>(`/products/${id}`);
    return data.product;
  },

  async listCategories(): Promise<CategorySummary[]> {
    const data = await request<{ categories: CategorySummary[] }>("/categories");
    return data.categories;
  },

  async getCategory(slug: string): Promise<CategoryView> {
    return request<CategoryView>(`/categories/${encodeURIComponent(slug)}`);
  },

  async submitEnquiry(payload: EnquiryPayload): Promise<EnquiryResponse> {
    return request<EnquiryResponse>("/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
