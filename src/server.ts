import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import {
  createApiServer,
  type ApiServerOptions,
  type StaticAuthRole
} from "./api.js";

export interface ServeConfig {
  host: string;
  port: number;
  options: ApiServerOptions;
}

export interface ServeIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;
const DEFAULT_DEVELOPMENT_API_KEY = "dev_scheduleos_change_me";
const PUBLIC_BIND_HOSTS = new Set(["0.0.0.0", "::"]);
const DEFAULT_SCOPE = {
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
};

export const resolveServeConfig = (
  env: Record<string, string | undefined>
): ServeConfig => {
  const host = nonEmpty(env.SCHEDULEOS_HOST) ?? DEFAULT_HOST;
  const port = parsePort(env.SCHEDULEOS_PORT);
  const options: ApiServerOptions = {};
  const storagePath = nonEmpty(env.SCHEDULEOS_STORAGE_PATH);
  if (storagePath !== undefined) options.storagePath = storagePath;

  const rateLimitWindowMs = parseOptionalPositiveInteger(
    env.SCHEDULEOS_RATE_LIMIT_WINDOW_MS,
    "SCHEDULEOS_RATE_LIMIT_WINDOW_MS"
  );
  const rateLimitMaxRequests = parseOptionalPositiveInteger(
    env.SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS,
    "SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS"
  );
const rateLimitPersisted = parseBoolean(
env.SCHEDULEOS_RATE_LIMIT_PERSISTED,
false
);
const rateLimitTrustedProxyHeader = parseOptionalTrustedProxyHeader(
env.SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER
);
  if (
    rateLimitWindowMs !== undefined ||
    rateLimitMaxRequests !== undefined ||
    rateLimitPersisted ||
    rateLimitTrustedProxyHeader !== undefined
) {
options.rateLimit = {
windowMs: rateLimitWindowMs ?? 60_000,
maxRequests: rateLimitMaxRequests ?? 120,
...(rateLimitPersisted ? { persisted: true } : {}),
...(rateLimitTrustedProxyHeader !== undefined
? { trustedProxyClientIpHeader: rateLimitTrustedProxyHeader }
      : {})
    };
  }

  const importAbuseAlertDeniedEvents = parseOptionalPositiveInteger(
    env.SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS,
    "SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS"
  );
  const importAbuseAlertDeniedRows = parseOptionalPositiveInteger(
    env.SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS,
    "SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS"
  );
  if (
    importAbuseAlertDeniedEvents !== undefined ||
    importAbuseAlertDeniedRows !== undefined
  ) {
    options.importAbuseAlerts = {
      ...(importAbuseAlertDeniedEvents !== undefined
        ? { deniedEvents: importAbuseAlertDeniedEvents }
        : {}),
      ...(importAbuseAlertDeniedRows !== undefined
        ? { deniedRows: importAbuseAlertDeniedRows }
        : {})
    };
  }
  const publicEventDeliveryAlertFailedAttempts = parseOptionalPositiveInteger(
    env.SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS,
    "SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS"
  );
  const publicEventDeliveryAlertRetryableFailedAttempts =
    parseOptionalPositiveInteger(
      env.SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_RETRYABLE_FAILED_ATTEMPTS,
      "SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_RETRYABLE_FAILED_ATTEMPTS"
    );
  if (
    publicEventDeliveryAlertFailedAttempts !== undefined ||
    publicEventDeliveryAlertRetryableFailedAttempts !== undefined
  ) {
    options.publicEventDeliveryAlerts = {
      ...(publicEventDeliveryAlertFailedAttempts !== undefined
        ? { failedAttempts: publicEventDeliveryAlertFailedAttempts }
        : {}),
      ...(publicEventDeliveryAlertRetryableFailedAttempts !== undefined
        ? {
            retryableFailedAttempts:
              publicEventDeliveryAlertRetryableFailedAttempts
          }
        : {})
    };
  }

  const publicEventSubscriptionHealthAlertFailingSubscriptions =
    parseOptionalPositiveInteger(
      env.SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_FAILING_SUBSCRIPTIONS,
      "SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_FAILING_SUBSCRIPTIONS"
    );
  const publicEventSubscriptionHealthAlertExhaustedSubscriptions =
    parseOptionalPositiveInteger(
      env.SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS,
      "SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS"
    );
  const publicEventSubscriptionHealthAlertNeverDeliveredSubscriptions =
    parseOptionalPositiveInteger(
      env.SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_NEVER_DELIVERED_SUBSCRIPTIONS,
      "SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_NEVER_DELIVERED_SUBSCRIPTIONS"
    );
  if (
    publicEventSubscriptionHealthAlertFailingSubscriptions !== undefined ||
    publicEventSubscriptionHealthAlertExhaustedSubscriptions !== undefined ||
    publicEventSubscriptionHealthAlertNeverDeliveredSubscriptions !== undefined
  ) {
  options.publicEventSubscriptionHealthAlerts = {
    ...(publicEventSubscriptionHealthAlertFailingSubscriptions !== undefined
      ? {
          failingSubscriptions:
            publicEventSubscriptionHealthAlertFailingSubscriptions
          }
        : {}),
      ...(publicEventSubscriptionHealthAlertExhaustedSubscriptions !== undefined
        ? {
            exhaustedSubscriptions:
              publicEventSubscriptionHealthAlertExhaustedSubscriptions
          }
        : {}),
      ...(publicEventSubscriptionHealthAlertNeverDeliveredSubscriptions !==
      undefined
        ? {
            neverDeliveredSubscriptions:
              publicEventSubscriptionHealthAlertNeverDeliveredSubscriptions
          }
      : {})
  };
}

const publicEventDeadLetterQueueAlertUnreviewedItems =
  parseOptionalPositiveInteger(
    env.SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS,
    "SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS"
  );
if (publicEventDeadLetterQueueAlertUnreviewedItems !== undefined) {
  options.publicEventDeadLetterQueueAlerts = {
    unreviewedItems: publicEventDeadLetterQueueAlertUnreviewedItems
  };
}

const token = nonEmpty(env.SCHEDULEOS_API_KEY);
  const staticAuthScope = {
    tenantId: nonEmpty(env.SCHEDULEOS_TENANT_ID) ?? DEFAULT_SCOPE.tenantId,
    workspaceId:
      nonEmpty(env.SCHEDULEOS_WORKSPACE_ID) ?? DEFAULT_SCOPE.workspaceId,
    userId: nonEmpty(env.SCHEDULEOS_USER_ID) ?? DEFAULT_SCOPE.userId
  };
  if (env.NODE_ENV === "production" && token === DEFAULT_DEVELOPMENT_API_KEY) {
    throw new Error(
      "SCHEDULEOS_API_KEY must not use the default development value in production."
    );
  }
  if (
    env.NODE_ENV === "production" &&
    token !== undefined &&
    isDefaultScope(staticAuthScope)
  ) {
    throw new Error(
      "Production static API-key auth requires explicit non-demo scope IDs."
    );
  }
  const sessionCookieEnabled = parseBoolean(
    env.SCHEDULEOS_AUTH_SESSION_COOKIE,
    false
  );
  const passwordResetReturnToken = parseBoolean(
    env.SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN,
    false
  );
  if (env.NODE_ENV === "production" && passwordResetReturnToken) {
    throw new Error(
      "SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN cannot be true in production."
    );
  }
  const passwordResetTtlMs = parseOptionalPositiveInteger(
    env.SCHEDULEOS_AUTH_PASSWORD_RESET_TTL_MS,
    "SCHEDULEOS_AUTH_PASSWORD_RESET_TTL_MS"
  );
  if (
    env.NODE_ENV === "production" &&
    isPublicBindHost(host) &&
    token === undefined &&
    !sessionCookieEnabled
  ) {
    throw new Error(
      "Production public bind requires authentication. Set SCHEDULEOS_API_KEY or enable SCHEDULEOS_AUTH_SESSION_COOKIE."
    );
  }
  if (
    env.NODE_ENV === "production" &&
    isPublicBindHost(host) &&
    options.rateLimit === undefined
  ) {
    throw new Error(
      "Production public bind requires request throttling. Set SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS or SCHEDULEOS_RATE_LIMIT_WINDOW_MS."
    );
  }
  if (
    env.NODE_ENV === "production" &&
    isPublicBindHost(host) &&
    storagePath === undefined
  ) {
    throw new Error(
      "Production public bind requires durable storage. Set SCHEDULEOS_STORAGE_PATH."
    );
  }
  if (
    env.NODE_ENV === "production" &&
    isPublicBindHost(host) &&
    !options.rateLimit?.persisted
  ) {
    throw new Error(
      "Production public bind requires persisted request throttling. Set SCHEDULEOS_RATE_LIMIT_PERSISTED=true."
    );
  }
  if (
    token !== undefined ||
    sessionCookieEnabled ||
    passwordResetReturnToken ||
    passwordResetTtlMs !== undefined
  ) {
    options.auth = {
      apiKeys:
        token !== undefined
          ? [
              {
                token,
                tenantId:
                  nonEmpty(env.SCHEDULEOS_TENANT_ID) ?? DEFAULT_SCOPE.tenantId,
                workspaceId:
                  nonEmpty(env.SCHEDULEOS_WORKSPACE_ID) ??
                  DEFAULT_SCOPE.workspaceId,
                userId: nonEmpty(env.SCHEDULEOS_USER_ID) ?? DEFAULT_SCOPE.userId,
                role: parseApiRole(env.SCHEDULEOS_API_ROLE)
              }
            ]
          : []
  };
  if (sessionCookieEnabled) {
      const sessionCookieSecure = parseBoolean(
        env.SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE,
        false
      );
      if (env.NODE_ENV === "production" && !sessionCookieSecure) {
        throw new Error(
          "SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE must be true when cookie auth is enabled in production."
        );
      }
      options.auth.sessionCookie = {
        enabled: true,
        secure: sessionCookieSecure,
        csrfRequired: true
      };
    }
    if (passwordResetReturnToken || passwordResetTtlMs !== undefined) {
      options.auth.passwordReset = {
        returnTokenForLocalDevelopment: passwordResetReturnToken,
        ...(passwordResetTtlMs !== undefined ? { ttlMs: passwordResetTtlMs } : {})
      };
    }
  }

  return { host, port, options };
};

