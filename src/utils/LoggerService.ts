import type { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import type { Log } from '../schemas/zod.js';
import { logger } from '../server.js';
export default class LoggerService {
  private readonly sbClient: ServiceBusClient;
  private readonly sender: ServiceBusSender;

  constructor(sbClient: ServiceBusClient, sender: ServiceBusSender) {
    this.sbClient = sbClient;
    this.sender = sender;
  }

  async registerLog(log: Log): Promise<void> {
    const message = {
      body: log,
      contentType: 'application/json',
      subject: 'log',
    };

    try {
      await this.sender.sendMessages(message);
      logger.info('Log sent to Service Bus:', log);
    } catch (error) {
      logger.error(`Error sending message to Service Bus: ${error}`);
    }
  }
}
