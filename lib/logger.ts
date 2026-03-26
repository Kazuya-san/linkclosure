import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function normalizeMeta(meta: LogMeta) {
  if (!meta) return undefined;

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      key === "error" ? serializeError(value) : value,
    ]),
  );
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: LogMeta) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...normalizeMeta(meta),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function createLogger(scope: string) {
  return {
    info(message: string, meta?: LogMeta) {
      writeLog("info", scope, message, meta);
    },
    warn(message: string, meta?: LogMeta) {
      writeLog("warn", scope, message, meta);
    },
    error(message: string, meta?: LogMeta) {
      writeLog("error", scope, message, meta);
    },
  };
}
