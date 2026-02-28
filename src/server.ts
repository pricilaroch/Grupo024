import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { ZodError } from 'zod';
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { config } from './config';
import { AppError } from './errors/AppError';
import { getDatabase } from './database/database';

// Repositories
import { UserRepository } from './repositories/UserRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { OrderRepository } from './repositories/OrderRepository';
import { SaleRepository } from './repositories/SaleRepository';
import { ExpenseRepository } from './repositories/ExpenseRepository';

// Services
import { UserService } from './services/UserService';
import { ProductService } from './services/ProductService';
import { OrderService } from './services/OrderService';
import { SaleService } from './services/SaleService';
import { ExpenseService } from './services/ExpenseService';
import { AnalyticsService } from './services/AnalyticsService';

// Controllers
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { AdminController } from './controllers/AdminController';
import { ProductController } from './controllers/ProductController';
import { OrderController } from './controllers/OrderController';
import { SaleController } from './controllers/SaleController';
import { ExpenseController } from './controllers/ExpenseController';
import { AnalyticsController } from './controllers/AnalyticsController';

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
import { buildExpenseRoutes } from './routes/expenseRoutes';
import { buildAnalyticsRoutes } from './routes/analyticsRoutes';

async function main(): Promise<void> {
  const fastify = Fastify({ logger: true });

  // ─── Zod Type Provider ─────────────────────────────────
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // ─── Swagger / OpenAPI ─────────────────────────────────
  const enableDocs = process.env.NODE_ENV !== 'production';

  if (enableDocs) {
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Gestão de Encomendas API',
          description: 'API para gerenciamento de encomendas, vendas, despesas e produção artesanal.',
          version: '1.0.0',
        },
        servers: [
          { url: `http://localhost:${config.port}`, description: 'Servidor local' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [
          { name: 'Auth',      description: 'Autenticação e registro' },
          { name: 'Users',     description: 'Gerenciamento de usuários' },
          { name: 'Admin',     description: 'Painel administrativo' },
          { name: 'Products',  description: 'Catálogo de produtos' },
          { name: 'Clients',   description: 'Cadastro de clientes' },
          { name: 'Orders',    description: 'Encomendas e Kanban' },
          { name: 'Sales',     description: 'Registro de vendas' },
          { name: 'Expenses',  description: 'Controle de despesas' },
          { name: 'Analytics', description: 'Indicadores financeiros e metas' },
        ],
      },
      transform: jsonSchemaTransform,
    });

    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });
  }

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
  const expenseRepository = new ExpenseRepository(db);

  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const clientService = new ClientService(clientRepository);
  const orderService = new OrderService(orderRepository, productRepository, clientRepository);
  const saleService = new SaleService(saleRepository, orderRepository, clientRepository);
  const expenseService = new ExpenseService(expenseRepository);
  const analyticsService = new AnalyticsService(saleRepository, expenseRepository);

  // Injeção tardia: OrderService usa SaleService para registrar vendas automaticamente
  orderService.setSaleService(saleService);

  const userController = new UserController(userService);
  const authController = new AuthController(userService);
  const adminController = new AdminController(userService);
  const productController = new ProductController(productService);
  const clientController = new ClientController(clientService);
  const orderController = new OrderController(orderService);
  const saleController = new SaleController(saleService);
  const expenseController = new ExpenseController(expenseService);
  const analyticsController = new AnalyticsController(analyticsService);

  // ─── Rotas ─────────────────────────────────────────────
  await fastify.register(buildUserRoutes(userController));
  await fastify.register(buildAuthRoutes(authController));
  await fastify.register(buildAdminRoutes(adminController));
  await fastify.register(buildProductRoutes(productController), { prefix: '/products' });
  await fastify.register(buildClientRoutes(clientController),  { prefix: '/clients' });
  await fastify.register(buildOrderRoutes(orderController),    { prefix: '/orders' });
  await fastify.register(buildSaleRoutes(saleController),      { prefix: '/sales' });
  await fastify.register(buildExpenseRoutes(expenseController), { prefix: '/expenses' });
  await fastify.register(buildAnalyticsRoutes(analyticsController), { prefix: '/analytics' });

  // ─── Start ─────────────────────────────────────────────
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
