import { z } from "zod";

export const enquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().max(254).pipe(z.email("Enter a valid email address")),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, "Phone may only contain digits, spaces, +, - and brackets")
    .optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
