import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = Number(process.env.PORT || 3001);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(PORT);
  console.log(`Dashboard: http://localhost:${PORT}/admin/queues`);
  console.log(`Add a job:  curl -X POST http://localhost:${PORT}/emails/send`);
}
bootstrap();
