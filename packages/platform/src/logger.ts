import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export type { Logger };

export interface LoggerSettings {
  service: string;
  level: string;
  /** Human-readable, coloured output for local development. */
  pretty?: boolean;
}

/**
 * @param destination Where log lines go. Defaults to stdout; tests pass a collector.
 */
export function createLogger(settings: LoggerSettings, destination?: DestinationStream): Logger {
  const options: LoggerOptions = {
    level: settings.level,
    base: { service: settings.service },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      censor: '[redacted]',
    },
  };

  if (settings.pretty) {
    return pino({ ...options, transport: { target: 'pino-pretty', options: { colorize: true } } });
  }

  const jsonOptions: LoggerOptions = {
    ...options,
    formatters: { level: (label) => ({ level: label }) }, // "info", not 30
  };
  return destination ? pino(jsonOptions, destination) : pino(jsonOptions);
}
