import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isExecutedModule, resolveServeConfig } from "./server.js";

test("standalone server config uses safe local defaults", () => {
  const config = resolveServeConfig({});

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
  assert.deepEqual(config.options, {});
});

test("standalone server config enables scoped static auth from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_API_KEY: "dev_secret",
    SCHEDULEOS_TENANT_ID: "tenant_local",
    SCHEDULEOS_WORKSPACE_ID: "workspace_local",
    SCHEDULEOS_USER_ID: "user_local"
  });

  assert.deepEqual(config.options.auth, {
    apiKeys: [
      {
        token: "dev_secret",
        tenantId: "tenant_local",
        workspaceId: "workspace_local",
        userId: "user_local",
        role: "EDITOR"
      }
    ]
  });
});

test("standalone server config supports explicit static auth role", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_API_KEY: "dev_secret",
    SCHEDULEOS_API_ROLE: "OWNER"
  });

  assert.equal(config.options.auth?.apiKeys[0]?.role, "OWNER");
});

test("standalone server config rejects the default development API key in production", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_API_KEY: "dev_scheduleos_change_me"
      }),
    /SCHEDULEOS_API_KEY must not use the default development value in production/
  );
});

test("standalone server config rejects production static auth with default scope", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_API_KEY: "prod_secret"
      }),
    /Production static API-key auth requires explicit non-demo scope IDs/
  );
});

test("standalone server config rejects production static auth with demo scope", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_API_KEY: "prod_secret",
        SCHEDULEOS_TENANT_ID: "tenant_demo",
        SCHEDULEOS_WORKSPACE_ID: "workspace_demo",
        SCHEDULEOS_USER_ID: "user_jordan"
      }),
    /Production static API-key auth requires explicit non-demo scope IDs/
  );
});

test("standalone server config rejects unauthenticated production public bind", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_HOST: "0.0.0.0"
      }),
    /Production public bind requires authentication/
  );
});

test("standalone server config rejects production public bind without request throttling", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_HOST: "0.0.0.0",
        SCHEDULEOS_API_KEY: "prod_secret",
        SCHEDULEOS_TENANT_ID: "tenant_prod_demo",
        SCHEDULEOS_WORKSPACE_ID: "workspace_prod_demo",
        SCHEDULEOS_USER_ID: "user_prod_demo"
      }),
    /Production public bind requires request throttling/
  );
});

test("standalone server config rejects production public bind without durable storage", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_HOST: "0.0.0.0",
        SCHEDULEOS_API_KEY: "prod_secret",
        SCHEDULEOS_TENANT_ID: "tenant_prod_demo",
        SCHEDULEOS_WORKSPACE_ID: "workspace_prod_demo",
        SCHEDULEOS_USER_ID: "user_prod_demo",
        SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS: "120"
      }),
    /Production public bind requires durable storage/
  );
});

test("standalone server config rejects production public bind without persisted throttling", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_HOST: "0.0.0.0",
        SCHEDULEOS_API_KEY: "prod_secret",
        SCHEDULEOS_TENANT_ID: "tenant_prod_demo",
        SCHEDULEOS_WORKSPACE_ID: "workspace_prod_demo",
        SCHEDULEOS_USER_ID: "user_prod_demo",
        SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS: "120",
        SCHEDULEOS_STORAGE_PATH: ".local/prod-scheduleos.json"
      }),
    /Production public bind requires persisted request throttling/
  );
});

test("standalone server config allows authenticated throttled production public bind", () => {
  const config = resolveServeConfig({
    NODE_ENV: "production",
    SCHEDULEOS_HOST: "0.0.0.0",
    SCHEDULEOS_API_KEY: "prod_secret",
    SCHEDULEOS_TENANT_ID: "tenant_prod_demo",
    SCHEDULEOS_WORKSPACE_ID: "workspace_prod_demo",
    SCHEDULEOS_USER_ID: "user_prod_demo",
    SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS: "120",
    SCHEDULEOS_RATE_LIMIT_PERSISTED: "true",
    SCHEDULEOS_STORAGE_PATH: ".local/prod-scheduleos.json"
  });

  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.options.storagePath, ".local/prod-scheduleos.json");
  assert.equal(config.options.auth?.apiKeys[0]?.token, "prod_secret");
  assert.deepEqual(config.options.rateLimit, {
    windowMs: 60_000,
    maxRequests: 120,
    persisted: true
  });
});

test("standalone server config enables hardened session cookie transport from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_API_KEY: "dev_secret",
    SCHEDULEOS_AUTH_SESSION_COOKIE: "true",
    SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE: "true"
  });

  assert.deepEqual(config.options.auth?.sessionCookie, {
    enabled: true,
    secure: true,
    csrfRequired: true
  });
});

test("standalone server config rejects insecure production session cookies", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_AUTH_SESSION_COOKIE: "true",
        SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE: "false"
      }),
    /SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE must be true when cookie auth is enabled in production/
  );
});

