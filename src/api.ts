import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { URL } from "node:url";
import { createSchedule } from "./scheduler.js";
import {
  exportCalendarEventsToIcs,
  exportScheduleBlocksToIcs,
  parseIcsCalendarEventImport
} from "./ics.js";
import { renderScheduleOsAppHtml } from "./web-app.js";
import { createApiStore } from "./store.js";
import type { ApiStore } from "./store.js";
import {
  createStoreRepositories,
  RepositoryForbiddenError,
  RepositoryNotFoundError,
  RepositoryValidationError
} from "./repositories.js";
import type {
  CalendarEventRepository,
  IdempotencyRepository,
  RepositoryActor,
  ScheduleOSRepositories,
  TaskRepository
} from "./repositories.js";
import type {
  AuthUser,
  AuthSession,
  CalendarEvent,
  CreateScheduleInput,
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  IdempotencyRecord,
  ImportThrottleOperation,
  ImportThrottleRecord,
  IntegrationState,
  Priority,
  RequestThrottleRecord,
  SchedulePlan,
  SchedulingTask,
  TimeBlock,
  WorkingHours,
  WorkspaceMembership,
  WorkspaceRole
} from "./domain.js";
import {
  calculateRetentionCutoffs,
  type RetentionPolicyCategory
} from "./retention-policy.js";
import {
  requireDestructiveConfirmation,
  timedScopedConfirmation
} from "./destructive-approval.js";

export interface ApiServerOptions {
  storagePath?: string;
  auth?: StaticAuthConfig;
  webhookSecrets?: Record<string, WebhookSecretConfig>;
  publicEventDeliveryTargets?: Record<string, PublicEventDeliveryTargetConfig>;
  managedSecrets?: ManagedSecretProvider;
  webhookReplayWindowMs?: number;
  webhookReplayWindows?: Record<string, number>;
  maxRequestBodyBytes?: number;
  rateLimit?: RateLimitConfig;
  importThrottle?: ImportThrottleConfig;
  importAbuseAlerts?: ImportAbuseAlertConfig;
  publicEventDeliveryAlerts?: PublicEventDeliveryAlertConfig;
  publicEventSubscriptionHealthAlerts?: PublicEventSubscriptionHealthAlertConfig;
  publicEventDeadLetterQueueAlerts?: PublicEventDeadLetterQueueAlertConfig;
}

export interface PublicEventDeliveryTargetConfig {
  targetUrl?: string;
  secret?: string;
  targetUrlSecretRef?: string;
  signingSecretRef?: string;
}

export type ManagedSecretPurpose =
  | "PUBLIC_EVENT_TARGET_URL"
  | "PUBLIC_EVENT_SIGNING_SECRET";

export interface ManagedSecretResolveRequest extends Scope {
  secretRef: string;
  purpose: ManagedSecretPurpose;
}

export interface ManagedSecretProvider {
  resolveSecret(
    request: ManagedSecretResolveRequest
  ): string | undefined | Promise<string | undefined>;
}

type ManagedSecretResolutionOutcome =
  | "RESOLVED"
  | "UNAVAILABLE"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "REJECTED_SCOPE";

type ManagedSecretResolutionAuditRecorder = (
  event: AuditEvent
) => void;

export interface PublicEventDeliveryAlertConfig {
  failedAttempts?: number;
  retryableFailedAttempts?: number;
}

export interface PublicEventSubscriptionHealthAlertConfig {
  failingSubscriptions?: number;
  exhaustedSubscriptions?: number;
  neverDeliveredSubscriptions?: number;
}

export interface PublicEventDeadLetterQueueAlertConfig {
  unreviewedItems?: number;
}

const SCHEDULEOS_EVENT_ENVELOPE = {
 name: "ScheduleOSEvent",
 requiredFields: [
  "id",
  "type",
  "version",
  "tenantId",
  "workspaceId",
  "userId",
  "occurredAt",
  "idempotencyKey",
  "source",
  "subject",
  "data"
 ],
 requiredProperties:
  "Events must be versioned, tenant-scoped, workspace-scoped where applicable, idempotent, timestamped, and minimal on private content."
} as const;

const SCHEDULEOS_PUBLIC_EVENT_TYPES = [
 "task.imported",
 "task.scheduling_requested",
 "task.scheduled",
 "task.unscheduled",
 "task.deadline_at_risk",
 "task.completed",
 "block.created",
 "block.moved",
 "block.locked",
 "block.unlocked",
 "block.completed",
 "block.missed",
 "schedule.created",
 "schedule.accepted",
 "schedule.rejected",
 "schedule.replanned",
 "schedule.capacity_exceeded",
 "schedule.constraint_violated",
 "calendar.event_imported",
 "calendar.event_changed",
 "calendar.sync_failed"
].map((type) => ({
 type,
 version: "v1",
 privacy: "content-minimized",
 idempotency: "required",
 scope: ["tenantId", "workspaceId", "userId"]
}));

const publicEventCatalog = () => ({
 envelope: SCHEDULEOS_EVENT_ENVELOPE,
 data: SCHEDULEOS_PUBLIC_EVENT_TYPES,
 delivery: {
  internal: "Current local foundations expose audit events for operational proof.",
    webhooks:
      "Current local/self-host explicit delivery uses signed ScheduleOSEvent envelopes and subscription metadata can be registered without exposing secrets or raw target URLs. Production subscription delivery workers, persistent retry execution, and hosted operations remain release blockers."
 },
 releaseBoundary:
    "Catalog is a public contract foundation. Production webhook delivery operations remain a release blocker."
});

type WebhookSecretConfig = string | string[];

export interface StaticAuthConfig {
  apiKeys: StaticAuthPrincipal[];
  sessionCookie?: SessionCookieConfig;
  loginBackoff?: LoginBackoffConfig;
  passwordReset?: PasswordResetConfig;
}
export interface PasswordResetConfig {
  ttlMs?: number;
  returnTokenForLocalDevelopment?: boolean;
}

export interface AuthPrincipal extends Scope {
  role?: StaticAuthRole;
  sessionId?: string;
  authMethod?: "STATIC" | "BEARER_SESSION" | "COOKIE_SESSION";
  csrfToken?: string;
}

export interface StaticAuthPrincipal extends AuthPrincipal {
  token: string;
}

export type StaticAuthRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export interface SessionCookieConfig {
  enabled?: boolean;
  name?: string;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
  csrfRequired?: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  persisted?: boolean;
  trustedProxyClientIpHeader?: "x-forwarded-for" | "x-real-ip";
}

export interface LoginBackoffConfig {
  windowMs: number;
  maxFailedAttempts: number;
}

export interface ImportThrottleConfig {
  windowMs: number;
  maxRows: number;
  sourcePolicies?: Record<string, ImportThrottlePolicy>;
  enforceProviderPolicies?: boolean;
}

export interface ImportThrottlePolicy {
  windowMs: number;
  maxRows: number;
}

export interface ImportAbuseAlertConfig {
  deniedEvents?: number;
  deniedRows?: number;
}

interface ProviderImportPolicy {
  sourceSystem: string;
  operation: string;
  recommendedPolicy: ImportThrottlePolicy;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  notes: string;
}

interface PublicEventWebhookDeliveryRequest extends Scope {
  targetUrl: string;
  secret: string;
  type?: string;
  sourceSystem?: string;
}

interface PublicEventWebhookDeliveryRetryDueRequest
  extends PublicEventWebhookDeliveryRequest {
  asOf: string;
}

interface PublicEventWebhookSubscriptionDeliveryRequest extends Scope {
  subscriptionId: string;
  targetUrl?: string;
  secret?: string;
}

interface PublicEventWebhookSubscriptionDeliverReadyRequest extends Scope {
  type?: string;
  sourceSystem?: string;
  dryRun?: boolean;
  maxSubscriptions?: number;
  maxEvents?: number;
}

interface PublicEventWebhookDeliveryAttempt {
  deliveryId: string;
  eventId: string;
  type: string;
  targetUrl: string;
  status: "DELIVERED" | "FAILED";
  httpStatus?: number;
  errorCode?: string;
  retryable: boolean;
  attemptNumber: number;
  nextRetryAt?: string;
  occurredAt: string;
}

interface PublicEventWebhookDeliveryAttemptView {
  deliveryId: string;
  eventId: string;
  type: string;
  status: "DELIVERED" | "FAILED";
  targetUrlHash: string;
  occurredAt: string;
  httpStatus?: number;
  errorCode?: string;
  retryable: boolean;
  attemptNumber: number;
  nextRetryAt?: string;
}

interface PublicEventWebhookExhaustedDeliveryView
  extends PublicEventWebhookDeliveryAttemptView {
  reason: "retry_limit_reached" | "non_retryable_failure" | "retry_schedule_missing";
}

type PublicEventWebhookDeadLetterDecision =
  | "ACKNOWLEDGED"
  | "REPLAY_REQUESTED"
  | "DROPPED";

interface PublicEventWebhookDeadLetterReviewRequest extends Scope {
  deliveryId: string;
  eventId: string;
  targetUrlHash: string;
  maxAttempts: number;
  decision: PublicEventWebhookDeadLetterDecision;
  note?: string;
}

interface PublicEventWebhookDeadLetterReviewView {
  id: string;
  deliveryId: string;
  eventId: string;
  targetUrlHash: string;
  decision: PublicEventWebhookDeadLetterDecision;
  exhaustionReason: PublicEventWebhookExhaustedDeliveryView["reason"];
  maxAttempts: number;
  reviewedAt: string;
  note?: string;
}

interface PublicEventWebhookDeadLetterQueueView
  extends PublicEventWebhookExhaustedDeliveryView {
  reviewStatus: "UNREVIEWED" | "REVIEWED";
  latestReview?: PublicEventWebhookDeadLetterReviewView;
}

interface PublicEventWebhookDeliveryTargetSummary {
  targetUrlHash: string;
  totalCount: number;
  deliveredCount: number;
  failedCount: number;
  retryableFailedCount: number;
  latestAttemptAt: string;
  latestStatus: "DELIVERED" | "FAILED";
  nextRetryAt?: string;
}

interface PublicEventWebhookSubscriptionRequest extends Scope {
  targetUrl?: string;
  secret?: string;
  deliveryTargetRef?: string;
  eventTypes?: string[];
  sourceSystem?: string;
  status?: "ENABLED" | "DISABLED";
}

interface PublicEventWebhookSubscriptionStatusRequest extends Scope {
  subscriptionId: string;
  status: "ENABLED" | "DISABLED";
}

interface PublicEventWebhookSubscriptionView extends Scope {
  id: string;
  targetUrlHash: string;
  secretHash: string;
  deliveryTargetRefHash?: string;
  eventTypes: string[];
  sourceSystem?: string;
  status: "ENABLED" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

type PublicEventWebhookSubscriptionHealthStatus =
  | "HEALTHY"
  | "FAILING"
  | "EXHAUSTED"
  | "NEVER_DELIVERED"
  | "DISABLED";

interface PublicEventWebhookSubscriptionHealthView {
  subscriptionId: string;
  status: PublicEventWebhookSubscriptionView["status"];
  targetUrlHash: string;
  deliveryTargetRefHash?: string;
  eventTypes: string[];
  sourceSystem?: string;
  lastAttemptAt?: string;
  latestStatus?: PublicEventWebhookDeliveryAttemptView["status"];
  failedCount: number;
  deliveredCount: number;
  retryableFailedCount: number;
  exhaustedCount: number;
  healthStatus: PublicEventWebhookSubscriptionHealthStatus;
}

interface SyncCheckpointRequest extends Scope {
  sourceSystem: string;
  externalAccountId: string;
  providerEventId: string;
  syncCursor: string;
  observedAt: string;
  status: IntegrationState["status"];
}

interface IntegrationRevocationRequest extends Scope {
  sourceSystem: string;
  externalAccountId: string;
  providerEventId: string;
  revokedAt: string;
  reason?: string;
}

interface RetentionCleanupRequest extends Scope {
  asOf: string;
  apply?: boolean;
  confirm?: string;
}

type RetentionCountMap = Partial<Record<RetentionPolicyCategory, number>>;

interface LocalRetentionCleanupResult {
  asOf: string;
  dryRun: boolean;
  requiredConfirmation: string;
  eligible: RetentionCountMap;
  deleted: RetentionCountMap;
  reviewDue: RetentionCountMap;
}

interface RateLimitBucket {
  windowStartedAt: number;
  count: number;
}

const DEFAULT_WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const DEFAULT_AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_LOGIN_BACKOFF_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LOGIN_BACKOFF_MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const MAX_PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000;

export const createApiServer = (options: ApiServerOptions = {}): Server => {
  const storeController = createApiStore(options.storagePath);
  const store = storeController.state;
  const persist = storeController.persist;
  const repositories = createStoreRepositories(storeController);
  const maxRequestBodyBytes =
    options.maxRequestBodyBytes ?? DEFAULT_MAX_REQUEST_BODY_BYTES;
  validateWebhookSecretsConfig(options.webhookSecrets);
  validateWebhookReplayWindowsConfig(options.webhookReplayWindows);
  validateRateLimitConfig(options.rateLimit);
  validateImportThrottleConfig(options.importThrottle);
  validateImportAbuseAlertConfig(options.importAbuseAlerts);
  validatePublicEventDeliveryAlertConfig(options.publicEventDeliveryAlerts);
validatePublicEventSubscriptionHealthAlertConfig(
options.publicEventSubscriptionHealthAlerts
);
validatePublicEventDeadLetterQueueAlertConfig(
options.publicEventDeadLetterQueueAlerts
);
validateLoginBackoffConfig(options.auth?.loginBackoff);
  validatePasswordResetConfig(options.auth?.passwordReset);
  const rateLimitBuckets = new Map<string, RateLimitBucket>();

  return createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://scheduleos.local");
      enforceRateLimit(
        request,
        options.rateLimit,
        rateLimitBuckets,
        repositories,
        store,
        options.auth
      );

      if (method === "GET" && url.pathname === "/healthz") {
        return sendJson(response, 200, { ok: true, service: "scheduleos-api" });
      }

    if (method === "GET" && url.pathname === "/api/events/catalog") {
      return sendJson(response, 200, publicEventCatalog());
    }

    if (method === "GET" && (url.pathname === "/" || url.pathname === "/app")) {
      return sendHtml(response, 200, renderScheduleOsAppHtml());
    }

  if (method === "POST" && url.pathname === "/api/auth/login") {
      const loginRequest = parseAuthSessionLoginRequest(
        await readJson(request, maxRequestBodyBytes)
      );
      const loginBackoff = resolvedLoginBackoffConfig(options.auth?.loginBackoff);
      enforceLoginAttemptBackoff(repositories, loginBackoff, loginRequest);
  const user = store.authUsers.find(
    (candidate) =>
      candidate.tenantId === loginRequest.tenantId &&
      candidate.id === loginRequest.userId
  );
  const activeMembership = store.workspaceMemberships.find(
    (candidate) =>
      candidate.tenantId === loginRequest.tenantId &&
      candidate.workspaceId === loginRequest.workspaceId &&
      candidate.userId === loginRequest.userId &&
      candidate.status === "ACTIVE"
  );
  if (
    user === undefined ||
    user.status !== "ACTIVE" ||
    activeMembership === undefined ||
    !verifyCredential(loginRequest.password, user.credentialHash)
  ) {
    recordFailedLoginAttempt(repositories, loginBackoff, loginRequest);
    throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Credentials invalid."
    );
  }
  resetLoginAttemptBackoff(repositories, loginRequest);
  const { session, token } = createAuthSession(loginRequest);
    const savedSession = repositories.auth.upsertSession(
      { kind: "system" },
      session
    );
    const auditEvent = repositories.auditEvents.append(
      { kind: "system" },
      authSessionAuditEvent(savedSession, "AUTH_SESSION_CREATED")
    );
    const csrfToken = csrfTokenForSessionToken(token);
    if (sessionCookieEnabled(options.auth?.sessionCookie)) {
      response.setHeader(
        "set-cookie",
        sessionCookieHeader(token, options.auth?.sessionCookie)
      );
    }
    return sendJson(
      response,
      201,
      stripUndefined({
        data: publicAuthSession(savedSession),
        token,
        csrfToken: sessionCookieEnabled(options.auth?.sessionCookie)
          ? csrfToken
          : undefined,
        auditEvent
      })
 );
 }

 if (method === "POST" && url.pathname === "/api/auth/password-reset-requests") {
 const resetRequest = parseAuthPasswordResetRequestCreate(
 await readJson(request, maxRequestBodyBytes)
      );
      const maybeReset = createPasswordResetTokenIfEligible(
        repositories,
        resetRequest,
        resolvedPasswordResetConfig(options.auth?.passwordReset)
      );
      if (maybeReset) {
        const resetRecord = repositories.auth.upsertPasswordResetToken(
          { kind: "system" },
          maybeReset.record
        );
        const auditEvent = repositories.auditEvents.append(
          { kind: "system" },
          authPasswordResetRequestedAuditEvent(resetRecord)
        );
        return sendJson(
          response,
          202,
          stripUndefined({
            data: {
              status: "IF_ELIGIBLE_RESET_TOKEN_CREATED",
              expiresAt: resetRecord.expiresAt
            },
            resetToken: options.auth?.passwordReset?.returnTokenForLocalDevelopment
              ? maybeReset.token
 : undefined,
 auditEvent
 })
 );
 }
 return sendJson(response, 202, {
 data: {
 status: "IF_ELIGIBLE_RESET_TOKEN_CREATED"
 }
 });
 }

 if (method === "POST" && url.pathname === "/api/auth/password-reset") {
 const resetConfirm = parseAuthPasswordResetConfirmRequest(
 await readJson(request, maxRequestBodyBytes)
 );
      if (resetConfirm.newPassword.length < 12) {
        throw validationError("newPassword must be at least 12 characters.");
      }
      const now = new Date().toISOString();
      const resetRecord = consumeValidPasswordResetToken(
        repositories,
        resetConfirm,
        now
      );
 if (!resetRecord) {
 throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token invalid.");
 }
 const user = repositories.auth.getUser(
 { kind: "system" },
 resetConfirm.tenantId,
 resetConfirm.userId
 );
 if (user.status !== "ACTIVE") {
 throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token invalid.");
 }
 assertActiveAuthSubject(repositories, { kind: "system" }, resetConfirm);
 const savedUser = repositories.auth.upsertUser(
 { kind: "system" },
 {
 ...user,
 credentialHash: createCredentialHash(resetConfirm.newPassword),
 updatedAt: now
 }
 );
 const nowMs = new Date(now).getTime();
 const revokedSessions = repositories.auth
 .listSessions({ kind: "system" }, resetConfirm)
 .filter(
 (session) =>
 session.revokedAt === undefined &&
 new Date(session.expiresAt).getTime() > nowMs
 )
 .map((session) =>
 repositories.auth.revokeSession({ kind: "system" }, session.id, now)
 );
 const auditEvent = repositories.auditEvents.append(
 { kind: "system" },
 authPasswordResetCompletedAuditEvent(
 savedUser,
 resetRecord,
 revokedSessions.length
 )
 );
 return sendJson(response, 200, {
 data: publicAuthUser(savedUser),
 revokedSessions: revokedSessions.map(publicAuthSession),
 auditEvent
 });
 }

 const principal = authenticate(request, options.auth, repositories, store);
enforceCookieCsrf(request, principal, options.auth);
const actor = repositoryActor(principal);

      const authSessionRouteMatch = matchPath(
        url.pathname,
        /^\/api\/auth\/sessions\/([^/]+)$/
      );
if (authSessionRouteMatch && method === "DELETE") {
requireAuthAdmin(principal, principal ?? undefined);
const sessionId = decodeURIComponent(
requirePathCapture(authSessionRouteMatch, 1)
);
        const revokedSession = repositories.auth.revokeSession(
          actor,
          sessionId,
          new Date().toISOString()
        );
        const auditEvent = repositories.auditEvents.append(
          actor,
          authSessionAuditEvent(revokedSession, "AUTH_SESSION_REVOKED")
        );
        return sendJson(response, 200, {
          data: publicAuthSession(revokedSession),
      auditEvent
    });
  }

  if (method === "DELETE" && url.pathname === "/api/auth/session") {
    const sessionPrincipal = requireSessionPrincipal(principal);
    const revokedSession = repositories.auth.revokeSession(
      actor,
      sessionPrincipal.sessionId,
      new Date().toISOString()
    );
    const auditEvent = repositories.auditEvents.append(
      actor,
      authSessionAuditEvent(revokedSession, "AUTH_SESSION_REVOKED")
    );
    if (sessionCookieEnabled(options.auth?.sessionCookie)) {
      response.setHeader(
        "set-cookie",
        clearedSessionCookieHeader(options.auth?.sessionCookie)
      );
    }
    return sendJson(response, 200, {
      data: publicAuthSession(revokedSession),
      auditEvent
    });
  }

