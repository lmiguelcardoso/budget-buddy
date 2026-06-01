type Level = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: Level;
  ts: string;
  ctx: string;
  msg: string;
  [key: string]: unknown;
}

function log(level: Level, ctx: string, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    ts: new Date().toISOString(),
    ctx,
    msg,
    ...meta,
  };

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export function createLogger(ctx: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => log("info", ctx, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", ctx, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", ctx, msg, meta),
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", ctx, msg, meta),
  };
}