test("standalone server config enables local password reset token return from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN: "true",
    SCHEDULEOS_AUTH_PASSWORD_RESET_TTL_MS: "60000"
  });

  assert.deepEqual(config.options.auth?.passwordReset, {
    returnTokenForLocalDevelopment: true,
    ttlMs: 60_000
  });
});

test("standalone server config rejects production password reset token return", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        NODE_ENV: "production",
        SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN: "true"
      }),
    /SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN cannot be true in production/
  );
});

test("standalone server config preserves storage path custom host port", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_HOST: "0.0.0.0",
    SCHEDULEOS_PORT: "9090",
    SCHEDULEOS_STORAGE_PATH: ".local/scheduleos.dev.json"
  });

  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.port, 9090);
  assert.equal(config.options.storagePath, ".local/scheduleos.dev.json");
});

test("standalone server config enables local rate limits from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_RATE_LIMIT_WINDOW_MS: "300000",
    SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS: "60"
  });

  assert.deepEqual(config.options.rateLimit, {
    windowMs: 300_000,
    maxRequests: 60
  });
});

test("standalone server config uses local rate limit defaults when partially configured", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS: "90"
  });

  assert.deepEqual(config.options.rateLimit, {
    windowMs: 60_000,
    maxRequests: 90
  });
});

test("standalone server config enables persisted request throttles from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_RATE_LIMIT_PERSISTED: "true"
  });

  assert.deepEqual(config.options.rateLimit, {
    windowMs: 60_000,
    maxRequests: 120,
    persisted: true
  });
});

test("standalone server config enables trusted proxy rate-limit client header from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER: "x-forwarded-for"
  });

  assert.deepEqual(config.options.rateLimit, {
    windowMs: 60_000,
    maxRequests: 120,
    trustedProxyClientIpHeader: "x-forwarded-for"
  });
});

test("standalone server config enables import abuse alert thresholds from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS: "3",
    SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS: "10"
  });

  assert.deepEqual(config.options.importAbuseAlerts, {
    deniedEvents: 3,
    deniedRows: 10
  });
});

test("standalone server config enables public event delivery alert thresholds from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS: "4",
    SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_RETRYABLE_FAILED_ATTEMPTS: "2"
  });
  assert.deepEqual(config.options.publicEventDeliveryAlerts, {
    failedAttempts: 4,
    retryableFailedAttempts: 2
  });
});

test("standalone server config enables public event subscription health alert thresholds from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_FAILING_SUBSCRIPTIONS: "2",
    SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS: "1",
    SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_NEVER_DELIVERED_SUBSCRIPTIONS: "3"
  });

  assert.deepEqual(config.options.publicEventSubscriptionHealthAlerts, {
    failingSubscriptions: 2,
    exhaustedSubscriptions: 1,
    neverDeliveredSubscriptions: 3
  });
});

test("standalone server config enables public event dead-letter queue alert thresholds from env", () => {
  const config = resolveServeConfig({
    SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS: "4"
  });

  assert.deepEqual(config.options.publicEventDeadLetterQueueAlerts, {
    unreviewedItems: 4
  });
});

test("standalone server config rejects invalid ports", () => {
  assert.throws(
    () => resolveServeConfig({ SCHEDULEOS_PORT: "70000" }),
    /SCHEDULEOS_PORT must be an integer/
  );
  assert.throws(
    () => resolveServeConfig({ SCHEDULEOS_PORT: "not-a-port" }),
    /SCHEDULEOS_PORT must be an integer/
  );
});

test("standalone server config rejects invalid trusted proxy rate-limit header", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER: "forwarded"
      }),
    /SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER must be x-forwarded-for or x-real-ip/
  );
});

test("standalone server config rejects invalid import abuse alert thresholds", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS: "0"
      }),
    /SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS must be a positive integer/
  );
});

test("standalone server config rejects invalid public event delivery alert thresholds", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS: "0"
      }),
    /SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS must be a positive integer/
  );
});

test("standalone server config rejects invalid public event subscription health alert thresholds", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS:
          "0"
      }),
    /SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS must be a positive integer/
  );
});

test("standalone server config rejects invalid static auth role", () => {
  assert.throws(
    () =>
      resolveServeConfig({
        SCHEDULEOS_API_KEY: "dev_secret",
        SCHEDULEOS_API_ROLE: "SUPEROWNER"
      }),
    /SCHEDULEOS_API_ROLE must be OWNER, ADMIN, EDITOR, or VIEWER/
  );
});

test("standalone server detects direct execution paths with spaces", () => {
  const argvPath = "/tmp/ScheduleOS local/dist/server.js";
  assert.equal(
    isExecutedModule(pathToFileURL(resolve(argvPath)).toString(), argvPath),
    true
  );
});
