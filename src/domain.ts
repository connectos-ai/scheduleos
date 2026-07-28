export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type SchedulingMode =
  | "FLEXIBLE"
  | "FIXED"
  | "DEADLINE_DRIVEN"
  | "HABIT"
  | "ROUTINE"
  | "MEETING"
  | "REMINDER"
  | "DO_NOT_SCHEDULE"
  | "MANUALLY_SCHEDULED";

export type TaskConfidence =
  | "CONFIRMED"
  | "INFERRED_HIGH"
  | "INFERRED_MEDIUM"
  | "INFERRED_LOW"
  | "UNKNOWN";

export interface SchedulingTask {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  ownerId: string;
  title: string;
  priority: Priority;
  estimatedDurationMinutes: number;
  remainingDurationMinutes: number;
  schedulingMode: SchedulingMode;
  splittable: boolean;
  schedulingEligible: boolean;
  blocked: boolean;
  waiting: boolean;
  confidence: TaskConfidence;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  earliestStart?: string;
  latestFinish?: string;
  minimumBlockMinutes?: number;
  maximumBlockMinutes?: number;
  preferredBlockMinutes?: number;
  preferredDayparts?: Array<"MORNING" | "AFTERNOON" | "EVENING">;
  dependencies?: string[];
  sourceSystem?: string;
  externalId?: string;
  sourceReference?: string;
  sourceUrl?: string;
  desiredOutcome?: string;
  projectId?: string;
  tags?: string[];
}

export type CalendarStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";
export type BusyStatus =
  | "BUSY"
  | "FREE"
  | "OUT_OF_OFFICE"
  | "TENTATIVE_BUSY"
  | "UNKNOWN";
export type PrivacyLevel =
  | "PUBLIC"
  | "PRIVATE"
  | "CONFIDENTIAL"
  | "BUSY_ONLY"
  | "UNKNOWN";

export interface CalendarEvent {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  timezone: string;
  allDay: boolean;
  status: CalendarStatus;
  busyStatus: BusyStatus;
  movable: boolean;
  locked: boolean;
  privacyLevel: PrivacyLevel;
  version: number;
  sourceSystem?: string;
  externalId?: string;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  travelBeforeMinutes?: number;
  travelAfterMinutes?: number;
}

export interface WorkingHours {
  userId: string;
  timezone: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  breakWindows?: BreakWindow[];
}

export interface BreakWindow {
  label: string;
  startTime: string;
  endTime: string;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  start: string;
  end: string;
  status: "PROPOSED" | "ACCEPTED" | "LOCKED" | "COMPLETED" | "MISSED";
  locked: boolean;
}

export interface CapacityWarning {
  code:
    | "OVER_CAPACITY"
    | "DEADLINE_AT_RISK"
    | "NO_CONTIGUOUS_SLOT"
    | "LOCKED_BLOCK_LIMITS_PLAN";
  taskId?: string;
  availableMinutes: number;
  requiredMinutes: number;
  message: string;
}

export interface SchedulingExplanation {
  type:
    | "TASK_PLACED"
    | "TASK_UNSCHEDULED"
    | "BLOCK_PRESERVED"
    | "CAPACITY_EXCEEDED";
  taskId?: string;
  blockId?: string;
  message: string;
  evidence: Record<string, string | number | boolean | string[]>;
}

export interface SchedulePlan {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "FAILED";
  blocks: TimeBlock[];
  unscheduledTasks: Array<{ taskId: string; reason: string }>;
  capacityWarnings: CapacityWarning[];
  explanations: SchedulingExplanation[];
}

export interface CreateScheduleInput {
  tenantId: string;
  workspaceId: string;
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
  tasks: SchedulingTask[];
  calendarEvents: CalendarEvent[];
  workingHours: WorkingHours;
  existingBlocks?: TimeBlock[];
  planId?: string;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface AuditEvent {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  occurredAt: string;
  actorType: "USER" | "SYSTEM" | "INTEGRATION";
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: JsonObject;
}

export interface IdempotencyRecord {
  key: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  requestHash: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: string;
  completedAt?: string;
  responseResourceId?: string;
  expiresAt?: string;
}

export interface IntegrationState {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  sourceSystem: string;
  externalAccountId?: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  syncCursor?: string;
  lastSyncedAt?: string;
  updatedAt: string;
  metadata?: JsonObject;
}

export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "MEMBER" | "VIEWER";

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  status: "ACTIVE" | "DISABLED";
  credentialHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMembership {
  tenantId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  sessionTokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastSeenAt?: string;
}

export interface AuthPasswordResetToken {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

export interface AuthLoginAttemptWindow {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  windowStartedAt: string;
  windowMs: number;
  maxFailedAttempts: number;
  failedCount: number;
  lockedUntil?: string;
  updatedAt: string;
}

export type ImportThrottleOperation =
  | "WEBHOOK_TASK_IMPORT"
  | "JSON_TASK_IMPORT"
  | "CSV_TASK_IMPORT"
  | "OWNEROPS_TASK_IMPORT"
  | "CONNECTOS_CALENDAR_IMPORT"
  | "ICS_CALENDAR_IMPORT";

export interface ImportThrottleRecord {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  sourceSystem: string;
  operation: ImportThrottleOperation;
  windowStartedAt: string;
  windowMs: number;
  limit: number;
  count: number;
  updatedAt: string;
}

export interface RequestThrottleRecord {
  id: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  keyHash: string;
  windowStartedAt: string;
  windowMs: number;
  limit: number;
  count: number;
  updatedAt: string;
}