  if (method === "POST" && url.pathname === "/api/auth/password") {
    const sessionPrincipal = requireSessionPrincipal(
      principal,
      "Current-session password change requires session authentication."
    );
    const passwordRequest = parseAuthPasswordChangeRequest(
      await readJson(request, maxRequestBodyBytes)
    );
    const user = repositories.auth.getUser(
      actor,
      sessionPrincipal.tenantId,
      sessionPrincipal.userId
    );
    if (
      user.status !== "ACTIVE" ||
      !verifyCredential(passwordRequest.currentPassword, user.credentialHash)
    ) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Credentials invalid.");
    }
    const updatedAt = new Date().toISOString();
    const savedUser = repositories.auth.upsertUser(actor, {
      ...user,
      credentialHash: createCredentialHash(passwordRequest.newPassword),
      updatedAt
    });
    const revokedAt = updatedAt;
    const nowMs = new Date(updatedAt).getTime();
    const revokedSessions = repositories.auth
      .listSessions(actor, sessionPrincipal)
      .filter(
        (session) =>
          session.revokedAt === undefined &&
          new Date(session.expiresAt).getTime() > nowMs
      )
      .map((session) =>
        repositories.auth.revokeSession(actor, session.id, revokedAt)
      );
    const auditEvent = repositories.auditEvents.append(
      actor,
      authCredentialRotatedAuditEvent(
        sessionPrincipal,
        savedUser,
        revokedSessions.length
      )
    );
    if (sessionCookieEnabled(options.auth?.sessionCookie)) {
      response.setHeader(
        "set-cookie",
        clearedSessionCookieHeader(options.auth?.sessionCookie)
      );
    }
    return sendJson(response, 200, {
      data: publicAuthUser(savedUser),
      revokedSessions: revokedSessions.map(publicAuthSession),
      auditEvent
    });
  }

  assertMethodAllowed(principal, method);

  if (method === "POST" && url.pathname === "/api/auth/users") {
    requireAuthAdmin(principal, principal ?? undefined);
    const user = parseAuthUserUpsertRequest(
      await readJson(request, maxRequestBodyBytes)
        );
        requireSameTenantPrincipal(principal, user.tenantId);
        const savedUser = repositories.auth.upsertUser({ kind: "system" }, user);
        const auditEvent = repositories.auditEvents.append(
          { kind: "system" },
          authUserAuditEvent(principal, savedUser)
        );
        return sendJson(response, 201, {
          data: publicAuthUser(savedUser),
          auditEvent
    });
  }

  const authUserPasswordRouteMatch = matchPath(
    url.pathname,
    /^\/api\/auth\/users\/([^/]+)\/password$/
  );
  if (authUserPasswordRouteMatch && method === "POST") {
    const targetUserId = decodeURIComponent(
      requirePathCapture(authUserPasswordRouteMatch, 1)
    );
    const resetRequest = parseAuthPasswordResetRequest(
      await readJson(request, maxRequestBodyBytes)
    );
    requireAuthAdmin(principal, resetRequest);
    const targetUser = repositories.auth.getUser(
      { kind: "system" },
      resetRequest.tenantId,
      targetUserId
    );
    const targetMembership = repositories.auth.getMembership(
      { kind: "system" },
      { ...resetRequest, userId: targetUserId }
    );
    if (targetMembership.role === "OWNER" || targetMembership.role === "ADMIN") {
      requireAuthOwner(principal, resetRequest);
    }
    const updatedAt = new Date().toISOString();
    const savedUser = repositories.auth.upsertUser(
      { kind: "system" },
      {
        ...targetUser,
        credentialHash: createCredentialHash(resetRequest.newPassword),
        updatedAt
      }
    );
    const nowMs = new Date(updatedAt).getTime();
    const revokedSessions = repositories.auth
      .listSessions({ kind: "system" }, { ...resetRequest, userId: targetUserId })
      .filter(
        (session) =>
          session.revokedAt === undefined &&
          new Date(session.expiresAt).getTime() > nowMs
      )
      .map((session) =>
        repositories.auth.revokeSession({ kind: "system" }, session.id, updatedAt)
      );
    const auditEvent = repositories.auditEvents.append(
      { kind: "system" },
      authCredentialResetAuditEvent(
        requireAuthenticatedPrincipal(principal),
        savedUser,
        resetRequest.workspaceId,
        revokedSessions.length
      )
    );
    return sendJson(response, 200, {
      data: publicAuthUser(savedUser),
      revokedSessions: revokedSessions.map(publicAuthSession),
      auditEvent
    });
  }

  const authUserRouteMatch = matchPath(
    url.pathname,
    /^\/api\/auth\/users\/([^/]+)$/
      );
      if (authUserRouteMatch && method === "GET") {
        requireAuthAdmin(principal, principal ?? undefined);
        const tenantId = requiredQuery(url, "tenantId");
        requireSameTenantPrincipal(principal, tenantId);
        const userId = decodeURIComponent(requirePathCapture(authUserRouteMatch, 1));
        const user = repositories.auth.getUser({ kind: "system" }, tenantId, userId);
        return sendJson(response, 200, { data: publicAuthUser(user) });
      }

      if (method === "POST" && url.pathname === "/api/auth/memberships") {
        const membership = parseWorkspaceMembershipUpsertRequest(
          await readJson(request, maxRequestBodyBytes)
        );
        requireAuthAdmin(principal, membership);
        if (membership.role === "OWNER" || membership.role === "ADMIN") {
          requireAuthOwner(principal, membership);
        }
        repositories.auth.getUser(
          { kind: "system" },
          membership.tenantId,
          membership.userId
        );
        const savedMembership = repositories.auth.upsertMembership(
          { kind: "system" },
          membership
        );
        const auditEvent = repositories.auditEvents.append(
          { kind: "system" },
          workspaceMembershipAuditEvent(principal, savedMembership)
        );
        return sendJson(response, 201, {
          data: savedMembership,
          auditEvent
        });
      }

      if (method === "GET" && url.pathname === "/api/auth/memberships") {
        const tenantId = requiredQuery(url, "tenantId");
        const userId = requiredQuery(url, "userId");
        requireSameTenantPrincipal(principal, tenantId);
        requireAuthAdmin(principal, principal ?? undefined);
        const memberships = repositories.auth.listMemberships(
          { kind: "system" },
          tenantId,
          userId
        );
        return sendJson(response, 200, { data: memberships });
      }

      if (method === "POST" && url.pathname === "/api/auth/sessions") {
        requireAuthenticatedPrincipal(principal);
        const sessionRequest = parseAuthSessionCreateRequest(
          await readJson(request, maxRequestBodyBytes)
        );
        assertAuthorized(principal, sessionRequest);
        assertActiveAuthSubject(repositories, actor, sessionRequest);
        const { session, token } = createAuthSession(sessionRequest);
        const savedSession = repositories.auth.upsertSession(actor, session);
    const auditEvent = repositories.auditEvents.append(
      actor,
      authSessionAuditEvent(savedSession, "AUTH_SESSION_CREATED")
    );
    const csrfToken = csrfTokenForSessionToken(token);
    if (sessionCookieEnabled(options.auth?.sessionCookie)) {
      response.setHeader(
        "set-cookie",
        sessionCookieHeader(token, options.auth?.sessionCookie)
      );
    }
    return sendJson(response, 201, stripUndefined({
      data: publicAuthSession(savedSession),
      token,
      csrfToken: sessionCookieEnabled(options.auth?.sessionCookie)
        ? csrfToken
        : undefined,
      auditEvent
    }));
  }

    if (method === "GET" && url.pathname === "/api/audit-events") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      const auditEvents = repositories.auditEvents
        .list(actor, scope)
        .filter((event) => matchesAuditEventFilters(event, url));
      return sendJson(response, 200, {
        data: auditEvents
      });
    }

    if (method === "GET" && url.pathname === "/api/events") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      const events = repositories.auditEvents
        .list(actor, scope)
        .map(publicEventFromAuditEvent)
        .filter((event): event is PublicScheduleOSEvent => event !== undefined)
        .filter((event) => matchesPublicEventFilters(event, url));
      return sendJson(response, 200, {
        data: events,
        releaseBoundary:
          "Local read model foundation only. Production signed webhook delivery remains a release blocker."
      });
    }

    if (
      method === "GET" &&
      url.pathname === "/api/events/webhook-deliveries/summary"
    ) {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      const attempts = repositories.auditEvents
        .list(actor, scope)
        .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
        .filter(
          (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
            attempt !== undefined
        )
        .filter((attempt) =>
          matchesPublicEventWebhookDeliveryAttemptFilters(attempt, url)
        );
      const targetSummaries = publicEventWebhookDeliveryTargetSummaries(attempts);
      const failedCount = attempts.filter((attempt) => attempt.status === "FAILED")
        .length;
      const retryableFailedCount = attempts.filter(
        (attempt) => attempt.status === "FAILED" && attempt.retryable
      ).length;
    return sendJson(response, 200, {
      summary: {
        totalCount: attempts.length,
        deliveredCount: attempts.filter((attempt) => attempt.status === "DELIVERED")
            .length,
          failedCount,
          retryableFailedCount,
          targetCount: targetSummaries.length
        },
        alert: publicEventDeliverySummaryAlert(
          { failedCount, retryableFailedCount },
          options.publicEventDeliveryAlerts
        ),
        targets: targetSummaries,
      releaseBoundary:
        "Local/self-host delivery-attempt summary foundation only. Production hosted dashboards, alert routing, durable workers, and hosted observability remain release blockers."
    });
  }

  if (
    method === "GET" &&
    url.pathname === "/api/events/webhook-deliveries/exhausted"
  ) {
    const scope = {
      tenantId: requiredQuery(url, "tenantId"),
      workspaceId: requiredQuery(url, "workspaceId"),
      userId: requiredQuery(url, "userId")
    };
    const maxAttempts = positiveIntegerQuery(url, "maxAttempts") ?? 3;
    const attempts = repositories.auditEvents
      .list(actor, scope)
      .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
      .filter(
        (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
          attempt !== undefined
      )
      .filter((attempt) =>
        matchesPublicEventWebhookDeliveryAttemptFilters(attempt, url)
      );
    const exhausted = publicEventWebhookExhaustedDeliveries(
      attempts,
      maxAttempts
    );
  return sendJson(response, 200, {
    summary: {
      exhaustedCount: exhausted.length,
      maxAttempts
    },
    data: exhausted,
    releaseBoundary:
      "Local/self-host exhausted delivery visibility foundation only. Production dead-letter queues, hosted dashboards, alert routing, durable workers, and hosted observability remain release blockers."
  });
}

if (
  method === "GET" &&
  url.pathname === "/api/events/webhook-deliveries/dead-letter/queue"
) {
  const scope = {
    tenantId: requiredQuery(url, "tenantId"),
    workspaceId: requiredQuery(url, "workspaceId"),
    userId: requiredQuery(url, "userId")
  };
  const maxAttempts = positiveIntegerQuery(url, "maxAttempts") ?? 3;
  const auditEvents = repositories.auditEvents.list(actor, scope);
  const attempts = auditEvents
    .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
    .filter(
      (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
        attempt !== undefined
    )
    .filter((attempt) =>
      matchesPublicEventWebhookDeliveryAttemptFilters(attempt, url)
    );
  const reviews = auditEvents
    .map(publicEventWebhookDeadLetterReviewFromAuditEvent)
    .filter(
      (review): review is PublicEventWebhookDeadLetterReviewView =>
        review !== undefined
    );
  const queue = publicEventWebhookDeadLetterQueue(
    publicEventWebhookExhaustedDeliveries(attempts, maxAttempts),
    reviews
  );
  return sendJson(response, 200, {
    summary: {
      queueCount: queue.length,
      unreviewedCount: queue.filter(
        (item) => item.reviewStatus === "UNREVIEWED"
      ).length,
      reviewedCount: queue.filter((item) => item.reviewStatus === "REVIEWED")
        .length,
 maxAttempts
 },
 alert: publicEventDeadLetterQueueAlert(
 {
 unreviewedCount: queue.filter(
 (item) => item.reviewStatus === "UNREVIEWED"
 ).length
 },
 options.publicEventDeadLetterQueueAlerts
 ),
 data: queue,
    releaseBoundary:
      "Local/self-host dead-letter queue visibility foundation only. It derives content-minimized queue rows from audit evidence. Production durable dead-letter queues, replay orchestration, hosted dashboards, alert routing, and durable workers remain release blockers."
  });
}

if (
  method === "GET" &&
  url.pathname === "/api/events/webhook-deliveries/dead-letter"
) {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      const reviews = repositories.auditEvents
        .list(actor, scope)
        .map(publicEventWebhookDeadLetterReviewFromAuditEvent)
        .filter(
          (review): review is PublicEventWebhookDeadLetterReviewView =>
            review !== undefined
        );
      return sendJson(response, 200, {
        summary: { reviewCount: reviews.length },
        data: reviews,
        releaseBoundary:
          "Local/self-host dead-letter review evidence only. Production durable dead-letter queues, replay orchestration, hosted dashboards, alert routing, and durable workers remain release blockers."
      });
    }

    if (
      method === "POST" &&
      url.pathname === "/api/events/webhook-deliveries/dead-letter"
    ) {
      const reviewRequest = parsePublicEventWebhookDeadLetterReviewRequest(
        await readJson(request, maxRequestBodyBytes)
      );
      assertAuthorized(principal, reviewRequest);
      const attempts = repositories.auditEvents
        .list(actor, reviewRequest)
        .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
        .filter(
          (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
            attempt !== undefined
        );
      const exhausted = publicEventWebhookExhaustedDeliveries(
        attempts,
        reviewRequest.maxAttempts
      );
      const exhaustedAttempt = exhausted.find(
        (attempt) =>
          attempt.deliveryId === reviewRequest.deliveryId &&
          attempt.eventId === reviewRequest.eventId &&
          attempt.targetUrlHash === reviewRequest.targetUrlHash
      );
      if (!exhaustedAttempt) {
        throw new ApiError(
          409,
          "DELIVERY_NOT_EXHAUSTED",
          "Delivery is not an exhausted dead-letter candidate."
        );
      }
      const review = publicEventWebhookDeadLetterReviewView(
        reviewRequest,
        exhaustedAttempt
      );
      repositories.auditEvents.append(
        actor,
        publicEventWebhookDeadLetterReviewAuditEvent(reviewRequest, review)
      );
      return sendJson(response, 201, {
        review,
        releaseBoundary:
          "Local/self-host dead-letter review evidence only. This does not replay, delete, or expose webhook target details. Production durable dead-letter queues, replay orchestration, hosted dashboards, alert routing, and durable workers remain release blockers."
      });
    }

    if (method === "GET" && url.pathname === "/api/events/webhook-deliveries") {
    const scope = {
      tenantId: requiredQuery(url, "tenantId"),
      workspaceId: requiredQuery(url, "workspaceId"),
      userId: requiredQuery(url, "userId")
    };
    const attempts = repositories.auditEvents
      .list(actor, scope)
      .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
      .filter(
        (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
          attempt !== undefined
      )
      .filter((attempt) =>
        matchesPublicEventWebhookDeliveryAttemptFilters(attempt, url)
      );
    return sendJson(response, 200, {
      data: attempts,
      releaseBoundary:
        "Local/self-host delivery-attempt observability foundation only. Production retry queues, subscription delivery workers, hosted delivery operations, and hosted observability remain release blockers."
    });
  }

  if (
    method === "GET" &&
    url.pathname === "/api/events/webhook-subscriptions/health"
  ) {
    const scope = {
      tenantId: requiredQuery(url, "tenantId"),
      workspaceId: requiredQuery(url, "workspaceId"),
      userId: requiredQuery(url, "userId")
    };
    const maxAttempts = positiveIntegerQuery(url, "maxAttempts") ?? 3;
    const auditEvents = repositories.auditEvents.list(actor, scope);
    const subscriptions = currentPublicEventWebhookSubscriptions(auditEvents)
      .filter((subscription) =>
        matchesPublicEventWebhookSubscriptionFilters(subscription, url)
      );
    const attempts = auditEvents
      .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
      .filter(
        (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
          attempt !== undefined
      )
      .filter((attempt) =>
        matchesPublicEventWebhookDeliveryAttemptFilters(attempt, url)
      );
    const exhausted = publicEventWebhookExhaustedDeliveries(
      attempts,
      maxAttempts
    );
    const data = publicEventWebhookSubscriptionHealth(
      subscriptions,
      attempts,
      exhausted
    );
    const summary = {
      totalCount: data.length,
      enabledCount: data.filter((row) => row.status === "ENABLED").length,
      disabledCount: data.filter((row) => row.status === "DISABLED").length,
      healthyCount: data.filter((row) => row.healthStatus === "HEALTHY")
        .length,
      failingCount: data.filter(
        (row) =>
          row.healthStatus === "FAILING" || row.healthStatus === "EXHAUSTED"
      ).length,
      exhaustedCount: data.filter((row) => row.healthStatus === "EXHAUSTED")
        .length,
      neverDeliveredCount: data.filter(
        (row) => row.deliveredCount + row.failedCount === 0
      ).length,
      maxAttempts
    };
    return sendJson(response, 200, {
      summary,
      alert: publicEventSubscriptionHealthAlert(
        {
          failingCount: summary.failingCount,
          exhaustedCount: summary.exhaustedCount,
          neverDeliveredCount: summary.neverDeliveredCount
        },
        options.publicEventSubscriptionHealthAlerts
      ),
      data,
      releaseBoundary:
        "Local/self-host subscription health observability foundation only. Production hosted dashboards, alert routing, durable workers, dead-letter queues, and hosted observability remain release blockers."
    });
  }

  if (method === "GET" && url.pathname === "/api/events/webhook-subscriptions") {
    const scope = {
      tenantId: requiredQuery(url, "tenantId"),
      workspaceId: requiredQuery(url, "workspaceId"),
      userId: requiredQuery(url, "userId")
    };
    const subscriptions = currentPublicEventWebhookSubscriptions(
      repositories.auditEvents.list(actor, scope)
    )
      .filter((subscription) =>
        matchesPublicEventWebhookSubscriptionFilters(subscription, url)
      );
    return sendJson(response, 200, {
      data: subscriptions,
      releaseBoundary:
        "Local/self-host subscription metadata foundation only. Production subscription delivery workers, persistent retry execution, hosted operations, and hosted observability remain release blockers."
    });
  }

    if (method === "POST" && url.pathname === "/api/events/webhook-subscriptions") {
      const subscriptionRequest = parsePublicEventWebhookSubscriptionRequest(
        await readJson(request, maxRequestBodyBytes)
      );
    assertAuthorized(principal, subscriptionRequest);
  const subscription = await publicEventWebhookSubscriptionView(
    subscriptionRequest,
    new Date().toISOString(),
    options.publicEventDeliveryTargets,
    options.managedSecrets,
    (event) => repositories.auditEvents.append(actor, event)
  );
    repositories.auditEvents.append(
      actor,
      publicEventWebhookSubscriptionAuditEvent(subscriptionRequest, subscription)
    );
    return sendJson(response, 201, {
      subscription,
      releaseBoundary:
        "Local/self-host subscription metadata foundation only. Secrets and raw target URLs are not returned. Production subscription delivery workers, persistent retry execution, hosted operations, and hosted observability remain release blockers."
    });
  }

  if (
    method === "POST" &&
    url.pathname === "/api/events/webhook-subscriptions/status"
  ) {
    const statusRequest = parsePublicEventWebhookSubscriptionStatusRequest(
      await readJson(request, maxRequestBodyBytes)
    );
    assertAuthorized(principal, statusRequest);
    const subscriptions = currentPublicEventWebhookSubscriptions(
      repositories.auditEvents.list(actor, statusRequest)
    );
    const existing = subscriptions.find(
      (subscription) => subscription.id === statusRequest.subscriptionId
    );
    if (!existing) {
      throw new ApiError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found.");
    }
    const subscription: PublicEventWebhookSubscriptionView = {
      ...existing,
      status: statusRequest.status,
      updatedAt: new Date().toISOString()
    };
    repositories.auditEvents.append(
      actor,
      publicEventWebhookSubscriptionAuditEvent(statusRequest, subscription)
    );
    return sendJson(response, 200, {
      subscription,
      releaseBoundary:
        "Local/self-host subscription pause/resume foundation only. Production worker pause queues, hosted approval workflow, hosted dashboards, and alert routing remain release blockers."
    });
  }

  if (
    method === "POST" &&
    url.pathname === "/api/events/webhook-subscriptions/deliver"
    ) {
      const deliveryRequest = parsePublicEventWebhookSubscriptionDeliveryRequest(
        await readJson(request, maxRequestBodyBytes)
      );
      assertAuthorized(principal, deliveryRequest);
      const auditEvents = repositories.auditEvents.list(actor, deliveryRequest);
    const subscriptions = currentPublicEventWebhookSubscriptions(auditEvents);
  const verifiedDelivery = await verifiedSubscriptionForDelivery(
    deliveryRequest,
    subscriptions,
    options.publicEventDeliveryTargets,
    options.managedSecrets,
    (event) => repositories.auditEvents.append(actor, event)
  );
      const subscription = verifiedDelivery.subscription;
      const events = auditEvents
        .map(publicEventFromAuditEvent)
        .filter((event): event is PublicScheduleOSEvent => event !== undefined)
        .filter((event) =>
          matchesPublicEventSubscriptionDeliveryFilters(event, subscription)
        );
      const attempts = await deliverPublicEventsToWebhook(
        verifiedDelivery.deliveryRequest,
        events
      );
      attempts.forEach((attempt) => {
        repositories.auditEvents.append(
          actor,
          publicEventWebhookDeliveryAttemptAuditEvent(
            verifiedDelivery.deliveryRequest,
            attempt
          )
        );
      });
      return sendJson(response, 202, {
        subscriptionId: subscription.id,
        deliveredCount: attempts.filter((attempt) => attempt.status === "DELIVERED")
          .length,
        failedCount: attempts.filter((attempt) => attempt.status === "FAILED")
          .length,
        attempts: attempts.map(publicEventWebhookDeliveryAttemptViewFromAttempt),
        releaseBoundary:
          "Local/self-host subscription delivery execution foundation only. Production managed secret storage, durable hosted workers, hosted operations, and hosted observability remain release blockers."
      });
    }

    if (
      method === "POST" &&
      url.pathname === "/api/events/webhook-subscriptions/deliver-ready"
    ) {
      const deliverReadyRequest =
        parsePublicEventWebhookSubscriptionDeliverReadyRequest(
          await readJson(request, maxRequestBodyBytes)
        );
      assertAuthorized(principal, deliverReadyRequest);
      const auditEvents = repositories.auditEvents.list(actor, deliverReadyRequest);
    const subscriptions = currentPublicEventWebhookSubscriptions(auditEvents)
      .filter((subscription) => subscription.status === "ENABLED")
        .filter((subscription) => subscription.deliveryTargetRefHash !== undefined)
        .slice(0, deliverReadyRequest.maxSubscriptions);
      const events = auditEvents
        .map(publicEventFromAuditEvent)
        .filter((event): event is PublicScheduleOSEvent => event !== undefined)
        .filter((event) =>
          matchesPublicEventDeliverReadyFilters(event, deliverReadyRequest)
        );
      const results: Array<{
        subscriptionId: string;
        matchedEventCount: number;
        processedEventCount: number;
        deliveredCount: number;
        failedCount: number;
        attempts: PublicEventWebhookDeliveryAttemptView[];
      }> = [];
      for (const subscription of subscriptions) {
    const verifiedDelivery = await verifiedSubscriptionForDelivery(
      {
        tenantId: deliverReadyRequest.tenantId,
        workspaceId: deliverReadyRequest.workspaceId,
        userId: deliverReadyRequest.userId,
        subscriptionId: subscription.id
      },
      subscriptions,
      options.publicEventDeliveryTargets,
      options.managedSecrets,
      (event) => repositories.auditEvents.append(actor, event)
    );
        const subscriptionEvents = events.filter((event) =>
          matchesPublicEventSubscriptionDeliveryFilters(event, subscription)
        );
        const boundedSubscriptionEvents = subscriptionEvents.slice(
          0,
          deliverReadyRequest.maxEvents
        );
        const attempts = deliverReadyRequest.dryRun
          ? []
          : await deliverPublicEventsToWebhook(
              verifiedDelivery.deliveryRequest,
              boundedSubscriptionEvents
            );
        attempts.forEach((attempt) => {
          repositories.auditEvents.append(
            actor,
            publicEventWebhookDeliveryAttemptAuditEvent(
              verifiedDelivery.deliveryRequest,
              attempt
            )
          );
        });
        results.push({
          subscriptionId: subscription.id,
          matchedEventCount: subscriptionEvents.length,
          processedEventCount: boundedSubscriptionEvents.length,
          deliveredCount: attempts.filter(
            (attempt) => attempt.status === "DELIVERED"
          ).length,
          failedCount: attempts.filter((attempt) => attempt.status === "FAILED")
            .length,
          attempts: attempts.map(publicEventWebhookDeliveryAttemptViewFromAttempt)
        });
      }
      return sendJson(response, 202, {
        subscriptionCount: results.length,
        dryRun: deliverReadyRequest.dryRun === true,
        deliveredCount: results.reduce(
          (total, result) => total + result.deliveredCount,
          0
        ),
        failedCount: results.reduce(
          (total, result) => total + result.failedCount,
          0
        ),
        results,
        releaseBoundary:
          "Local/self-host subscription delivery worker foundation only. Production durable workers, managed secret storage, hosted operations, and hosted observability remain release blockers."
      });
    }

    if (
      method === "POST" &&
      url.pathname === "/api/events/webhook-deliveries/retry-due"
    ) {
      const retryRequest = parsePublicEventWebhookDeliveryRetryDueRequest(
        await readJson(request, maxRequestBodyBytes)
      );
      assertAuthorized(principal, retryRequest);
      const auditEvents = repositories.auditEvents.list(actor, retryRequest);
      const events = auditEvents
        .map(publicEventFromAuditEvent)
        .filter((event): event is PublicScheduleOSEvent => event !== undefined);
      const dueAttempts = duePublicEventWebhookDeliveryAttempts(
        retryRequest,
        auditEvents
      );
      const eventsById = new Map(events.map((event) => [event.id, event]));
      const retryEvents = dueAttempts
        .map((attempt) => eventsById.get(attempt.eventId))
        .filter((event): event is PublicScheduleOSEvent => event !== undefined);
      const nextAttemptNumbers = new Map(
        dueAttempts.map((attempt) => [attempt.eventId, attempt.attemptNumber + 1])
      );
      const attempts = await deliverPublicEventsToWebhook(
        retryRequest,
        retryEvents,
        nextAttemptNumbers
      );
      attempts.forEach((attempt) => {
        repositories.auditEvents.append(
          actor,
          publicEventWebhookDeliveryAttemptAuditEvent(retryRequest, attempt)
        );
      });
      return sendJson(response, 202, {
        retriedCount: attempts.length,
        deliveredCount: attempts.filter((attempt) => attempt.status === "DELIVERED")
          .length,
        failedCount: attempts.filter((attempt) => attempt.status === "FAILED")
          .length,
        attempts: attempts.map(publicEventWebhookDeliveryAttemptViewFromAttempt),
        releaseBoundary:
          "Local/self-host retry execution foundation only. Production subscription delivery workers, managed secret storage, hosted operations, and hosted observability remain release blockers."
      });
    }

    if (method === "POST" && url.pathname === "/api/events/webhook-deliveries") {
      const deliveryRequest = parsePublicEventWebhookDeliveryRequest(
        await readJson(request, maxRequestBodyBytes)
      );
    assertAuthorized(principal, deliveryRequest);
    const events = repositories.auditEvents
      .list(actor, deliveryRequest)
      .map(publicEventFromAuditEvent)
      .filter((event): event is PublicScheduleOSEvent => event !== undefined)
      .filter((event) =>
        matchesPublicEventDeliveryFilters(event, deliveryRequest)
      );
  const attempts = await deliverPublicEventsToWebhook(
  deliveryRequest,
  events
  );
  attempts.forEach((attempt) => {
    repositories.auditEvents.append(
      actor,
      publicEventWebhookDeliveryAttemptAuditEvent(deliveryRequest, attempt)
    );
  });
  return sendJson(response, 202, {
      deliveredCount: attempts.filter((attempt) => attempt.status === "DELIVERED")
        .length,
      failedCount: attempts.filter((attempt) => attempt.status === "FAILED")
        .length,
      attempts,
      releaseBoundary:
        "Local/self-host signed delivery foundation only. Production retry queues, subscription delivery workers, hosted delivery operations, and hosted observability remain release blockers."
    });
  }

  if (method === "GET" && url.pathname === "/api/import-abuse/summary") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
    };
      const auditEvents = repositories.auditEvents
        .list(actor, scope)
        .filter((event) => matchesImportAbuseSummaryFilters(event, url));
    return sendJson(response, 200, {
      data: summarizeImportAbuseEvents(
        scope,
        auditEvents,
        url,
        options.importAbuseAlerts
      )
    });
  }

  if (method === "GET" && url.pathname === "/api/request-abuse/summary") {
    const scope = {
      tenantId: requiredQuery(url, "tenantId"),
      workspaceId: requiredQuery(url, "workspaceId"),
      userId: requiredQuery(url, "userId")
    };
    return sendJson(response, 200, {
      data: summarizeRequestThrottleWindows(
        scope,
        repositories.requestThrottles.list(actor, scope),
        url,
        options.rateLimit
      )
    });
  }

  if (method === "GET" && url.pathname === "/api/import-policies") {
      const sourceSystem = url.searchParams.get("sourceSystem");
      const policies = sourceSystem
        ? PROVIDER_IMPORT_POLICIES.filter((policy) => policy.sourceSystem === sourceSystem)
        : PROVIDER_IMPORT_POLICIES;
      return sendJson(response, 200, {
        data: policies,
        sourcePolicies: providerImportPoliciesAsThrottleConfig(policies),
        releaseBoundary:
          "Local/self-host provider import policy catalog only; production distributed throttling, alerting, dashboards, and provider-specific quota operations remain release blockers."
      });
    }

if (method === "POST" && url.pathname === "/api/retention/cleanup") {
const cleanupRequest = parseRetentionCleanupRequest(
await readJson(request, maxRequestBodyBytes)
);
requireAuthAdmin(principal, cleanupRequest);
const asOf = new Date(cleanupRequest.asOf);
if (Number.isNaN(asOf.getTime())) {
throw validationError("asOf must be valid ISO datetime.");
}
const requiredConfirmation = timedScopedConfirmation(cleanupRequest, asOf);
const dryRun = cleanupRequest.apply !== true;
if (!dryRun) {
const approval = requireDestructiveConfirmation(
cleanupRequest.confirm,
requiredConfirmation,
"local JSON retention cleanup"
);
if (!approval.approved) {
return sendJson(response, 400, {
error: {
code: "DESTRUCTIVE_CONFIRMATION_REQUIRED",
message: approval.refusal,
requiredConfirmation: approval.requiredConfirmation
}
});
}
}
const cleanupResult = cleanupLocalStoreRetention(
store,
cleanupRequest,
asOf,
dryRun,
requiredConfirmation
);
let auditEvent: AuditEvent | undefined;
if (!dryRun) {
auditEvent = repositories.auditEvents.append(
{ kind: "system" },
retentionCleanupAuditEvent(
requireAuthenticatedPrincipal(principal),
cleanupRequest,
cleanupResult
)
);
}
return sendJson(
response,
200,
stripUndefined({ ...cleanupResult, auditEvent })
);
}

if (method === "POST" && url.pathname === "/api/tasks") {
const body = await readJson(request, maxRequestBodyBytes);
const task = parseSchedulingTask(body);
return sendJson(response, 201, repositories.tasks.upsert(actor, task));
}

    const taskRouteMatch = matchPath(url.pathname, /^\/api\/tasks\/([^/]+)$/);
    if (taskRouteMatch && method === "GET") {
      const taskId = decodeURIComponent(requirePathCapture(taskRouteMatch, 1));
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      return sendJson(response, 200, repositories.tasks.get(actor, scope, taskId));
    }

    if (taskRouteMatch && method === "PATCH") {
      const taskId = decodeURIComponent(requirePathCapture(taskRouteMatch, 1));
      const body = await readJson(request, maxRequestBodyBytes);
      const scope = parseScope(body);
      const existingTask = repositories.tasks.get(actor, scope, taskId);
      const updatedTask = applyTaskPatch(existingTask, body);
      return sendJson(response, 200, repositories.tasks.upsert(actor, updatedTask));
    }

    if (taskRouteMatch && method === "DELETE") {
      const taskId = decodeURIComponent(requirePathCapture(taskRouteMatch, 1));
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      repositories.tasks.delete(actor, scope, taskId);
      return sendJson(response, 200, { deleted: true, id: taskId });
    }

    if (method === "POST" && url.pathname === "/api/task-sources/webhook") {
      const rawBody = await readBodyText(request, maxRequestBodyBytes);
      const body = parseJsonText(rawBody);
      const webhookTask = parseWebhookTask(body);
      assertAuthorized(principal, webhookTask);
      enforceImportThrottle(
        repositories,
        actor,
        webhookTask,
        webhookTask.sourceSystem,
        "WEBHOOK_TASK_IMPORT",
        1,
        options.importThrottle
      );
      const replayCheck = verifyWebhookSignature(
        request,
        rawBody,
        webhookTask.sourceSystem,
        options
      );
      if (replayCheck) {
        reserveWebhookEvent(actor, repositories.idempotency, webhookTask, rawBody, replayCheck);
      }
      const savedImport = upsertImportedTask(
        actor,
        repositories.tasks,
        taskFromImportedRequest(webhookTask, "webhook")
      );
      if (replayCheck) {
        repositories.idempotency.complete(
          actor,
          webhookTask,
          replayCheck.idempotencyKey,
          {
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
            responseResourceId: savedImport.task.id
          }
        );
      }
      const auditEvent = repositories.auditEvents.append(
        actor,
        taskImportAuditEvent(webhookTask, savedImport.task, savedImport.updated, "WEBHOOK")
      );
      return sendJson(response, 201, {
        data: savedImport.task,
        auditEvent,
        createdCount: savedImport.updated ? 0 : 1,
        updatedCount: savedImport.updated ? 1 : 0
      });
    }

    if (method === "POST" && url.pathname === "/api/task-sources/json/import") {
      const body = await readJson(request, maxRequestBodyBytes);
      const importRequest = parseJsonTaskImportRequest(body);
      assertAuthorized(principal, importRequest);
      const dryRun = importRequest.dryRun ?? false;
      if (!dryRun) {
        enforceImportThrottle(
          repositories,
          actor,
          importRequest,
          importRequest.sourceSystem,
          "JSON_TASK_IMPORT",
          importRequest.tasks.length,
          options.importThrottle
        );
      }
      const importedTasks: SchedulingTask[] = [];
      const rowErrors: TaskImportRowError[] = [];
      let createdCount = 0;
      let updatedCount = 0;

      for (const [index, row] of importRequest.tasks.entries()) {
        try {
          const importedTask = parseImportedTaskRequest({
            ...row,
            tenantId: importRequest.tenantId,
            workspaceId: importRequest.workspaceId,
          userId: importRequest.userId,
          sourceSystem: importRequest.sourceSystem
        });
        const task = taskFromImportedRequest(importedTask, "json");
        if (dryRun) {
          importedTasks.push(task);
        } else {
          const savedImport = upsertImportedTask(actor, repositories.tasks, task);
          repositories.auditEvents.append(
            actor,
            taskImportAuditEvent(
              importedTask,
              savedImport.task,
              savedImport.updated,
              "JSON"
            )
          );
          importedTasks.push(savedImport.task);
          if (savedImport.updated) updatedCount += 1;
          else createdCount += 1;
        }
      } catch (error) {
        rowErrors.push(taskImportRowError(index, error));
      }
    }

    return sendJson(response, dryRun ? 200 : 201, {
      data: importedTasks,
      errors: rowErrors,
      createdCount,
      updatedCount,
      ...(dryRun ? { dryRun: true } : {})
    });
  }

    if (method === "GET" && url.pathname === "/api/task-sources/csv/templates") {
      return sendJson(response, 200, { data: CSV_TASK_TEMPLATES });
    }

    const csvTemplateSampleRouteMatch = matchPath(
      url.pathname,
      /^\/api\/task-sources\/csv\/templates\/([^/]+)\/sample$/
    );

    if (csvTemplateSampleRouteMatch && method === "GET") {
      const templateId = decodeURIComponent(
        requirePathCapture(csvTemplateSampleRouteMatch, 1)
      );
      const template = csvTemplateById(templateId);
      return sendCsv(
        response,
        200,
        `${template.id}-scheduleos-sample.csv`,
        template.sampleCsv
      );
    }

    if (method === "POST" && url.pathname === "/api/task-sources/csv/import") {
      const body = await readJson(request, maxRequestBodyBytes);
      const importRequest = parseCsvTaskImportRequest(body);
      assertAuthorized(principal, importRequest);
      const dryRun = importRequest.dryRun ?? false;
      if (!dryRun) {
        enforceImportThrottle(
          repositories,
          actor,
          importRequest,
          importRequest.sourceSystem,
          "CSV_TASK_IMPORT",
          importRequest.rows.length,
          options.importThrottle
        );
      }
      const importedTasks: SchedulingTask[] = [];
    const rowErrors: TaskImportRowError[] = [];
    let createdCount = 0;
    let updatedCount = 0;

      for (const [index, row] of importRequest.rows.entries()) {
        try {
          const importedTask = parseImportedTaskRequest({
            ...csvTaskRowToObject(importRequest.headers, row),
            tenantId: importRequest.tenantId,
            workspaceId: importRequest.workspaceId,
          userId: importRequest.userId,
          sourceSystem: importRequest.sourceSystem
        });
        const task = taskFromImportedRequest(importedTask, "csv");
        if (dryRun) {
          importedTasks.push(task);
        } else {
          const savedImport = upsertImportedTask(actor, repositories.tasks, task);
          repositories.auditEvents.append(
            actor,
            taskImportAuditEvent(
              importedTask,
              savedImport.task,
              savedImport.updated,
              "CSV"
            )
          );
          importedTasks.push(savedImport.task);
          if (savedImport.updated) updatedCount += 1;
          else createdCount += 1;
        }
      } catch (error) {
        rowErrors.push(taskImportRowError(index, error));
      }
    }

      return sendJson(response, dryRun ? 200 : 201, {
        data: importedTasks,
        errors: rowErrors,
        createdCount,
        updatedCount,
        ...(dryRun ? { dryRun: true } : {})
      });
    }

    if (method === "POST" && url.pathname === "/api/integrations/ownerops/tasks/import") {
      const body = await readJson(request, maxRequestBodyBytes);
      const importRequest = parseOwnerOpsTaskImportRequest(body);
      assertAuthorized(principal, importRequest);
      const dryRun = importRequest.dryRun ?? false;
      if (!dryRun) {
        enforceImportThrottle(
          repositories,
          actor,
          importRequest,
          "OWNEROPS",
          "OWNEROPS_TASK_IMPORT",
          importRequest.tasks.length,
          options.importThrottle
        );
      }

      const importedTasks: SchedulingTask[] = [];
      const auditEvents: AuditEvent[] = [];
      const rowErrors: TaskImportRowError[] = [];
      let createdCount = 0;
      let updatedCount = 0;

      for (const [index, row] of importRequest.tasks.entries()) {
        try {
          const importedTask = parseOwnerOpsImportedTaskRequest(row, importRequest);
          const task = taskFromImportedRequest(importedTask, "ownerops");
          if (dryRun) {
            importedTasks.push(task);
          } else {
            const savedImport = upsertImportedTask(actor, repositories.tasks, task);
            const auditEvent = repositories.auditEvents.append(
              actor,
              taskImportAuditEvent(
                importedTask,
                savedImport.task,
                savedImport.updated,
                "OWNEROPS"
              )
            );
            auditEvents.push(auditEvent);
            importedTasks.push(savedImport.task);
            if (savedImport.updated) updatedCount += 1;
            else createdCount += 1;
          }
        } catch (error) {
          rowErrors.push(taskImportRowError(index, error));
        }
      }

      return sendJson(response, dryRun ? 200 : 201, {
        data: importedTasks,
        auditEvents,
        errors: rowErrors,
        createdCount,
        updatedCount,
        ...(dryRun ? { dryRun: true } : {})
      });
    }

    if (method === "POST" && url.pathname === "/api/schedule-guidance/apply") {
      const body = await readJson(request, maxRequestBodyBytes);
      const guidanceRequest = parseScheduleGuidanceApplyRequest(body);
      assertAuthorized(principal, guidanceRequest);

      const updatedTasks: SchedulingTask[] = [];
      const auditEvents: AuditEvent[] = [];

      for (const guidance of guidanceRequest.guidance) {
        const existingTask = repositories.tasks.get(
          actor,
          guidanceRequest,
          guidance.taskId
        );
        const updatedTask = applyScheduleGuidance(existingTask, guidance);
        const savedTask = repositories.tasks.upsert(actor, updatedTask);
        const auditEvent = repositories.auditEvents.append(
          actor,
          scheduleGuidanceAuditEvent(guidanceRequest, guidance, savedTask)
        );
        updatedTasks.push(savedTask);
        auditEvents.push(auditEvent);
      }

      return sendJson(response, 200, {
        data: updatedTasks,
        auditEvents,
        updatedCount: updatedTasks.length
      });
    }

    if (method === "GET" && url.pathname === "/api/tasks") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
        };
    return sendJson(response, 200, { data: repositories.tasks.list(actor, scope) });
  }

  if (method === "POST" && url.pathname === "/api/calendar-events") {
    const body = await readJson(request, maxRequestBodyBytes);
    const scope = parseScope(body);
    const event = parseCalendarEvent(body);
    assertAuthorized(principal, scope);
    const savedEvent = repositories.calendarEvents.upsert(actor, event, scope);
    repositories.auditEvents.append(
      actor,
      localCalendarEventAuditEvent(savedEvent, false)
    );
    return sendJson(response, 201, savedEvent);
  }

    if (method === "GET" && url.pathname === "/api/calendar-events") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      return sendJson(response, 200, {
        data: repositories.calendarEvents.listForSchedule(actor, scope)
      });
    }

    const calendarEventRouteMatch = matchPath(
      url.pathname,
      /^\/api\/calendar-events\/([^/]+)$/
    );

    if (calendarEventRouteMatch && method === "GET") {
      const eventId = decodeURIComponent(
        requirePathCapture(calendarEventRouteMatch, 1)
      );
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      return sendJson(
        response,
        200,
        repositories.calendarEvents.get(actor, scope, eventId)
      );
    }

    if (calendarEventRouteMatch && method === "PATCH") {
      const eventId = decodeURIComponent(
        requirePathCapture(calendarEventRouteMatch, 1)
      );
      const body = await readJson(request, maxRequestBodyBytes);
    const scope = parseScope(body);
    const existingEvent = repositories.calendarEvents.get(actor, scope, eventId);
    const updatedEvent = applyCalendarEventPatch(existingEvent, body);
    const savedEvent = repositories.calendarEvents.upsert(
      actor,
      updatedEvent,
      scope
    );
    repositories.auditEvents.append(
      actor,
      localCalendarEventAuditEvent(savedEvent, true)
    );
    return sendJson(response, 200, savedEvent);
  }

    if (calendarEventRouteMatch && method === "DELETE") {
      const eventId = decodeURIComponent(
        requirePathCapture(calendarEventRouteMatch, 1)
      );
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      const existingEvent = repositories.calendarEvents.get(
        actor,
        scope,
        eventId
      );
      repositories.calendarEvents.delete(actor, scope, eventId);
      repositories.auditEvents.append(
        actor,
        localCalendarEventAuditEvent(
          { ...existingEvent, title: "Busy", status: "CANCELLED" },
          true
        )
      );
      return sendJson(response, 200, { deleted: true, id: eventId });
    }

  if (method === "POST" && url.pathname === "/api/calendar-events/ics/import") {
      const body = await readJson(request, maxRequestBodyBytes);
      const importRequest = parseIcsImportRequest(body);
      assertAuthorizedTenantUser(principal, importRequest);
      const parsedImport = parseIcsCalendarEventImport(
        importRequest.ics,
        importRequest,
        icsParseOptions(importRequest)
      );
      const events = parsedImport.events;
      enforceImportThrottle(
        repositories,
        actor,
        importRequest,
        importRequest.calendarId,
        "ICS_CALENDAR_IMPORT",
        events.length,
        options.importThrottle
      );
      const importResult = upsertCalendarEvents(
        actor,
        repositories.calendarEvents,
        importRequest,
        events,
        parsedImport.cancelledEvents
      );
      for (const deletedEvent of importResult.deletedEvents) {
        repositories.auditEvents.append(
          actor,
          localCalendarEventAuditEvent(deletedEvent, true)
        );
      }
      return sendJson(response, 201, {
        data: events,
        createdCount: importResult.createdCount,
        updatedCount: importResult.updatedCount,
        deletedCount: importResult.deletedCount
      });
  }

  if (method === "POST" && url.pathname === "/api/integrations/connectos/calendar-events/import") {
    const body = await readJson(request, maxRequestBodyBytes);
    const importRequest = parseConnectOsCalendarImportRequest(body);
    assertAuthorized(principal, importRequest);
    const dryRun = importRequest.dryRun ?? false;
    if (!dryRun) {
      enforceImportThrottle(
        repositories,
        actor,
        importRequest,
        "CONNECTOS",
        "CONNECTOS_CALENDAR_IMPORT",
        importRequest.events.length,
        options.importThrottle
      );
    }
    const events = importRequest.events.map((event) =>
      calendarEventFromConnectOsImport(event, importRequest)
    );
    const importStatuses = dryRun
      ? []
      : classifyCalendarEventImports(
          actor,
          repositories.calendarEvents,
          importRequest,
          events
        );
    const importResult = dryRun
      ? { createdCount: 0, updatedCount: 0 }
      : upsertCalendarEvents(actor, repositories.calendarEvents, importRequest, events);
    if (!dryRun) {
      appendConnectOsCalendarImportAuditEvents(
        actor,
        repositories,
        importRequest,
        importStatuses
      );
    }
    return sendJson(response, dryRun ? 200 : 201, {
      data: events,
      createdCount: importResult.createdCount,
      updatedCount: importResult.updatedCount,
      ...(dryRun ? { dryRun: true } : {})
    });
  }

  if (method === "POST" && url.pathname === "/api/sync/checkpoints") {
    const body = await readJson(request, maxRequestBodyBytes);
    const checkpoint = parseSyncCheckpointRequest(body);
    assertAuthorized(principal, checkpoint);
    const result = recordSyncCheckpoint(actor, repositories, checkpoint);
    return sendJson(response, result.idempotent ? 200 : 201, result);
  }

  if (method === "POST" && url.pathname === "/api/integrations/revoke") {
    const body = await readJson(request, maxRequestBodyBytes);
    const revocation = parseIntegrationRevocationRequest(body);
    assertAuthorized(principal, revocation);
    const result = recordIntegrationRevocation(actor, repositories, revocation);
    return sendJson(response, result.idempotent ? 200 : 201, result);
  }

  if (method === "GET" && url.pathname === "/api/calendar-events/ics/export") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId"),
        calendarId: requiredQuery(url, "calendarId")
      };
      assertAuthorized(principal, scope);
      const events = repositories.calendarEvents
        .listForSchedule(actor, scope)
        .filter((event) => event.calendarId === scope.calendarId);
    const ics = exportCalendarEventsToIcs(events, {
      calendarName: "ScheduleOS",
      productId: "-//ScheduleOS//Calendar Export//EN"
    });
    return sendJson(response, 200, { contentType: "text/calendar", ics });
  }

  if (method === "PUT" && url.pathname === "/api/working-hours") {
      const body = await readJson(request, maxRequestBodyBytes);
    const workingHours = parseWorkingHours(body);
        assertAuthorizedUser(principal, workingHours.userId);
        store.workingHours.set(workingHours.userId, workingHours);
      persist();
      return sendJson(response, 200, workingHours);
      }

    if (method === "POST" && url.pathname === "/api/schedule-plans") {
      const body = await readJson(request, maxRequestBodyBytes);
      const planRequest = parseScheduleRequest(body);
      const workingHours = repositories.workingHours.get(actor, planRequest);
        if (!workingHours) {
          return sendError(response, 422, "VALIDATION_ERROR", "workingHours are required before creating a schedule plan.");
        }
        const scheduleInput: CreateScheduleInput = {
          ...planRequest,
          workingHours,
      tasks: repositories.tasks.list(actor, planRequest),
      calendarEvents: repositories.calendarEvents.listForSchedule(actor, planRequest)
      };
      const plan = repositories.schedulePlans.upsert(actor, createSchedule(scheduleInput));
      repositories.auditEvents.append(actor, schedulePlanAuditEvent(plan, "SCHEDULE_CREATED"));
      appendScheduleWarningAuditEvents(actor, repositories, plan);
      return sendJson(response, 201, plan);
    }

    if (method === "GET" && url.pathname === "/api/schedule-plans") {
      const scope = {
        tenantId: requiredQuery(url, "tenantId"),
        workspaceId: requiredQuery(url, "workspaceId"),
        userId: requiredQuery(url, "userId")
      };
      return sendJson(response, 200, {
        data: repositories.schedulePlans.list(actor, scope)
      });
    }

    const schedulePlanRouteMatch = matchPath(
      url.pathname,
      /^\/api\/schedule-plans\/([^/]+)$/
    );
    if (method === "GET" && schedulePlanRouteMatch) {
      const planId = decodeURIComponent(
        requirePathCapture(schedulePlanRouteMatch, 1)
      );
      return sendJson(response, 200, repositories.schedulePlans.get(actor, planId));
    }

    const acceptPlanMatch = matchPath(
      url.pathname,
      /^\/api\/schedule-plans\/([^/]+)\/accept$/
    );
 if (method === "POST" && acceptPlanMatch) {
  const planId = requirePathCapture(acceptPlanMatch, 1);
  const plan = repositories.schedulePlans.get(actor, planId);
  const acceptedPlan: SchedulePlan = {
   ...plan,
   status: "ACCEPTED",
   blocks: plan.blocks.map((block) =>
          block.locked ? block : { ...block, status: "ACCEPTED" }
        )
  };
      const savedPlan = repositories.schedulePlans.replace(actor, acceptedPlan);
      repositories.auditEvents.append(actor, schedulePlanAuditEvent(savedPlan, "SCHEDULE_ACCEPTED"));
      return sendJson(response, 200, savedPlan);
 }

 const calendarWritebackPreviewMatch = matchPath(
  url.pathname,
  /^\/api\/schedule-plans\/([^/]+)\/calendar-writeback\/preview$/
 );
 if (method === "POST" && calendarWritebackPreviewMatch) {
  const planId = requirePathCapture(calendarWritebackPreviewMatch, 1);
  const body = await readJson(request, maxRequestBodyBytes);
  const writebackRequest = parseCalendarWritebackRequest(body);
  assertAuthorized(principal, writebackRequest);
  const plan = repositories.schedulePlans.get(actor, planId);
  if (!matchesScope(plan, writebackRequest)) {
   throw new RepositoryForbiddenError("Schedule plan is outside requested scope.");
  }
  if (plan.status !== "ACCEPTED") {
   return sendError(
    response,
    409,
    "SCHEDULE_PLAN_NOT_ACCEPTED",
    "Only accepted schedule plans can be previewed for calendar write-back."
   );
  }

  const tasks = repositories.tasks.list(actor, writebackRequest);
  const candidateEvents = acceptedPlanBlocksToCalendarEvents(
   plan,
   tasks,
   writebackRequest
  );
  const candidateIds = new Set(candidateEvents.map((event) => event.id));
  const existingEvents = repositories.calendarEvents
   .listForSchedule(actor, writebackRequest)
   .filter(
    (event) =>
     event.calendarId === writebackRequest.calendarId &&
     !candidateIds.has(event.id) &&
     isBlockingCalendarEvent(event)
   );
  const conflicts = calendarWritebackConflicts(candidateEvents, existingEvents);
  return sendJson(response, 200, {
   data: conflicts,
   conflictCount: conflicts.length,
   readOnly: writebackRequest.readOnly,
   writable: !writebackRequest.readOnly
  });
 }

 const calendarWritebackMatch = matchPath(
  url.pathname,
  /^\/api\/schedule-plans\/([^/]+)\/calendar-writeback$/
 );
 if (method === "POST" && calendarWritebackMatch) {
  const planId = requirePathCapture(calendarWritebackMatch, 1);
  const body = await readJson(request, maxRequestBodyBytes);
  const writebackRequest = parseCalendarWritebackRequest(body);
  assertAuthorized(principal, writebackRequest);

  if (writebackRequest.readOnly) {
   return sendError(
    response,
    409,
    "CALENDAR_READ_ONLY",
    "Cannot write accepted schedule blocks to a read-only calendar."
   );
  }

  const plan = repositories.schedulePlans.get(actor, planId);
  if (!matchesScope(plan, writebackRequest)) {
   throw new RepositoryForbiddenError("Schedule plan is outside requested scope.");
  }
  if (plan.status !== "ACCEPTED") {
   return sendError(
    response,
    409,
    "SCHEDULE_PLAN_NOT_ACCEPTED",
    "Only accepted schedule plans can be written back to a calendar."
   );
  }

 const tasks = repositories.tasks.list(actor, writebackRequest);
 const events = acceptedPlanBlocksToCalendarEvents(plan, tasks, writebackRequest);
 const candidateIds = new Set(events.map((event) => event.id));
 const existingEvents = repositories.calendarEvents
  .listForSchedule(actor, writebackRequest)
  .filter(
   (event) =>
    event.calendarId === writebackRequest.calendarId &&
    !candidateIds.has(event.id) &&
    isBlockingCalendarEvent(event)
  );
 const conflicts = calendarWritebackConflicts(events, existingEvents);
 if (conflicts.length > 0) {
  return sendJson(response, 409, {
   error: {
    code: "CALENDAR_WRITEBACK_CONFLICT",
    message:
     "Calendar write-back has blocking conflicts. Preview conflicts before writing."
   },
   data: conflicts,
   conflictCount: conflicts.length
  });
 }
 const writebackResult = upsertCalendarEvents(
  actor,
  repositories.calendarEvents,
   writebackRequest,
   events
  );
  return sendJson(response, 201, {
   data: events,
   createdCount: writebackResult.createdCount,
   updatedCount: writebackResult.updatedCount
  });
 }

 const rejectPlanMatch = matchPath(
  url.pathname,
  /^\/api\/schedule-plans\/([^/]+)\/reject$/
 );
    if (method === "POST" && rejectPlanMatch) {
      const planId = requirePathCapture(rejectPlanMatch, 1);
      const plan = repositories.schedulePlans.get(actor, planId);
      const rejectedPlan: SchedulePlan = {
        ...plan,
        status: "REJECTED"
      };
      const savedPlan = repositories.schedulePlans.replace(actor, rejectedPlan);
      repositories.auditEvents.append(actor, schedulePlanAuditEvent(savedPlan, "SCHEDULE_REJECTED"));
      return sendJson(response, 200, savedPlan);
    }

    const exportPlanIcsMatch = matchPath(
    url.pathname,
    /^\/api\/schedule-plans\/([^/]+)\/ics\/export$/
  );
  if (method === "GET" && exportPlanIcsMatch) {
    const planId = requirePathCapture(exportPlanIcsMatch, 1);
    const plan = repositories.schedulePlans.get(actor, planId);
    const tasks = repositories.tasks.list(actor, plan);
    const calendarId = url.searchParams.get("calendarId") ?? "calendar_scheduleos";
    const ics = exportScheduleBlocksToIcs(plan.blocks, tasks, {
      calendarId,
      calendarName: "ScheduleOS Plan",
      productId: "-//ScheduleOS//Plan Export//EN"
    });
    return sendJson(response, 200, { contentType: "text/calendar", ics });
  }

  const replanMatch = matchPath(
      url.pathname,
      /^\/api\/schedule-plans\/([^/]+)\/replan$/
    );
      if (method === "POST" && replanMatch) {
      const planId = requirePathCapture(replanMatch, 1);
      repositories.schedulePlans.get(actor, planId);
      const replanned = replanSchedule(store, planId);
      const savedPlan = repositories.schedulePlans.replace(actor, replanned);
      repositories.auditEvents.append(actor, schedulePlanAuditEvent(savedPlan, "SCHEDULE_REPLANNED"));
      appendScheduleWarningAuditEvents(actor, repositories, savedPlan);
      return sendJson(response, 200, savedPlan);
    }

    const explanationsMatch = matchPath(
      url.pathname,
      /^\/api\/schedule-plans\/([^/]+)\/explanations$/
    );
      if (method === "GET" && explanationsMatch) {
    const plan = repositories.schedulePlans.get(actor, requirePathCapture(explanationsMatch, 1));
        return sendJson(response, 200, { data: plan.explanations });
      }

      if (method === "GET" && url.pathname === "/api/capacity") {
    const plan = repositories.schedulePlans.get(actor, requiredQuery(url, "planId"));
        return sendJson(response, 200, { data: plan.capacityWarnings });
      }

  if (method === "GET" && url.pathname === "/api/deadline-risks") {
    const plan = repositories.schedulePlans.get(actor, requiredQuery(url, "planId"));
      return sendJson(response, 200, {
        data: plan.capacityWarnings.filter(
          (warning) => warning.code === "DEADLINE_AT_RISK"
        )
      });
    }

  if (method === "GET" && url.pathname === "/api/unscheduled-tasks") {
    const plan = repositories.schedulePlans.get(actor, requiredQuery(url, "planId"));
        return sendJson(response, 200, { data: plan.unscheduledTasks });
      }

    const blockStateMatch = matchPath(
      url.pathname,
      /^\/api\/time-blocks\/([^/]+)\/(lock|unlock|complete|missed)$/
    );
    if (method === "POST" && blockStateMatch) {
      const blockId = requirePathCapture(blockStateMatch, 1);
      const action = requirePathCapture(blockStateMatch, 2) as
        | "lock"
        | "unlock"
        | "complete"
        | "missed";
      const updatedBlock = repositories.timeBlocks.updateStatus(actor, blockId, action);
      repositories.auditEvents.append(actor, timeBlockAuditEvent(updatedBlock, action));
      return sendJson(response, 200, updatedBlock);
    }

    const blockTimeMatch = matchPath(url.pathname, /^\/api\/time-blocks\/([^/]+)$/);
    if (method === "PATCH" && blockTimeMatch) {
      const blockId = requirePathCapture(blockTimeMatch, 1);
      const body = await readJson(request, maxRequestBodyBytes);
      const updatedBlock = repositories.timeBlocks.updateTime(
        actor,
        blockId,
        parseTimeBlockPatch(body)
      );
      return sendJson(response, 200, updatedBlock);
    }

    return sendError(response, 404, "NOT_FOUND", "Route not found.");
  } catch (error) {
    if (error instanceof ApiError) {
      return sendError(response, error.status, error.code, error.message);
    }
    if (
      error instanceof RepositoryForbiddenError ||
      error instanceof RepositoryNotFoundError ||
      error instanceof RepositoryValidationError
    ) {
      return sendError(response, error.status, error.code, error.message);
    }
    return sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
  }
});
};

