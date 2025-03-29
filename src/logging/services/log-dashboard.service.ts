import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { LogEntry } from "../entities/log-entry.entity"

interface LogFilterOptions {
  level?: string
  context?: string
  search?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

@Injectable()
export class LogDashboardService {
  constructor(
    @InjectRepository(LogEntry)
    private logEntryRepository: Repository<LogEntry>,
  ) {}

  async getLogs(options: LogFilterOptions) {
    const { level, context, search, startDate, endDate, page = 1, limit = 50 } = options

    const queryBuilder = this.logEntryRepository.createQueryBuilder("log")

    // Apply filters
    if (level) {
      queryBuilder.andWhere("log.level = :level", { level })
    }

    if (context) {
      queryBuilder.andWhere("log.context = :context", { context })
    }

    if (search) {
      queryBuilder.andWhere("log.message ILIKE :search", { search: `%${search}%` })
    }

    if (startDate && endDate) {
      queryBuilder.andWhere("log.timestamp BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
    } else if (startDate) {
      queryBuilder.andWhere("log.timestamp >= :startDate", { startDate })
    } else if (endDate) {
      queryBuilder.andWhere("log.timestamp <= :endDate", { endDate })
    }

    // Add pagination
    queryBuilder
      .orderBy("log.timestamp", "DESC")
      .skip((page - 1) * limit)
      .take(limit)

    // Get results and count
    const [logs, total] = await queryBuilder.getManyAndCount()

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getAvailableContexts() {
    const contexts = await this.logEntryRepository
      .createQueryBuilder("log")
      .select("DISTINCT log.context")
      .where("log.context IS NOT NULL")
      .getRawMany()

    return contexts.map((c) => c.context)
  }

  async getLogStats() {
    // Get counts by level
    const levelCounts = await this.logEntryRepository
      .createQueryBuilder("log")
      .select("log.level, COUNT(*) as count")
      .groupBy("log.level")
      .getRawMany()

    // Get counts by context
    const contextCounts = await this.logEntryRepository
      .createQueryBuilder("log")
      .select("log.context, COUNT(*) as count")
      .where("log.context IS NOT NULL")
      .groupBy("log.context")
      .getRawMany()

    // Get counts by day for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyCounts = await this.logEntryRepository
      .createQueryBuilder("log")
      .select("DATE(log.timestamp) as date, COUNT(*) as count")
      .where("log.timestamp >= :sevenDaysAgo", { sevenDaysAgo })
      .groupBy("DATE(log.timestamp)")
      .orderBy("date", "ASC")
      .getRawMany()

    return {
      totalLogs: await this.logEntryRepository.count(),
      byLevel: levelCounts,
      byContext: contextCounts,
      byDay: dailyCounts,
    }
  }

  async deleteLog(id: string) {
    const result = await this.logEntryRepository.delete(id)

    if (result.affected === 0) {
      throw new NotFoundException(`Log with ID ${id} not found`)
    }

    return { success: true, message: "Log entry deleted successfully" }
  }

  async clearLogs(criteria: { level?: string; context?: string; olderThan?: string }) {
    const { level, context, olderThan } = criteria
    const queryBuilder = this.logEntryRepository.createQueryBuilder("log")

    if (level) {
      queryBuilder.andWhere("log.level = :level", { level })
    }

    if (context) {
      queryBuilder.andWhere("log.context = :context", { context })
    }

    if (olderThan) {
      const date = new Date(olderThan)
      queryBuilder.andWhere("log.timestamp < :date", { date })
    }

    const result = await queryBuilder.delete().execute()

    return {
      success: true,
      message: `${result.affected} log entries cleared successfully`,
    }
  }
}