export const startScheduleOsServer = (
  config: ServeConfig,
  io: ServeIO = defaultServeIO
): Server => {
  const server = createApiServer(config.options);
  server.on("error", (error) => {
    io.stderr(error instanceof Error ? error.message : String(error));
  });
  server.listen(config.port, config.host, () => {
    io.stdout(
      `ScheduleOS listening on http://${config.host}:${config.port}/app`
    );
  });
  return server;
};

export const isExecutedModule = (
  moduleUrl: string,
  argvPath: string | undefined
): boolean => {
  if (argvPath === undefined) return false;
  return moduleUrl === pathToFileURL(resolve(argvPath)).toString();
};

const parsePort = (value: string | undefined): number => {
  const raw = nonEmpty(value);
  if (raw === undefined) return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SCHEDULEOS_PORT must be an integer from 1 to 65535.");
  }
  return port;
};

const parseOptionalPositiveInteger = (
  value: string | undefined,
  label: string
): number | undefined => {
  const raw = nonEmpty(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
};

const parseApiRole = (value: string | undefined): StaticAuthRole => {
  const role = nonEmpty(value) ?? "EDITOR";
  if (
    role !== "OWNER" &&
    role !== "ADMIN" &&
    role !== "EDITOR" &&
    role !== "VIEWER"
  ) {
    throw new Error("SCHEDULEOS_API_ROLE must be OWNER, ADMIN, EDITOR, or VIEWER.");
  }
  return role;
};

const parseOptionalTrustedProxyHeader = (
  value: string | undefined
): "x-forwarded-for" | "x-real-ip" | undefined => {
  const header = nonEmpty(value)?.toLowerCase();
  if (header === undefined) return undefined;
  if (header === "x-forwarded-for" || header === "x-real-ip") return header;
  throw new Error(
    "SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER must be x-forwarded-for or x-real-ip."
  );
};

const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  const normalized = nonEmpty(value)?.toLowerCase();
  if (normalized === undefined) return defaultValue;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new Error("Boolean environment values must be true or false.");
};

const nonEmpty = (value: string | undefined): string | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isPublicBindHost = (host: string): boolean =>
  PUBLIC_BIND_HOSTS.has(host.trim().toLowerCase());

const isDefaultScope = (scope: typeof DEFAULT_SCOPE): boolean =>
  scope.tenantId === DEFAULT_SCOPE.tenantId ||
  scope.workspaceId === DEFAULT_SCOPE.workspaceId ||
  scope.userId === DEFAULT_SCOPE.userId;

const defaultServeIO: ServeIO = {
  stdout(message) {
    console.log(message);
  },
  stderr(message) {
    console.error(message);
  }
};

if (isExecutedModule(import.meta.url, process.argv[1])) {
  try {
    const config = resolveServeConfig(process.env);
    const server = startScheduleOsServer(config);
    process.on("SIGTERM", () => {
      server.close(() => {
        process.exit(0);
      });
    });
    process.on("SIGINT", () => {
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    defaultServeIO.stderr(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