const matchPath = (pathname: string, pattern: RegExp): RegExpMatchArray | null =>
  pathname.match(pattern);

const requirePathCapture = (match: RegExpMatchArray, index: number): string => {
  const value = match[index];
  if (!value) {
    throw new ApiError(404, "NOT_FOUND", "Route not found.");
  }
  return value;
};

const authenticate = (
  request: IncomingMessage,
  auth: StaticAuthConfig | undefined,
  repositories: ScheduleOSRepositories,
  store: ApiStore
): AuthPrincipal | null => {
  if (!auth) return null;
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    const principal = auth.apiKeys.find((apiKey) => apiKey.token === token);
    if (principal) return { ...principal, authMethod: "STATIC" };
    const sessionPrincipal = sessionPrincipalFromToken(
      repositories,
      store,
      token,
      "BEARER_SESSION"
    );
    if (sessionPrincipal) return sessionPrincipal;
    throw new ApiError(401, "UNAUTHENTICATED", "Bearer token invalid.");
  }
  const cookieToken = sessionTokenFromCookie(request, auth.sessionCookie);
  if (cookieToken) {
    const sessionPrincipal = sessionPrincipalFromToken(
      repositories,
      store,
      cookieToken,
      "COOKIE_SESSION"
    );
    if (sessionPrincipal) return sessionPrincipal;
    throw new ApiError(401, "UNAUTHENTICATED", "Session cookie invalid.");
  }
  throw new ApiError(401, "UNAUTHENTICATED", "Bearer token required.");
};

const sessionPrincipalFromToken = (
  repositories: ScheduleOSRepositories,
  store: ApiStore,
  token: string,
  authMethod: "BEARER_SESSION" | "COOKIE_SESSION"
): AuthPrincipal | null => {
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const session = store.authSessions.find(
    (candidate) =>
      candidate.sessionTokenHash === tokenHash &&
      candidate.revokedAt === undefined &&
      new Date(candidate.expiresAt).getTime() > now.getTime()
  );
  if (!session) return null;
  if (!isActiveAuthSubject(repositories, { kind: "system" }, session)) {
    return null;
  }
  const membership = repositories.auth.getMembership(
    { kind: "system" },
    session
  );
  repositories.auth.upsertSession(
    { kind: "system" },
    {
      ...session,
      lastSeenAt: now.toISOString()
    }
  );
  return {
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
    userId: session.userId,
    role: staticRoleForMembership(membership.role),
    sessionId: session.id,
    authMethod,
    csrfToken: csrfTokenForSessionToken(token)
  };
};

const repositoryActor = (principal: AuthPrincipal | null): RepositoryActor => {
  if (!principal) return { kind: "system" };
  return {
    kind: "user",
    tenantId: principal.tenantId,
    workspaceId: principal.workspaceId,
    userId: principal.userId
  };
};

const assertMethodAllowed = (
  principal: AuthPrincipal | null,
  method: string
): void => {
  if (!principal || method === "GET") return;
  const role = principal.role ?? "EDITOR";
  if (role === "VIEWER") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Authenticated principal is read-only."
    );
  }
};

const requireAuthenticatedPrincipal = (
  principal: AuthPrincipal | null
): AuthPrincipal => {
  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authenticated principal required.");
  }
  return principal;
};

const requireSessionPrincipal = (
  principal: AuthPrincipal | null,
  message = "Current-session logout requires session authentication."
): AuthPrincipal & { sessionId: string } => {
  const authenticated = requireAuthenticatedPrincipal(principal);
  if (!authenticated.sessionId) {
    throw new ApiError(
      400,
      "SESSION_REQUIRED",
      message
    );
  }
  return authenticated as AuthPrincipal & { sessionId: string };
};

const requireSameTenantPrincipal = (
  principal: AuthPrincipal | null,
  tenantId: string
): void => {
  const authenticated = requireAuthenticatedPrincipal(principal);
  if (authenticated.tenantId !== tenantId) {
    throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot access tenant.");
  }
};

const enforceRateLimit = (
  request: IncomingMessage,
  config: RateLimitConfig | undefined,
  buckets: Map<string, RateLimitBucket>,
  repositories: ScheduleOSRepositories,
  store: ApiStore,
  auth: StaticAuthConfig | undefined
): void => {
  if (!config) return;
  if (config.maxRequests <= 0 || config.windowMs <= 0) {
    throw validationError("rateLimit maxRequests and windowMs must be positive.");
  }
  const now = Date.now();
  if (config.persisted === true) {
    const principal = principalForPersistedRateLimit(request, auth, repositories, store);
    if (principal) {
      const result = repositories.requestThrottles.consume(
        { kind: "system" },
        principal,
        {
          keyHash: requestThrottleKeyHash(request, principal, config),
          count: 1,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          now: new Date(now).toISOString()
        }
      );
      if (!result.allowed) {
        throw rateLimitedError(result.retryAfterMs);
      }
      return;
    }
  }
  const key = rateLimitKey(request, config);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStartedAt >= config.windowMs) {
    buckets.set(key, { windowStartedAt: now, count: 1 });
    return;
  }
  if (bucket.count >= config.maxRequests) {
    throw rateLimitedError(config.windowMs - (now - bucket.windowStartedAt));
  }
  bucket.count += 1;
};

const principalForPersistedRateLimit = (
  request: IncomingMessage,
  auth: StaticAuthConfig | undefined,
  repositories: ScheduleOSRepositories,
  store: ApiStore
): AuthPrincipal | null => {
  if (!auth) return null;
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    const principal = auth.apiKeys.find((apiKey) => apiKey.token === token);
    if (principal) return { ...principal, authMethod: "STATIC" };
    return sessionPrincipalFromToken(
      repositories,
      store,
      token,
      "BEARER_SESSION"
    );
  }
  const cookieToken = sessionTokenFromCookie(request, auth.sessionCookie);
  if (!cookieToken) return null;
  return sessionPrincipalFromToken(
    repositories,
    store,
    cookieToken,
    "COOKIE_SESSION"
  );
};

const resolvedLoginBackoffConfig = (
  config: LoginBackoffConfig | undefined
): LoginBackoffConfig => ({
  windowMs: config?.windowMs ?? DEFAULT_LOGIN_BACKOFF_WINDOW_MS,
  maxFailedAttempts:
    config?.maxFailedAttempts ?? DEFAULT_LOGIN_BACKOFF_MAX_FAILED_ATTEMPTS
});

const enforceLoginAttemptBackoff = (
  repositories: ScheduleOSRepositories,
  config: LoginBackoffConfig,
  request: AuthSessionLoginRequest
): void => {
  const now = new Date();
  const window = repositories.auth.getLoginAttemptWindow(
    { kind: "system" },
    request
  );
  if (!window) return;
  if (window.lockedUntil && new Date(window.lockedUntil).getTime() > now.getTime()) {
    throw authAttemptLimitedError(
      new Date(window.lockedUntil).getTime() - now.getTime()
    );
  }
  if (now.getTime() - new Date(window.windowStartedAt).getTime() >= config.windowMs) {
    repositories.auth.clearLoginAttemptWindow({ kind: "system" }, request);
  }
};

const recordFailedLoginAttempt = (
  repositories: ScheduleOSRepositories,
  config: LoginBackoffConfig,
  request: AuthSessionLoginRequest
): void => {
  const now = new Date();
  const nowIso = now.toISOString();
  const existing = repositories.auth.getLoginAttemptWindow(
    { kind: "system" },
    request
  );
  const windowExpired =
    !existing ||
    now.getTime() - new Date(existing.windowStartedAt).getTime() >= config.windowMs;
  const failedCount = windowExpired ? 1 : existing.failedCount + 1;
  const lockedUntil =
    failedCount >= config.maxFailedAttempts
      ? new Date(now.getTime() + config.windowMs).toISOString()
      : undefined;
  const window: AuthLoginAttemptWindow = {
    id: loginAttemptWindowId(request),
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    windowStartedAt: windowExpired ? nowIso : existing.windowStartedAt,
    windowMs: config.windowMs,
    maxFailedAttempts: config.maxFailedAttempts,
    failedCount,
    updatedAt: nowIso
  };
  if (lockedUntil) {
    window.lockedUntil = lockedUntil;
  }
  repositories.auth.upsertLoginAttemptWindow({ kind: "system" }, window);
};

const resetLoginAttemptBackoff = (
  repositories: ScheduleOSRepositories,
  request: AuthSessionLoginRequest
): void => {
  repositories.auth.clearLoginAttemptWindow({ kind: "system" }, request);
};

const loginAttemptWindowId = (request: Scope): string =>
  [request.tenantId, request.workspaceId, request.userId].join("\u0000");

const enforceImportThrottle = (
  repositories: ScheduleOSRepositories,
  actor: RepositoryActor,
  scope: Scope,
  sourceSystem: string,
  operation: ImportThrottleOperation,
  rowCount: number,
  config: ImportThrottleConfig | undefined
): void => {
  if (!config || rowCount <= 0) return;
  const policy =
    config.sourcePolicies?.[sourceSystem] ??
    (config.enforceProviderPolicies
      ? providerImportPolicyFor(sourceSystem, operation)
      : undefined) ??
    config;
  if (policy.maxRows <= 0 || policy.windowMs <= 0) {
    throw validationError("importThrottle maxRows and windowMs must be positive.");
  }
  const result = repositories.importThrottles.consume(actor, scope, {
    sourceSystem,
    operation,
    count: rowCount,
    limit: policy.maxRows,
    windowMs: policy.windowMs,
    now: new Date().toISOString()
  });
  if (!result.allowed) {
    repositories.auditEvents.append(
      actor,
      importThrottleDeniedAuditEvent(
        scope,
        sourceSystem,
        operation,
        rowCount,
        policy,
        result.retryAfterMs
      )
    );
    throw rateLimitedError(result.retryAfterMs);
  }
};

const validateImportThrottleConfig = (
  config: ImportThrottleConfig | undefined
): void => {
  if (!config) return;
  validateImportThrottlePolicy("importThrottle", config);
  for (const [sourceSystem, policy] of Object.entries(
    config.sourcePolicies ?? {}
  )) {
    validateImportThrottlePolicy(
      `importThrottle sourcePolicies.${sourceSystem}`,
      policy
    );
  }
};

const validateImportAbuseAlertConfig = (
  config: ImportAbuseAlertConfig | undefined
): void => {
  if (!config) return;
  for (const threshold of [config.deniedEvents, config.deniedRows]) {
    if (
      threshold !== undefined &&
      (!Number.isInteger(threshold) || threshold <= 0)
    ) {
      throw validationError(
        "importAbuseAlerts thresholds must be positive integers."
      );
    }
  }
};

const validatePublicEventDeliveryAlertConfig = (
  config: PublicEventDeliveryAlertConfig | undefined
): void => {
  if (!config) return;
  for (const threshold of [
    config.failedAttempts,
    config.retryableFailedAttempts
  ]) {
    if (
      threshold !== undefined &&
      (!Number.isInteger(threshold) || threshold <= 0)
    ) {
      throw validationError(
        "publicEventDeliveryAlerts thresholds must be positive integers."
      );
    }
  }
};

const validatePublicEventSubscriptionHealthAlertConfig = (
  config: PublicEventSubscriptionHealthAlertConfig | undefined
): void => {
  if (!config) return;
  for (const threshold of [
    config.failingSubscriptions,
    config.exhaustedSubscriptions,
    config.neverDeliveredSubscriptions
  ]) {
    if (
      threshold !== undefined &&
      (!Number.isInteger(threshold) || threshold <= 0)
    ) {
      throw validationError(
        "publicEventSubscriptionHealthAlerts thresholds must be positive integers."
      );
    }
  }
};

const validatePublicEventDeadLetterQueueAlertConfig = (
  config: PublicEventDeadLetterQueueAlertConfig | undefined
): void => {
  if (!config) return;
  for (const threshold of [config.unreviewedItems]) {
    if (
      threshold !== undefined &&
      (!Number.isInteger(threshold) || threshold <= 0)
    ) {
      throw validationError(
        "publicEventDeadLetterQueueAlerts thresholds must be positive integers."
      );
    }
  }
};

const validateRateLimitConfig = (config: RateLimitConfig | undefined): void => {
  if (!config) return;
  if (config.maxRequests <= 0 || config.windowMs <= 0) {
    throw validationError("rateLimit maxRequests windowMs must be positive.");
  }
  if (
    config.trustedProxyClientIpHeader !== undefined &&
    !["x-forwarded-for", "x-real-ip"].includes(config.trustedProxyClientIpHeader)
  ) {
    throw validationError(
      "rateLimit trustedProxyClientIpHeader must be x-forwarded-for or x-real-ip."
    );
  }
};

const validateLoginBackoffConfig = (
  config: LoginBackoffConfig | undefined
): void => {
  if (!config) return;
  if (config.maxFailedAttempts <= 0 || config.windowMs <= 0) {
    throw validationError(
      "auth.loginBackoff maxFailedAttempts windowMs must be positive."
    );
  }
};

const validatePasswordResetConfig = (
  config: PasswordResetConfig | undefined
): void => {
  if (!config || config.ttlMs === undefined) return;
  if (config.ttlMs <= 0 || config.ttlMs > MAX_PASSWORD_RESET_TTL_MS) {
    throw validationError(
      "auth.passwordReset ttlMs must be positive and no more than 24 hours."
    );
  }
};

const validateImportThrottlePolicy = (
  label: string,
  policy: ImportThrottlePolicy
): void => {
  if (policy.maxRows <= 0 || policy.windowMs <= 0) {
    throw validationError(`${label} maxRows and windowMs must be positive.`);
  }
};

const rateLimitKey = (
  request: IncomingMessage,
  config?: RateLimitConfig
): string => {
  const authorization = request.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return `token:${authorization.slice("Bearer ".length)}`;
  }
  const forwardedClientIp = trustedProxyClientIp(request, config);
  if (forwardedClientIp) return `ip:${forwardedClientIp}`;
  return `ip:${request.socket.remoteAddress ?? "unknown"}`;
};

const trustedProxyClientIp = (
  request: IncomingMessage,
  config?: RateLimitConfig
): string | undefined => {
  const headerName = config?.trustedProxyClientIpHeader;
  if (!headerName) return undefined;
  const headerValue = request.headers[headerName];
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!raw) return undefined;
  const candidate =
    headerName === "x-forwarded-for" ? raw.split(",")[0]?.trim() : raw.trim();
  if (
    !candidate ||
    candidate.length > 128 ||
    /[\r\n]/.test(candidate) ||
    /\s/.test(candidate)
  ) {
    return undefined;
  }
  return candidate;
};

const requestThrottleKeyHash = (
  request: IncomingMessage,
  principal: AuthPrincipal,
  config?: RateLimitConfig
): string =>
  createHash("sha256")
    .update(principal.tenantId)
    .update("\0")
    .update(principal.workspaceId)
    .update("\0")
    .update(principal.userId)
    .update("\0")
    .update(rateLimitKey(request, config))
    .digest("hex");

const matchesAuditEventFilters = (event: AuditEvent, url: URL): boolean => {
  const action = url.searchParams.get("action");
  if (action && event.action !== action) return false;

  const resourceType = url.searchParams.get("resourceType");
  if (resourceType && event.resourceType !== resourceType) return false;

const sourceSystem = url.searchParams.get("sourceSystem");
if (sourceSystem && event.metadata?.sourceSystem !== sourceSystem) return false;

  return true;
};

const publicEventFromAuditEvent = (
  event: AuditEvent
): PublicScheduleOSEvent | undefined => {
  const type = publicEventTypeForAuditEvent(event);
  if (!type) return undefined;

  const stableHash = createHash("sha256").update(event.id).digest("hex");
  const sourceSystem = metadataString(event, "sourceSystem") ?? event.actorId;
  const externalId = metadataString(event, "externalId");
  const sourceReference = metadataString(event, "sourceReference");

  return {
    id: `event_${stableHash.slice(0, 24)}`,
    type,
    version: "v1",
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    userId: event.userId,
    occurredAt: event.occurredAt,
    idempotencyKey: `scheduleos-public-event:${stableHash}`,
    source: {
      system: sourceSystem,
      actorType: event.actorType,
      actorId: event.actorId,
      auditEventId: event.id
    },
    subject: {
      type: publicEventSubjectType(event),
      id: publicEventSubjectId(event, externalId)
    },
    data: {
      auditAction: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      externalId,
      sourceReference,
      ...publicEventMetadata(event),
      contentPolicy: "content-minimized"
    }
  };
};

const publicEventTypeForAuditEvent = (event: AuditEvent): string | undefined => {
  if (
    event.resourceType === "TASK" &&
    (event.action === "TASK_CREATED_FROM_WEBHOOK" ||
      event.action === "TASK_CREATED_FROM_JSON" ||
      event.action === "TASK_CREATED_FROM_CSV" ||
      event.action === "TASK_CREATED_FROM_OWNEROPS" ||
      event.action === "TASK_UPDATED_FROM_WEBHOOK" ||
      event.action === "TASK_UPDATED_FROM_JSON" ||
      event.action === "TASK_UPDATED_FROM_CSV" ||
      event.action === "TASK_UPDATED_FROM_OWNEROPS")
  ) {
    return "task.imported";
  }
  if (event.resourceType === "SCHEDULE_PLAN") {
    if (event.action === "SCHEDULE_CAPACITY_EXCEEDED") {
      return "schedule.capacity_exceeded";
    }
    if (event.action === "SCHEDULE_CREATED") return "schedule.created";
    if (event.action === "SCHEDULE_ACCEPTED") return "schedule.accepted";
    if (event.action === "SCHEDULE_REJECTED") return "schedule.rejected";
    if (event.action === "SCHEDULE_REPLANNED") return "schedule.replanned";
  }
  if (event.resourceType === "TASK" && event.action === "TASK_DEADLINE_AT_RISK") {
    return "task.deadline_at_risk";
  }
  if (event.resourceType === "TIME_BLOCK") {
    if (event.action === "BLOCK_LOCK") return "block.locked";
    if (event.action === "BLOCK_UNLOCK") return "block.unlocked";
    if (event.action === "BLOCK_COMPLETE") return "block.completed";
    if (event.action === "BLOCK_MISSED") return "block.missed";
  }
  if (event.resourceType === "CALENDAR_EVENT") {
    if (event.action === "CALENDAR_EVENT_IMPORTED") return "calendar.event_imported";
    if (event.action === "CALENDAR_EVENT_CHANGED") return "calendar.event_changed";
  }
  return undefined;
};

const publicEventSubjectType = (event: AuditEvent): string => {
  if (event.resourceType === "SCHEDULE_PLAN") return "schedule";
  if (event.resourceType === "TIME_BLOCK") return "block";
  if (event.resourceType === "TASK") return "task";
  if (event.resourceType === "CALENDAR_EVENT") return "calendar_event";
  return event.resourceType.toLowerCase();
};

const publicEventSubjectId = (
  event: AuditEvent,
  externalId: string | undefined
): string => {
  if (event.resourceType === "CALENDAR_EVENT") return event.resourceId;
  return externalId ?? event.resourceId;
};

const publicEventMetadata = (event: AuditEvent): Record<string, unknown> => {
  if (!event.metadata) return {};
  if (
    event.action === "SCHEDULE_CAPACITY_EXCEEDED" ||
    event.action === "TASK_DEADLINE_AT_RISK"
  ) {
    return {
      warningCode: event.metadata.warningCode,
      taskId: event.metadata.taskId,
      availableMinutes: event.metadata.availableMinutes,
      requiredMinutes: event.metadata.requiredMinutes,
      planId: event.metadata.planId,
      planStatus: event.metadata.planStatus
    };
  }
  if (event.resourceType === "SCHEDULE_PLAN") {
    return {
      status: event.metadata.status,
      rangeStart: event.metadata.rangeStart,
      rangeEnd: event.metadata.rangeEnd,
      timezone: event.metadata.timezone,
      blockCount: event.metadata.blockCount,
      unscheduledCount: event.metadata.unscheduledCount,
      capacityWarningCount: event.metadata.capacityWarningCount
    };
  }
  if (event.resourceType === "TIME_BLOCK") {
    return {
      taskId: event.metadata.taskId,
      status: event.metadata.status,
      locked: event.metadata.locked,
      start: event.metadata.start,
      end: event.metadata.end
    };
  }
  if (event.resourceType === "CALENDAR_EVENT") {
    return {
      calendarId: event.metadata.calendarId,
      externalId: event.metadata.externalId,
      sourceSystem: event.metadata.sourceSystem,
      connectionId: event.metadata.connectionId,
      capabilityRef: event.metadata.capabilityRef,
      status: event.metadata.status,
      busyStatus: event.metadata.busyStatus,
      privacyLevel: event.metadata.privacyLevel,
      start: event.metadata.start,
      end: event.metadata.end,
      allDay: event.metadata.allDay
    };
  }
  return {};
};

const matchesPublicEventFilters = (
  event: PublicScheduleOSEvent,
  url: URL
): boolean => {
  const type = url.searchParams.get("type");
  if (type && event.type !== type) return false;

  const sourceSystem = url.searchParams.get("sourceSystem");
  if (sourceSystem && event.source.system !== sourceSystem) return false;

  return true;
};

const matchesPublicEventDeliveryFilters = (
  event: PublicScheduleOSEvent,
  request: PublicEventWebhookDeliveryRequest
): boolean => {
  if (request.type && event.type !== request.type) return false;
  if (request.sourceSystem && event.source.system !== request.sourceSystem) {
    return false;
  }
  return true;
};

const matchesPublicEventSubscriptionDeliveryFilters = (
  event: PublicScheduleOSEvent,
  subscription: PublicEventWebhookSubscriptionView
): boolean => {
  if (
    subscription.eventTypes.length > 0 &&
    !subscription.eventTypes.includes(event.type)
  ) {
    return false;
  }
  if (
    subscription.sourceSystem !== undefined &&
    event.source.system !== subscription.sourceSystem
  ) {
    return false;
  }
  return true;
};

