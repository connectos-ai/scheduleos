CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS users (
tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
id TEXT NOT NULL,
email TEXT NOT NULL,
display_name TEXT,
status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
credential_hash TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
data JSONB NOT NULL DEFAULT '{}'::jsonb,
PRIMARY KEY (tenant_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (tenant_id, email);

CREATE TABLE IF NOT EXISTS memberships (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
data JSONB NOT NULL DEFAULT '{}'::jsonb,
PRIMARY KEY (tenant_id, workspace_id, user_id),
FOREIGN KEY (tenant_id, workspace_id)
REFERENCES workspaces(tenant_id, id) ON DELETE CASCADE,
FOREIGN KEY (tenant_id, user_id)
REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_sessions (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
id TEXT NOT NULL,
session_token_hash TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
revoked_at TIMESTAMPTZ,
last_seen_at TIMESTAMPTZ,
data JSONB NOT NULL,
PRIMARY KEY (tenant_id, workspace_id, user_id, id),
FOREIGN KEY (tenant_id, workspace_id, user_id)
REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions (tenant_id, session_token_hash);

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
id TEXT NOT NULL,
token_hash TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
used_at TIMESTAMPTZ,
data JSONB NOT NULL,
PRIMARY KEY (tenant_id, workspace_id, user_id, id),
FOREIGN KEY (tenant_id, workspace_id, user_id)
REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_hash ON auth_password_reset_tokens (tenant_id, token_hash);

CREATE TABLE IF NOT EXISTS auth_login_attempt_windows (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_ms INTEGER NOT NULL,
  max_failed_attempts INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  priority TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_scope_status
  ON tasks (tenant_id, workspace_id, user_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_tasks_deadline
  ON tasks (tenant_id, workspace_id, user_id, deadline);

CREATE TABLE IF NOT EXISTS calendar_events (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  busy_status TEXT NOT NULL,
  privacy_level TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_time
  ON calendar_events (tenant_id, workspace_id, user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS working_hours (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timezone TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_plans (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  range_start TIMESTAMPTZ NOT NULL,
  range_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROPOSED', 'ACCEPTED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
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
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROPOSED', 'ACCEPTED', 'LOCKED', 'COMPLETED', 'MISSED')),
  locked BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id, plan_id)
    REFERENCES schedule_plans(tenant_id, workspace_id, user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_plan
  ON time_blocks (tenant_id, workspace_id, user_id, plan_id);

CREATE INDEX IF NOT EXISTS idx_time_blocks_time
  ON time_blocks (tenant_id, workspace_id, user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS audit_events (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events (tenant_id, workspace_id, user_id, resource_type, resource_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  response_resource_id TEXT,
  data JSONB NOT NULL,
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_unique_scope_key
  ON idempotency_keys (tenant_id, workspace_id, user_id, key);

CREATE TABLE IF NOT EXISTS integration_states (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  external_account_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ERROR')),
  last_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id) ON DELETE CASCADE
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
  window_started_at TIMESTAMPTZ NOT NULL,
  window_ms INTEGER NOT NULL,
  limit_count INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_import_throttles_source
  ON import_throttles (tenant_id, workspace_id, user_id, source_system, operation);

CREATE TABLE IF NOT EXISTS request_throttles (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_ms INTEGER NOT NULL,
  limit_count INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id),
  FOREIGN KEY (tenant_id, workspace_id, user_id)
    REFERENCES memberships(tenant_id, workspace_id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_request_throttles_key
  ON request_throttles (tenant_id, workspace_id, user_id, key_hash);
