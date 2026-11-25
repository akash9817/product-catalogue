// Mirrors the server rules in backend/src/enquiries/enquirySchema.ts.
// The server is still the source of truth; this only gives fast feedback.

export interface EnquiryValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]*$/;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const message = values.message.trim();

  if (!name) errors.name = "Name is required";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer";

  if (!email) errors.email = "Email is required";
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address";

  if (phone && (phone.length > 30 || !PHONE_PATTERN.test(phone))) {
    errors.phone = "Phone may only contain digits, spaces, +, - and brackets";
  }

  if (!message) errors.message = "Message is required";
  else if (message.length > 2000) errors.message = "Message must be 2000 characters or fewer";

  return errors;
}
