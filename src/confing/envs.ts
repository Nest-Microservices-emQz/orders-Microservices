
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars{
    PORT: number;

    NATS_SERVERS: string[];

    /* Ya no es necesario los puertos y host de productos ya que todo es por NATS  */
    // PRODUCTS_MICROSERVICE_HOST: string;
    // PRODUCTS_MICROSERVICE_PORT: number;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required()
    
    // PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    // PRODUCTS_MICROSERVICE_PORT: joi.number().required()
    // DATABASE_URL: joi.string().required(),
})
.unknown(true);

const{error, value} = envsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
});
if(error){
    throw new Error('Config validation error: ${error.message}')
}

const envVars : EnvVars = value;
export const envs = {
    port: envVars.PORT,
    natsServers: envVars.NATS_SERVERS
    // productMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    // productMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT
}