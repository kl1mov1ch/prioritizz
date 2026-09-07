import { Global, Module } from '@nestjs/common';
import { OrderStateMachine } from './order.state-machine';

/**
 * The order state machine has no dependencies beyond the global outbox, so it
 * lives in its own global module. Both OrdersModule and EscrowModule use it
 * without importing each other (which would be a cycle).
 */
@Global()
@Module({
  providers: [OrderStateMachine],
  exports: [OrderStateMachine],
})
export class OrdersCoreModule {}
