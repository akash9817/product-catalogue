// Mirrors the backend's response shapes. A shared package can replace this later.

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface CategorySummary {
  name: string;
  slug: string;
}

export interface CategoryView {
  category: CategorySummary;
  topRated: Product[];
  additional: Product[];
}

export interface EnquiryPayload {
  productId: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface EnquiryResponse {
  id: string;
  message: string;
}

export interface FieldIssue {
  field: string;
  message: string;
}
