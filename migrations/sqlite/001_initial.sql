CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_scope_deadline
  ON tasks (tenant_id, workspace_id, user_id, id);

CREATE TABLE IF NOT EXISTS calendar_events (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_time
  ON calendar_events (tenant_id, user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS working_hours (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS schedule_plans (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  range_start TEXT NOT NULL,
  range_end TEXT NOT NULL,
  status TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_plans_range
  ON schedule_plans (tenant_id, workspace_id, user_id, range_start, range_end);

CREATE TABLE IF NOT EXISTS time_blocks (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL,
  locked INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_plan
  ON time_blocks (tenant_id, workspace_id, user_id, plan_id);

CREATE TABLE IF NOT EXISTS audit_events (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events (tenant_id, workspace_id, user_id, resource_type, resource_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, key)
);

CREATE TABLE IF NOT EXISTS integration_states (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_integration_states_source
  ON integration_states (tenant_id, workspace_id, user_id, source_system);

CREATE TABLE IF NOT EXISTS import_throttles (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  operation TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  window_ms INTEGER NOT NULL,
  limit_count INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_import_throttles_source
  ON import_throttles (tenant_id, workspace_id, user_id, source_system, operation);

CREATE TABLE IF NOT EXISTS request_throttles (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  window_ms INTEGER NOT NULL,
  limit_count INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_request_throttles_key
  ON request_throttles (tenant_id, workspace_id, user_id, key_hash);

CREATE TABLE IF NOT EXISTS auth_users (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users (tenant_id, email);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user ON workspace_memberships (tenant_id, user_id, status);

CREATE TABLE IF NOT EXISTS auth_sessions (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions (tenant_id, session_token_hash);

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
id TEXT NOT NULL,
token_hash TEXT NOT NULL,
created_at TEXT NOT NULL,
expires_at TEXT NOT NULL,
used_at TEXT,
data TEXT NOT NULL,
PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_hash ON auth_password_reset_tokens (tenant_id, token_hash);

CREATE TABLE IF NOT EXISTS auth_login_attempt_windows (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  window_ms INTEGER NOT NULL,
  max_failed_attempts INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  locked_until TEXT,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);