const matchesPublicEventDeliverReadyFilters = (
  event: PublicScheduleOSEvent,
  request: PublicEventWebhookSubscriptionDeliverReadyRequest
): boolean => {
  if (request.type && event.type !== request.type) return false;
  if (request.sourceSystem && event.source.system !== request.sourceSystem) {
    return false;
  }
  return true;
};

const metadataString = (event: AuditEvent, name: string): string | undefined => {
  const value = event.metadata?.[name];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
};

const metadataStringArray = (
  event: AuditEvent,
  name: string
): string[] | undefined => {
  const value = event.metadata?.[name];
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : undefined;
};

const publicEventDeliveryTargetRefHash = (deliveryTargetRef: string): string =>
  createHash("sha256").update(deliveryTargetRef).digest("hex");

const managedSecretRefHash = (secretRef: string): string =>
  createHash("sha256").update(secretRef).digest("hex");

type ResolvedPublicEventDeliveryTarget = {
  targetUrl: string;
  secret: string;
};

const managedSecretPurposePath: Record<ManagedSecretPurpose, string> = {
  PUBLIC_EVENT_TARGET_URL: "public-event-target",
  PUBLIC_EVENT_SIGNING_SECRET: "public-event-signing"
};

const validateManagedSecretRefScope = (
  scope: Scope,
  secretRef: string,
  purpose: ManagedSecretPurpose
): void => {
  if (secretRef.trim().length === 0 || /\s/.test(secretRef)) {
    throw validationError("secretRef must be a non-empty opaque reference.");
  }
  const expectedPrefix = `scheduleos/${scope.tenantId}/${scope.workspaceId}/${managedSecretPurposePath[purpose]}/`;
  if (!secretRef.startsWith(expectedPrefix)) {
    throw validationError("secretRef must match tenant, workspace, and purpose scope.");
  }
};

const managedSecretResolutionAuditEvent = (
  scope: Scope,
  secretRef: string,
  purpose: ManagedSecretPurpose,
  outcome: ManagedSecretResolutionOutcome,
  errorCode?: string
): AuditEvent => {
  const occurredAt = new Date().toISOString();
  const secretRefHash = managedSecretRefHash(secretRef);
  return {
    id: `audit_managed_secret_resolution_${secretRefHash}_${purpose}_${outcome}_${occurredAt}_${randomBytes(6).toString("hex")}`,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    userId: scope.userId,
    occurredAt,
    actorType: "SYSTEM",
    actorId: "SCHEDULEOS_MANAGED_SECRETS",
    action: "MANAGED_SECRET_RESOLUTION_CHECKED",
    resourceType: "MANAGED_SECRET_REF",
    resourceId: secretRefHash,
    metadata: stripUndefined({
      purpose,
      secretRefHash,
      outcome,
      errorCode
    }) as NonNullable<AuditEvent["metadata"]>
  };
};

