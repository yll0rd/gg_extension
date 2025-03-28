import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { AuthExceptionFilter } from "./filters/auth-exception.filter"
import { ValidationPipe } from "@nestjs/common"
import { LoggingService } from "./logging/services/logging.service"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable NestJS default logger since we're using our custom logger
    logger: false,
  })

  // Get our custom logger
  const logger = app.get(LoggingService)
  logger.setContext("Bootstrap")

  // Global filters and pipes
  app.useGlobalFilters(new AuthExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("Gasless Gossip API")
    .setDescription("The Gasless Gossip API Documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("Authentication", "User registration and authentication endpoints")
    .addTag("Users", "User management endpoints")
    .addTag("Logs", "Log management and visualization")
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  logger.log(`Application is running on: http://localhost:${port}`)
  logger.log(`Swagger documentation available at: http://localhost:${port}/api`)
  logger.log(`Log dashboard available at: http://localhost:${port}/logs/dashboard`)
}
bootstrap()

