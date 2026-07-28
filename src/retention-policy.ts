export type RetentionPolicyCategory =
  | "ACTIVE_USER_DATA"
  | "WORKSPACE_EXPORT"
  | "PLAINTEXT_BACKUP"
  | "ENCRYPTED_BACKUP"
  | "AUDIT_EVENT"
  | "IDEMPOTENCY_RECORD"
| "AUTH_SESSION"
| "AUTH_PASSWORD_RESET_TOKEN"
| "AUTH_LOGIN_ATTEMPT_WINDOW"
| "IMPORT_THROTTLE_WINDOW"
  | "CALENDAR_SYNC_STATE"
  | "INTEGRATION_SYNC_METADATA"
  | "SCHEDULE_PLAN_HISTORY"
  | "DELETED_WORKSPACE_OPERATOR_NOTE";

export interface RetentionPolicyEntry {
  category: RetentionPolicyCategory;
  retentionDays: number | null;
  startsAt: string;
  action: "KEEP_UNTIL_DELETION" | "DELETE_AFTER_RETENTION" | "REVIEW_AFTER_RETENTION";
  rationale: string;
}

export interface RetentionCutoff {
  category: RetentionPolicyCategory;
  deleteBefore: string | null;
  action: RetentionPolicyEntry["action"];
}

export const scheduleOSRetentionPolicy: readonly RetentionPolicyEntry[] = [
  {
    category: "ACTIVE_USER_DATA",
    retentionDays: null,
    startsAt: "until explicit workspace or user deletion",
    action: "KEEP_UNTIL_DELETION",
    rationale:
      "Tasks, current calendar events, working hours, and active schedule state are user data and remain until export/deletion workflow or user action removes them."
  },
  {
    category: "WORKSPACE_EXPORT",
    retentionDays: 7,
    startsAt: "export creation",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Exports are portable copies of private user data and should be short-lived unless the operator moves them to a separately governed archive."
  },
  {
    category: "PLAINTEXT_BACKUP",
    retentionDays: 7,
    startsAt: "backup creation",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Plaintext backups are allowed for local restore validation but should not remain on disk longer than necessary."
  },
  {
    category: "ENCRYPTED_BACKUP",
    retentionDays: 30,
    startsAt: "backup creation",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Encrypted self-host backups keep enough recovery history for local operators without becoming an indefinite second data store."
  },
  {
    category: "AUDIT_EVENT",
    retentionDays: 365,
    startsAt: "event occurrence",
    action: "REVIEW_AFTER_RETENTION",
    rationale:
      "Audit events support security review, support requests, and destructive-operation proof; long-term retention should be reviewed yearly."
  },
  {
    category: "IDEMPOTENCY_RECORD",
    retentionDays: 30,
    startsAt: "record completion, expiry, or failure",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Replay protection records should outlive normal retry windows but not retain request hashes forever."
  },
  {
    category: "AUTH_SESSION",
    retentionDays: 30,
    startsAt: "session expiration or revocation",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Expired and revoked session hashes should be available briefly for security review, then pruned so old bearer artifacts do not remain indefinitely."
  },
{
category: "AUTH_PASSWORD_RESET_TOKEN",
retentionDays: 7,
startsAt: "token expiration or use",
action: "DELETE_AFTER_RETENTION",
rationale:
"Expired or used password reset token hashes are short-lived recovery artifacts and should be pruned quickly after operational review."
},
  {
    category: "AUTH_LOGIN_ATTEMPT_WINDOW",
    retentionDays: 14,
    startsAt: "lock release or latest failed-attempt window update",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Credential-attempt windows are abuse-control evidence and should persist briefly after lockout review without becoming permanent login metadata."
  },
  {
    category: "IMPORT_THROTTLE_WINDOW",
    retentionDays: 14,
    startsAt: "window end",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Import throttle windows are abuse-control evidence and can be removed after short operational review."
  },
  {
    category: "CALENDAR_SYNC_STATE",
    retentionDays: 90,
    startsAt: "sync replacement, reset, or disconnect",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Old calendar sync cursors and busy snapshots should not persist after they stop serving active planning."
  },
  {
    category: "INTEGRATION_SYNC_METADATA",
    retentionDays: 90,
    startsAt: "provider disconnect or sync reset",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Provider metadata can help debug recent sync issues but should not become permanent connector history."
  },
  {
    category: "SCHEDULE_PLAN_HISTORY",
    retentionDays: 180,
    startsAt: "plan range end",
    action: "DELETE_AFTER_RETENTION",
    rationale:
      "Historical plans help explain replanning and outcomes for a limited period while avoiding indefinite planning history."
  },
  {
    category: "DELETED_WORKSPACE_OPERATOR_NOTE",
    retentionDays: 365,
    startsAt: "workspace deletion",
    action: "REVIEW_AFTER_RETENTION",
    rationale:
      "Deletion proof should live outside the deleted workspace and be reviewed yearly under the operator's legal/support needs."
  }
] as const;

export const calculateRetentionCutoffs = (
  asOf: Date,
  policy: readonly RetentionPolicyEntry[] = scheduleOSRetentionPolicy
): RetentionCutoff[] => {
  if (Number.isNaN(asOf.getTime())) {
    throw new Error("Retention cutoff date is invalid.");
  }

  return policy.map((entry) => ({
    category: entry.category,
    deleteBefore:
      entry.retentionDays === null ? null : daysBefore(asOf, entry.retentionDays).toISOString(),
    action: entry.action
  }));
};

const daysBefore = (date: Date, days: number): Date =>
  new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
