/**
 * Domain model for a product. This is the shape the rest of the app uses.
 * Product data sources must map their own payloads into this shape.
 */
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
