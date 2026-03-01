import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { globalPipesConfig } from '@shared/infrastructure/config/pipes.config';
import { DomainExceptionFilter } from '@shared/infrastructure/filters/domain-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.useGlobalFilters(new DomainExceptionFilter());

    app.use(helmet());
    app.use(cookieParser());

    app.setGlobalPrefix('api/v1');

    globalPipesConfig(app);

    app.enableCors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(
      `✅ MesaViva API corriendo en: http://localhost:${port}/api/v1`,
    );
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

void bootstrap();
