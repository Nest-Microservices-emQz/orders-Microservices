import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICES, envs } from 'src/confing';

@Module({
    imports: [
        ClientsModule.register([
      { 
        name: NATS_SERVICES, 
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers
          // host: envs.productMicroserviceHost,
          // port:  envs.productMicroservicePort
        }
      }
    ])
    ],
    
    exports: [
        ClientsModule.register([
      { 
        name: NATS_SERVICES, 
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers
          // host: envs.productMicroserviceHost,
          // port:  envs.productMicroservicePort
        }
      }
    ])
    ]
})
export class NatsModule {}
