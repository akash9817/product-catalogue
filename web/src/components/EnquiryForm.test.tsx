import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../api/client";
import { EnquiryForm } from "./EnquiryForm";

vi.mock("../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client")>();
  return {
    ...actual,
    api: { submitEnquiry: vi.fn() },
  };
});

const submitEnquiry = vi.mocked(api.submitEnquiry);

function renderForm() {
  return render(<EnquiryForm productId={7} productTitle="Gold ring" />);
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Name/), "Ada Lovelace");
  await user.type(screen.getByLabelText(/^Email/), "ada@example.com");
  await user.type(screen.getByLabelText(/^Message/), "Is this in stock?");
}

describe("EnquiryForm", () => {
  beforeEach(() => {
    submitEnquiry.mockReset();
  });

  it("shows required-field errors and does not submit when the form is empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Submit enquiry" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Message is required")).toBeInTheDocument();
    expect(submitEnquiry).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address before calling the API", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.clear(screen.getByLabelText(/^Email/));
    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Submit enquiry" }));

    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(submitEnquiry).not.toHaveBeenCalled();
  });

  it("submits the trimmed enquiry and shows the thank you message", async () => {
    const user = userEvent.setup();
    submitEnquiry.mockResolvedValue({
      id: "abc",
      message: "Thank you for your enquiry. Our sales team will be in touch shortly.",
    });
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Submit enquiry" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/Thank you/));
    expect(submitEnquiry).toHaveBeenCalledWith({
      productId: 7,
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: undefined,
      message: "Is this in stock?",
    });
  });

  it("maps server field errors back onto the form", async () => {
    const user = userEvent.setup();
    submitEnquiry.mockRejectedValue(
      new ApiError(400, "Please correct the highlighted fields", [
        { field: "message", message: "Message is required" },
      ]),
    );
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Submit enquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please correct the highlighted fields");
  });

  it("shows an error and keeps the form when the server fails", async () => {
    const user = userEvent.setup();
    submitEnquiry.mockRejectedValue(new ApiError(502, "We could not send your enquiry. Please try again."));
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Submit enquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not send your enquiry");
    expect(screen.getByRole("button", { name: "Submit enquiry" })).toBeEnabled();
  });
});
