import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyJwt from '@fastify/jwt';
import path from 'path';
import { ZodError } from 'zod';

import { config } from './config';
import { AppError } from './errors/AppError';
import { getDatabase } from './database/database';

// Repositories
import { UserRepository } from './repositories/UserRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { OrderRepository } from './repositories/OrderRepository';
import { SaleRepository } from './repositories/SaleRepository';

// Services
import { UserService } from './services/UserService';
import { ProductService } from './services/ProductService';
import { OrderService } from './services/OrderService';
import { SaleService } from './services/SaleService'; 

// Controllers
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { AdminController } from './controllers/AdminController';
import { ProductController } from './controllers/ProductController';
import { OrderController } from './controllers/OrderController';
import { SaleController } from './controllers/SaleController';

// Route builders
import { buildUserRoutes } from './routes/userRoutes';
import { buildAuthRoutes } from './routes/authRoutes';
import { buildAdminRoutes } from './routes/adminRoutes';
import { buildProductRoutes } from './routes/productRoutes';
import { ClientRepository } from './repositories/ClientRepository';
import { ClientService } from './services/ClientService';
import { ClientController } from './controllers/ClientController';
import { buildClientRoutes } from './routes/clientRoutes';
import { buildOrderRoutes } from './routes/orderRoutes';
import { buildSaleRoutes } from './routes/saleRoutes';

async function main(): Promise<void> {
  const fastify = Fastify({ logger: true });

  // ─── Plugins ───────────────────────────────────────────
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/',
  });

  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  // ─── Error Handler centralizado ────────────────────────
  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // Erros de validação Zod
    if (error instanceof ZodError) {
      const messages = error.issues.map((e: { message: string }) => e.message);
      reply.status(400).send({ error: messages.join('; ') });
      return;
    }

    // Erros de aplicação (AppError e subclasses)
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: error.message });
      return;
    }

    // Erros inesperados
    request.log.error(error);
    reply.status(500).send({ error: 'Erro interno do servidor.' });
  });

  // ─── Banco de Dados (Migrations) ──────────────────────
  const db = await getDatabase();

  // ─── Injeção de Dependências (DI manual) ───────────────
  const userRepository = new UserRepository();
  const productRepository = new ProductRepository(db);
  const clientRepository = new ClientRepository(db);
  const orderRepository = new OrderRepository(db);
  const saleRepository = new SaleRepository(db);

  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const clientService = new ClientService(clientRepository);
  const orderService = new OrderService(orderRepository, productRepository, clientRepository);
  const saleService = new SaleService(saleRepository, orderRepository, clientRepository);

  // Injeção tardia: OrderService usa SaleService para registrar vendas automaticamente
  orderService.setSaleService(saleService);

  const userController = new UserController(userService);
  const authController = new AuthController(userService);
  const adminController = new AdminController(userService);
  const productController = new ProductController(productService);
  const clientController = new ClientController(clientService);
  const orderController = new OrderController(orderService);
  const saleController = new SaleController(saleService);

  // ─── Rotas ─────────────────────────────────────────────
  await fastify.register(buildUserRoutes(userController));
  await fastify.register(buildAuthRoutes(authController));
  await fastify.register(buildAdminRoutes(adminController));
  await fastify.register(buildProductRoutes(productController), { prefix: '/products' });
  await fastify.register(buildClientRoutes(clientController),  { prefix: '/clients' });
  await fastify.register(buildOrderRoutes(orderController),    { prefix: '/orders' });
  await fastify.register(buildSaleRoutes(saleController),      { prefix: '/sales' });

  // ─── Start ─────────────────────────────────────────────
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
