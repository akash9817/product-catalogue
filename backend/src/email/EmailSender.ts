export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Abstraction over the email provider. The PoC uses SMTP (Mailpit locally);
 * swapping to SES, SendGrid, etc. only means adding another implementation.
 */
export interface EmailSender {
  send(email: OutgoingEmail): Promise<void>;
}
