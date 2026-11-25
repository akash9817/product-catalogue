import nodemailer, { type Transporter } from "nodemailer";
import type { EmailSender, OutgoingEmail } from "./EmailSender.js";

export interface SmtpOptions {
  host: string;
  port: number;
  from: string;
}

export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(
    private readonly options: SmtpOptions,
    transporter?: Transporter,
  ) {
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: options.host,
        port: options.port,
        secure: false,
      });
  }

  async send(email: OutgoingEmail): Promise<void> {
    await this.transporter.sendMail({
      from: this.options.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      replyTo: email.replyTo,
    });
  }
}