const resolveManagedSecret = async (
  scope: Scope,
  secretRef: string,
  purpose: ManagedSecretPurpose,
  managedSecrets: ManagedSecretProvider | undefined,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<string> => {
  const recordResolution = (
    outcome: ManagedSecretResolutionOutcome,
    errorCode?: string
  ): void => {
    auditManagedSecretResolution?.(
      managedSecretResolutionAuditEvent(
        scope,
        secretRef,
        purpose,
        outcome,
        errorCode
      )
    );
  };
  try {
    validateManagedSecretRefScope(scope, secretRef, purpose);
  } catch (error) {
    recordResolution("REJECTED_SCOPE", "MANAGED_SECRET_SCOPE_REJECTED");
    throw error;
  }
  if (managedSecrets === undefined) {
    recordResolution(
      "PROVIDER_UNAVAILABLE",
      "MANAGED_SECRET_PROVIDER_UNAVAILABLE"
    );
    throw new ApiError(
      503,
      "MANAGED_SECRET_PROVIDER_UNAVAILABLE",
      "Managed secret provider unavailable."
    );
  }
  let value: string | undefined;
  try {
    value = await managedSecrets.resolveSecret({ ...scope, secretRef, purpose });
  } catch (error) {
    recordResolution("PROVIDER_ERROR", "MANAGED_SECRET_PROVIDER_ERROR");
    throw error;
  }
  if (value === undefined || value.trim().length === 0) {
    recordResolution("UNAVAILABLE", "MANAGED_SECRET_UNAVAILABLE");
    throw new ApiError(503, "MANAGED_SECRET_UNAVAILABLE", "Managed secret unavailable.");
  }
  recordResolution("RESOLVED");
  return value;
};

const validateResolvedPublicEventDeliveryTarget = (
  target: ResolvedPublicEventDeliveryTarget
): ResolvedPublicEventDeliveryTarget => {
  validatedWebhookDeliveryTargetUrl(target.targetUrl);
  if (target.secret.trim().length < 16) {
    throw validationError("configured delivery target secret must be at least 16 characters.");
  }
  return target;
};

const configuredPublicEventDeliveryTarget = async (
  scope: Scope,
  deliveryTargetRef: string,
  deliveryTargets: Record<string, PublicEventDeliveryTargetConfig> | undefined,
  managedSecrets: ManagedSecretProvider | undefined,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<ResolvedPublicEventDeliveryTarget> => {
  const target = deliveryTargets?.[deliveryTargetRef];
  if (!target) {
    throw validationError(`deliveryTargetRef ${deliveryTargetRef} is not configured.`);
  }
  const hasRawTarget = target.targetUrl !== undefined || target.secret !== undefined;
  const hasSecretRefs =
    target.targetUrlSecretRef !== undefined || target.signingSecretRef !== undefined;
  if (hasRawTarget && hasSecretRefs) {
    throw validationError("configured delivery target must use raw values or secret refs, not both.");
  }
  if (hasRawTarget) {
    if (target.targetUrl === undefined || target.secret === undefined) {
      throw validationError("configured delivery targetUrl and secret are required together.");
    }
    return validateResolvedPublicEventDeliveryTarget({
      targetUrl: target.targetUrl,
      secret: target.secret
    });
  }
  if (target.targetUrlSecretRef === undefined || target.signingSecretRef === undefined) {
    throw validationError(
      "configured delivery target targetUrlSecretRef and signingSecretRef are required together."
    );
  }
  const targetUrl = await resolveManagedSecret(
    scope,
    target.targetUrlSecretRef,
    "PUBLIC_EVENT_TARGET_URL",
    managedSecrets,
    auditManagedSecretResolution
  );
  const secret = await resolveManagedSecret(
    scope,
    target.signingSecretRef,
    "PUBLIC_EVENT_SIGNING_SECRET",
    managedSecrets,
    auditManagedSecretResolution
  );
  return validateResolvedPublicEventDeliveryTarget({ targetUrl, secret });
};

const publicEventWebhookSubscriptionTarget = async (
  request: PublicEventWebhookSubscriptionRequest,
  deliveryTargets: Record<string, PublicEventDeliveryTargetConfig> | undefined,
  managedSecrets: ManagedSecretProvider | undefined,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<ResolvedPublicEventDeliveryTarget & { deliveryTargetRefHash?: string }> => {
  if (request.deliveryTargetRef !== undefined) {
    const target = await configuredPublicEventDeliveryTarget(
      request,
      request.deliveryTargetRef,
      deliveryTargets,
      managedSecrets,
      auditManagedSecretResolution
    );
    return {
      ...target,
      deliveryTargetRefHash: publicEventDeliveryTargetRefHash(
        request.deliveryTargetRef
      )
    };
  }
  if (request.targetUrl === undefined || request.secret === undefined) {
    throw validationError("targetUrl and secret, or deliveryTargetRef, required.");
  }
  return validateResolvedPublicEventDeliveryTarget({
    targetUrl: request.targetUrl,
    secret: request.secret
  });
};

const publicEventWebhookSubscriptionView = async (
  request: PublicEventWebhookSubscriptionRequest,
  now = new Date().toISOString(),
  deliveryTargets?: Record<string, PublicEventDeliveryTargetConfig>,
  managedSecrets?: ManagedSecretProvider,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<PublicEventWebhookSubscriptionView> => {
  const target = await publicEventWebhookSubscriptionTarget(
    request,
    deliveryTargets,
    managedSecrets,
    auditManagedSecretResolution
  );
  const targetUrl = validatedWebhookDeliveryTargetUrl(target.targetUrl);
  const stableHash = createHash("sha256")
    .update(request.tenantId)
    .update("\0")
    .update(request.workspaceId)
    .update("\0")
    .update(request.userId)
    .update("\0")
    .update(targetUrl)
    .update("\0")
    .update(request.sourceSystem ?? "")
    .update("\0")
    .update((request.eventTypes ?? []).join(","))
    .update("\0")
    .update(now)
    .digest("hex");
  const subscription: PublicEventWebhookSubscriptionView = {
    id: `subscription_${stableHash.slice(0, 24)}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    targetUrlHash: createHash("sha256").update(targetUrl).digest("hex"),
    secretHash: createHash("sha256").update(target.secret).digest("hex"),
    eventTypes: request.eventTypes ?? [],
    status: request.status ?? "ENABLED",
    createdAt: now,
    updatedAt: now
  };
  if (request.sourceSystem !== undefined) {
    subscription.sourceSystem = request.sourceSystem;
  }
  if (target.deliveryTargetRefHash !== undefined) {
    subscription.deliveryTargetRefHash = target.deliveryTargetRefHash;
  }
  return subscription;
};

const publicEventWebhookSubscriptionAuditEvent = (
  request: PublicEventWebhookSubscriptionRequest,
  subscription: PublicEventWebhookSubscriptionView
): AuditEvent => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    subscriptionId: subscription.id,
    targetUrlHash: subscription.targetUrlHash,
    secretHash: subscription.secretHash,
    eventTypes: subscription.eventTypes,
    status: subscription.status,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt
  };
  if (subscription.sourceSystem !== undefined) {
    metadata.sourceSystem = subscription.sourceSystem;
  }
  if (subscription.deliveryTargetRefHash !== undefined) {
    metadata.deliveryTargetRefHash = subscription.deliveryTargetRefHash;
  }
  return {
    id: `audit_public_event_subscription_${subscription.id}_${Date.now()}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    occurredAt: subscription.createdAt,
    actorType: "SYSTEM",
    actorId: "SCHEDULEOS_PUBLIC_EVENTS",
    action: "PUBLIC_EVENT_WEBHOOK_SUBSCRIPTION_REGISTERED",
    resourceType: "PUBLIC_EVENT_WEBHOOK_SUBSCRIPTION",
    resourceId: subscription.id,
    metadata
  };
};

const publicEventWebhookSubscriptionFromAuditEvent = (
  event: AuditEvent
): PublicEventWebhookSubscriptionView | undefined => {
  if (
    event.resourceType !== "PUBLIC_EVENT_WEBHOOK_SUBSCRIPTION" ||
    event.action !== "PUBLIC_EVENT_WEBHOOK_SUBSCRIPTION_REGISTERED" ||
    !event.metadata
  ) {
    return undefined;
  }
  const id = metadataString(event, "subscriptionId") ?? event.resourceId;
  const targetUrlHash = metadataString(event, "targetUrlHash");
  const secretHash = metadataString(event, "secretHash");
  const status = metadataString(event, "status");
  if (
    !id ||
    !targetUrlHash ||
    !secretHash ||
    (status !== "ENABLED" && status !== "DISABLED")
  ) {
    return undefined;
  }
  const subscription: PublicEventWebhookSubscriptionView = {
    id,
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    userId: event.userId,
    targetUrlHash,
    secretHash,
    eventTypes: metadataStringArray(event, "eventTypes") ?? [],
    status,
    createdAt: metadataString(event, "createdAt") ?? event.occurredAt,
    updatedAt: metadataString(event, "updatedAt") ?? event.occurredAt
  };
  const sourceSystem = metadataString(event, "sourceSystem");
  if (sourceSystem !== undefined) {
    subscription.sourceSystem = sourceSystem;
  }
  const deliveryTargetRefHash = metadataString(event, "deliveryTargetRefHash");
  if (deliveryTargetRefHash !== undefined) {
    subscription.deliveryTargetRefHash = deliveryTargetRefHash;
  }
  return subscription;
};

const currentPublicEventWebhookSubscriptions = (
  auditEvents: AuditEvent[]
): PublicEventWebhookSubscriptionView[] => {
  const latest = new Map<string, PublicEventWebhookSubscriptionView>();
  for (const event of auditEvents) {
    const subscription = publicEventWebhookSubscriptionFromAuditEvent(event);
    if (!subscription) continue;
    const existing = latest.get(subscription.id);
    if (
      !existing ||
      Date.parse(subscription.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      latest.set(subscription.id, subscription);
    }
  }
  return [...latest.values()].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  );
};

const matchesPublicEventWebhookSubscriptionFilters = (
  subscription: PublicEventWebhookSubscriptionView,
  url: URL
): boolean => {
  const status = url.searchParams.get("status");
  if (status && subscription.status !== status) return false;
  const type = url.searchParams.get("type");
  if (type && !subscription.eventTypes.includes(type)) return false;
  const sourceSystem = url.searchParams.get("sourceSystem");
  if (sourceSystem && subscription.sourceSystem !== sourceSystem) return false;
  return true;
};

const configuredPublicEventDeliveryTargetForSubscription = async (
  subscription: PublicEventWebhookSubscriptionView,
  deliveryTargets: Record<string, PublicEventDeliveryTargetConfig> | undefined,
  managedSecrets: ManagedSecretProvider | undefined,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<ResolvedPublicEventDeliveryTarget> => {
  if (subscription.deliveryTargetRefHash === undefined) {
    throw new ApiError(
      422,
      "SUBSCRIPTION_DELIVERY_TARGET_REQUIRED",
      "Subscription delivery target required."
    );
  }
  for (const [deliveryTargetRef, target] of Object.entries(deliveryTargets ?? {})) {
    if (
      publicEventDeliveryTargetRefHash(deliveryTargetRef) ===
      subscription.deliveryTargetRefHash
    ) {
      return configuredPublicEventDeliveryTarget(
        subscription,
        deliveryTargetRef,
        deliveryTargets,
        managedSecrets,
        auditManagedSecretResolution
      );
    }
  }
  throw new ApiError(
    503,
    "SUBSCRIPTION_DELIVERY_TARGET_UNAVAILABLE",
    "Subscription delivery target unavailable."
  );
};

const verifiedSubscriptionForDelivery = async (
  request: PublicEventWebhookSubscriptionDeliveryRequest,
  subscriptions: PublicEventWebhookSubscriptionView[],
  deliveryTargets: Record<string, PublicEventDeliveryTargetConfig> | undefined,
  managedSecrets: ManagedSecretProvider | undefined,
  auditManagedSecretResolution?: ManagedSecretResolutionAuditRecorder
): Promise<{
  subscription: PublicEventWebhookSubscriptionView;
  deliveryRequest: PublicEventWebhookDeliveryRequest;
}> => {
  const subscription = subscriptions.find(
    (candidate) => candidate.id === request.subscriptionId
  );
  if (!subscription) {
    throw new ApiError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found.");
  }
  if (subscription.status !== "ENABLED") {
    throw new ApiError(409, "SUBSCRIPTION_DISABLED", "Subscription disabled.");
  }
  const resolvedTarget =
    request.targetUrl !== undefined && request.secret !== undefined
      ? validateResolvedPublicEventDeliveryTarget({
          targetUrl: request.targetUrl,
          secret: request.secret
        })
    : await configuredPublicEventDeliveryTargetForSubscription(
        subscription,
        deliveryTargets,
        managedSecrets,
        auditManagedSecretResolution
      );
  const targetUrl = validatedWebhookDeliveryTargetUrl(resolvedTarget.targetUrl);
  const targetUrlHash = createHash("sha256").update(targetUrl).digest("hex");
  if (subscription.targetUrlHash !== targetUrlHash) {
    throw new ApiError(
      403,
      "SUBSCRIPTION_TARGET_MISMATCH",
      "Subscription target does not match."
    );
  }
  const secretHash = createHash("sha256").update(resolvedTarget.secret).digest("hex");
  if (subscription.secretHash !== secretHash) {
    throw new ApiError(
      403,
      "SUBSCRIPTION_SECRET_MISMATCH",
      "Subscription secret does not match."
    );
  }
  return {
    subscription,
    deliveryRequest: {
      tenantId: request.tenantId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      targetUrl,
      secret: resolvedTarget.secret
    }
  };
};

const publicEventWebhookDeliveryAttemptAuditEvent = (
  request: PublicEventWebhookDeliveryRequest,
  attempt: PublicEventWebhookDeliveryAttempt
): AuditEvent => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    deliveryId: attempt.deliveryId,
    eventId: attempt.eventId,
  type: attempt.type,
  status: attempt.status,
  targetUrlHash: createHash("sha256").update(attempt.targetUrl).digest("hex"),
  retryable: attempt.retryable,
  attemptNumber: attempt.attemptNumber
  };
  if (attempt.httpStatus !== undefined) metadata.httpStatus = attempt.httpStatus;
  if (attempt.errorCode !== undefined) metadata.errorCode = attempt.errorCode;
  if (attempt.nextRetryAt !== undefined) metadata.nextRetryAt = attempt.nextRetryAt;
  return {
    id: `audit_public_event_delivery_${attempt.deliveryId}_${Date.now()}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    occurredAt: attempt.occurredAt,
    actorType: "SYSTEM",
    actorId: "SCHEDULEOS_PUBLIC_EVENTS",
    action: "PUBLIC_EVENT_WEBHOOK_DELIVERY_ATTEMPTED",
    resourceType: "PUBLIC_EVENT_WEBHOOK_DELIVERY",
    resourceId: attempt.deliveryId,
    metadata
  };
};

const publicEventWebhookDeliveryAttemptFromAuditEvent = (
  event: AuditEvent
): PublicEventWebhookDeliveryAttemptView | undefined => {
  if (
    event.resourceType !== "PUBLIC_EVENT_WEBHOOK_DELIVERY" ||
    event.action !== "PUBLIC_EVENT_WEBHOOK_DELIVERY_ATTEMPTED" ||
    !event.metadata
  ) {
    return undefined;
  }
  const deliveryId = metadataString(event, "deliveryId");
  const eventId = metadataString(event, "eventId");
  const type = metadataString(event, "type");
  const targetUrlHash = metadataString(event, "targetUrlHash");
  const status = metadataString(event, "status");
  if (
    !deliveryId ||
    !eventId ||
    !type ||
    !targetUrlHash ||
    (status !== "DELIVERED" && status !== "FAILED")
  ) {
    return undefined;
  }
  const deliveredStatus: PublicEventWebhookDeliveryAttemptView["status"] = status;
  const httpStatus = event.metadata.httpStatus;
  const errorCode = metadataString(event, "errorCode");
  const retryable =
    typeof event.metadata.retryable === "boolean"
      ? event.metadata.retryable
      : false;
  const attemptNumber =
    typeof event.metadata.attemptNumber === "number" &&
    Number.isFinite(event.metadata.attemptNumber)
      ? event.metadata.attemptNumber
      : 1;
  const nextRetryAt = metadataString(event, "nextRetryAt");
  const attempt: PublicEventWebhookDeliveryAttemptView = {
    deliveryId,
    eventId,
    type,
    status: deliveredStatus,
    targetUrlHash,
    retryable,
    attemptNumber,
    occurredAt: event.occurredAt
  };
  if (typeof httpStatus === "number" && Number.isFinite(httpStatus)) {
    attempt.httpStatus = httpStatus;
  }
  if (errorCode !== undefined) attempt.errorCode = errorCode;
  if (nextRetryAt !== undefined) attempt.nextRetryAt = nextRetryAt;
  return attempt;
};

const matchesPublicEventWebhookDeliveryAttemptFilters = (
  attempt: PublicEventWebhookDeliveryAttemptView,
  url: URL
): boolean => {
  const status = url.searchParams.get("status");
  if (status && attempt.status !== status) return false;
  const type = url.searchParams.get("type");
  if (type && attempt.type !== type) return false;
  return true;
};

const publicEventWebhookDeliveryTargetSummaries = (
  attempts: PublicEventWebhookDeliveryAttemptView[]
): PublicEventWebhookDeliveryTargetSummary[] => {
  const summaries = new Map<string, PublicEventWebhookDeliveryTargetSummary>();
  for (const attempt of attempts) {
    const existing = summaries.get(attempt.targetUrlHash);
    const latestAttemptAt =
      existing === undefined ||
      Date.parse(attempt.occurredAt) >= Date.parse(existing.latestAttemptAt);
    const summary: PublicEventWebhookDeliveryTargetSummary = existing ?? {
      targetUrlHash: attempt.targetUrlHash,
      totalCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      retryableFailedCount: 0,
      latestAttemptAt: attempt.occurredAt,
      latestStatus: attempt.status
    };
    summary.totalCount += 1;
    if (attempt.status === "DELIVERED") summary.deliveredCount += 1;
    if (attempt.status === "FAILED") summary.failedCount += 1;
    if (attempt.status === "FAILED" && attempt.retryable) {
      summary.retryableFailedCount += 1;
    }
    if (latestAttemptAt) {
      summary.latestAttemptAt = attempt.occurredAt;
      summary.latestStatus = attempt.status;
      if (attempt.nextRetryAt !== undefined) {
        summary.nextRetryAt = attempt.nextRetryAt;
      } else {
        delete summary.nextRetryAt;
      }
    }
    summaries.set(attempt.targetUrlHash, summary);
  }
  return [...summaries.values()].sort(
    (left, right) => Date.parse(right.latestAttemptAt) - Date.parse(left.latestAttemptAt)
  );
};

const publicEventWebhookExhaustedDeliveries = (
  attempts: PublicEventWebhookDeliveryAttemptView[],
  maxAttempts: number
): PublicEventWebhookExhaustedDeliveryView[] => {
  const latestByEventAndTarget =
    new Map<string, PublicEventWebhookDeliveryAttemptView>();
  for (const attempt of attempts) {
    const key = `${attempt.eventId}\0${attempt.targetUrlHash}`;
    const existing = latestByEventAndTarget.get(key);
    if (
      !existing ||
      Date.parse(attempt.occurredAt) >= Date.parse(existing.occurredAt)
    ) {
      latestByEventAndTarget.set(key, attempt);
    }
  }
  return [...latestByEventAndTarget.values()]
    .filter((attempt) => attempt.status === "FAILED")
    .map((attempt): PublicEventWebhookExhaustedDeliveryView | undefined => {
      if (!attempt.retryable) {
        return { ...attempt, reason: "non_retryable_failure" };
      }
      if (attempt.attemptNumber >= maxAttempts) {
        return { ...attempt, reason: "retry_limit_reached" };
      }
      if (!attempt.nextRetryAt) {
        return { ...attempt, reason: "retry_schedule_missing" };
      }
      return undefined;
    })
    .filter(
      (attempt): attempt is PublicEventWebhookExhaustedDeliveryView =>
        attempt !== undefined
    )
    .sort(
      (left, right) =>
        Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
    );
};

const publicEventWebhookDeadLetterQueue = (
  exhausted: PublicEventWebhookExhaustedDeliveryView[],
  reviews: PublicEventWebhookDeadLetterReviewView[]
): PublicEventWebhookDeadLetterQueueView[] => {
  const latestReviewByCandidate = new Map<
    string,
    PublicEventWebhookDeadLetterReviewView
  >();
  for (const review of reviews) {
    const key = deadLetterCandidateKey(review);
    const existing = latestReviewByCandidate.get(key);
    if (
      !existing ||
      Date.parse(review.reviewedAt) >= Date.parse(existing.reviewedAt)
    ) {
      latestReviewByCandidate.set(key, review);
    }
  }
  return exhausted.map((attempt) => {
    const latestReview = latestReviewByCandidate.get(
      deadLetterCandidateKey(attempt)
    );
    if (!latestReview) {
      return { ...attempt, reviewStatus: "UNREVIEWED" };
    }
    return { ...attempt, reviewStatus: "REVIEWED", latestReview };
  });
};

const deadLetterCandidateKey = (candidate: {
  deliveryId: string;
  eventId: string;
  targetUrlHash: string;
}): string =>
  `${candidate.deliveryId}\0${candidate.eventId}\0${candidate.targetUrlHash}`;

const publicEventWebhookDeadLetterReviewView = (
  request: PublicEventWebhookDeadLetterReviewRequest,
  exhaustedAttempt: PublicEventWebhookExhaustedDeliveryView,
  reviewedAt = new Date().toISOString()
): PublicEventWebhookDeadLetterReviewView => {
  const review: PublicEventWebhookDeadLetterReviewView = {
    id: `dead_letter_review_${sanitizeId(request.deliveryId)}_${Date.parse(
      reviewedAt
    )}`,
    deliveryId: request.deliveryId,
    eventId: request.eventId,
    targetUrlHash: request.targetUrlHash,
    decision: request.decision,
    exhaustionReason: exhaustedAttempt.reason,
    maxAttempts: request.maxAttempts,
    reviewedAt
  };
  if (request.note !== undefined) review.note = request.note;
  return review;
};

const publicEventWebhookDeadLetterReviewAuditEvent = (
  request: PublicEventWebhookDeadLetterReviewRequest,
  review: PublicEventWebhookDeadLetterReviewView
): AuditEvent => ({
  id: `audit_${review.id}`,
  tenantId: request.tenantId,
  workspaceId: request.workspaceId,
  userId: request.userId,
  occurredAt: review.reviewedAt,
  actorType: "USER",
  actorId: request.userId,
  action: "PUBLIC_EVENT_WEBHOOK_DEAD_LETTER_REVIEWED",
  resourceType: "PUBLIC_EVENT_WEBHOOK_DELIVERY",
  resourceId: review.deliveryId,
  metadata: {
    reviewId: review.id,
    deliveryId: review.deliveryId,
    eventId: review.eventId,
    targetUrlHash: review.targetUrlHash,
    decision: review.decision,
    exhaustionReason: review.exhaustionReason,
    maxAttempts: review.maxAttempts,
    reviewedAt: review.reviewedAt,
    ...(review.note !== undefined ? { note: review.note } : {})
  }
});

const publicEventWebhookDeadLetterReviewFromAuditEvent = (
  event: AuditEvent
): PublicEventWebhookDeadLetterReviewView | undefined => {
  if (
    event.action !== "PUBLIC_EVENT_WEBHOOK_DEAD_LETTER_REVIEWED" ||
    event.metadata === undefined
  ) {
    return undefined;
  }
  const id = metadataString(event, "reviewId") ?? event.id;
  const deliveryId = metadataString(event, "deliveryId") ?? event.resourceId;
  const eventId = metadataString(event, "eventId");
  const targetUrlHash = metadataString(event, "targetUrlHash");
  const decision = metadataString(event, "decision");
  const exhaustionReason = metadataString(event, "exhaustionReason");
  const reviewedAt = metadataString(event, "reviewedAt") ?? event.occurredAt;
  const maxAttempts =
    typeof event.metadata.maxAttempts === "number" &&
    Number.isInteger(event.metadata.maxAttempts)
      ? event.metadata.maxAttempts
      : undefined;
  if (
    !eventId ||
    !targetUrlHash ||
    (decision !== "ACKNOWLEDGED" &&
      decision !== "REPLAY_REQUESTED" &&
      decision !== "DROPPED") ||
    (exhaustionReason !== "retry_limit_reached" &&
      exhaustionReason !== "non_retryable_failure" &&
      exhaustionReason !== "retry_schedule_missing") ||
    maxAttempts === undefined
  ) {
    return undefined;
  }
  const review: PublicEventWebhookDeadLetterReviewView = {
    id,
    deliveryId,
    eventId,
    targetUrlHash,
    decision,
    exhaustionReason,
    maxAttempts,
    reviewedAt
  };
  const note = metadataString(event, "note");
  if (note !== undefined) review.note = note;
  return review;
};

const publicEventWebhookSubscriptionHealth = (
  subscriptions: PublicEventWebhookSubscriptionView[],
  attempts: PublicEventWebhookDeliveryAttemptView[],
  exhausted: PublicEventWebhookExhaustedDeliveryView[]
): PublicEventWebhookSubscriptionHealthView[] =>
  subscriptions
    .map((subscription) => {
      const subscriptionAttempts = attempts
        .filter((attempt) => attempt.targetUrlHash === subscription.targetUrlHash)
        .sort(
          (left, right) =>
            Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
        );
      const latestAttempt = subscriptionAttempts[0];
      const failedCount = subscriptionAttempts.filter(
        (attempt) => attempt.status === "FAILED"
      ).length;
      const deliveredCount = subscriptionAttempts.filter(
        (attempt) => attempt.status === "DELIVERED"
      ).length;
      const retryableFailedCount = subscriptionAttempts.filter(
        (attempt) => attempt.status === "FAILED" && attempt.retryable
      ).length;
      const exhaustedCount = exhausted.filter(
        (attempt) => attempt.targetUrlHash === subscription.targetUrlHash
      ).length;
      const healthStatus: PublicEventWebhookSubscriptionHealthStatus =
        subscription.status === "DISABLED"
          ? "DISABLED"
          : exhaustedCount > 0
            ? "EXHAUSTED"
            : latestAttempt === undefined
              ? "NEVER_DELIVERED"
              : latestAttempt.status === "FAILED"
                ? "FAILING"
                : "HEALTHY";
      const health: PublicEventWebhookSubscriptionHealthView = {
        subscriptionId: subscription.id,
        status: subscription.status,
        targetUrlHash: subscription.targetUrlHash,
        eventTypes: subscription.eventTypes,
        failedCount,
        deliveredCount,
        retryableFailedCount,
        exhaustedCount,
        healthStatus
      };
      if (subscription.deliveryTargetRefHash !== undefined) {
        health.deliveryTargetRefHash = subscription.deliveryTargetRefHash;
      }
      if (subscription.sourceSystem !== undefined) {
        health.sourceSystem = subscription.sourceSystem;
      }
      if (latestAttempt !== undefined) {
        health.lastAttemptAt = latestAttempt.occurredAt;
        health.latestStatus = latestAttempt.status;
      }
      return health;
    })
    .sort((left, right) => {
      const severityOrder: Record<
        PublicEventWebhookSubscriptionHealthStatus,
        number
      > = {
        EXHAUSTED: 0,
        FAILING: 1,
        NEVER_DELIVERED: 2,
        DISABLED: 3,
        HEALTHY: 4
      };
      const severityDifference =
        severityOrder[left.healthStatus] - severityOrder[right.healthStatus];
      if (severityDifference !== 0) return severityDifference;
      return (
        (right.lastAttemptAt ? Date.parse(right.lastAttemptAt) : 0) -
        (left.lastAttemptAt ? Date.parse(left.lastAttemptAt) : 0)
      );
    });

const publicEventDeliverySummaryAlert = (
  totals: { failedCount: number; retryableFailedCount: number },
  config: PublicEventDeliveryAlertConfig | undefined
) => {
  if (!config) {
    return {
      enabled: false,
      status: "NOT_CONFIGURED",
      thresholds: {},
      triggers: []
    };
  }
  const thresholds: Record<string, number> = {};
  const triggers: Array<{ metric: string; value: number; threshold: number }> = [];
  if (config.failedAttempts !== undefined) {
    thresholds.failedAttempts = config.failedAttempts;
    if (totals.failedCount >= config.failedAttempts) {
      triggers.push({
        metric: "failedAttempts",
        value: totals.failedCount,
        threshold: config.failedAttempts
      });
    }
  }
  if (config.retryableFailedAttempts !== undefined) {
    thresholds.retryableFailedAttempts = config.retryableFailedAttempts;
    if (totals.retryableFailedCount >= config.retryableFailedAttempts) {
      triggers.push({
        metric: "retryableFailedAttempts",
        value: totals.retryableFailedCount,
        threshold: config.retryableFailedAttempts
      });
    }
  }
  return {
    enabled: true,
    status: triggers.length > 0 ? "REVIEW_REQUIRED" : "OK",
    thresholds,
    triggers
  };
};

const publicEventSubscriptionHealthAlert = (
  totals: {
    failingCount: number;
    exhaustedCount: number;
    neverDeliveredCount: number;
  },
  config: PublicEventSubscriptionHealthAlertConfig | undefined
) => {
  if (!config) {
    return { enabled: false, status: "NOT_CONFIGURED", thresholds: {}, triggers: [] };
  }
  const thresholds: Record<string, number> = {};
  const triggers: Array<{ metric: string; value: number; threshold: number }> = [];
  if (config.failingSubscriptions !== undefined) {
    thresholds.failingSubscriptions = config.failingSubscriptions;
    if (totals.failingCount >= config.failingSubscriptions) {
      triggers.push({
        metric: "failingSubscriptions",
        value: totals.failingCount,
        threshold: config.failingSubscriptions
      });
    }
  }
  if (config.exhaustedSubscriptions !== undefined) {
    thresholds.exhaustedSubscriptions = config.exhaustedSubscriptions;
    if (totals.exhaustedCount >= config.exhaustedSubscriptions) {
      triggers.push({
        metric: "exhaustedSubscriptions",
        value: totals.exhaustedCount,
        threshold: config.exhaustedSubscriptions
      });
    }
  }
  if (config.neverDeliveredSubscriptions !== undefined) {
    thresholds.neverDeliveredSubscriptions = config.neverDeliveredSubscriptions;
    if (totals.neverDeliveredCount >= config.neverDeliveredSubscriptions) {
      triggers.push({
        metric: "neverDeliveredSubscriptions",
        value: totals.neverDeliveredCount,
        threshold: config.neverDeliveredSubscriptions
      });
    }
  }
  return {
    enabled: true,
    status: triggers.length > 0 ? "REVIEW_REQUIRED" : "OK",
    thresholds,
    triggers
  };
};

const publicEventDeadLetterQueueAlert = (
  totals: { unreviewedCount: number },
  config: PublicEventDeadLetterQueueAlertConfig | undefined
) => {
  if (!config) {
    return {
      enabled: false,
      status: "NOT_CONFIGURED",
      thresholds: {},
      triggers: []
    };
  }
  const thresholds: Record<string, number> = {};
  const triggers: Array<{ metric: string; value: number; threshold: number }> =
    [];
  if (config.unreviewedItems !== undefined) {
    thresholds.unreviewedItems = config.unreviewedItems;
    if (totals.unreviewedCount >= config.unreviewedItems) {
      triggers.push({
        metric: "unreviewedItems",
        value: totals.unreviewedCount,
        threshold: config.unreviewedItems
      });
    }
  }
  return {
    enabled: true,
    status: triggers.length > 0 ? "REVIEW_REQUIRED" : "OK",
    thresholds,
    triggers
  };
};

const publicEventWebhookDeliveryAttemptViewFromAttempt = (
  attempt: PublicEventWebhookDeliveryAttempt
): PublicEventWebhookDeliveryAttemptView => {
  const view: PublicEventWebhookDeliveryAttemptView = {
    deliveryId: attempt.deliveryId,
    eventId: attempt.eventId,
    type: attempt.type,
    status: attempt.status,
    targetUrlHash: createHash("sha256").update(attempt.targetUrl).digest("hex"),
    occurredAt: attempt.occurredAt,
    retryable: attempt.retryable,
    attemptNumber: attempt.attemptNumber
  };
  if (attempt.httpStatus !== undefined) view.httpStatus = attempt.httpStatus;
  if (attempt.errorCode !== undefined) view.errorCode = attempt.errorCode;
  if (attempt.nextRetryAt !== undefined) view.nextRetryAt = attempt.nextRetryAt;
  return view;
};

const duePublicEventWebhookDeliveryAttempts = (
  request: PublicEventWebhookDeliveryRetryDueRequest,
  auditEvents: AuditEvent[]
): PublicEventWebhookDeliveryAttemptView[] => {
  const targetUrlHash = createHash("sha256").update(request.targetUrl).digest("hex");
  const latestByEventAndTarget = new Map<string, PublicEventWebhookDeliveryAttemptView>();
  for (const attempt of auditEvents
    .map(publicEventWebhookDeliveryAttemptFromAuditEvent)
    .filter(
      (attempt): attempt is PublicEventWebhookDeliveryAttemptView =>
        attempt !== undefined
    )) {
    if (attempt.targetUrlHash !== targetUrlHash) continue;
    if (request.type && attempt.type !== request.type) continue;
    const key = `${attempt.eventId}\0${attempt.targetUrlHash}`;
    const existing = latestByEventAndTarget.get(key);
    if (!existing || Date.parse(attempt.occurredAt) >= Date.parse(existing.occurredAt)) {
      latestByEventAndTarget.set(key, attempt);
    }
  }
  const asOfMs = Date.parse(request.asOf);
  return Array.from(latestByEventAndTarget.values()).filter((attempt) => {
    if (attempt.status !== "FAILED" || !attempt.retryable) return false;
    if (!attempt.nextRetryAt) return false;
    const nextRetryAtMs = Date.parse(attempt.nextRetryAt);
    return Number.isFinite(nextRetryAtMs) && nextRetryAtMs <= asOfMs;
  });
};

const deliverPublicEventsToWebhook = async (
  request: PublicEventWebhookDeliveryRequest,
  events: PublicScheduleOSEvent[],
  attemptNumbers = new Map<string, number>()
): Promise<PublicEventWebhookDeliveryAttempt[]> => {
  const targetUrl = validatedWebhookDeliveryTargetUrl(request.targetUrl);
  const attempts: PublicEventWebhookDeliveryAttempt[] = [];
  for (const event of events) {
    const body = JSON.stringify(event);
    const occurredAt = new Date().toISOString();
    const attemptNumber = attemptNumbers.get(event.id) ?? 1;
      const deliveryId = `delivery_${createHash("sha256")
        .update(event.id)
        .update("\0")
        .update(occurredAt)
        .update("\0")
        .update(String(attemptNumber))
        .update("\0")
        .update(randomBytes(6).toString("hex"))
        .digest("hex")
        .slice(0, 24)}`;
    const signature = publicEventDeliverySignature(
      request.secret,
      occurredAt,
      deliveryId,
      event.id,
      body
    );
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "scheduleos-event-id": event.id,
          "scheduleos-delivery-id": deliveryId,
          "scheduleos-timestamp": occurredAt,
          "scheduleos-signature": signature
        },
  body
  });
  const retryMetadata = publicEventDeliveryRetryMetadata(
  response.status,
  occurredAt
  );
  const attempt: PublicEventWebhookDeliveryAttempt = {
  deliveryId,
  eventId: event.id,
  type: event.type,
  targetUrl,
  status: response.ok ? "DELIVERED" : "FAILED",
  httpStatus: response.status,
      retryable: retryMetadata.retryable,
      attemptNumber,
      occurredAt
    };
  if (retryMetadata.nextRetryAt !== undefined) {
  attempt.nextRetryAt = retryMetadata.nextRetryAt;
  }
  attempts.push(attempt);
  } catch {
  const retryMetadata = publicEventDeliveryRetryMetadata(undefined, occurredAt);
  const attempt: PublicEventWebhookDeliveryAttempt = {
  deliveryId,
  eventId: event.id,
  type: event.type,
  targetUrl,
  status: "FAILED",
      errorCode: "DELIVERY_NETWORK_ERROR",
      retryable: retryMetadata.retryable,
      attemptNumber,
      occurredAt
    };
  if (retryMetadata.nextRetryAt !== undefined) {
  attempt.nextRetryAt = retryMetadata.nextRetryAt;
  }
  attempts.push(attempt);
  }
  }
  return attempts;
};

const publicEventDeliveryRetryMetadata = (
  httpStatus: number | undefined,
  occurredAt: string
): { retryable: boolean; nextRetryAt?: string } => {
  const retryable =
    httpStatus === undefined ||
    httpStatus === 408 ||
    httpStatus === 429 ||
    (httpStatus >= 500 && httpStatus <= 599);
  if (!retryable) return { retryable: false };
  return {
    retryable: true,
    nextRetryAt: new Date(Date.parse(occurredAt) + 5 * 60 * 1000).toISOString()
  };
};

const publicEventDeliverySignature = (
  secret: string,
  timestamp: string,
  deliveryId: string,
  eventId: string,
  body: string
): string =>
  `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${deliveryId}.${eventId}.${body}`)
    .digest("hex")}`;

const validatedWebhookDeliveryTargetUrl = (targetUrl: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw validationError("targetUrl must be a valid URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw validationError("targetUrl must use http or https.");
  }
  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (parsed.protocol !== "https:" && !loopbackHosts.has(parsed.hostname)) {
    throw validationError("targetUrl must use https outside localhost.");
  }
  return parsed.toString();
};

const matchesImportAbuseSummaryFilters = (
  event: AuditEvent,
  url: URL
): boolean => {
  const sourceSystem = url.searchParams.get("sourceSystem");
  if (sourceSystem && event.metadata?.sourceSystem !== sourceSystem) return false;

  const since = optionalDateQuery(url, "since");
  if (since && Date.parse(event.occurredAt) < since.getTime()) return false;

  const until = optionalDateQuery(url, "until");
  if (until && Date.parse(event.occurredAt) > until.getTime()) return false;

  return (
    event.action === "IMPORT_THROTTLE_DENIED" ||
    (event.resourceType === "TASK" &&
      typeof event.metadata?.sourceSystem === "string" &&
      event.action.startsWith("TASK_") &&
      event.action.includes("_FROM_"))
  );
};

const summarizeImportAbuseEvents = (
  scope: Scope,
  events: AuditEvent[],
  url: URL,
  alertConfig: ImportAbuseAlertConfig | undefined
): Record<string, unknown> => {
  const sources = new Map<
    string,
    {
      sourceSystem: string;
      allowedEvents: number;
      deniedEvents: number;
      deniedRows: number;
      retryAfterMaxMs: number;
      operations: Map<
        string,
        {
          operation: string;
          allowedEvents: number;
          deniedEvents: number;
          deniedRows: number;
          maxRows?: number;
          windowMs?: number;
          retryAfterMaxMs: number;
        }
      >;
    }
  >();

  const totals = {
    allowedEvents: 0,
    deniedEvents: 0,
    deniedRows: 0,
    retryAfterMaxMs: 0
  };

  for (const event of events) {
    const eventSourceSystem =
      typeof event.metadata?.sourceSystem === "string"
        ? event.metadata.sourceSystem
        : event.actorId;
    const operation =
      typeof event.metadata?.operation === "string"
        ? event.metadata.operation
        : event.action;
    const sourceSummary =
      sources.get(eventSourceSystem) ??
      {
        sourceSystem: eventSourceSystem,
        allowedEvents: 0,
        deniedEvents: 0,
        deniedRows: 0,
        retryAfterMaxMs: 0,
        operations: new Map()
      };
    const operationSummary =
      sourceSummary.operations.get(operation) ??
      {
        operation,
        allowedEvents: 0,
        deniedEvents: 0,
        deniedRows: 0,
        retryAfterMaxMs: 0
      };

    if (event.action === "IMPORT_THROTTLE_DENIED") {
      const attemptedRows = numberMetadata(event, "attemptedRows") ?? 0;
      const retryAfterMs = numberMetadata(event, "retryAfterMs") ?? 0;
      sourceSummary.deniedEvents += 1;
      sourceSummary.deniedRows += attemptedRows;
      sourceSummary.retryAfterMaxMs = Math.max(
        sourceSummary.retryAfterMaxMs,
        retryAfterMs
      );
      operationSummary.deniedEvents += 1;
      operationSummary.deniedRows += attemptedRows;
      operationSummary.maxRows = numberMetadata(event, "maxRows");
      operationSummary.windowMs = numberMetadata(event, "windowMs");
      operationSummary.retryAfterMaxMs = Math.max(
        operationSummary.retryAfterMaxMs,
        retryAfterMs
      );
      totals.deniedEvents += 1;
      totals.deniedRows += attemptedRows;
      totals.retryAfterMaxMs = Math.max(totals.retryAfterMaxMs, retryAfterMs);
    } else {
      sourceSummary.allowedEvents += 1;
      operationSummary.allowedEvents += 1;
      totals.allowedEvents += 1;
    }

    sourceSummary.operations.set(operation, operationSummary);
    sources.set(eventSourceSystem, sourceSummary);
  }

  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    userId: scope.userId,
    generatedAt: new Date().toISOString(),
    filters: {
      sourceSystem: url.searchParams.get("sourceSystem"),
      since: url.searchParams.get("since"),
      until: url.searchParams.get("until")
    },
    totals,
    alert: importAbuseAlertSummary(totals, alertConfig),
    sources: Array.from(sources.values())
      .sort((left, right) => left.sourceSystem.localeCompare(right.sourceSystem))
      .map((source) => ({
        sourceSystem: source.sourceSystem,
        allowedEvents: source.allowedEvents,
        deniedEvents: source.deniedEvents,
        deniedRows: source.deniedRows,
        retryAfterMaxMs: source.retryAfterMaxMs,
        operations: Array.from(source.operations.values()).sort((left, right) =>
          left.operation.localeCompare(right.operation)
        )
      }))
  };
};

const importAbuseAlertSummary = (
  totals: { deniedEvents: number; deniedRows: number },
  config: ImportAbuseAlertConfig | undefined
): Record<string, unknown> => {
  if (!config || (config.deniedEvents === undefined && config.deniedRows === undefined)) {
    return {
      enabled: false,
      status: "NOT_CONFIGURED",
      thresholds: {},
      triggers: []
    };
  }

  const thresholds: Record<string, number> = {};
  const triggers: Array<{ metric: string; value: number; threshold: number }> = [];

  if (config.deniedEvents !== undefined) {
    thresholds.deniedEvents = config.deniedEvents;
    if (totals.deniedEvents >= config.deniedEvents) {
      triggers.push({
        metric: "deniedEvents",
        value: totals.deniedEvents,
        threshold: config.deniedEvents
      });
    }
  }

  if (config.deniedRows !== undefined) {
    thresholds.deniedRows = config.deniedRows;
    if (totals.deniedRows >= config.deniedRows) {
      triggers.push({
        metric: "deniedRows",
        value: totals.deniedRows,
        threshold: config.deniedRows
      });
    }
  }

  return {
    enabled: true,
    status: triggers.length > 0 ? "REVIEW_REQUIRED" : "OK",
    thresholds,
    triggers
  };
};

const summarizeRequestThrottleWindows = (
  scope: Scope,
  records: RequestThrottleRecord[],
  url: URL,
  rateLimit: RateLimitConfig | undefined
): Record<string, unknown> => {
  const since = optionalDateQuery(url, "since");
  const until = optionalDateQuery(url, "until");
  const now = optionalDateQuery(url, "asOf") ?? new Date();
  const filteredRecords = records.filter((record) => {
    const updatedAt = new Date(record.updatedAt);
    if (since && updatedAt.getTime() < since.getTime()) return false;
    if (until && updatedAt.getTime() > until.getTime()) return false;
    return true;
  });
  const windows = filteredRecords.map((record) => {
    const windowStartedAtMs = Date.parse(record.windowStartedAt);
    const retryAfterMs = Math.max(
      0,
      record.windowMs - (now.getTime() - windowStartedAtMs)
    );
    const atLimit = record.count >= record.limit;
    return {
      keyFingerprint: `sha256:${record.keyHash.slice(0, 12)}`,
      windowStartedAt: record.windowStartedAt,
      updatedAt: record.updatedAt,
      windowMs: record.windowMs,
      limit: record.limit,
      count: record.count,
      utilization: record.limit > 0 ? record.count / record.limit : 0,
      atLimit,
      retryAfterMs: atLimit ? retryAfterMs : 0
    };
  });
  const saturatedWindows = windows.filter((window) => window.atLimit);
  const totals = {
    activeWindows: windows.length,
    saturatedWindows: saturatedWindows.length,
    requestCount: windows.reduce((sum, window) => sum + window.count, 0),
    retryAfterMaxMs: saturatedWindows.reduce(
      (max, window) => Math.max(max, window.retryAfterMs),
      0
    )
  };
  return {
    scope,
    filters: {
      since: since?.toISOString(),
      until: until?.toISOString(),
      asOf: now.toISOString()
    },
    totals,
    alert: requestAbuseAlertSummary(totals, rateLimit),
    windows: windows.sort((left, right) =>
      left.keyFingerprint.localeCompare(right.keyFingerprint)
    )
  };
};

const requestAbuseAlertSummary = (
  totals: { saturatedWindows: number },
  rateLimit: RateLimitConfig | undefined
): Record<string, unknown> => {
  if (!rateLimit?.persisted) {
    return {
      enabled: false,
      status: "NOT_CONFIGURED",
      thresholds: {},
      triggers: []
    };
  }
  const threshold = 1;
  const triggers =
    totals.saturatedWindows >= threshold
      ? [
          {
            metric: "saturatedWindows",
            value: totals.saturatedWindows,
            threshold
          }
        ]
      : [];
  return {
    enabled: true,
    status: triggers.length > 0 ? "REVIEW_REQUIRED" : "OK",
    thresholds: { saturatedWindows: threshold },
    triggers
  };
};

const optionalDateQuery = (url: URL, field: string): Date | undefined => {
  const value = url.searchParams.get(field);
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be an ISO date.`);
  }
  return date;
};

const numberMetadata = (
  event: AuditEvent,
  field: string
): number | undefined => {
  const value = event.metadata?.[field];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const assertAuthorized = (
  principal: AuthPrincipal | null,
  scope: Scope
): void => {
  if (!principal) return;
  if (!matchesScope(principal, scope)) {
    throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot access this scope.");
  }
};

const assertAuthorizedUser = (
  principal: AuthPrincipal | null,
  userId: string
): void => {
  if (!principal) return;
  if (principal.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot access this user.");
  }
};

const assertAuthorizedTenantUser = (
  principal: AuthPrincipal | null,
  scope: Pick<Scope, "tenantId" | "userId">
): void => {
  if (!principal) return;
  if (principal.tenantId !== scope.tenantId || principal.userId !== scope.userId) {
    throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot access this scope.");
  }
};

const requireAuthAdmin = (
  principal: AuthPrincipal | null,
  scope?: Pick<Scope, "tenantId" | "workspaceId">
): AuthPrincipal => {
  const authenticated = requireAuthenticatedPrincipal(principal);
  if (scope) {
    if (
      authenticated.tenantId !== scope.tenantId ||
      authenticated.workspaceId !== scope.workspaceId
    ) {
      throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot manage this workspace.");
    }
  }
  if (authenticated.role !== "OWNER" && authenticated.role !== "ADMIN") {
    throw new ApiError(403, "FORBIDDEN", "Authenticated principal cannot manage auth records.");
  }
  return authenticated;
};

const requireAuthOwner = (
  principal: AuthPrincipal | null,
  scope: Pick<Scope, "tenantId" | "workspaceId">
): AuthPrincipal => {
  const authenticated = requireAuthAdmin(principal, scope);
  if (authenticated.role !== "OWNER") {
    throw new ApiError(403, "FORBIDDEN", "Only workspace owners can grant owner or admin roles.");
  }
  return authenticated;
};

const assertActiveAuthSubject = (
  repositories: ScheduleOSRepositories,
  actor: RepositoryActor,
  scope: Scope
): void => {
  if (!isActiveAuthSubject(repositories, actor, scope)) {
    throw new ApiError(403, "FORBIDDEN", "Auth subject is not active.");
  }
};

const isActiveAuthSubject = (
  repositories: ScheduleOSRepositories,
  actor: RepositoryActor,
  scope: Scope
): boolean => {
  const user = repositories.auth.getUser(actor, scope.tenantId, scope.userId);
  if (user.status !== "ACTIVE") return false;
  const membership = repositories.auth.getMembership(actor, scope);
  return membership.status === "ACTIVE";
};

const staticRoleForMembership = (role: string): StaticAuthRole => {
  if (role === "VIEWER") return "VIEWER";
  if (role === "ADMIN") return "ADMIN";
  if (role === "OWNER") return "OWNER";
  return "EDITOR";
};

const createAuthSession = (
  request: AuthSessionCreateRequest
): { session: AuthSession; token: string } => {
  const now = new Date();
  const expiresAt = requestedAuthSessionExpiry(request.expiresAt, now);
  const token = `sos_session_${randomBytes(32).toString("base64url")}`;
  const session: AuthSession = {
    id: `session_${randomBytes(16).toString("hex")}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    sessionTokenHash: hashSessionToken(token),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  return { session, token };
};

const requestedAuthSessionExpiry = (
  requestedExpiresAt: string | undefined,
  now: Date
): Date => {
  if (!requestedExpiresAt) {
    return new Date(now.getTime() + DEFAULT_AUTH_SESSION_TTL_MS);
  }
  const expiresAt = new Date(requestedExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    throw validationError("expiresAt must be an ISO date.");
  }
  if (expiresAt.getTime() <= now.getTime()) {
    throw validationError("expiresAt must be in the future.");
  }
  if (expiresAt.getTime() - now.getTime() > MAX_AUTH_SESSION_TTL_MS) {
    throw validationError("expiresAt must be within 30 days.");
  }
  return expiresAt;
};

const hashSessionToken = (token: string): string =>
createHash("sha256").update(token).digest("hex");

const hashPasswordResetToken = (token: string): string =>
createHash("sha256").update(token).digest("hex");

const resolvedPasswordResetConfig = (
  config: PasswordResetConfig | undefined
): Required<Pick<PasswordResetConfig, "ttlMs">> => ({
  ttlMs: config?.ttlMs ?? DEFAULT_PASSWORD_RESET_TTL_MS
});

const createPasswordResetTokenIfEligible = (
  repositories: ScheduleOSRepositories,
  request: AuthPasswordResetRequestCreate,
  config: Required<Pick<PasswordResetConfig, "ttlMs">>
): { record: AuthPasswordResetToken; token: string } | null => {
  let user: AuthUser;
  let membership: WorkspaceMembership;
  try {
    user = repositories.auth.getUser(
      { kind: "system" },
      request.tenantId,
      request.userId
    );
    membership = repositories.auth.getMembership({ kind: "system" }, request);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) return null;
    throw error;
  }
  if (
    user.status !== "ACTIVE" ||
    user.credentialHash === undefined ||
    membership.status !== "ACTIVE"
  ) {
    return null;
  }
  const now = new Date();
  const token = `sos_reset_${randomBytes(32).toString("base64url")}`;
  return {
    token,
    record: {
      id: `reset_${randomBytes(16).toString("hex")}`,
      tenantId: request.tenantId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      tokenHash: hashPasswordResetToken(token),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + config.ttlMs).toISOString()
    }
  };
};

const consumeValidPasswordResetToken = (
  repositories: ScheduleOSRepositories,
  request: AuthPasswordResetConfirmRequest,
  usedAt: string
): AuthPasswordResetToken | null => {
  const tokenHash = hashPasswordResetToken(request.resetToken);
  const nowMs = new Date(usedAt).getTime();
  const token = repositories.auth
    .listPasswordResetTokens({ kind: "system" }, request)
    .find(
      (candidate) =>
        candidate.tokenHash === tokenHash &&
        candidate.usedAt === undefined &&
        new Date(candidate.expiresAt).getTime() > nowMs
    );
  if (!token) return null;
  return repositories.auth.markPasswordResetTokenUsed(
    { kind: "system" },
    token.id,
    usedAt
  );
};

const SCRYPT_CREDENTIAL_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH_BYTES = 32;
const SCRYPT_CREDENTIAL_COST = 16384;
const SCRYPT_CREDENTIAL_BLOCK_SIZE = 8;
const SCRYPT_CREDENTIAL_PARALLELIZATION = 1;

const verifyCredential = (
  password: string,
  credentialHash: string | undefined
): boolean => {
  if (!credentialHash) return false;
  const parts = credentialHash.split("$");
  if (parts.length !== 7 || parts[0] !== SCRYPT_CREDENTIAL_PREFIX) {
    return false;
  }
  const [, rawCost, rawBlockSize, rawParallelization, rawKeyLength, salt, hash] =
    parts;
  const cost = Number(rawCost);
  const blockSize = Number(rawBlockSize);
  const parallelization = Number(rawParallelization);
  const keyLength = Number(rawKeyLength);
  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    keyLength !== SCRYPT_KEY_LENGTH_BYTES ||
    cost <= 1 ||
    blockSize <= 0 ||
    parallelization <= 0 ||
    salt === undefined ||
    hash === undefined
  ) {
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  if (expected.length !== keyLength) return false;
  try {
    const actual = scryptSync(
      password,
      Buffer.from(salt, "base64url"),
      keyLength,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: 64 * 1024 * 1024
      }
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};

const createCredentialHash = (password: string): string => {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH_BYTES, {
    N: SCRYPT_CREDENTIAL_COST,
    r: SCRYPT_CREDENTIAL_BLOCK_SIZE,
    p: SCRYPT_CREDENTIAL_PARALLELIZATION,
    maxmem: 64 * 1024 * 1024
  });
  return [
    SCRYPT_CREDENTIAL_PREFIX,
    String(SCRYPT_CREDENTIAL_COST),
    String(SCRYPT_CREDENTIAL_BLOCK_SIZE),
    String(SCRYPT_CREDENTIAL_PARALLELIZATION),
    String(SCRYPT_KEY_LENGTH_BYTES),
    salt.toString("base64url"),
    derived.toString("base64url")
  ].join("$");
};

const DEFAULT_SESSION_COOKIE_NAME = "sos_session";
const DEFAULT_SESSION_COOKIE_PATH = "/";
const DEFAULT_SESSION_COOKIE_SAME_SITE = "Lax";

const sessionCookieEnabled = (
  config: SessionCookieConfig | undefined
): boolean => config?.enabled === true;

const sessionCookieName = (config: SessionCookieConfig | undefined): string =>
  nonEmptyCookiePart(config?.name) ?? DEFAULT_SESSION_COOKIE_NAME;

const csrfTokenForSessionToken = (token: string): string =>
  `sos_csrf_${hashSessionToken(token)}`;

const sessionTokenFromCookie = (
  request: IncomingMessage,
  config: SessionCookieConfig | undefined
): string | undefined => {
  if (!sessionCookieEnabled(config)) return undefined;
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return parseCookieHeader(cookieHeader).get(sessionCookieName(config));
};

const parseCookieHeader = (cookieHeader: string): Map<string, string> => {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = part.split("=");
    const name = rawName?.trim();
    if (!name) continue;
    cookies.set(name, rawValueParts.join("=").trim());
  }
  return cookies;
};

const sessionCookieHeader = (
  token: string,
  config: SessionCookieConfig | undefined
): string => {
  const name = sessionCookieName(config);
  const path = nonEmptyCookiePart(config?.path) ?? DEFAULT_SESSION_COOKIE_PATH;
  const sameSite = config?.sameSite ?? DEFAULT_SESSION_COOKIE_SAME_SITE;
  const parts = [
    `${name}=${token}`,
    "HttpOnly",
    `Path=${path}`,
    `SameSite=${sameSite}`
  ];
  if (config?.secure === true) parts.push("Secure");
  return parts.join("; ");
};

const clearedSessionCookieHeader = (
  config: SessionCookieConfig | undefined
): string => {
  const name = sessionCookieName(config);
  const path = nonEmptyCookiePart(config?.path) ?? DEFAULT_SESSION_COOKIE_PATH;
  const sameSite = config?.sameSite ?? DEFAULT_SESSION_COOKIE_SAME_SITE;
  const parts = [
    `${name}=`,
    "HttpOnly",
    `Path=${path}`,
    `SameSite=${sameSite}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];
  if (config?.secure === true) parts.push("Secure");
  return parts.join("; ");
};

const nonEmptyCookiePart = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const enforceCookieCsrf = (
  request: IncomingMessage,
  principal: AuthPrincipal | null,
  auth: StaticAuthConfig | undefined
): void => {
  if (
    principal?.authMethod !== "COOKIE_SESSION" ||
    auth?.sessionCookie?.csrfRequired !== true ||
    !isUnsafeMethod(request.method ?? "GET")
  ) {
    return;
  }
  const csrfHeader = request.headers["x-scheduleos-csrf-token"];
  const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
  if (!csrfToken || csrfToken !== principal.csrfToken) {
    throw new ApiError(
      403,
      "CSRF_REQUIRED",
      "Cookie-authenticated write requests require a valid CSRF token."
    );
  }
};

const isUnsafeMethod = (method: string): boolean =>
  !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const publicAuthSession = (session: AuthSession): PublicAuthSession => {
  const publicSession: PublicAuthSession = {
    id: session.id,
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
  if (session.revokedAt !== undefined) publicSession.revokedAt = session.revokedAt;
  if (session.lastSeenAt !== undefined) publicSession.lastSeenAt = session.lastSeenAt;
  return publicSession;
};

const publicAuthUser = (user: AuthUser): PublicAuthUser => ({
  id: user.id,
  tenantId: user.tenantId,
  email: user.email,
  displayName: user.displayName,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const cleanupLocalStoreRetention = (
  store: ApiStore,
  scope: Scope,
  asOf: Date,
  dryRun: boolean,
  requiredConfirmation: string
): LocalRetentionCleanupResult => {
  const cutoffs = calculateRetentionCutoffs(asOf);
  const eligible: RetentionCountMap = {};
  const deleted: RetentionCountMap = {};
  const reviewDue: RetentionCountMap = {};

  const schedulePlanCutoff = cutoffFor(cutoffs, "SCHEDULE_PLAN_HISTORY");
  const idempotencyCutoff = cutoffFor(cutoffs, "IDEMPOTENCY_RECORD");
  const authSessionCutoff = cutoffFor(cutoffs, "AUTH_SESSION");
  const passwordResetTokenCutoff = cutoffFor(
    cutoffs,
    "AUTH_PASSWORD_RESET_TOKEN"
  );
  const loginAttemptWindowCutoff = cutoffFor(
    cutoffs,
    "AUTH_LOGIN_ATTEMPT_WINDOW"
  );
  const importThrottleCutoff = cutoffFor(cutoffs, "IMPORT_THROTTLE_WINDOW");
  const integrationCutoff = cutoffFor(cutoffs, "INTEGRATION_SYNC_METADATA");
  const auditCutoff = cutoffFor(cutoffs, "AUDIT_EVENT");

  const planEligible = (plan: SchedulePlan): boolean =>
    matchesScope(plan, scope) && beforeCutoff(plan.rangeEnd, schedulePlanCutoff);
  const idempotencyEligible = (record: IdempotencyRecord): boolean =>
    matchesScope(record, scope) &&
    (record.status === "COMPLETED" ||
      record.status === "FAILED" ||
      (record.expiresAt !== undefined && beforeIso(record.expiresAt, asOf))) &&
    beforeCutoff(
      record.completedAt ?? record.expiresAt ?? record.createdAt,
      idempotencyCutoff
    );
  const sessionEligible = (session: AuthSession): boolean =>
    matchesScope(session, scope) &&
    (session.revokedAt !== undefined || beforeIso(session.expiresAt, asOf)) &&
    beforeCutoff(session.revokedAt ?? session.expiresAt, authSessionCutoff);
  const passwordResetTokenEligible = (
    token: AuthPasswordResetToken
  ): boolean =>
    matchesScope(token, scope) &&
    (token.usedAt !== undefined || beforeIso(token.expiresAt, asOf)) &&
    beforeCutoff(token.usedAt ?? token.expiresAt, passwordResetTokenCutoff);
  const loginAttemptWindowEligible = (
    window: AuthLoginAttemptWindow
  ): boolean =>
    matchesScope(window, scope) &&
    beforeCutoff(window.lockedUntil ?? window.updatedAt, loginAttemptWindowCutoff);
  const throttleEligible = (record: ImportThrottleRecord): boolean =>
    matchesScope(record, scope) &&
    beforeCutoff(importThrottleWindowEnd(record), importThrottleCutoff);
  const integrationEligible = (integration: IntegrationState): boolean =>
    matchesScope(integration, scope) &&
    integration.status !== "CONNECTED" &&
    beforeCutoff(integration.updatedAt, integrationCutoff);
  const auditReviewDue = (event: AuditEvent): boolean =>
    matchesScope(event, scope) && beforeCutoff(event.occurredAt, auditCutoff);

  countMatches(store.plans, planEligible, eligible, "SCHEDULE_PLAN_HISTORY");
  countMatches(
    store.idempotencyRecords,
    idempotencyEligible,
    eligible,
    "IDEMPOTENCY_RECORD"
  );
  countMatches(store.authSessions, sessionEligible, eligible, "AUTH_SESSION");
  countMatches(
    store.authPasswordResetTokens,
    passwordResetTokenEligible,
    eligible,
    "AUTH_PASSWORD_RESET_TOKEN"
  );
  countMatches(
    store.authLoginAttemptWindows,
    loginAttemptWindowEligible,
    eligible,
    "AUTH_LOGIN_ATTEMPT_WINDOW"
  );
  countMatches(
    store.importThrottleRecords,
    throttleEligible,
    eligible,
    "IMPORT_THROTTLE_WINDOW"
  );
  countMatches(
    store.integrationStates,
    integrationEligible,
    eligible,
    "INTEGRATION_SYNC_METADATA"
  );
  countMatches(store.auditEvents, auditReviewDue, reviewDue, "AUDIT_EVENT");

  if (!dryRun) {
    store.plans = pruneEligible(
      store.plans,
      planEligible,
      deleted,
      "SCHEDULE_PLAN_HISTORY"
    );
    store.idempotencyRecords = pruneEligible(
      store.idempotencyRecords,
      idempotencyEligible,
      deleted,
      "IDEMPOTENCY_RECORD"
    );
  store.authSessions = pruneEligible(
    store.authSessions,
    sessionEligible,
    deleted,
    "AUTH_SESSION"
  );
  store.authPasswordResetTokens = pruneEligible(
    store.authPasswordResetTokens,
    passwordResetTokenEligible,
    deleted,
    "AUTH_PASSWORD_RESET_TOKEN"
  );
  store.authLoginAttemptWindows = pruneEligible(
    store.authLoginAttemptWindows,
    loginAttemptWindowEligible,
    deleted,
    "AUTH_LOGIN_ATTEMPT_WINDOW"
  );
  store.importThrottleRecords = pruneEligible(
      store.importThrottleRecords,
      throttleEligible,
      deleted,
      "IMPORT_THROTTLE_WINDOW"
    );
    store.integrationStates = pruneEligible(
      store.integrationStates,
      integrationEligible,
      deleted,
      "INTEGRATION_SYNC_METADATA"
    );
  }

  return {
    asOf: asOf.toISOString(),
    dryRun,
    requiredConfirmation,
    eligible,
    deleted,
    reviewDue
  };
};

const retentionCleanupAuditEvent = (
  principal: AuthPrincipal,
  scope: Scope,
  result: LocalRetentionCleanupResult
): AuditEvent => ({
  id: `retention_cleanup_${scope.tenantId}_${scope.workspaceId}_${scope.userId}_${Date.now()}`,
  tenantId: scope.tenantId,
  workspaceId: scope.workspaceId,
  userId: scope.userId,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: principal.userId,
  action: "RETENTION_CLEANUP_APPLIED",
  resourceType: "RETENTION_CLEANUP",
  resourceId: `${scope.tenantId}/${scope.workspaceId}/${scope.userId}`,
  metadata: {
    asOf: result.asOf,
    deleted: result.deleted,
    reviewDue: result.reviewDue
  }
});

const schedulePlanAuditEvent = (
  plan: SchedulePlan,
  action:
    | "SCHEDULE_CREATED"
    | "SCHEDULE_ACCEPTED"
    | "SCHEDULE_REJECTED"
    | "SCHEDULE_REPLANNED"
): AuditEvent => ({
  id: `audit_${action.toLowerCase()}_${plan.id}_${Date.now()}`,
  tenantId: plan.tenantId,
  workspaceId: plan.workspaceId,
  userId: plan.userId,
  occurredAt: new Date().toISOString(),
  actorType: "SYSTEM",
  actorId: "scheduleos-api",
  action,
  resourceType: "SCHEDULE_PLAN",
  resourceId: plan.id,
  metadata: {
    status: plan.status,
    rangeStart: plan.rangeStart,
    rangeEnd: plan.rangeEnd,
    timezone: plan.timezone,
    blockCount: plan.blocks.length,
    unscheduledCount: plan.unscheduledTasks.length,
    capacityWarningCount: plan.capacityWarnings.length
  }
});

const appendScheduleWarningAuditEvents = (
  actor: RepositoryActor,
  repositories: ScheduleOSRepositories,
  plan: SchedulePlan
): void => {
  plan.capacityWarnings.forEach((warning, index) => {
    repositories.auditEvents.append(
      actor,
      scheduleCapacityWarningAuditEvent(plan, warning, index)
    );
    if (warning.code === "DEADLINE_AT_RISK" && warning.taskId) {
      repositories.auditEvents.append(
        actor,
        taskDeadlineRiskAuditEvent(plan, warning, index)
      );
    }
  });
};

const scheduleCapacityWarningAuditEvent = (
  plan: SchedulePlan,
  warning: SchedulePlan["capacityWarnings"][number],
  index: number
): AuditEvent => ({
  id: `audit_schedule_capacity_exceeded_${plan.id}_${index}_${Date.now()}`,
  tenantId: plan.tenantId,
  workspaceId: plan.workspaceId,
  userId: plan.userId,
  occurredAt: new Date().toISOString(),
  actorType: "SYSTEM",
  actorId: "scheduleos-api",
  action: "SCHEDULE_CAPACITY_EXCEEDED",
  resourceType: "SCHEDULE_PLAN",
  resourceId: plan.id,
  metadata: warningAuditMetadata(plan, warning)
});

const taskDeadlineRiskAuditEvent = (
  plan: SchedulePlan,
  warning: SchedulePlan["capacityWarnings"][number],
  index: number
): AuditEvent => ({
  id: `audit_task_deadline_at_risk_${plan.id}_${warning.taskId}_${index}_${Date.now()}`,
  tenantId: plan.tenantId,
  workspaceId: plan.workspaceId,
  userId: plan.userId,
  occurredAt: new Date().toISOString(),
  actorType: "SYSTEM",
  actorId: "scheduleos-api",
  action: "TASK_DEADLINE_AT_RISK",
  resourceType: "TASK",
  resourceId: warning.taskId ?? plan.id,
  metadata: warningAuditMetadata(plan, warning)
});

const warningAuditMetadata = (
  plan: SchedulePlan,
  warning: SchedulePlan["capacityWarnings"][number]
): NonNullable<AuditEvent["metadata"]> => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    planId: plan.id,
    planStatus: plan.status,
    warningCode: warning.code,
    availableMinutes: warning.availableMinutes,
    requiredMinutes: warning.requiredMinutes
  };
  if (warning.taskId) metadata.taskId = warning.taskId;
  return metadata;
};

const timeBlockAuditEvent = (
  block: TimeBlock,
  action: "lock" | "unlock" | "complete" | "missed"
): AuditEvent => ({
  id: `audit_block_${action}_${block.id}_${Date.now()}`,
  tenantId: block.tenantId,
  workspaceId: block.workspaceId,
  userId: block.userId,
  occurredAt: new Date().toISOString(),
  actorType: "SYSTEM",
  actorId: "scheduleos-api",
  action: `BLOCK_${action.toUpperCase()}`,
  resourceType: "TIME_BLOCK",
  resourceId: block.id,
  metadata: {
    taskId: block.taskId,
    status: block.status,
    locked: block.locked,
    start: block.start,
    end: block.end
  }
});

const cutoffFor = (
  cutoffs: ReturnType<typeof calculateRetentionCutoffs>,
  category: RetentionPolicyCategory
): string | null =>
  cutoffs.find((cutoff) => cutoff.category === category)?.deleteBefore ?? null;

const countMatches = <T>(
  items: T[],
  predicate: (item: T) => boolean,
  counts: RetentionCountMap,
  category: RetentionPolicyCategory
): void => {
  const count = items.filter(predicate).length;
  if (count > 0) counts[category] = count;
};

const pruneEligible = <T>(
  items: T[],
  predicate: (item: T) => boolean,
  counts: RetentionCountMap,
  category: RetentionPolicyCategory
): T[] => {
  const retained: T[] = [];
  let deleted = 0;
  for (const item of items) {
    if (predicate(item)) {
      deleted += 1;
    } else {
      retained.push(item);
    }
  }
  if (deleted > 0) counts[category] = deleted;
  return retained;
};

const beforeCutoff = (value: string, cutoff: string | null): boolean =>
  cutoff !== null && beforeIso(value, new Date(cutoff));

const beforeIso = (value: string, date: Date): boolean => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < date.getTime();
};

const importThrottleWindowEnd = (record: ImportThrottleRecord): string => {
  const startedAt = new Date(record.windowStartedAt);
  if (Number.isNaN(startedAt.getTime())) return record.updatedAt;
  return new Date(startedAt.getTime() + record.windowMs).toISOString();
};

const authSessionAuditEvent = (
  session: AuthSession,
  action: "AUTH_SESSION_CREATED" | "AUTH_SESSION_REVOKED"
): AuditEvent => ({
  id: `${action.toLowerCase()}_${session.id}_${Date.now()}`,
  tenantId: session.tenantId,
  workspaceId: session.workspaceId,
  userId: session.userId,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: session.userId,
  action,
  resourceType: "auth_session",
  resourceId: session.id,
  metadata: {
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt ?? null
  }
});

const authUserAuditEvent = (
  principal: AuthPrincipal | null,
  user: AuthUser
): AuditEvent => ({
  id: `auth_user_upserted_${user.id}_${Date.now()}`,
  tenantId: user.tenantId,
  workspaceId: principal?.workspaceId ?? "workspace_auth_admin",
  userId: principal?.userId ?? user.id,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: principal?.userId ?? user.id,
  action: "AUTH_USER_UPSERTED",
  resourceType: "auth_user",
  resourceId: user.id,
  metadata: {
    targetUserId: user.id,
    status: user.status
  }
});

const authCredentialRotatedAuditEvent = (
  principal: AuthPrincipal,
  user: AuthUser,
  revokedSessionCount: number
): AuditEvent => ({
  id: `auth_credential_rotated_${user.id}_${Date.now()}`,
  tenantId: user.tenantId,
  workspaceId: principal.workspaceId,
  userId: principal.userId,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: principal.userId,
  action: "AUTH_CREDENTIAL_ROTATED",
  resourceType: "auth_user",
  resourceId: user.id,
  metadata: {
    targetUserId: user.id,
    revokedSessionCount
  }
});

const authCredentialResetAuditEvent = (
  principal: AuthPrincipal,
  user: AuthUser,
  workspaceId: string,
  revokedSessionCount: number
): AuditEvent => ({
  id: `auth_credential_reset_${user.id}_${Date.now()}`,
  tenantId: user.tenantId,
  workspaceId,
  userId: principal.userId,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: principal.userId,
  action: "AUTH_CREDENTIAL_RESET",
  resourceType: "auth_user",
  resourceId: user.id,
  metadata: {
    targetUserId: user.id,
    revokedSessionCount
  }
});

const authPasswordResetRequestedAuditEvent = (
  resetToken: AuthPasswordResetToken
): AuditEvent => ({
  id: `auth_password_reset_requested_${resetToken.id}_${Date.now()}`,
  tenantId: resetToken.tenantId,
  workspaceId: resetToken.workspaceId,
  userId: resetToken.userId,
  occurredAt: new Date().toISOString(),
  actorType: "SYSTEM",
  actorId: "password_reset",
  action: "AUTH_PASSWORD_RESET_REQUESTED",
  resourceType: "auth_password_reset_token",
  resourceId: resetToken.id,
  metadata: {
    expiresAt: resetToken.expiresAt
  }
});

const authPasswordResetCompletedAuditEvent = (
  user: AuthUser,
  resetToken: AuthPasswordResetToken,
  revokedSessionCount: number
): AuditEvent => ({
  id: `auth_password_reset_completed_${user.id}_${Date.now()}`,
  tenantId: user.tenantId,
  workspaceId: resetToken.workspaceId,
  userId: user.id,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: user.id,
  action: "AUTH_PASSWORD_RESET_COMPLETED",
  resourceType: "auth_user",
  resourceId: user.id,
  metadata: {
    resetTokenId: resetToken.id,
    revokedSessionCount
  }
});

const workspaceMembershipAuditEvent = (
  principal: AuthPrincipal | null,
  membership: WorkspaceMembership
): AuditEvent => ({
  id: `workspace_membership_upserted_${membership.userId}_${Date.now()}`,
  tenantId: membership.tenantId,
  workspaceId: membership.workspaceId,
  userId: principal?.userId ?? membership.userId,
  occurredAt: new Date().toISOString(),
  actorType: "USER",
  actorId: principal?.userId ?? membership.userId,
  action: "WORKSPACE_MEMBERSHIP_UPSERTED",
  resourceType: "workspace_membership",
  resourceId: membership.userId,
  metadata: {
    targetUserId: membership.userId,
    role: membership.role,
    status: membership.status
  }
});

const findPlan = (store: ApiStore, planId: string): SchedulePlan => {
  const plan = store.plans.find((candidate) => candidate.id === planId);
  if (!plan) {
    throw new ApiError(404, "NOT_FOUND", "Schedule plan not found.");
  }
  return plan;
};

const findBlock = (store: ApiStore, blockId: string): TimeBlock => {
  for (const plan of store.plans) {
    const block = plan.blocks.find((candidate) => candidate.id === blockId);
    if (block) return block;
  }
  throw new ApiError(404, "NOT_FOUND", "Time block not found.");
};

const replacePlan = (store: ApiStore, plan: SchedulePlan): void => {
  store.plans = [
    ...store.plans.filter((existing) => existing.id !== plan.id),
    plan
  ];
};

const replanSchedule = (store: ApiStore, planId: string): SchedulePlan => {
  const previousPlan = findPlan(store, planId);
  const workingHours = store.workingHours.get(previousPlan.userId);
  if (!workingHours) {
    throw validationError("workingHours are required before replanning schedule.");
  }

  const preservedBlocks = previousPlan.blocks
    .filter(
      (block) =>
        block.locked ||
        block.status === "LOCKED" ||
        block.status === "COMPLETED"
    )
    .map((block) =>
      block.status === "COMPLETED" ? { ...block, locked: true } : block
    );
  const preservedTaskIds = new Set(
    preservedBlocks.map((block) => block.taskId)
  );

  const scheduleInput: CreateScheduleInput = {
    tenantId: previousPlan.tenantId,
    workspaceId: previousPlan.workspaceId,
    userId: previousPlan.userId,
    rangeStart: previousPlan.rangeStart,
    rangeEnd: previousPlan.rangeEnd,
    timezone: previousPlan.timezone,
    workingHours,
    tasks: store.tasks.filter(
      (task) => matchesScope(task, previousPlan) && !preservedTaskIds.has(task.id)
    ),
    calendarEvents: store.calendarEvents.filter(
      (event) => matchesScope(event, previousPlan)
    ),
    existingBlocks: preservedBlocks,
    planId: previousPlan.id
  };

  const replanned = createSchedule(scheduleInput);
  replacePlan(store, replanned);
  return replanned;
};

const updateBlockState = (
  store: ApiStore,
  blockId: string,
  action: "lock" | "unlock" | "complete" | "missed"
): TimeBlock => {
  let updatedBlock: TimeBlock | undefined;
  let foundBlock = false;

  store.plans = store.plans.map((plan) => {
    const blocks = plan.blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }
      foundBlock = true;
      updatedBlock = applyBlockAction(block, action);
      return updatedBlock;
    });
    return { ...plan, blocks };
  });

  if (!foundBlock || !updatedBlock) {
    throw new ApiError(404, "NOT_FOUND", "Time block not found.");
  }
  return updatedBlock;
};

const applyBlockAction = (
  block: TimeBlock,
  action: "lock" | "unlock" | "complete" | "missed"
): TimeBlock => {
  switch (action) {
    case "lock":
      return { ...block, locked: true, status: "LOCKED" };
    case "unlock":
      return { ...block, locked: false, status: "ACCEPTED" };
    case "complete":
      return { ...block, status: "COMPLETED" };
    case "missed":
      return { ...block, status: "MISSED" };
  }
};

interface Scope {
  tenantId: string;
  workspaceId: string;
  userId: string;
}

interface PublicScheduleOSEvent {
  id: string;
  type: string;
  version: "v1";
  tenantId: string;
  workspaceId: string;
  userId: string;
  occurredAt: string;
  idempotencyKey: string;
  source: {
    system: string;
    actorType: AuditEvent["actorType"];
    actorId: string;
    auditEventId: string;
  };
  subject: {
    type: string;
    id: string;
  };
  data: Record<string, unknown>;
}

interface ScheduleRequest extends Scope {
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
}

interface CalendarWritebackRequest extends Scope {
 calendarId: string;
 readOnly: boolean;
}

interface CalendarWritebackConflict {
 blockId: string;
 taskId: string;
 proposedEventId: string;
 conflictEventId: string;
 conflictTitle: string;
 overlapStart: string;
 overlapEnd: string;
 severity: "BLOCKING";
}

interface IcsImportRequest {
  tenantId: string;
  workspaceId: string;
  userId: string;
  calendarId: string;
  ics: string;
  recurrenceRangeStart?: string;
  recurrenceRangeEnd?: string;
}

interface ConnectOsCalendarImportRequest extends Scope {
  connectionId: string;
  capabilityRef?: string;
  calendarId: string;
  dryRun?: boolean;
  events: ConnectOsCalendarEventRow[];
}

interface ConnectOsCalendarEventRow {
  externalId: string;
  title?: string;
  start: string;
  end: string;
  timezone?: string;
  allDay?: boolean;
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  busyStatus?: "BUSY" | "FREE" | "OUT_OF_OFFICE" | "TENTATIVE_BUSY" | "UNKNOWN";
  privacyLevel?: "PUBLIC" | "PRIVATE" | "CONFIDENTIAL" | "BUSY_ONLY" | "UNKNOWN";
  readOnly?: boolean;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  travelBeforeMinutes?: number;
  travelAfterMinutes?: number;
}

interface ImportedTaskRequest extends Scope {
  sourceSystem: string;
  externalId: string;
  title: string;
  durationMinutes?: number;
  ownerId?: string;
  desiredOutcome?: string;
  deadline?: string;
  earliestStart?: string;
  latestFinish?: string;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  blocked?: boolean;
  waiting?: boolean;
  completed?: boolean;
  dependencies?: string[];
  sourceReference?: string;
  sourceUrl?: string;
  projectId?: string;
  tags?: string[];
}

type WebhookTaskRequest = ImportedTaskRequest;

interface JsonTaskImportRequest extends Scope {
  sourceSystem: string;
  dryRun?: boolean;
  tasks: JsonTaskImportRow[];
}

interface CsvTaskImportRequest extends Scope {
  sourceSystem: string;
  templateId?: string;
  dryRun?: boolean;
  headers: string[];
  rows: string[][];
}

interface CsvTaskTemplate {
  id: string;
  displayName: string;
  sourceSystem: string;
  requiredHeaders: string[];
  optionalHeaders: string[];
  sampleCsv: string;
  sampleRowCount: number;
  fieldAliases: Partial<Record<CsvTaskTemplateField, string[]>>;
}

type CsvTaskTemplateField =
  | "externalId"
  | "title"
  | "durationMinutes"
  | "deadline"
  | "priority"
  | "sourceReference"
  | "sourceUrl"
  | "projectId"
  | "tags";

interface OwnerOpsTaskImportRequest extends Scope {
  dryRun?: boolean;
  tasks: OwnerOpsTaskImportRow[];
}

interface ScheduleGuidanceApplyRequest extends Scope {
  sourceSystem: string;
  guidance: ScheduleGuidanceRow[];
}

interface AuthSessionCreateRequest extends Scope {
  expiresAt?: string;
}

interface AuthSessionLoginRequest extends AuthSessionCreateRequest {
  password: string;
}

interface AuthPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

interface AuthPasswordResetRequestCreate extends Scope {}

interface AuthPasswordResetConfirmRequest extends Scope {
  resetToken: string;
  newPassword: string;
}

interface AuthPasswordResetRequest
  extends Pick<Scope, "tenantId" | "workspaceId"> {
  newPassword: string;
}

interface PublicAuthUser {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

interface PublicAuthSession {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastSeenAt?: string;
}

interface ScheduleGuidanceRow {
  taskId: string;
  strategicPriority?: Priority;
  ownerOnly?: boolean;
  preferredDayparts?: SchedulingTask["preferredDayparts"];
  tags?: string[];
  sourceReference?: string;
  reason?: string;
}

interface JsonTaskImportRow {
  externalId: string;
  title: string;
  durationMinutes?: number;
  deadline?: string;
  earliestStart?: string;
  latestFinish?: string;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  sourceReference?: string;
  sourceUrl?: string;
  projectId?: string;
  tags?: string[];
}

interface OwnerOpsTaskImportRow {
  externalId: string;
  title: string;
  desiredOutcome?: string;
  assigneeId?: string;
  ownerId?: string;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  estimatedDurationMinutes?: number;
  durationMinutes?: number;
  deadline?: string;
  earliestStart?: string;
  latestFinish?: string;
  blocked?: boolean;
  waiting?: boolean;
  completed?: boolean;
  operationalStatus?: string;
  dependencies?: string[];
  sourceReference?: string;
  sourceUrl?: string;
  projectId?: string;
  tags?: string[];
}

interface TaskImportRowError {
  index: number;
  code: string;
  message: string;
}

interface VerifiedWebhookReplayCheck {
  eventId: string;
  timestamp: string;
  idempotencyKey: string;
  expiresAt: string;
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const readJson = async (
  request: IncomingMessage,
  maxBytes: number
): Promise<unknown> => {
  return parseJsonText(await readBodyText(request, maxBytes));
};

const readBodyText = async (
  request: IncomingMessage,
  maxBytes: number
): Promise<string> => {
  const contentLength = request.headers["content-length"];
  if (
    typeof contentLength === "string" &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > maxBytes
  ) {
    throw requestBodyTooLargeError(maxBytes);
  }
  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += buffer.length;
    if (byteLength > maxBytes) {
      throw requestBodyTooLargeError(maxBytes);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const parseJsonText = (text: string): unknown => {
  if (text.length === 0) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "BAD_JSON", "Request body must be valid JSON.");
  }
};

const parseWebhookTask = (value: unknown): WebhookTaskRequest =>
  parseImportedTaskRequest(value);

const parseJsonTaskImportRequest = (value: unknown): JsonTaskImportRequest => {
  const object = asRecord(value);
  const tasks = object.tasks;
  if (!Array.isArray(tasks)) {
    throw validationError("tasks must be an array.");
  }
  const request: JsonTaskImportRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem: requiredString(object, "sourceSystem"),
    tasks: tasks as JsonTaskImportRow[]
  };
  const dryRun = optionalBoolean(object, "dryRun");
  if (dryRun !== undefined) request.dryRun = dryRun;
  return request;
};

const parseCsvTaskImportRequest = (value: unknown): CsvTaskImportRequest => {
  const object = asRecord(value);
  const csv = requiredString(object, "csv");
  const templateId = optionalString(object, "templateId");
  const template = templateId ? csvTemplateById(templateId) : undefined;
  const records = parseCsvRecords(csv).filter((row) =>
    row.some((field) => field.trim().length > 0)
  );
  if (records.length === 0) {
    throw validationError("csv must include header row.");
  }
  const rawHeaders = records[0]!.map((header) => header.trim());
  const rows = records.slice(1);
  const mapped = template
    ? mapCsvRowsWithTemplate(template, rawHeaders, rows)
    : { headers: rawHeaders, rows };
  const headers = mapped.headers;
  if (!headers.includes("externalId") || !headers.includes("title")) {
    throw validationError("csv must include externalId and title headers.");
  }
  const request: CsvTaskImportRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem:
      optionalString(object, "sourceSystem") ??
      template?.sourceSystem ??
      requiredString(object, "sourceSystem"),
    headers,
    rows: mapped.rows
  };
  if (templateId !== undefined) request.templateId = templateId;
  const dryRun = optionalBoolean(object, "dryRun");
  if (dryRun !== undefined) request.dryRun = dryRun;
  return request;
};

const parseOwnerOpsTaskImportRequest = (
  value: unknown
): OwnerOpsTaskImportRequest => {
  const object = asRecord(value);
  const tasks = object.tasks;
  if (!Array.isArray(tasks)) {
    throw validationError("tasks must be an array.");
  }
  const request: OwnerOpsTaskImportRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    tasks: tasks as OwnerOpsTaskImportRow[]
  };
  const dryRun = optionalBoolean(object, "dryRun");
  if (dryRun !== undefined) request.dryRun = dryRun;
  return request;
};

const parseScheduleGuidanceApplyRequest = (
  value: unknown
): ScheduleGuidanceApplyRequest => {
  const object = asRecord(value);
  const guidance = object.guidance;
  if (!Array.isArray(guidance)) {
    throw validationError("guidance must be an array.");
  }
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem: requiredString(object, "sourceSystem"),
    guidance: guidance.map(parseScheduleGuidanceRow)
  };
};

const parseScheduleGuidanceRow = (value: unknown): ScheduleGuidanceRow => {
  const object = asRecord(value);
  const row: ScheduleGuidanceRow = {
    taskId: requiredString(object, "taskId")
  };
  const strategicPriority = optionalEnum(object, "strategicPriority", [
    "URGENT",
    "HIGH",
    "MEDIUM",
    "LOW"
  ]);
  if (strategicPriority !== undefined) row.strategicPriority = strategicPriority;
  const ownerOnly = optionalBoolean(object, "ownerOnly");
  if (ownerOnly !== undefined) row.ownerOnly = ownerOnly;
  const preferredDayparts = optionalEnumArray(object, "preferredDayparts", [
    "MORNING",
    "AFTERNOON",
    "EVENING"
  ]);
  if (preferredDayparts !== undefined) {
    row.preferredDayparts = preferredDayparts;
  }
  const tags = optionalStringArray(object, "tags");
  if (tags !== undefined) row.tags = tags;
  const sourceReference = optionalString(object, "sourceReference");
  if (sourceReference !== undefined) row.sourceReference = sourceReference;
  const reason = optionalString(object, "reason");
  if (reason !== undefined) row.reason = reason;
  return row;
};

const parseOwnerOpsImportedTaskRequest = (
  value: unknown,
  scope: Scope
): ImportedTaskRequest => {
  const object = asRecord(value);
  const estimatedDurationMinutes =
    optionalPositiveNumber(object, "estimatedDurationMinutes") ??
    optionalPositiveNumber(object, "durationMinutes");
  const priority = optionalEnum(object, "priority", [
    "URGENT",
    "HIGH",
    "MEDIUM",
    "LOW"
  ]);
  const blocked = optionalBoolean(object, "blocked");
  const waiting = optionalBoolean(object, "waiting");
  const completed = ownerOpsRowIsCompleted(object);
  const task: ImportedTaskRequest = {
    ...scope,
    sourceSystem: "OWNEROPS",
    externalId: requiredString(object, "externalId"),
    title: requiredString(object, "title"),
    completed
  };

  if (estimatedDurationMinutes !== undefined) {
    task.durationMinutes = estimatedDurationMinutes;
  }
  if (priority !== undefined) task.priority = priority;
  if (blocked !== undefined) task.blocked = blocked;
  if (waiting !== undefined) task.waiting = waiting;

  const ownerId =
    optionalString(object, "assigneeId") ?? optionalString(object, "ownerId");
  if (ownerId !== undefined) task.ownerId = ownerId;

  for (const field of [
    "deadline",
    "earliestStart",
    "latestFinish",
    "desiredOutcome",
    "sourceReference",
    "sourceUrl",
    "projectId"
  ] as const) {
    const fieldValue = optionalString(object, field);
    if (fieldValue !== undefined) task[field] = fieldValue;
  }

  const dependencies = optionalStringArray(object, "dependencies");
  if (dependencies !== undefined) task.dependencies = dependencies;
  const tags = optionalStringArray(object, "tags");
  if (tags !== undefined) task.tags = tags;

  return task;
};

const ownerOpsRowIsCompleted = (object: Record<string, unknown>): boolean => {
  const completed = optionalBoolean(object, "completed");
  if (completed !== undefined) return completed;
  const operationalStatus = optionalString(object, "operationalStatus");
  return operationalStatus?.toUpperCase() === "COMPLETED";
};

const csvTaskRowToObject = (
  headers: string[],
  row: string[]
): Record<string, unknown> => {
  const object: Record<string, unknown> = {};
  for (const [index, header] of headers.entries()) {
    const rawValue = row[index] ?? "";
    const value = rawValue.trim();
    if (value.length === 0) continue;
    if (!CSV_TASK_FIELDS.has(header)) continue;
    if (header === "durationMinutes") {
      const durationMinutes = Number(value);
      if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0 ||
        !Number.isInteger(durationMinutes)
      ) {
        throw validationError("durationMinutes must be positive integer.");
      }
      object.durationMinutes = durationMinutes;
      continue;
    }
    if (header === "tags") {
      object.tags = value
        .split(/[|;]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      continue;
    }
    object[header] = value;
  }
  return object;
};

const CSV_TASK_TEMPLATES: CsvTaskTemplate[] = [
  {
    id: "todoist",
    displayName: "Todoist CSV",
    sourceSystem: "TODOIST_CSV",
    requiredHeaders: ["Task ID", "Content"],
  optionalHeaders: ["Due Date", "Priority", "Duration Minutes", "Project", "Labels", "URL"],
  sampleCsv:
    "Task ID,Content,Due Date,Priority,Duration Minutes,Project,Labels,URL\n" +
    "todoist_demo_1,Prepare launch checklist,2026-07-24T17:00:00.000Z,p1,45,Launch,ops|planning,https://todoist.example/tasks/todoist_demo_1\n" +
    "todoist_demo_2,Follow up with volunteer team,2026-07-25T16:00:00.000Z,p2,30,Launch,volunteers|follow-up,https://todoist.example/tasks/todoist_demo_2\n" +
    "todoist_demo_3,Review giving report,2026-07-26T15:00:00.000Z,p3,60,Finance,review|report,https://todoist.example/tasks/todoist_demo_3\n" +
    "todoist_demo_4,Capture sermon notes,,p4,,Teaching,ideas,https://todoist.example/tasks/todoist_demo_4",
  sampleRowCount: 4,
  fieldAliases: {
      externalId: ["Task ID", "ID"],
      title: ["Content", "Task", "Title"],
      deadline: ["Due Date", "Deadline"],
      priority: ["Priority"],
      durationMinutes: ["Duration Minutes", "Duration"],
      projectId: ["Project"],
      tags: ["Labels", "Tags"],
      sourceUrl: ["URL", "Link"]
    }
  },
  {
    id: "linear",
    displayName: "Linear Issues CSV",
    sourceSystem: "LINEAR_CSV",
    requiredHeaders: ["Issue ID", "Title"],
  optionalHeaders: ["Due Date", "Priority", "Estimate Minutes", "Project", "Labels", "URL"],
  sampleCsv:
    "Issue ID,Title,Due Date,Priority,Estimate Minutes,Project,Labels,URL\n" +
    "LIN-42,Review scheduling bug,2026-07-24T17:00:00.000Z,high,60,Calendar,bug|scheduler,https://linear.example/LIN-42\n" +
    "LIN-43,Write provider import notes,2026-07-25T15:00:00.000Z,medium,45,Integrations,docs|imports,https://linear.example/LIN-43\n" +
    "LIN-44,Confirm sync checkpoint copy,2026-07-26T14:00:00.000Z,low,30,Integrations,sync|copy,https://linear.example/LIN-44\n" +
    "LIN-45,Triage production calendar feedback,,medium,,Calendar,feedback,https://linear.example/LIN-45",
  sampleRowCount: 4,
  fieldAliases: {
      externalId: ["Issue ID", "ID"],
      title: ["Title"],
      deadline: ["Due Date", "Deadline"],
      priority: ["Priority"],
      durationMinutes: ["Estimate Minutes", "Estimate"],
      projectId: ["Project", "Team"],
      tags: ["Labels", "Tags"],
      sourceUrl: ["URL", "Link"]
    }
  },
  {
    id: "asana",
    displayName: "Asana Tasks CSV",
    sourceSystem: "ASANA_CSV",
    requiredHeaders: ["Task ID", "Name"],
  optionalHeaders: ["Due Date", "Priority", "Estimated Minutes", "Projects", "Tags", "Permalink"],
  sampleCsv:
    "Task ID,Name,Due Date,Priority,Estimated Minutes,Projects,Tags,Permalink\n" +
    "asana_demo_1,Prepare volunteer plan,2026-07-24T17:00:00.000Z,high,45,Launch,volunteers|planning,https://asana.example/tasks/asana_demo_1\n" +
    "asana_demo_2,Confirm room setup checklist,2026-07-25T14:00:00.000Z,medium,30,Launch,facilities|checklist,https://asana.example/tasks/asana_demo_2\n" +
    "asana_demo_3,Review first-time guest follow-up,2026-07-26T18:00:00.000Z,high,50,Keep,follow-up|care,https://asana.example/tasks/asana_demo_3\n" +
    "asana_demo_4,Collect leadership meeting notes,,low,,Crew,notes,https://asana.example/tasks/asana_demo_4",
  sampleRowCount: 4,
  fieldAliases: {
      externalId: ["Task ID", "ID"],
      title: ["Name", "Task Name", "Title"],
      deadline: ["Due Date", "Deadline"],
      priority: ["Priority"],
      durationMinutes: ["Estimated Minutes", "Estimate Minutes"],
      projectId: ["Projects", "Project"],
      tags: ["Tags"],
      sourceUrl: ["Permalink", "URL", "Link"]
    }
  },
  {
    id: "clickup",
    displayName: "ClickUp Tasks CSV",
    sourceSystem: "CLICKUP_CSV",
    requiredHeaders: ["Task ID", "Task Name"],
  optionalHeaders: ["Due Date", "Priority", "Time Estimate Minutes", "List", "Tags", "URL"],
  sampleCsv:
    "Task ID,Task Name,Due Date,Priority,Time Estimate Minutes,List,Tags,URL\n" +
    "clickup_demo_1,Confirm production checklist,2026-07-24T17:00:00.000Z,urgent,30,Launch,ops|release,https://clickup.example/t/clickup_demo_1\n" +
    "clickup_demo_2,Review Sunday schedule handoff,2026-07-25T18:00:00.000Z,high,45,Launch,schedule|handoff,https://clickup.example/t/clickup_demo_2\n" +
    "clickup_demo_3,Check kids ministry supplies,2026-07-26T20:00:00.000Z,normal,25,Operations,supplies|kids,https://clickup.example/t/clickup_demo_3\n" +
    "clickup_demo_4,Backlog community outreach ideas,,low,,Grow,ideas,https://clickup.example/t/clickup_demo_4",
  sampleRowCount: 4,
  fieldAliases: {
      externalId: ["Task ID", "ID"],
      title: ["Task Name", "Name", "Title"],
      deadline: ["Due Date", "Deadline"],
      priority: ["Priority"],
      durationMinutes: ["Time Estimate Minutes", "Estimate Minutes"],
      projectId: ["List", "Folder", "Project"],
      tags: ["Tags"],
      sourceUrl: ["URL", "Link"]
    }
  },
{
id: "trello",
displayName: "Trello Cards CSV",
sourceSystem: "TRELLO_CSV",
requiredHeaders: ["Card ID", "Card Name"],
optionalHeaders: ["List Name", "Due Date", "Labels", "Card URL", "Estimated Minutes"],
sampleCsv:
"Card ID,Card Name,List Name,Due Date,Labels,Card URL,Estimated Minutes\n" +
"trello_demo_1,Review launch board,Doing,2026-07-25T16:00:00.000Z,ops|board,https://trello.example/c/trello_demo_1,35\n" +
"trello_demo_2,Prepare follow-up checklist,Next,2026-07-26T15:00:00.000Z,follow-up|planning,https://trello.example/c/trello_demo_2,45\n" +
"trello_demo_3,Confirm calendar blockers,Waiting,2026-07-27T14:00:00.000Z,calendar|risk,https://trello.example/c/trello_demo_3,30\n" +
"trello_demo_4,Capture backlog idea,Backlog,,ideas,https://trello.example/c/trello_demo_4,",
sampleRowCount: 4,
  fieldAliases: {
    externalId: ["Card ID", "Card Short ID", "ID"],
    title: ["Card Name", "Name", "Title"],
    deadline: ["Due Date", "Due"],
    durationMinutes: ["Estimated Minutes", "Estimate Minutes", "Duration Minutes"],
    projectId: ["List Name", "List", "Board"],
    tags: ["Labels", "Tags"],
    sourceUrl: ["Card URL", "URL", "Link"]
  }
},
{
  id: "microsoft_planner",
  displayName: "Microsoft Planner Tasks CSV",
  sourceSystem: "MICROSOFT_PLANNER_CSV",
  requiredHeaders: ["Task ID", "Task Name"],
  optionalHeaders: [
    "Bucket Name",
    "Due Date",
    "Priority",
    "Estimated Minutes",
    "Labels",
    "Task Link"
  ],
  sampleCsv:
    "Task ID,Task Name,Bucket Name,Due Date,Priority,Estimated Minutes,Labels,Task Link\n" +
    "planner_demo_1,Confirm ministry calendar plan,This week,2026-07-27T16:00:00.000Z,urgent,50,calendar|planning,https://planner.example/tasks/planner_demo_1\n" +
    "planner_demo_2,Prepare volunteer rota,Next,2026-07-28T15:00:00.000Z,high,40,volunteers|schedule,https://planner.example/tasks/planner_demo_2\n" +
    "planner_demo_3,Review facility checklist,Waiting,2026-07-29T18:00:00.000Z,normal,30,facilities|review,https://planner.example/tasks/planner_demo_3\n" +
    "planner_demo_4,Capture outreach follow-up,Backlog,,low,,outreach,https://planner.example/tasks/planner_demo_4",
  sampleRowCount: 4,
  fieldAliases: {
    externalId: ["Task ID", "ID"],
    title: ["Task Name", "Title", "Name"],
    deadline: ["Due Date", "Deadline"],
    priority: ["Priority"],
    durationMinutes: ["Estimated Minutes", "Estimate Minutes", "Duration Minutes"],
    projectId: ["Bucket Name", "Bucket", "Plan Name", "Plan"],
    tags: ["Labels", "Tags"],
    sourceUrl: ["Task Link", "URL", "Link"]
  }
},
{
  id: "github_issues",
  displayName: "GitHub Issues CSV",
sourceSystem: "GITHUB_ISSUES_CSV",
    requiredHeaders: ["Issue Number", "Title"],
  optionalHeaders: ["Due Date", "Priority", "Estimate Minutes", "Repository", "Labels", "URL"],
  sampleCsv:
    "Issue Number,Title,Due Date,Priority,Estimate Minutes,Repository,Labels,URL\n" +
    "42,Fix calendar export edge case,2026-07-24T17:00:00.000Z,medium,60,scheduleos,bug|ics,https://github.example/scheduleos/issues/42\n" +
    "43,Document provider CSV import flow,2026-07-25T15:00:00.000Z,medium,45,scheduleos,docs|csv,https://github.example/scheduleos/issues/43\n" +
    "44,Add regression fixture for CSV import,2026-07-26T14:00:00.000Z,high,35,scheduleos,test|csv,https://github.example/scheduleos/issues/44\n" +
    "45,Collect provider import UX notes,,low,,scheduleos,research,https://github.example/scheduleos/issues/45",
  sampleRowCount: 4,
  fieldAliases: {
      externalId: ["Issue Number", "Issue ID", "Number"],
      title: ["Title"],
      deadline: ["Due Date", "Deadline"],
      priority: ["Priority"],
      durationMinutes: ["Estimate Minutes", "Duration Minutes"],
      projectId: ["Repository", "Project"],
      tags: ["Labels", "Tags"],
      sourceUrl: ["URL", "Link"]
    }
  }
];

const csvTemplateById = (templateId: string): CsvTaskTemplate => {
  const template = CSV_TASK_TEMPLATES.find((candidate) => candidate.id === templateId);
  if (!template) throw validationError(`unknown CSV template: ${templateId}.`);
  return template;
};

const mapCsvRowsWithTemplate = (
  template: CsvTaskTemplate,
  headers: string[],
  rows: string[][]
): { headers: string[]; rows: string[][] } => {
  const canonicalHeaders: CsvTaskTemplateField[] = [
    "externalId",
    "title",
    "durationMinutes",
    "deadline",
    "priority",
    "sourceReference",
    "sourceUrl",
    "projectId",
    "tags"
  ];
  const headerIndexes = csvTemplateHeaderIndexes(template, headers);
  return {
    headers: canonicalHeaders,
    rows: rows.map((row) =>
      canonicalHeaders.map((field) =>
        templateCsvFieldValue(field, row, headerIndexes.get(field))
      )
    )
  };
};

const csvTemplateHeaderIndexes = (
  template: CsvTaskTemplate,
  headers: string[]
): Map<CsvTaskTemplateField, number | undefined> => {
  const lowerHeaders = headers.map((header) => normalizeCsvHeader(header));
  const indexes = new Map<CsvTaskTemplateField, number | undefined>();
  for (const [field, aliases] of Object.entries(template.fieldAliases) as Array<
    [CsvTaskTemplateField, string[]]
  >) {
    indexes.set(
      field,
      aliases
        .map((alias) => lowerHeaders.indexOf(normalizeCsvHeader(alias)))
        .find((index) => index >= 0)
    );
  }
  for (const requiredHeader of template.requiredHeaders) {
    if (!lowerHeaders.includes(normalizeCsvHeader(requiredHeader))) {
      throw validationError(`csv template ${template.id} missing required header ${requiredHeader}.`);
    }
  }
  return indexes;
};

const templateCsvFieldValue = (
  field: CsvTaskTemplateField,
  row: string[],
  index: number | undefined
): string => {
  if (field === "sourceReference") return `row:${row.join("|").slice(0, 120)}`;
  if (index === undefined) return "";
  const value = row[index] ?? "";
  if (field === "priority") return normalizeTemplatePriority(value);
  return value;
};

const normalizeCsvHeader = (header: string): string => header.trim().toLowerCase();

const normalizeTemplatePriority = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (["p1", "urgent", "highest", "critical"].includes(normalized)) return "URGENT";
  if (["p2", "high"].includes(normalized)) return "HIGH";
  if (["p3", "medium", "normal"].includes(normalized)) return "MEDIUM";
  if (["p4", "low", "lowest"].includes(normalized)) return "LOW";
  return value.trim();
};

const CSV_TASK_FIELDS = new Set([
  "externalId",
  "title",
  "durationMinutes",
  "deadline",
  "earliestStart",
  "latestFinish",
  "priority",
  "sourceReference",
  "sourceUrl",
  "projectId",
  "tags"
]);

const parseCsvRecords = (text: string): string[][] => {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"" && field.length === 0) {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      record.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      continue;
    }
    if (char === "\r") {
      if (text[index + 1] === "\n") index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      continue;
    }
    field += char;
  }

  if (inQuotes) {
    throw validationError("csv contains unterminated quoted field.");
  }
  record.push(field);
  records.push(record);
  return records;
};

const parseImportedTaskRequest = (value: unknown): ImportedTaskRequest => {
  const object = asRecord(value);
  const durationMinutes = optionalPositiveNumber(object, "durationMinutes");
  const priority = optionalEnum(object, "priority", [
    "URGENT",
    "HIGH",
    "MEDIUM",
    "LOW"
  ]);
  const task: ImportedTaskRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem: requiredString(object, "sourceSystem"),
    externalId: requiredString(object, "externalId"),
    title: requiredString(object, "title")
  };

  if (durationMinutes !== undefined) task.durationMinutes = durationMinutes;
  if (priority !== undefined) task.priority = priority;
  for (const field of [
    "deadline",
    "earliestStart",
    "latestFinish",
    "sourceReference",
    "sourceUrl",
    "projectId"
  ] as const) {
    const value = optionalString(object, field);
    if (value !== undefined) task[field] = value;
  }
  const tags = optionalStringArray(object, "tags");
  if (tags !== undefined) task.tags = tags;
  return task;
};

const taskFromImportedRequest = (
  request: ImportedTaskRequest,
  sourcePrefix: "webhook" | "json" | "csv" | "ownerops"
): SchedulingTask => {
  const durationMinutes = request.durationMinutes ?? 1;
  const hasDuration = request.durationMinutes !== undefined;
  const blocked = request.blocked ?? false;
  const waiting = request.waiting ?? false;
  const completed = request.completed ?? false;
  const now = new Date().toISOString();
  const task: SchedulingTask = {
    id: `${sourcePrefix}_${sanitizeId(request.sourceSystem)}_${sanitizeId(request.externalId)}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    ownerId: request.ownerId ?? request.userId,
    title: request.title,
    priority: request.priority ?? "MEDIUM",
    estimatedDurationMinutes: durationMinutes,
    remainingDurationMinutes: durationMinutes,
    schedulingMode: request.deadline ? "DEADLINE_DRIVEN" : "FLEXIBLE",
    splittable: false,
    schedulingEligible: hasDuration && !blocked && !waiting && !completed,
    blocked,
    waiting,
    confidence: hasDuration ? "INFERRED_HIGH" : "UNKNOWN",
    createdAt: now,
    updatedAt: now,
    sourceSystem: request.sourceSystem,
    externalId: request.externalId,
    sourceReference: request.sourceReference ?? request.externalId
  };
  if (request.deadline !== undefined) task.deadline = request.deadline;
  if (request.earliestStart !== undefined) task.earliestStart = request.earliestStart;
  if (request.latestFinish !== undefined) task.latestFinish = request.latestFinish;
  if (request.desiredOutcome !== undefined) task.desiredOutcome = request.desiredOutcome;
  if (request.dependencies !== undefined) task.dependencies = request.dependencies;
  if (request.sourceReference !== undefined) {
    task.sourceReference = request.sourceReference;
  }
  if (request.sourceUrl !== undefined) task.sourceUrl = request.sourceUrl;
  if (request.projectId !== undefined) task.projectId = request.projectId;
  if (request.tags !== undefined) task.tags = request.tags;
  return task;
};

const upsertImportedTask = (
  actor: RepositoryActor,
  repository: TaskRepository,
  task: SchedulingTask
): { task: SchedulingTask; updated: boolean } => {
  const existingTasks = repository.list(actor, task);
  const existingTask = existingTasks.find((existing) => existing.id === task.id);
  const updated = existingTask !== undefined;
  if (existingTask) task.createdAt = existingTask.createdAt;
  return { task: repository.upsert(actor, task), updated };
};

const verifyWebhookSignature = (
  request: IncomingMessage,
  rawBody: string,
  sourceSystem: string,
  options: ApiServerOptions
): VerifiedWebhookReplayCheck | undefined => {
  const secrets = webhookSecretsForSource(options.webhookSecrets?.[sourceSystem]);
  if (secrets.length === 0) return undefined;

  const signature = request.headers["x-scheduleos-signature"];
  const timestamp = request.headers["x-scheduleos-timestamp"];
  const eventId = request.headers["x-scheduleos-event-id"];
  if (typeof timestamp !== "string" || typeof eventId !== "string") {
    throw new ApiError(
      401,
      "MISSING_WEBHOOK_REPLAY_HEADERS",
      "Signed webhooks require timestamp and event id headers."
    );
  }

  const timestampMs = Date.parse(timestamp);
  const replayWindowMs = webhookReplayWindowForSource(sourceSystem, options);
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > replayWindowMs
  ) {
    throw new ApiError(
      401,
      "WEBHOOK_TIMESTAMP_OUT_OF_WINDOW",
      "Webhook timestamp is outside the allowed replay window."
    );
  }

  if (
    typeof signature !== "string" ||
    !secrets.some((secret) => validSignature(rawBody, secret, signature, timestamp))
  ) {
    throw new ApiError(
      401,
      "INVALID_WEBHOOK_SIGNATURE",
      "Webhook signature is invalid."
    );
  }

  return {
    eventId,
    timestamp,
    idempotencyKey: `webhook:${sanitizeId(sourceSystem)}:${sanitizeId(eventId)}`,
    expiresAt: new Date(timestampMs + replayWindowMs).toISOString()
  };
};

