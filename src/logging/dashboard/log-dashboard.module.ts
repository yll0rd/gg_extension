import { Module } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from "path"
import { LogDashboardService } from "../services/log-dashboard.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { LogEntry } from "../entities/log-entry.entity"
import { LogDashboardController } from "../controllers/ log-dashboard.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntry]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public", "dashboard"),
      serveRoot: "/logs/dashboard",
    }),
  ],
  controllers: [LogDashboardController],
  providers: [LogDashboardService],
})
export class LogDashboardModule {}

