import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

interface Shipment {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  updatedAt: Date;
  lastReminderSentAt: Date | null;
  contactEmail: string;
}

@Injectable()
export class StatusReminderService {
  private readonly logger = new Logger(StatusReminderService.name);

  private readonly thresholds = {
    PENDING: parseInt(process.env.REMINDER_PENDING_HOURS ?? '24', 10) * 3600_000,
    ACCEPTED: parseInt(process.env.REMINDER_ACCEPTED_HOURS ?? '12', 10) * 3600_000,
  };

  constructor(
    @InjectRepository('Shipment')
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkStaleShipments() {
    const now = Date.now();

    for (const [status, threshold] of Object.entries(this.thresholds) as [keyof typeof this.thresholds, number][]) {
      const cutoff = new Date(now - threshold);

      const stale = await this.shipmentRepo.find({
        where: { status, updatedAt: LessThan(cutoff) },
      });

      for (const shipment of stale) {
        const lastSent = shipment.lastReminderSentAt?.getTime() ?? 0;
        if (now - lastSent < threshold) continue; // already emailed within this period

        await this.sendReminder(shipment);
        await this.shipmentRepo.update(shipment.id, { lastReminderSentAt: new Date() });
        this.logger.log(`Reminder sent for shipment ${shipment.id} (${status})`);
      }
    }
  }

  private async sendReminder(shipment: Shipment) {
    // Plug in your mailer service here (e.g. nodemailer / SendGrid)
    this.logger.debug(`[EMAIL] → ${shipment.contactEmail}: shipment ${shipment.id} is stale`);
  }
}