const reserveWebhookEvent = (
  actor: RepositoryActor,
  repository: IdempotencyRepository,
  request: ImportedTaskRequest,
  rawBody: string,
  replayCheck: VerifiedWebhookReplayCheck
): void => {
  const reserved = repository.reserve(actor, {
    key: replayCheck.idempotencyKey,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    requestHash: createHash("sha256").update(rawBody).digest("hex"),
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
    expiresAt: replayCheck.expiresAt
  });
  if (!reserved.created) {
    throw new ApiError(409, "WEBHOOK_REPLAYED", "Webhook event was already used.");
  }
};

const validSignature = (
  body: string,
  secret: string,
  signature: string,
  timestamp: string
): boolean => {
  const signedPayload = `${timestamp}.${body}`;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const webhookSecretsForSource = (
  config: WebhookSecretConfig | undefined
): string[] => {
  if (!config) return [];
  const secrets = Array.isArray(config) ? config : [config];
  return secrets.filter((secret) => secret.trim().length > 0);
};

const validateWebhookSecretsConfig = (
  webhookSecrets: Record<string, WebhookSecretConfig> | undefined
): void => {
  if (!webhookSecrets) return;
  for (const [sourceSystem, config] of Object.entries(webhookSecrets)) {
    if (webhookSecretsForSource(config).length === 0) {
      throw validationError(
        `webhookSecrets.${sourceSystem} must include at least one non-empty secret.`
      );
    }
  }
};

const webhookReplayWindowForSource = (
  sourceSystem: string,
  options: ApiServerOptions
): number =>
  options.webhookReplayWindows?.[sourceSystem] ??
  options.webhookReplayWindowMs ??
  DEFAULT_WEBHOOK_REPLAY_WINDOW_MS;

const validateWebhookReplayWindowsConfig = (
  replayWindows: Record<string, number> | undefined
): void => {
  if (!replayWindows) return;
  for (const [sourceSystem, replayWindowMs] of Object.entries(replayWindows)) {
    if (replayWindowMs <= 0) {
      throw validationError(
        `webhookReplayWindows.${sourceSystem} must be positive.`
      );
    }
  }
};

const taskImportAuditEvent = (
  request: ImportedTaskRequest,
  task: SchedulingTask,
  updated: boolean,
  sourceKind: "WEBHOOK" | "JSON" | "CSV" | "OWNEROPS"
): AuditEvent => ({
  id: `audit_${sourceKind.toLowerCase()}_${task.id}_${updated ? "updated" : "created"}`,
  tenantId: request.tenantId,
  workspaceId: request.workspaceId,
  userId: request.userId,
  occurredAt: task.updatedAt,
  actorType: "INTEGRATION",
  actorId: request.sourceSystem,
  action: `TASK_${updated ? "UPDATED" : "CREATED"}_FROM_${sourceKind}`,
  resourceType: "TASK",
  resourceId: task.id,
  metadata: {
    sourceSystem: request.sourceSystem,
    externalId: request.externalId,
    sourceReference: request.sourceReference ?? request.externalId
  }
});

const scheduleGuidanceAuditEvent = (
  request: ScheduleGuidanceApplyRequest,
  guidance: ScheduleGuidanceRow,
  task: SchedulingTask
): AuditEvent => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    sourceSystem: request.sourceSystem,
    sourceReference: guidance.sourceReference ?? guidance.taskId
  };
  if (guidance.strategicPriority !== undefined) {
    metadata.strategicPriority = guidance.strategicPriority;
  }
  if (guidance.ownerOnly !== undefined) metadata.ownerOnly = guidance.ownerOnly;
  if (guidance.reason !== undefined) metadata.reason = guidance.reason;
  return {
    id: `audit_schedule_guidance_${task.id}_${Date.parse(task.updatedAt)}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    occurredAt: task.updatedAt,
    actorType: "INTEGRATION",
    actorId: request.sourceSystem,
    action: "TASK_SCHEDULE_GUIDANCE_APPLIED",
    resourceType: "TASK",
    resourceId: task.id,
    metadata
  };
};

const importThrottleDeniedAuditEvent = (
  scope: Scope,
  sourceSystem: string,
  operation: ImportThrottleOperation,
  attemptedRows: number,
  policy: ImportThrottlePolicy,
  retryAfterMs: number
): AuditEvent => {
  const occurredAt = new Date().toISOString();
  return {
    id: `audit_import_throttle_denied_${sourceSystem}_${operation}_${occurredAt}`,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    userId: scope.userId,
    occurredAt,
    actorType: "INTEGRATION",
    actorId: sourceSystem,
    action: "IMPORT_THROTTLE_DENIED",
    resourceType: "IMPORT_THROTTLE",
    resourceId: `${sourceSystem}:${operation}`,
    metadata: {
      sourceSystem,
      operation,
      attemptedRows,
      maxRows: policy.maxRows,
      windowMs: policy.windowMs,
      retryAfterMs
    }
  };
};

const taskImportRowError = (
  index: number,
  error: unknown
): TaskImportRowError => {
  if (error instanceof ApiError) {
    return { index, code: error.code, message: error.message };
  }
  return {
    index,
    code: "VALIDATION_ERROR",
    message: "Task row could not be imported."
  };
};

const PROVIDER_IMPORT_POLICIES: ProviderImportPolicy[] = [
  {
    sourceSystem: "GENERIC_WEBHOOK",
    operation: "WEBHOOK_TASK_IMPORT",
    recommendedPolicy: { windowMs: 300_000, maxRows: 100 },
    riskLevel: "MEDIUM",
    notes: "Signed low-volume webhook default."
  },
  {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 500 },
    riskLevel: "MEDIUM",
    notes: "Manual or batch task import default."
  },
  {
    sourceSystem: "CSV_IMPORT",
    operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 500 },
    riskLevel: "MEDIUM",
    notes: "Generic CSV import default."
  },
  {
    sourceSystem: "ICS_CALENDAR_IMPORT",
    operation: "ICS_CALENDAR_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Calendar imports can include larger historical or recurring ranges."
  },
  {
    sourceSystem: "TODOIST_CSV",
    operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 500 },
    riskLevel: "MEDIUM",
    notes: "Provider-template CSV import source."
  },
  {
    sourceSystem: "LINEAR_CSV",
    operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Issue exports can be larger than personal task exports."
  },
  {
    sourceSystem: "ASANA_CSV",
    operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Project exports can include many completed or archived tasks."
  },
  {
    sourceSystem: "CLICKUP_CSV",
    operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Workspace/list exports can be larger than personal task exports."
  },
{
sourceSystem: "TRELLO_CSV",
operation: "CSV_TASK_IMPORT",
recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
riskLevel: "MEDIUM",
notes: "Board card exports can include labels, list state, and archived planning cards."
},
{
sourceSystem: "MICROSOFT_PLANNER_CSV",
operation: "CSV_TASK_IMPORT",
recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
riskLevel: "MEDIUM",
notes: "Planner bucket exports can include team task queues and label metadata."
},
{
sourceSystem: "GITHUB_ISSUES_CSV",
operation: "CSV_TASK_IMPORT",
    recommendedPolicy: { windowMs: 900_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Repository issue exports can include many labels and closed issues."
  },
  {
    sourceSystem: "OWNEROPS",
    operation: "OWNEROPS_TASK_IMPORT",
    recommendedPolicy: { windowMs: 300_000, maxRows: 500 },
    riskLevel: "LOW",
    notes: "Owned-work bridge should be steady and idempotent."
  },
  {
    sourceSystem: "CONNECTOS_CALENDAR_IMPORT",
    operation: "CONNECTOS_CALENDAR_IMPORT",
    recommendedPolicy: { windowMs: 600_000, maxRows: 1000 },
    riskLevel: "MEDIUM",
    notes: "Calendar bridge imports may include recurring synced provider events."
  }
];

const providerImportPoliciesAsThrottleConfig = (
  policies: readonly ProviderImportPolicy[]
): Record<string, ImportThrottlePolicy> =>
  Object.fromEntries(
    policies.map((policy) => [policy.sourceSystem, policy.recommendedPolicy])
  );

const providerImportPolicyFor = (
  sourceSystem: string,
  operation: ImportThrottleOperation
): ImportThrottlePolicy | undefined =>
  PROVIDER_IMPORT_POLICIES.find(
    (policy) =>
      policy.sourceSystem === sourceSystem && policy.operation === operation
  )?.recommendedPolicy;

const parseSchedulingTask = (value: unknown): SchedulingTask => {
  const object = asRecord(value);
  const task: SchedulingTask = {
    id: requiredString(object, "id"),
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    ownerId: requiredString(object, "ownerId"),
    title: requiredString(object, "title"),
    priority: requiredEnum(object, "priority", ["URGENT", "HIGH", "MEDIUM", "LOW"]),
    estimatedDurationMinutes: requiredPositiveNumber(object, "estimatedDurationMinutes"),
    remainingDurationMinutes: requiredPositiveNumber(object, "remainingDurationMinutes"),
    schedulingMode: requiredEnum(object, "schedulingMode", [
      "FLEXIBLE",
      "FIXED",
      "DEADLINE_DRIVEN",
      "HABIT",
      "ROUTINE",
      "MEETING",
      "REMINDER",
      "DO_NOT_SCHEDULE",
      "MANUALLY_SCHEDULED"
    ]),
    splittable: requiredBoolean(object, "splittable"),
    schedulingEligible: requiredBoolean(object, "schedulingEligible"),
    blocked: requiredBoolean(object, "blocked"),
    waiting: requiredBoolean(object, "waiting"),
    confidence: requiredEnum(object, "confidence", [
      "CONFIRMED",
      "INFERRED_HIGH",
      "INFERRED_MEDIUM",
      "INFERRED_LOW",
      "UNKNOWN"
    ]),
    createdAt: requiredString(object, "createdAt"),
    updatedAt: requiredString(object, "updatedAt")
  };
  const deadline = optionalString(object, "deadline");
  if (deadline !== undefined) task.deadline = deadline;
  const earliestStart = optionalString(object, "earliestStart");
  if (earliestStart !== undefined) task.earliestStart = earliestStart;
  const latestFinish = optionalString(object, "latestFinish");
  if (latestFinish !== undefined) task.latestFinish = latestFinish;
  return stripUndefined(task);
};

const parseScope = (value: unknown): Scope => {
  const object = asRecord(value);
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId")
  };
};

const parseRetentionCleanupRequest = (
  value: unknown
): RetentionCleanupRequest => {
  const object = asRecord(value);
  const request: RetentionCleanupRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    asOf: requiredString(object, "asOf")
  };
  const apply = optionalBoolean(object, "apply");
  if (apply !== undefined) request.apply = apply;
  const confirm = optionalString(object, "confirm");
  if (confirm !== undefined) request.confirm = confirm;
  return request;
};

const parseAuthSessionCreateRequest = (
  value: unknown
): AuthSessionCreateRequest => {
  const object = asRecord(value);
  const request: AuthSessionCreateRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId")
  };
  const expiresAt = optionalString(object, "expiresAt");
  if (expiresAt !== undefined) request.expiresAt = expiresAt;
  return request;
};

const parseAuthSessionLoginRequest = (
  value: unknown
): AuthSessionLoginRequest => {
  const object = asRecord(value);
  const request: AuthSessionLoginRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    password: requiredString(object, "password")
  };
  const expiresAt = optionalString(object, "expiresAt");
  if (expiresAt !== undefined) request.expiresAt = expiresAt;
  return request;
};

const parseAuthPasswordChangeRequest = (
  value: unknown
): AuthPasswordChangeRequest => {
  const object = asRecord(value);
  const request: AuthPasswordChangeRequest = {
    currentPassword: requiredString(object, "currentPassword"),
    newPassword: requiredString(object, "newPassword")
  };
  if (request.newPassword.length < 12) {
    throw validationError("newPassword must be at least 12 characters.");
  }
  if (request.currentPassword === request.newPassword) {
    throw validationError("newPassword must be different from currentPassword.");
  }
  return request;
};

const parseAuthPasswordResetRequestCreate = (
  value: unknown
): AuthPasswordResetRequestCreate => {
  const object = asRecord(value);
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId")
  };
};

const parseAuthPasswordResetConfirmRequest = (
  value: unknown
): AuthPasswordResetConfirmRequest => {
  const object = asRecord(value);
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    resetToken: requiredString(object, "resetToken"),
    newPassword: requiredString(object, "newPassword")
  };
};

const parseAuthPasswordResetRequest = (
  value: unknown
): AuthPasswordResetRequest => {
  const object = asRecord(value);
  const request: AuthPasswordResetRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    newPassword: requiredString(object, "newPassword")
  };
  if (request.newPassword.length < 12) {
    throw validationError("newPassword must be at least 12 characters.");
  }
  return request;
};

const parseAuthUserUpsertRequest = (value: unknown): AuthUser => {
  const object = asRecord(value);
  const now = new Date().toISOString();
  const user: AuthUser = {
    id: requiredString(object, "id"),
    tenantId: requiredString(object, "tenantId"),
    email: requiredString(object, "email"),
    displayName: requiredString(object, "displayName"),
    status: optionalEnum(object, "status", ["ACTIVE", "DISABLED"]) ?? "ACTIVE",
    createdAt: optionalString(object, "createdAt") ?? now,
    updatedAt: now
  };
  const credentialHash = optionalString(object, "credentialHash");
  if (credentialHash !== undefined) user.credentialHash = credentialHash;
  return user;
};

const parseWorkspaceMembershipUpsertRequest = (
  value: unknown
): WorkspaceMembership => {
  const object = asRecord(value);
  const now = new Date().toISOString();
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    role: requiredEnum(object, "role", [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "MEMBER",
      "VIEWER"
    ]),
    status: optionalEnum(object, "status", ["ACTIVE", "SUSPENDED"]) ?? "ACTIVE",
    createdAt: optionalString(object, "createdAt") ?? now,
    updatedAt: now
  };
};

const applyTaskPatch = (
  existingTask: SchedulingTask,
  value: unknown
): SchedulingTask => {
  const object = asRecord(value);
  const task: SchedulingTask = {
    ...existingTask,
    updatedAt: new Date().toISOString()
  };

  const title = optionalNonEmptyString(object, "title");
  if (title !== undefined) task.title = title;

  const priority = optionalEnum(object, "priority", [
    "URGENT",
    "HIGH",
    "MEDIUM",
    "LOW"
  ]);
  if (priority !== undefined) task.priority = priority;

  const estimatedDurationMinutes = optionalPositiveNumber(
    object,
    "estimatedDurationMinutes"
  );
  if (estimatedDurationMinutes !== undefined) {
    task.estimatedDurationMinutes = estimatedDurationMinutes;
  }

  const remainingDurationMinutes = optionalPositiveNumber(
    object,
    "remainingDurationMinutes"
  );
  if (remainingDurationMinutes !== undefined) {
    task.remainingDurationMinutes = remainingDurationMinutes;
  }

  const schedulingMode = optionalEnum(object, "schedulingMode", [
    "FLEXIBLE",
    "FIXED",
    "DEADLINE_DRIVEN",
    "HABIT",
    "ROUTINE",
    "MEETING",
    "REMINDER",
    "DO_NOT_SCHEDULE",
    "MANUALLY_SCHEDULED"
  ]);
  if (schedulingMode !== undefined) task.schedulingMode = schedulingMode;

  const confidence = optionalEnum(object, "confidence", [
    "CONFIRMED",
    "INFERRED_HIGH",
    "INFERRED_MEDIUM",
    "INFERRED_LOW",
    "UNKNOWN"
  ]);
  if (confidence !== undefined) task.confidence = confidence;

  for (const field of [
    "deadline",
    "earliestStart",
    "latestFinish",
    "desiredOutcome",
    "projectId",
    "sourceReference",
    "sourceUrl"
  ] as const) {
    const fieldValue = optionalString(object, field);
    if (fieldValue !== undefined) task[field] = fieldValue;
  }

  for (const field of ["splittable", "schedulingEligible", "blocked", "waiting"] as const) {
    const fieldValue = optionalBoolean(object, field);
    if (fieldValue !== undefined) task[field] = fieldValue;
  }

  const tags = optionalStringArray(object, "tags");
  if (tags !== undefined) task.tags = tags;

  return stripUndefined(task);
};

const applyScheduleGuidance = (
  existingTask: SchedulingTask,
  guidance: ScheduleGuidanceRow
): SchedulingTask => {
  const task: SchedulingTask = {
    ...existingTask,
    updatedAt: new Date().toISOString()
  };
  if (guidance.strategicPriority !== undefined) {
    task.priority = guidance.strategicPriority;
  }
  if (guidance.preferredDayparts !== undefined) {
    task.preferredDayparts = guidance.preferredDayparts;
  }
  const tags = [
    ...(guidance.tags ?? []),
    ...(guidance.ownerOnly ? ["owner-only"] : []),
    ...(existingTask.tags ?? [])
  ];
  if (tags.length > 0) {
    task.tags = Array.from(new Set(tags));
  }
  return stripUndefined(task);
};

const parseCalendarEvent = (value: unknown): CalendarEvent => {
  const object = asRecord(value);
  const event: CalendarEvent = {
    id: requiredString(object, "id"),
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    calendarId: requiredString(object, "calendarId"),
    title: requiredString(object, "title"),
    start: requiredString(object, "start"),
    end: requiredString(object, "end"),
    timezone: requiredString(object, "timezone"),
    allDay: requiredBoolean(object, "allDay"),
    status: requiredEnum(object, "status", ["CONFIRMED", "TENTATIVE", "CANCELLED"]),
    busyStatus: requiredEnum(object, "busyStatus", [
      "BUSY",
      "FREE",
      "OUT_OF_OFFICE",
      "TENTATIVE_BUSY",
      "UNKNOWN"
    ]),
    movable: requiredBoolean(object, "movable"),
    locked: requiredBoolean(object, "locked"),
    privacyLevel: requiredEnum(object, "privacyLevel", [
      "PUBLIC",
      "PRIVATE",
      "CONFIDENTIAL",
      "BUSY_ONLY",
      "UNKNOWN"
    ]),
    version: requiredPositiveNumber(object, "version")
  };

  for (const field of ["sourceSystem", "externalId"] as const) {
    const fieldValue = optionalString(object, field);
    if (fieldValue !== undefined) event[field] = fieldValue;
  }

  for (const field of [
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
    "travelBeforeMinutes",
    "travelAfterMinutes"
  ] as const) {
    const fieldValue = optionalPositiveNumber(object, field);
    if (fieldValue !== undefined) event[field] = fieldValue;
  }

  return stripUndefined(event);
};

const applyCalendarEventPatch = (
  existingEvent: CalendarEvent,
  value: unknown
): CalendarEvent => {
  const object = asRecord(value);
  const event: CalendarEvent = {
    ...existingEvent,
    version: existingEvent.version + 1
  };

  for (const field of [
    "calendarId",
    "title",
    "start",
    "end",
    "timezone",
    "sourceSystem",
    "externalId"
  ] as const) {
    const fieldValue = optionalNonEmptyString(object, field);
    if (fieldValue !== undefined) event[field] = fieldValue;
  }

  const status = optionalEnum(object, "status", [
    "CONFIRMED",
    "TENTATIVE",
    "CANCELLED"
  ]);
  if (status !== undefined) event.status = status;

  const busyStatus = optionalEnum(object, "busyStatus", [
    "BUSY",
    "FREE",
    "OUT_OF_OFFICE",
    "TENTATIVE_BUSY",
    "UNKNOWN"
  ]);
  if (busyStatus !== undefined) event.busyStatus = busyStatus;

  const privacyLevel = optionalEnum(object, "privacyLevel", [
    "PUBLIC",
    "PRIVATE",
    "CONFIDENTIAL",
    "BUSY_ONLY",
    "UNKNOWN"
  ]);
  if (privacyLevel !== undefined) event.privacyLevel = privacyLevel;

  for (const field of ["allDay", "movable", "locked"] as const) {
    const fieldValue = optionalBoolean(object, field);
    if (fieldValue !== undefined) event[field] = fieldValue;
  }

  for (const field of [
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
    "travelBeforeMinutes",
    "travelAfterMinutes"
  ] as const) {
    const fieldValue = optionalPositiveNumber(object, field);
    if (fieldValue !== undefined) event[field] = fieldValue;
  }

  return stripUndefined(event);
};

const parseIcsImportRequest = (value: unknown): IcsImportRequest => {
  const object = asRecord(value);
  const request: IcsImportRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    calendarId: requiredString(object, "calendarId"),
    ics: requiredString(object, "ics")
  };
  const recurrenceRangeStart = optionalString(object, "recurrenceRangeStart");
  const recurrenceRangeEnd = optionalString(object, "recurrenceRangeEnd");
  if (recurrenceRangeStart) request.recurrenceRangeStart = recurrenceRangeStart;
  if (recurrenceRangeEnd) request.recurrenceRangeEnd = recurrenceRangeEnd;
  return request;
};

const parseConnectOsCalendarImportRequest = (
  value: unknown
): ConnectOsCalendarImportRequest => {
  const object = asRecord(value);
  rejectConnectOsTokenFields(object);
  const events = object.events;
  if (!Array.isArray(events)) {
    throw validationError("events must be an array.");
  }
  const request: ConnectOsCalendarImportRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    connectionId: requiredString(object, "connectionId"),
    calendarId: requiredString(object, "calendarId"),
    events: events.map((event) => parseConnectOsCalendarEventRow(event))
  };
  const capabilityRef = optionalString(object, "capabilityRef");
  if (capabilityRef !== undefined) request.capabilityRef = capabilityRef;
  const dryRun = optionalBoolean(object, "dryRun");
  if (dryRun !== undefined) request.dryRun = dryRun;
  return request;
};

const parseSyncCheckpointRequest = (value: unknown): SyncCheckpointRequest => {
  const object = asRecord(value);
  rejectConnectOsTokenFields(object);
  const status = optionalEnum(object, "status", [
    "CONNECTED",
    "DISCONNECTED",
    "ERROR"
  ]);
  const checkpoint: SyncCheckpointRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem: requiredString(object, "sourceSystem"),
    externalAccountId: requiredString(object, "externalAccountId"),
    providerEventId: requiredString(object, "providerEventId"),
    syncCursor: requiredString(object, "syncCursor"),
    observedAt: requiredString(object, "observedAt"),
    status: status ?? "CONNECTED"
  };
  if (!isValidTimestamp(checkpoint.observedAt)) {
    throw validationError("observedAt must be valid ISO timestamp.");
  }
  return checkpoint;
};

const parseIntegrationRevocationRequest = (
  value: unknown
): IntegrationRevocationRequest => {
  const object = asRecord(value);
  rejectConnectOsTokenFields(object);
  const revocation: IntegrationRevocationRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    sourceSystem: requiredString(object, "sourceSystem"),
    externalAccountId: requiredString(object, "externalAccountId"),
    providerEventId: requiredString(object, "providerEventId"),
    revokedAt: requiredString(object, "revokedAt")
  };
  if (!isValidTimestamp(revocation.revokedAt)) {
    throw validationError("revokedAt must be valid ISO timestamp.");
  }
  const reason = optionalString(object, "reason");
  if (reason !== undefined) revocation.reason = reason;
  return revocation;
};

const parseConnectOsCalendarEventRow = (
  value: unknown
): ConnectOsCalendarEventRow => {
  const object = asRecord(value);
  rejectConnectOsTokenFields(object);
  const row: ConnectOsCalendarEventRow = {
    externalId: requiredString(object, "externalId"),
    start: requiredString(object, "start"),
    end: requiredString(object, "end")
  };
  for (const field of ["title", "timezone"] as const) {
    const fieldValue = optionalString(object, field);
    if (fieldValue !== undefined) row[field] = fieldValue;
  }
  const allDay = optionalBoolean(object, "allDay");
  if (allDay !== undefined) row.allDay = allDay;
  const status = optionalEnum(object, "status", [
    "CONFIRMED",
    "TENTATIVE",
    "CANCELLED"
  ]);
  if (status !== undefined) row.status = status;
  const busyStatus = optionalEnum(object, "busyStatus", [
    "BUSY",
    "FREE",
    "OUT_OF_OFFICE",
    "TENTATIVE_BUSY",
    "UNKNOWN"
  ]);
  if (busyStatus !== undefined) row.busyStatus = busyStatus;
  const privacyLevel = optionalEnum(object, "privacyLevel", [
    "PUBLIC",
    "PRIVATE",
    "CONFIDENTIAL",
    "BUSY_ONLY",
    "UNKNOWN"
  ]);
  if (privacyLevel !== undefined) row.privacyLevel = privacyLevel;
  const readOnly = optionalBoolean(object, "readOnly");
  if (readOnly !== undefined) row.readOnly = readOnly;
  for (const field of [
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
    "travelBeforeMinutes",
    "travelAfterMinutes"
  ] as const) {
    const fieldValue = optionalPositiveNumber(object, field);
    if (fieldValue !== undefined) row[field] = fieldValue;
  }
  return row;
};

const calendarEventFromConnectOsImport = (
  row: ConnectOsCalendarEventRow,
  request: ConnectOsCalendarImportRequest
): CalendarEvent => {
  const event: CalendarEvent = {
    id: `connectos_${sanitizeId(request.connectionId)}_${sanitizeId(row.externalId)}`,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
    userId: request.userId,
    calendarId: request.calendarId,
    title: connectOsCalendarTitle(row),
    start: row.start,
    end: row.end,
    timezone: row.timezone ?? "UTC",
    allDay: row.allDay ?? false,
    status: row.status ?? "CONFIRMED",
    busyStatus: row.busyStatus ?? "BUSY",
    movable: false,
    locked: true,
    privacyLevel: row.privacyLevel ?? "BUSY_ONLY",
    version: 1,
    sourceSystem: "CONNECTOS",
    externalId: row.externalId
  };
  for (const field of [
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
    "travelBeforeMinutes",
    "travelAfterMinutes"
  ] as const) {
    const fieldValue = row[field];
    if (fieldValue !== undefined) event[field] = fieldValue;
  }
  return event;
};

const connectOsCalendarTitle = (row: ConnectOsCalendarEventRow): string => {
  const privacyLevel = row.privacyLevel ?? "BUSY_ONLY";
  if (privacyLevel !== "PUBLIC") return "Busy";
  return row.title ?? "ConnectOS calendar event";
};

const rejectConnectOsTokenFields = (object: Record<string, unknown>): void => {
  for (const field of CONNECTOS_FORBIDDEN_TOKEN_FIELDS) {
    if (object[field] !== undefined) {
      throw validationError(
        `ConnectOS payload must not include provider credential field ${field}.`
      );
    }
  }
};

const CONNECTOS_FORBIDDEN_TOKEN_FIELDS = new Set([
  "accessToken",
  "refreshToken",
  "idToken",
  "token",
  "apiKey",
  "clientSecret"
]);

const icsParseOptions = (request: IcsImportRequest) => {
  const options: {
    recurrenceRangeStart?: string;
    recurrenceRangeEnd?: string;
  } = {};
  if (request.recurrenceRangeStart) {
    options.recurrenceRangeStart = request.recurrenceRangeStart;
  }
  if (request.recurrenceRangeEnd) {
    options.recurrenceRangeEnd = request.recurrenceRangeEnd;
  }
  return options;
};

const upsertCalendarEvents = (
  actor: RepositoryActor,
  repository: CalendarEventRepository,
  scope: Scope,
  newEvents: CalendarEvent[],
  cancelledEvents: CalendarEvent[] = []
): {
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  deletedEvents: CalendarEvent[];
} => {
  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  const deletedEvents: CalendarEvent[] = [];

  for (const event of newEvents) {
    try {
      repository.get(actor, scope, event.id);
      updatedCount += 1;
    } catch (error) {
      if (!(error instanceof RepositoryNotFoundError)) throw error;
      createdCount += 1;
    }

    repository.upsert(actor, event, scope);
  }

  for (const event of cancelledEvents) {
    try {
      repository.delete(actor, scope, event.id);
      deletedCount += 1;
      deletedEvents.push(event);
    } catch (error) {
      if (!(error instanceof RepositoryNotFoundError)) throw error;
    }
  }

  return { createdCount, updatedCount, deletedCount, deletedEvents };
};

type CalendarImportStatus = {
  event: CalendarEvent;
  changed: boolean;
};

const classifyCalendarEventImports = (
  actor: RepositoryActor,
  repository: CalendarEventRepository,
  scope: Scope,
  events: CalendarEvent[]
): CalendarImportStatus[] =>
  events.map((event) => {
    try {
      repository.get(actor, scope, event.id);
      return { event, changed: true };
    } catch (error) {
      if (!(error instanceof RepositoryNotFoundError)) throw error;
      return { event, changed: false };
    }
  });

const appendConnectOsCalendarImportAuditEvents = (
  actor: RepositoryActor,
  repositories: ScheduleOSRepositories,
  request: ConnectOsCalendarImportRequest,
  statuses: CalendarImportStatus[]
): void => {
  statuses.forEach((status) => {
    repositories.auditEvents.append(
      actor,
      connectOsCalendarImportAuditEvent(request, status.event, status.changed)
    );
  });
};

const connectOsCalendarImportAuditEvent = (
  request: ConnectOsCalendarImportRequest,
  event: CalendarEvent,
  changed: boolean
): AuditEvent => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    sourceSystem: "CONNECTOS",
    connectionId: request.connectionId,
    calendarId: event.calendarId,
    status: event.status,
    busyStatus: event.busyStatus,
    privacyLevel: event.privacyLevel,
    start: event.start,
    end: event.end,
    allDay: event.allDay
  };
  if (request.capabilityRef) metadata.capabilityRef = request.capabilityRef;
  if (event.externalId) metadata.externalId = event.externalId;
  return {
    id: `audit_connectos_calendar_${changed ? "changed" : "imported"}_${event.id}_${Date.now()}`,
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    userId: event.userId,
    occurredAt: new Date().toISOString(),
    actorType: "INTEGRATION",
    actorId: "CONNECTOS",
    action: changed ? "CALENDAR_EVENT_CHANGED" : "CALENDAR_EVENT_IMPORTED",
    resourceType: "CALENDAR_EVENT",
    resourceId: event.id,
    metadata
  };
};

const localCalendarEventAuditEvent = (
  event: CalendarEvent,
  changed: boolean
): AuditEvent => {
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    sourceSystem: "SCHEDULEOS",
    calendarId: event.calendarId,
    status: event.status,
    busyStatus: event.busyStatus,
    privacyLevel: event.privacyLevel,
    start: event.start,
    end: event.end,
    allDay: event.allDay
  };
  if (event.externalId) metadata.externalId = event.externalId;
  const statusSegment = sanitizeId(event.status.toLowerCase());
  return {
    id: `audit_local_calendar_${changed ? "changed" : "imported"}_${event.id}_${statusSegment}_${Date.now()}`,
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    userId: event.userId,
    occurredAt: new Date().toISOString(),
    actorType: "USER",
    actorId: event.userId,
    action: changed ? "CALENDAR_EVENT_CHANGED" : "CALENDAR_EVENT_IMPORTED",
    resourceType: "CALENDAR_EVENT",
    resourceId: event.id,
    metadata
  };
};

const acceptedPlanBlocksToCalendarEvents = (
  plan: SchedulePlan,
  tasks: SchedulingTask[],
  request: CalendarWritebackRequest
): CalendarEvent[] => {
  const taskTitles = new Map(tasks.map((task) => [task.id, task.title]));
  return plan.blocks
    .filter((block) => block.status === "ACCEPTED" || block.status === "LOCKED")
    .map((block) => ({
      id: `writeback_${sanitizeId(request.calendarId)}_${sanitizeId(block.id)}`,
      tenantId: request.tenantId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      calendarId: request.calendarId,
      title: taskTitles.get(block.taskId) ?? "Scheduled work",
      start: block.start,
      end: block.end,
      timezone: plan.timezone,
      allDay: false,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      movable: true,
      locked: block.locked,
      privacyLevel: "BUSY_ONLY",
      version: 1,
      sourceSystem: "SCHEDULEOS_WRITEBACK",
      externalId: `${plan.id}:${block.id}:${block.taskId}`
    }));
};

const calendarWritebackConflicts = (
  candidateEvents: CalendarEvent[],
  existingEvents: CalendarEvent[]
): CalendarWritebackConflict[] => {
  const conflicts: CalendarWritebackConflict[] = [];
  for (const candidate of candidateEvents) {
    for (const existing of existingEvents) {
      const overlap = eventOverlap(candidate, existing);
      if (!overlap) continue;
      conflicts.push({
        blockId: candidate.externalId?.split(":").at(1) ?? candidate.id,
        taskId: candidate.externalId?.split(":").at(2) ?? candidate.id,
        proposedEventId: candidate.id,
        conflictEventId: existing.id,
        conflictTitle: calendarEventPreviewTitle(existing),
        overlapStart: overlap.start,
        overlapEnd: overlap.end,
        severity: "BLOCKING"
      });
    }
  }
  return conflicts;
};

const isBlockingCalendarEvent = (event: CalendarEvent): boolean =>
  event.status !== "CANCELLED" && event.busyStatus !== "FREE";

const calendarEventPreviewTitle = (event: CalendarEvent): string =>
  event.privacyLevel === "PUBLIC" ? event.title : "Busy";

const eventOverlap = (
  first: Pick<CalendarEvent, "start" | "end">,
  second: Pick<CalendarEvent, "start" | "end">
): { start: string; end: string } | undefined => {
  const overlapStart = Math.max(Date.parse(first.start), Date.parse(second.start));
  const overlapEnd = Math.min(Date.parse(first.end), Date.parse(second.end));
  if (!Number.isFinite(overlapStart) || !Number.isFinite(overlapEnd)) {
    throw validationError("Calendar event dates must be valid ISO timestamps.");
  }
  if (overlapStart >= overlapEnd) return undefined;
  return {
    start: new Date(overlapStart).toISOString(),
    end: new Date(overlapEnd).toISOString()
  };
};

const recordSyncCheckpoint = (
  actor: RepositoryActor,
  repositories: ScheduleOSRepositories,
  checkpoint: SyncCheckpointRequest
): {
  state: IntegrationState;
  idempotent: boolean;
  idempotencyKey: string;
} => {
  const idempotencyKey = syncCheckpointIdempotencyKey(checkpoint);
  const stateId = syncIntegrationStateId(checkpoint);
  const requestHash = syncCheckpointRequestHash(checkpoint);
  const existingState = getIntegrationStateIfPresent(
    actor,
    repositories,
    checkpoint,
    stateId
  );
  if (existingState?.status === "DISCONNECTED") {
    throw new ApiError(
      409,
      "INTEGRATION_DISCONNECTED",
      "Integration is disconnected and must be reconnected before sync can resume."
    );
  }
  const reserved = repositories.idempotency.reserve(actor, {
    key: idempotencyKey,
    tenantId: checkpoint.tenantId,
    workspaceId: checkpoint.workspaceId,
    userId: checkpoint.userId,
    requestHash,
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString()
  });

  if (!reserved.created) {
    if (reserved.record.requestHash !== requestHash) {
      throw new ApiError(
        409,
        "SYNC_REPLAY_CONFLICT",
        "Sync checkpoint event id was already used with different content."
      );
    }
    return {
      state: repositories.integrationStates.get(actor, checkpoint, stateId),
      idempotent: true,
      idempotencyKey
    };
  }

  const state: IntegrationState = {
    id: stateId,
    tenantId: checkpoint.tenantId,
    workspaceId: checkpoint.workspaceId,
    userId: checkpoint.userId,
    sourceSystem: checkpoint.sourceSystem,
    externalAccountId: checkpoint.externalAccountId,
    status: checkpoint.status,
    syncCursor: checkpoint.syncCursor,
    lastSyncedAt: checkpoint.observedAt,
    updatedAt: new Date().toISOString(),
    metadata: {
      lastProviderEventId: checkpoint.providerEventId
    }
  };
  const savedState = repositories.integrationStates.upsert(actor, state);
  repositories.idempotency.complete(actor, checkpoint, idempotencyKey, {
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
    responseResourceId: savedState.id
  });
  repositories.auditEvents.append(actor, syncCheckpointAuditEvent(checkpoint, savedState));
  return { state: savedState, idempotent: false, idempotencyKey };
};

const recordIntegrationRevocation = (
  actor: RepositoryActor,
  repositories: ScheduleOSRepositories,
  revocation: IntegrationRevocationRequest
): {
  state: IntegrationState;
  idempotent: boolean;
  idempotencyKey: string;
} => {
  const idempotencyKey = integrationRevocationIdempotencyKey(revocation);
  const stateId = syncIntegrationStateId(revocation);
  const requestHash = integrationRevocationRequestHash(revocation);
  const reserved = repositories.idempotency.reserve(actor, {
    key: idempotencyKey,
    tenantId: revocation.tenantId,
    workspaceId: revocation.workspaceId,
    userId: revocation.userId,
    requestHash,
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString()
  });

  if (!reserved.created) {
    if (reserved.record.requestHash !== requestHash) {
      throw new ApiError(
        409,
        "INTEGRATION_REPLAY_CONFLICT",
        "Integration revocation event id was already used with different content."
      );
    }
    return {
      state: repositories.integrationStates.get(actor, revocation, stateId),
      idempotent: true,
      idempotencyKey
    };
  }

  const existingState = getIntegrationStateIfPresent(
    actor,
    repositories,
    revocation,
    stateId
  );
  const metadata: NonNullable<IntegrationState["metadata"]> = {
    ...(existingState?.metadata ?? {}),
    lastProviderEventId: revocation.providerEventId,
    revokedAt: revocation.revokedAt
  };
  if (revocation.reason !== undefined) metadata.reason = revocation.reason;

  const state: IntegrationState = {
    id: stateId,
    tenantId: revocation.tenantId,
    workspaceId: revocation.workspaceId,
    userId: revocation.userId,
    sourceSystem: revocation.sourceSystem,
    externalAccountId: revocation.externalAccountId,
    status: "DISCONNECTED",
    updatedAt: new Date().toISOString(),
    metadata
  };
  const savedState = repositories.integrationStates.upsert(actor, state);
  repositories.idempotency.complete(actor, revocation, idempotencyKey, {
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
    responseResourceId: savedState.id
  });
  repositories.auditEvents.append(
    actor,
    integrationRevocationAuditEvent(revocation, savedState)
  );
  return { state: savedState, idempotent: false, idempotencyKey };
};

const getIntegrationStateIfPresent = (
  actor: RepositoryActor,
  repositories: ScheduleOSRepositories,
  scope: Scope,
  id: string
): IntegrationState | undefined => {
  try {
    return repositories.integrationStates.get(actor, scope, id);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) return undefined;
    throw error;
  }
};

const syncCheckpointIdempotencyKey = (checkpoint: SyncCheckpointRequest): string =>
  `sync:${sanitizeId(checkpoint.sourceSystem)}:${sanitizeId(
    checkpoint.externalAccountId
  )}:${sanitizeId(checkpoint.providerEventId)}`;

const integrationRevocationIdempotencyKey = (
  revocation: IntegrationRevocationRequest
): string =>
  `integration-revoked:${sanitizeId(revocation.sourceSystem)}:${sanitizeId(
    revocation.externalAccountId
  )}:${sanitizeId(revocation.providerEventId)}`;

const syncIntegrationStateId = (
  checkpoint: Pick<SyncCheckpointRequest, "sourceSystem" | "externalAccountId">
): string =>
  `sync_${sanitizeId(checkpoint.sourceSystem)}_${sanitizeId(
    checkpoint.externalAccountId
  )}`;

const syncCheckpointRequestHash = (checkpoint: SyncCheckpointRequest): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        tenantId: checkpoint.tenantId,
        workspaceId: checkpoint.workspaceId,
        userId: checkpoint.userId,
        sourceSystem: checkpoint.sourceSystem,
        externalAccountId: checkpoint.externalAccountId,
        providerEventId: checkpoint.providerEventId,
        syncCursor: checkpoint.syncCursor,
        observedAt: checkpoint.observedAt,
        status: checkpoint.status
      })
    )
    .digest("hex");

const integrationRevocationRequestHash = (
  revocation: IntegrationRevocationRequest
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        tenantId: revocation.tenantId,
        workspaceId: revocation.workspaceId,
        userId: revocation.userId,
        sourceSystem: revocation.sourceSystem,
        externalAccountId: revocation.externalAccountId,
        providerEventId: revocation.providerEventId,
        revokedAt: revocation.revokedAt,
        reason: revocation.reason
      })
    )
    .digest("hex");

const syncCheckpointAuditEvent = (
  checkpoint: SyncCheckpointRequest,
  state: IntegrationState
): AuditEvent => {
  const occurredAt = new Date().toISOString();
  return {
    id: `audit_sync_checkpoint_${sanitizeId(checkpoint.sourceSystem)}_${sanitizeId(
      checkpoint.providerEventId
    )}_${Date.parse(occurredAt)}`,
    tenantId: checkpoint.tenantId,
    workspaceId: checkpoint.workspaceId,
    userId: checkpoint.userId,
    occurredAt,
    actorType: "INTEGRATION",
    actorId: checkpoint.sourceSystem,
    action: "SYNC_CHECKPOINT_RECORDED",
    resourceType: "INTEGRATION_STATE",
    resourceId: state.id,
    metadata: {
      sourceSystem: checkpoint.sourceSystem,
      externalAccountId: checkpoint.externalAccountId,
      providerEventId: checkpoint.providerEventId,
      syncCursor: checkpoint.syncCursor,
      observedAt: checkpoint.observedAt,
      status: checkpoint.status
    }
  };
};

const integrationRevocationAuditEvent = (
  revocation: IntegrationRevocationRequest,
  state: IntegrationState
): AuditEvent => {
  const occurredAt = new Date().toISOString();
  const metadata: NonNullable<AuditEvent["metadata"]> = {
    sourceSystem: revocation.sourceSystem,
    externalAccountId: revocation.externalAccountId,
    providerEventId: revocation.providerEventId,
    revokedAt: revocation.revokedAt
  };
  if (revocation.reason !== undefined) metadata.reason = revocation.reason;
  return {
    id: `audit_integration_revoked_${sanitizeId(
      revocation.sourceSystem
    )}_${sanitizeId(revocation.providerEventId)}_${Date.parse(occurredAt)}`,
    tenantId: revocation.tenantId,
    workspaceId: revocation.workspaceId,
    userId: revocation.userId,
    occurredAt,
    actorType: "INTEGRATION",
    actorId: revocation.sourceSystem,
    action: "INTEGRATION_REVOKED",
    resourceType: "INTEGRATION_STATE",
    resourceId: state.id,
    metadata
  };
};

const parseWorkingHours = (value: unknown): WorkingHours => {
  const object = asRecord(value);
  const daysOfWeek = object.daysOfWeek;
  if (!Array.isArray(daysOfWeek) || !daysOfWeek.every((day) => Number.isInteger(day))) {
    throw validationError("daysOfWeek must be an array of integers.");
  }
  const workingHours: WorkingHours = {
    userId: requiredString(object, "userId"),
    timezone: requiredString(object, "timezone"),
    daysOfWeek,
    startTime: requiredString(object, "startTime"),
    endTime: requiredString(object, "endTime")
  };
  const breakWindows = parseBreakWindows(object);
  if (breakWindows !== undefined) workingHours.breakWindows = breakWindows;
  return workingHours;
};

const parseBreakWindows = (
  object: Record<string, unknown>
): WorkingHours["breakWindows"] => {
  const value = object.breakWindows;
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw validationError("breakWindows must be an array.");
  }

  return value.map((entry) => {
    const breakWindow = asRecord(entry);
    return {
      label: requiredString(breakWindow, "label"),
      startTime: requiredString(breakWindow, "startTime"),
      endTime: requiredString(breakWindow, "endTime")
    };
  });
};

const parseScheduleRequest = (value: unknown): ScheduleRequest => {
 const object = asRecord(value);
 return {
  tenantId: requiredString(object, "tenantId"),
  workspaceId: requiredString(object, "workspaceId"),
  userId: requiredString(object, "userId"),
  rangeStart: requiredString(object, "rangeStart"),
  rangeEnd: requiredString(object, "rangeEnd"),
  timezone: requiredString(object, "timezone")
 };
};

const parseCalendarWritebackRequest = (
  value: unknown
): CalendarWritebackRequest => {
 const object = asRecord(value);
 return {
  tenantId: requiredString(object, "tenantId"),
  workspaceId: requiredString(object, "workspaceId"),
  userId: requiredString(object, "userId"),
  calendarId: requiredString(object, "calendarId"),
    readOnly: requiredBoolean(object, "readOnly")
  };
};

const parsePublicEventWebhookDeliveryRequest = (
  value: unknown
): PublicEventWebhookDeliveryRequest => {
  const object = asRecord(value);
  const request: PublicEventWebhookDeliveryRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    targetUrl: requiredString(object, "targetUrl"),
    secret: requiredString(object, "secret")
  };
  const type = optionalString(object, "type");
  if (type !== undefined) request.type = type;
  const sourceSystem = optionalString(object, "sourceSystem");
  if (sourceSystem !== undefined) request.sourceSystem = sourceSystem;
  validatedWebhookDeliveryTargetUrl(request.targetUrl);
  if (request.secret.trim().length < 16) {
    throw validationError("secret must be at least 16 characters.");
  }
  return request;
};

const parsePublicEventWebhookDeliveryRetryDueRequest = (
  value: unknown
): PublicEventWebhookDeliveryRetryDueRequest => {
  const object = asRecord(value);
  const request = {
    ...parsePublicEventWebhookDeliveryRequest(value),
    asOf: requiredString(object, "asOf")
  };
  if (!isValidTimestamp(request.asOf)) {
    throw validationError("asOf must be valid ISO timestamp.");
  }
  return request;
};

const parsePublicEventWebhookDeadLetterReviewRequest = (
  value: unknown
): PublicEventWebhookDeadLetterReviewRequest => {
  const object = asRecord(value);
  const request: PublicEventWebhookDeadLetterReviewRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    deliveryId: requiredString(object, "deliveryId"),
    eventId: requiredString(object, "eventId"),
    targetUrlHash: requiredString(object, "targetUrlHash"),
    maxAttempts: requiredPositiveInteger(object, "maxAttempts"),
    decision: requiredEnum(object, "decision", [
      "ACKNOWLEDGED",
      "REPLAY_REQUESTED",
      "DROPPED"
    ] as const)
  };
  if (!/^[a-f0-9]{64}$/.test(request.targetUrlHash)) {
    throw validationError("targetUrlHash must be sha256 hex.");
  }
  const note = optionalString(object, "note");
  if (note !== undefined) {
    if (note.length > 500) throw validationError("note must be 500 characters or fewer.");
    request.note = note;
  }
  return request;
};

const parsePublicEventWebhookSubscriptionDeliveryRequest = (
  value: unknown
): PublicEventWebhookSubscriptionDeliveryRequest => {
  const object = asRecord(value);
  const request: PublicEventWebhookSubscriptionDeliveryRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    subscriptionId: requiredString(object, "subscriptionId")
  };
  const targetUrl = optionalString(object, "targetUrl");
  const secret = optionalString(object, "secret");
  if ((targetUrl === undefined) !== (secret === undefined)) {
    throw validationError("targetUrl and secret must be provided together.");
  }
  if (targetUrl !== undefined && secret !== undefined) {
    request.targetUrl = targetUrl;
    request.secret = secret;
    validatedWebhookDeliveryTargetUrl(targetUrl);
    if (secret.trim().length < 16) {
      throw validationError("secret must be at least 16 characters.");
    }
  }
  return request;
};

const parsePublicEventWebhookSubscriptionDeliverReadyRequest = (
  value: unknown
): PublicEventWebhookSubscriptionDeliverReadyRequest => {
  const object = asRecord(value);
  const request: PublicEventWebhookSubscriptionDeliverReadyRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId")
  };
  const type = optionalString(object, "type");
  if (type !== undefined) {
    const allowedTypes = new Set(
      SCHEDULEOS_PUBLIC_EVENT_TYPES.map((entry) => entry.type)
    );
    if (!allowedTypes.has(type)) {
      throw validationError(`type contains unsupported type ${type}.`);
    }
    request.type = type;
  }
  const sourceSystem = optionalString(object, "sourceSystem");
  if (sourceSystem !== undefined) request.sourceSystem = sourceSystem;
  const dryRun = optionalBoolean(object, "dryRun");
  if (dryRun !== undefined) request.dryRun = dryRun;
  const maxSubscriptions = optionalPositiveInteger(object, "maxSubscriptions");
  if (maxSubscriptions !== undefined) request.maxSubscriptions = maxSubscriptions;
  const maxEvents = optionalPositiveInteger(object, "maxEvents");
  if (maxEvents !== undefined) request.maxEvents = maxEvents;
  return request;
};

const parsePublicEventWebhookSubscriptionRequest = (
  value: unknown
): PublicEventWebhookSubscriptionRequest => {
  const object = asRecord(value);
  const request: PublicEventWebhookSubscriptionRequest = {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId")
  };
  const targetUrl = optionalString(object, "targetUrl");
  const secret = optionalString(object, "secret");
  const deliveryTargetRef = optionalString(object, "deliveryTargetRef");
  if (deliveryTargetRef !== undefined) request.deliveryTargetRef = deliveryTargetRef;
  if ((targetUrl === undefined) !== (secret === undefined)) {
    throw validationError("targetUrl and secret must be provided together.");
  }
  if (targetUrl === undefined && deliveryTargetRef === undefined) {
    throw validationError("targetUrl and secret, or deliveryTargetRef, required.");
  }
  if (targetUrl !== undefined && secret !== undefined) {
    request.targetUrl = targetUrl;
    request.secret = secret;
    validatedWebhookDeliveryTargetUrl(targetUrl);
    if (secret.trim().length < 16) {
      throw validationError("secret must be at least 16 characters.");
    }
  }
  const eventTypes = optionalStringArray(object, "eventTypes");
  if (eventTypes !== undefined) {
    const allowedTypes = new Set(
      SCHEDULEOS_PUBLIC_EVENT_TYPES.map((entry) => entry.type)
    );
    for (const eventType of eventTypes) {
      if (!allowedTypes.has(eventType)) {
        throw validationError(`eventTypes contains unsupported type ${eventType}.`);
      }
    }
    request.eventTypes = Array.from(new Set(eventTypes));
  }
  const sourceSystem = optionalString(object, "sourceSystem");
  if (sourceSystem !== undefined) request.sourceSystem = sourceSystem;
const status = optionalEnum(object, "status", ["ENABLED", "DISABLED"] as const);
if (status !== undefined) request.status = status;
return request;
};

const parsePublicEventWebhookSubscriptionStatusRequest = (
  value: unknown
): PublicEventWebhookSubscriptionStatusRequest => {
  const object = asRecord(value);
  return {
    tenantId: requiredString(object, "tenantId"),
    workspaceId: requiredString(object, "workspaceId"),
    userId: requiredString(object, "userId"),
    subscriptionId: requiredString(object, "subscriptionId"),
    status: requiredEnum(object, "status", ["ENABLED", "DISABLED"] as const)
  };
};

const matchesScope = (item: Scope, scope: Scope): boolean =>
  item.tenantId === scope.tenantId &&
 item.workspaceId === scope.workspaceId &&
  item.userId === scope.userId;

const parseTimeBlockPatch = (value: unknown): { start?: string; end?: string } => {
  const object = asRecord(value);
  const start = optionalNonEmptyString(object, "start");
  const end = optionalNonEmptyString(object, "end");
  if (start === undefined && end === undefined) {
    throw validationError("start or end is required.");
  }
  const patch: { start?: string; end?: string } = {};
  if (start !== undefined) patch.start = start;
  if (end !== undefined) patch.end = end;
  return patch;
};

const requiredQuery = (url: URL, name: string): string => {
  const value = url.searchParams.get(name);
  if (!value) throw validationError(`${name} query parameter is required.`);
  return value;
};

const positiveIntegerQuery = (url: URL, name: string): number | undefined => {
  const value = url.searchParams.get(name);
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw validationError(`${name} query parameter must be positive integer.`);
  }
  return parsed;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("Request body must be an object.");
  }
  return value as Record<string, unknown>;
};

const requiredString = (object: Record<string, unknown>, field: string): string => {
  const value = object[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationError(`${field} is required.`);
  }
  return value;
};

const optionalString = (
  object: Record<string, unknown>,
  field: string
): string | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw validationError(`${field} must be a string.`);
  return value;
};

const optionalNonEmptyString = (
  object: Record<string, unknown>,
  field: string
): string | undefined => {
  const value = optionalString(object, field);
  if (value === undefined) return undefined;
  if (value.trim().length === 0) throw validationError(`${field} is required.`);
  return value;
};

const requiredPositiveNumber = (
  object: Record<string, unknown>,
  field: string
): number => {
  const value = object[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw validationError(`${field} must be a positive number.`);
  }
  return value;
};

const requiredBoolean = (object: Record<string, unknown>, field: string): boolean => {
  const value = object[field];
  if (typeof value !== "boolean") throw validationError(`${field} must be a boolean.`);
  return value;
};

const optionalBoolean = (
  object: Record<string, unknown>,
  field: string
): boolean | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") throw validationError(`${field} must be a boolean.`);
  return value;
};

const optionalPositiveInteger = (
  object: Record<string, unknown>,
  field: string
): number | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw validationError(`${field} must be a positive integer.`);
  }
  return value;
};

const requiredPositiveInteger = (
  object: Record<string, unknown>,
  field: string
): number => {
  const value = optionalPositiveInteger(object, field);
  if (value === undefined) throw validationError(`${field} is required.`);
  return value;
};

const isValidTimestamp = (value: string): boolean => Number.isFinite(Date.parse(value));

const requiredEnum = <T extends string>(
  object: Record<string, unknown>,
  field: string,
  values: readonly T[]
): T => {
  const value = object[field];
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw validationError(`${field} must be one of ${values.join(", ")}.`);
  }
  return value as T;
};

const validationError = (message: string): ApiError =>
  new ApiError(422, "VALIDATION_ERROR", message);

const requestBodyTooLargeError = (maxBytes: number): ApiError =>
  new ApiError(
    413,
    "REQUEST_BODY_TOO_LARGE",
    `Request body must be ${maxBytes} bytes or smaller.`
  );

const rateLimitedError = (retryAfterMs: number): ApiError =>
  new ApiError(
    429,
    "RATE_LIMITED",
    `Too many requests. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds.`
  );

const authAttemptLimitedError = (retryAfterMs: number): ApiError =>
  new ApiError(
    429,
    "AUTH_ATTEMPT_LIMITED",
    `Too many credential attempts. Retry after ${Math.ceil(
      retryAfterMs / 1000
    )} seconds.`
  );

const sendJson = (
response: ServerResponse,
status: number,
body: unknown
): void => {
setBaseSecurityHeaders(response);
setNoStoreCacheHeader(response);
response.statusCode = status;
response.setHeader("content-type", "application/json");
response.end(JSON.stringify(body));
};

const sendHtml = (
  response: ServerResponse,
  status: number,
  html: string
): void => {
setBaseSecurityHeaders(response);
setNoStoreCacheHeader(response);
response.setHeader(
"content-security-policy",
"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
  );
  response.statusCode = status;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(html);
};

const sendCsv = (
  response: ServerResponse,
  status: number,
  filename: string,
  csv: string
): void => {
setBaseSecurityHeaders(response);
setNoStoreCacheHeader(response);
response.statusCode = status;
response.setHeader("content-type", "text/csv; charset=utf-8");
response.setHeader("content-disposition", `attachment; filename="${filename}"`);
  response.end(csv);
};

const sendError = (
  response: ServerResponse,
  status: number,
  code: string,
  message: string
): void => sendJson(response, status, { error: { code, message } });

const setBaseSecurityHeaders = (response: ServerResponse): void => {
response.setHeader("x-content-type-options", "nosniff");
response.setHeader("x-frame-options", "DENY");
response.setHeader("referrer-policy", "no-referrer");
};

const setNoStoreCacheHeader = (response: ServerResponse): void => {
response.setHeader("cache-control", "no-store, max-age=0");
};

const stripUndefined = <T extends object>(value: T): T => {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(entries) as T;
};

const optionalStringArray = (
  object: Record<string, unknown>,
  field: string
): string[] | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw validationError(`${field} must be string array.`);
  }
  return value;
};

const optionalPositiveNumber = (
  object: Record<string, unknown>,
  field: string
): number | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw validationError(`${field} must be positive number.`);
  }
  return value;
};

const optionalEnum = <T extends string>(
  object: Record<string, unknown>,
  field: string,
  values: readonly T[]
): T | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw validationError(`${field} must be one of ${values.join(", ")}.`);
  }
  return value as T;
};

const optionalEnumArray = <T extends string>(
  object: Record<string, unknown>,
  field: string,
  values: readonly T[]
): T[] | undefined => {
  const value = object[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw validationError(`${field} must be an array.`);
  return value.map((item) => {
    if (typeof item !== "string" || !values.includes(item as T)) {
      throw validationError(`${field} must contain only ${values.join(", ")}.`);
    }
    return item as T;
  });
};

const sanitizeId = (value: string): string =>
  value.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "external";
