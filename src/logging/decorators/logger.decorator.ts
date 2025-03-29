import { Inject } from "@nestjs/common"
import { LoggingService } from "../services/logging.service"

export function Logger(context?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const logger = this.logger as LoggingService

      if (logger) {
        if (context) {
          logger.setContext(context)
        } else if (this.constructor && this.constructor.name) {
          logger.setContext(this.constructor.name)
        }
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

export const InjectLogger = () => Inject(LoggingService)

