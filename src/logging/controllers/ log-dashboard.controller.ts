import { Controller, Get, Query, UseGuards, Post, Body, Delete, Param } from "@nestjs/common"
import type { LogDashboardService } from "../services/log-dashboard.service"
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger"

@ApiTags("Logs")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("logs")
export class LogDashboardController {
  constructor(private readonly logDashboardService: LogDashboardService) {}

  @Get()
  @ApiOperation({ summary: "Get logs with filtering options" })
  @ApiQuery({ name: "level", required: false, enum: ["debug", "info", "warn", "error"] })
  @ApiQuery({ name: "context", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getLogs(
    @Query('level') level?: string,
    @Query('context') context?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.logDashboardService.getLogs({
      level,
      context,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: +page,
      limit: +limit,
    })
  }

  @Get("contexts")
  @ApiOperation({ summary: "Get all available log contexts" })
  async getContexts() {
    return this.logDashboardService.getAvailableContexts()
  }

  @Get("stats")
  @ApiOperation({ summary: "Get log statistics" })
  async getStats() {
    return this.logDashboardService.getLogStats()
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a log entry' })
  async deleteLog(@Param('id') id: string) {
    return this.logDashboardService.deleteLog(id);
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear logs based on criteria' })
  async clearLogs(@Body() criteria: {
    level?: string,
    context?: string,
    olderThan?: string,
  }) {
    return this.logDashboardService.clearLogs(criteria);
  }
}

