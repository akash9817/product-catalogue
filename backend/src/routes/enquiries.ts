import { Router } from "express";
import { ValidationError } from "../errors.js";
import type { EnquiryService } from "../enquiries/EnquiryService.js";
import { enquirySchema } from "../enquiries/enquirySchema.js";

export const THANK_YOU_MESSAGE = "Thank you for your enquiry. Our sales team will be in touch shortly.";

export function createEnquiriesRouter(enquiries: EnquiryService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Please correct the highlighted fields",
        parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    const result = await enquiries.submit(parsed.data);
    res.status(201).json({ id: result.id, message: THANK_YOU_MESSAGE });
  });

  return router;
}
