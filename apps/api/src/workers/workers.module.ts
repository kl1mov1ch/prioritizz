import { Module } from '@nestjs/common';
import { EscrowTimersWorker } from './escrow-timers.worker';

/**
 * In-process background jobs. They poll rather than use a scheduler, so they
 * run wherever the process runs — no separate cron infra for a single box.
 */
@Module({
  providers: [EscrowTimersWorker],
})
export class WorkersModule {}
