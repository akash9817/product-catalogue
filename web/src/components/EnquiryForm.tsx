import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "../api/client";
import { type EnquiryErrors, type EnquiryValues, validateEnquiry } from "./enquiryValidation";

interface EnquiryFormProps {
  productId: number;
  productTitle: string;
}

const EMPTY_VALUES: EnquiryValues = { name: "", email: "", phone: "", message: "" };

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; message: string }
  | { status: "failed"; message: string };

export function EnquiryForm({ productId, productTitle }: EnquiryFormProps) {
  const [values, setValues] = useState<EnquiryValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  function update(field: keyof EnquiryValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEnquiry(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmit({ status: "submitting" });
    try {
      const response = await api.submitEnquiry({
        productId,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        message: values.message.trim(),
      });
      setSubmit({ status: "submitted", message: response.message });
    } catch (error) {
      if (error instanceof ApiError && error.details.length > 0) {
        const serverErrors: EnquiryErrors = {};
        for (const issue of error.details) {
          if (issue.field in EMPTY_VALUES) {
            serverErrors[issue.field as keyof EnquiryValues] = issue.message;
          }
        }
        setErrors(serverErrors);
      }
      setSubmit({
        status: "failed",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  if (submit.status === "submitted") {
    return (
      <p className="enquiry-thanks" role="status">
        {submit.message}
      </p>
    );
  }

  const submitting = submit.status === "submitting";

  return (
    <form className="enquiry-form" onSubmit={handleSubmit} noValidate aria-labelledby="enquiry-heading">
      <h2 id="enquiry-heading">Enquire about {productTitle}</h2>

      <Field id="enquiry-name" label="Name" error={errors.name} required>
        <input id="enquiry-name" value={values.name} onChange={update("name")} autoComplete="name" />
      </Field>

      <Field id="enquiry-email" label="Email" error={errors.email} required>
        <input
          id="enquiry-email"
          type="email"
          value={values.email}
          onChange={update("email")}
          autoComplete="email"
        />
      </Field>

      <Field id="enquiry-phone" label="Phone (optional)" error={errors.phone}>
        <input id="enquiry-phone" type="tel" value={values.phone} onChange={update("phone")} autoComplete="tel" />
      </Field>

      <Field id="enquiry-message" label="Message" error={errors.message} required>
        <textarea id="enquiry-message" rows={4} value={values.message} onChange={update("message")} />
      </Field>

      {submit.status === "failed" && (
        <p className="status status--error" role="alert">
          {submit.message}
        </p>
      )}

      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? "Sending..." : "Submit enquiry"}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function Field({ id, label, error, required, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
