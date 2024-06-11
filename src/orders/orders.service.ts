import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, OrderItemDto } from './dto';
import { NATS_SERVICES, PRODUCT_SERVICE } from 'src/confing';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService')

  constructor(
    @Inject(NATS_SERVICES) private readonly nastClient: ClientProxy
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase Connected');
  }


  async create(createOrderDto: CreateOrderDto) {

    try {
      // Confirmar los Ids de los productos
      const productIds = createOrderDto.items.map(item => item.productId)

      const products: any[] = await firstValueFrom(
        this.nastClient.send({ cmd: 'validate_products' }, productIds)
      );

      // Calculo de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(product => product.id == orderItem.productId).price;

        return acc + (price * orderItem.quantity);
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, ordersItem) => {
        return acc + ordersItem.quantity;
      }, 0);

      // Crear una transaccion de base de datos
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(product => product.id == orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          }
        }
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find(product => product.id == orderItem.productId).name
        }))
      };

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs'
      })
    }

  }


  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status
      }
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    return {
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)
      },
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status
        }
      })
    }
  }

  async findOne(id: string) {

    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found `
      });
    }

    const productId = order.OrderItem.map(orderItem => orderItem.productId);

    const products: any[] = await firstValueFrom(
      this.nastClient.send({ cmd: 'validate_products' },productId)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id == orderItem.productId ).name
      }))
    }
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {

    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status == status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: {
        status: status
      }
    })
  }



  // update(id: number, updateOrderDto: UpdateOrderDto) {
  //   return `This action updates a #${id} order`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} order`;
  // }
}
