import { registerAs } from "@nestjs/config"

export default registerAs("logging", () => ({
  level: process.env.LOG_LEVEL || "info",
  dir: process.env.LOG_DIR || "logs",
  maxSize: process.env.MAX_LOG_SIZE || "10m",
  maxFiles: Number.parseInt(process.env.MAX_LOG_FILES || "5", 10),
  retentionDays: Number.parseInt(process.env.LOG_RETENTION_DAYS || "30", 10),
  logRequests: process.env.LOG_REQUESTS !== "false",
  logResponses: process.env.LOG_RESPONSES !== "false",
  logRequestBody: process.env.LOG_REQUEST_BODY === "true",
  logResponseBody: process.env.LOG_RESPONSE_BODY === "true",
  requestBodySizeLimit: Number.parseInt(process.env.LOG_REQUEST_BODY_SIZE_LIMIT || "1024", 10),
  responseBodySizeLimit: Number.parseInt(process.env.LOG_RESPONSE_BODY_SIZE_LIMIT || "1024", 10),
}))

