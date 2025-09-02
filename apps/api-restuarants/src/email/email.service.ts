import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

type mailOptions = {
  subject: string;
  email: string;
  name: string;
  activationCode?: string;
  activation_token?: string;
  template: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailService: MailerService) {}

  async sendMail({
    subject,
    email,
    name,
    activationCode,
    activation_token,
    template,
  }: mailOptions) {
    try {
      this.logger.log(`🍕 RESTAURANT SERVICE | 📧 Sending email to ${email}`);
      
      await this.mailService.sendMail({
        to: email,
        subject,
        template,
        context: {
          name,
          activationCode,
          activation_token,
        },
      });

      this.logger.log(`🍕 RESTAURANT SERVICE | ✅ Email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  async sendActivationEmail(email: string, name: string, activationCode: string, activationToken: string) {
    return this.sendMail({
      subject: 'Activate your restaurant account!',
      email,
      name,
      activationCode,
      activation_token: activationToken,
      template: './activation-mail',
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    return this.sendMail({
      subject: 'Welcome to SnackRapido!',
      email,
      name,
      template: './welcome-mail',
    });
  }
}