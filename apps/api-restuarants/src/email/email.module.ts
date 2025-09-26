import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST') || 'smtp.gmail.com',
          port: parseInt(config.get('SMTP_PORT') || '465'),
          secure: true,
          auth: {
            user: config.get('SMTP_MAIL')?.replace(/"/g, ''),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: 'SnackRapido <noreply@snackrapido.com>',
        },
        template: {
          dir: join(__dirname, '../../../apps/api-restuarants/email-templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}