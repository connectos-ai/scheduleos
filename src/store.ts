import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  AuthUser,
  CalendarEvent,
  IdempotencyRecord,
  ImportThrottleRecord,
  IntegrationState,
  RequestThrottleRecord,
  SchedulePlan,
  SchedulingTask,
  WorkingHours,
  WorkspaceMembership
} from "./domain.js";

export interface ApiStore {
  tasks: SchedulingTask[];
  calendarEvents: CalendarEvent[];
  workingHours: Map<string, WorkingHours>;
  plans: SchedulePlan[];
  auditEvents: AuditEvent[];
  idempotencyRecords: IdempotencyRecord[];
  integrationStates: IntegrationState[];
  importThrottleRecords: ImportThrottleRecord[];
  requestThrottleRecords: RequestThrottleRecord[];
  authUsers: AuthUser[];
  workspaceMemberships: WorkspaceMembership[];
  authSessions: AuthSession[];
  authPasswordResetTokens: AuthPasswordResetToken[];
  authLoginAttemptWindows: AuthLoginAttemptWindow[];
}

export interface ApiStoreController {
  state: ApiStore;
  persist: () => void;
}

interface SerializedApiStore {
  version: 1;
  tasks: SchedulingTask[];
  calendarEvents: CalendarEvent[];
  workingHours: WorkingHours[];
  plans: SchedulePlan[];
  auditEvents?: AuditEvent[];
  idempotencyRecords?: IdempotencyRecord[];
  integrationStates?: IntegrationState[];
  importThrottleRecords?: ImportThrottleRecord[];
  requestThrottleRecords?: RequestThrottleRecord[];
  authUsers?: AuthUser[];
  workspaceMemberships?: WorkspaceMembership[];
  authSessions?: AuthSession[];
  authPasswordResetTokens?: AuthPasswordResetToken[];
  authLoginAttemptWindows?: AuthLoginAttemptWindow[];
}

export const createApiStore = (storagePath?: string): ApiStoreController => {
  const state = storagePath ? loadStore(storagePath) : emptyStore();

  return {
    state,
    persist: () => {
      if (storagePath) writeStore(storagePath, state);
    }
  };
};

const emptyStore = (): ApiStore => ({
  tasks: [],
  calendarEvents: [],
  workingHours: new Map(),
  plans: [],
  auditEvents: [],
  idempotencyRecords: [],
  integrationStates: [],
  importThrottleRecords: [],
  requestThrottleRecords: [],
  authUsers: [],
  workspaceMemberships: [],
  authSessions: [],
  authPasswordResetTokens: [],
  authLoginAttemptWindows: []
});

const loadStore = (storagePath: string): ApiStore => {
  if (!existsSync(storagePath)) return emptyStore();

  const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as SerializedApiStore;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported ScheduleOS store version: ${parsed.version}`);
  }

  return {
    tasks: parsed.tasks,
    calendarEvents: parsed.calendarEvents,
    workingHours: new Map(
      parsed.workingHours.map((workingHours) => [workingHours.userId, workingHours])
    ),
    plans: parsed.plans,
  auditEvents: parsed.auditEvents ?? [],
  idempotencyRecords: parsed.idempotencyRecords ?? [],
    integrationStates: parsed.integrationStates ?? [],
    importThrottleRecords: parsed.importThrottleRecords ?? [],
    requestThrottleRecords: parsed.requestThrottleRecords ?? [],
    authUsers: parsed.authUsers ?? [],
  workspaceMemberships: parsed.workspaceMemberships ?? [],
  authSessions: parsed.authSessions ?? [],
  authPasswordResetTokens: parsed.authPasswordResetTokens ?? [],
  authLoginAttemptWindows: parsed.authLoginAttemptWindows ?? []
};
};

const writeStore = (storagePath: string, state: ApiStore): void => {
  mkdirSync(dirname(storagePath), { recursive: true });
  const temporaryPath = `${storagePath}.tmp`;
  const serialized: SerializedApiStore = {
    version: 1,
    tasks: state.tasks,
    calendarEvents: state.calendarEvents,
    workingHours: [...state.workingHours.values()],
    plans: state.plans,
  auditEvents: state.auditEvents,
  idempotencyRecords: state.idempotencyRecords,
    integrationStates: state.integrationStates,
    importThrottleRecords: state.importThrottleRecords,
    requestThrottleRecords: state.requestThrottleRecords,
    authUsers: state.authUsers,
  workspaceMemberships: state.workspaceMemberships,
  authSessions: state.authSessions,
  authPasswordResetTokens: state.authPasswordResetTokens,
  authLoginAttemptWindows: state.authLoginAttemptWindows
};

  writeFileSync(temporaryPath, `${JSON.stringify(serialized, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, storagePath);
};
