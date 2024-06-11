import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_SERVICE, envs } from 'src/confing';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    NatsModule
  ]
})
export class OrdersModule {}
