import test from "node:test";
import assert from "node:assert/strict";
import { createSchedule } from "./scheduler.js";
import { exportScheduleBlocksToIcs } from "./ics.js";
import type {
  CalendarEvent,
  CreateScheduleInput,
  SchedulingTask,
  TimeBlock,
  WorkingHours
} from "./domain.js";

const baseWorkingHours = (overrides: Partial<WorkingHours> = {}): WorkingHours => ({
  userId: "user_jordan",
  timezone: "UTC",
  daysOfWeek: [3],
  startTime: "09:00",
  endTime: "17:00",
  ...overrides
});

const task = (overrides: Partial<SchedulingTask>): SchedulingTask => ({
  id: "task_demo",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  ownerId: "user_jordan",
  title: "Demo task",
  priority: "MEDIUM",
  estimatedDurationMinutes: 60,
  remainingDurationMinutes: 60,
  deadline: "2026-07-22T17:00:00.000Z",
  schedulingMode: "DEADLINE_DRIVEN",
  splittable: false,
  schedulingEligible: true,
  blocked: false,
  waiting: false,
  confidence: "CONFIRMED",
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z",
  ...overrides
});

const event = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: "event_demo",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  calendarId: "calendar_demo",
  title: "Busy",
  start: "2026-07-22T12:00:00.000Z",
  end: "2026-07-22T13:00:00.000Z",
  timezone: "UTC",
  allDay: false,
  status: "CONFIRMED",
  busyStatus: "BUSY",
  movable: false,
  locked: true,
  privacyLevel: "BUSY_ONLY",
  version: 1,
  ...overrides
});

const input = (overrides: Partial<CreateScheduleInput>): CreateScheduleInput => ({
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  rangeStart: "2026-07-22T09:00:00.000Z",
  rangeEnd: "2026-07-22T17:00:00.000Z",
  timezone: "UTC",
  tasks: [],
  calendarEvents: [],
  workingHours: baseWorkingHours(),
  ...overrides
});

const totalMinutes = (blocks: TimeBlock[]): number =>
  blocks.reduce(
    (sum, block) =>
      sum + (new Date(block.end).getTime() - new Date(block.start).getTime()) / 60_000,
    0
  );

test("persona 1 basic solo user gets a simple standalone daily plan", () => {
  const plan = createSchedule(
    input({
      tasks: [
        task({
          id: "persona_solo_plan_day",
          title: "Plan simple day",
          estimatedDurationMinutes: 45,
          remainingDurationMinutes: 45
        })
      ],
      workingHours: baseWorkingHours({ startTime: "09:00", endTime: "12:00" })
    })
  );

  assert.equal(plan.blocks.length, 1);
  assert.equal(plan.blocks[0]?.taskId, "persona_solo_plan_day");
  assert.equal(plan.blocks[0]?.start, "2026-07-22T09:00:00.000Z");
  assert.equal(plan.unscheduledTasks.length, 0);
});

test("persona 2 busy owner sees honest over-capacity and deadline risk", () => {
  const plan = createSchedule(
    input({
      rangeEnd: "2026-07-22T11:00:00.000Z",
      workingHours: baseWorkingHours({ startTime: "09:00", endTime: "11:00" }),
      calendarEvents: [
        event({
          id: "persona_owner_budget_review",
          start: "2026-07-22T10:00:00.000Z",
          end: "2026-07-22T11:00:00.000Z"
        })
      ],
      tasks: [
        task({
          id: "persona_owner_deadline",
          title: "Finish owner deadline brief",
          priority: "URGENT",
          estimatedDurationMinutes: 120,
          remainingDurationMinutes: 120,
          deadline: "2026-07-22T11:00:00.000Z"
        })
      ]
    })
  );

  assert.deepEqual(plan.unscheduledTasks, [
    { taskId: "persona_owner_deadline", reason: "DEADLINE_AT_RISK" }
  ]);
  assert.ok(plan.capacityWarnings.some((warning) => warning.code === "DEADLINE_AT_RISK"));
  assert.ok(plan.capacityWarnings.some((warning) => warning.code === "OVER_CAPACITY"));
});

test("persona 3 pastor creative leader gets morning focus and protected boundary", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T07:00:00.000Z",
      rangeEnd: "2026-07-22T12:00:00.000Z",
      workingHours: baseWorkingHours({ startTime: "07:00", endTime: "12:00" }),
      calendarEvents: [
        event({
          id: "persona_pastor_personal_boundary",
          title: "Personal boundary",
          start: "2026-07-22T09:00:00.000Z",
          end: "2026-07-22T10:00:00.000Z",
          privacyLevel: "BUSY_ONLY"
        })
      ],
      tasks: [
        task({
          id: "persona_sermon_prep",
          title: "Prepare sermon outline",
          priority: "HIGH",
          estimatedDurationMinutes: 90,
          remainingDurationMinutes: 90,
          preferredDayparts: ["MORNING"]
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.taskId, "persona_sermon_prep");
  assert.ok(new Date(plan.blocks[0]?.start ?? "").getUTCHours() < 12);
  assert.ok(
    (plan.blocks[0]?.end ?? "") <= "2026-07-22T09:00:00.000Z" ||
      (plan.blocks[0]?.start ?? "") >= "2026-07-22T10:00:00.000Z"
  );
});

test("persona 4 small-team manager schedules OwnerOps assigned work for mapped user", () => {
  const plan = createSchedule(
    input({
      userId: "user_casey",
      workingHours: baseWorkingHours({ userId: "user_casey" }),
      tasks: [
        task({
          id: "persona_manager_assigned_work",
          userId: "user_casey",
          ownerId: "user_casey",
          sourceSystem: "OWNEROPS",
          externalId: "ownerops_persona_manager_assigned_work",
          title: "Prepare team handoff",
          priority: "HIGH"
        }),
        task({
          id: "persona_manager_wrong_user",
          userId: "user_jordan",
          ownerId: "user_jordan",
          sourceSystem: "OWNEROPS",
          title: "Other teammate work"
        })
      ]
    })
  );

  assert.equal(plan.blocks.length, 1);
  assert.equal(plan.blocks[0]?.taskId, "persona_manager_assigned_work");
  assert.deepEqual(plan.unscheduledTasks, [
    { taskId: "persona_manager_wrong_user", reason: "WRONG_SCOPE" }
  ]);
});

test("persona 5 calendar-heavy professional replans around new meeting while preserving lock", () => {
  const lockedBlock: TimeBlock = {
    id: "persona_calendar_locked_focus",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    taskId: "persona_calendar_existing_focus",
    start: "2026-07-22T09:00:00.000Z",
    end: "2026-07-22T10:00:00.000Z",
    status: "LOCKED",
    locked: true
  };

  const plan = createSchedule(
    input({
      existingBlocks: [lockedBlock],
      calendarEvents: [
        event({
          id: "persona_calendar_new_meeting",
          start: "2026-07-22T10:00:00.000Z",
          end: "2026-07-22T11:00:00.000Z"
        })
      ],
      tasks: [
        task({
          id: "persona_calendar_follow_up",
          title: "Follow up after new meeting",
          estimatedDurationMinutes: 60,
          remainingDurationMinutes: 60
        })
      ]
    })
  );

  assert.deepEqual(plan.blocks.find((block) => block.id === lockedBlock.id), lockedBlock);
  assert.equal(
    plan.blocks.find((block) => block.taskId === "persona_calendar_follow_up")?.start,
    "2026-07-22T11:00:00.000Z"
  );
  assert.ok(plan.explanations.some((explanation) => explanation.type === "BLOCK_PRESERVED"));
});

test("persona 6 local-first user exports a deterministic plan through ICS", () => {
  const tasks = [
    task({
      id: "persona_local_first_task",
      title: "Local-first planning block",
      estimatedDurationMinutes: 60,
      remainingDurationMinutes: 60
    })
  ];
  const plan = createSchedule(
    input({
      tasks
    })
  );
  const acceptedBlocks = plan.blocks.map((block) => ({
    ...block,
    status: "ACCEPTED" as const
  }));
  const ics = exportScheduleBlocksToIcs(acceptedBlocks, tasks, {
    calendarId: "calendar_local_first",
    calendarName: "ScheduleOS Persona Validation"
  });

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /UID:block_persona_local_first_task_1/);
  assert.match(ics, /SUMMARY:Local-first planning block/);
});

test("persona 7 ConnectOS user schedules around private provider busy time", () => {
  const plan = createSchedule(
    input({
      calendarEvents: [
        event({
          id: "persona_connectos_private_hold",
          sourceSystem: "CONNECTOS",
          title: "Provider private hold",
          start: "2026-07-22T09:00:00.000Z",
          end: "2026-07-22T10:00:00.000Z",
          privacyLevel: "PRIVATE"
        })
      ],
      tasks: [
        task({
          id: "persona_connectos_task",
          title: "Schedule after provider hold",
          sourceSystem: "CONNECTOS",
          estimatedDurationMinutes: 60,
          remainingDurationMinutes: 60
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.taskId, "persona_connectos_task");
  assert.equal(plan.blocks[0]?.start, "2026-07-22T10:00:00.000Z");
  assert.doesNotMatch(
    plan.explanations.map((explanation) => explanation.message).join("\n"),
    /Provider private hold/
  );
});

test("persona 8 compatible leadership system user can add public leadership priority without private dependency", () => {
  const plan = createSchedule(
    input({
      tasks: [
        task({
          id: "persona_leadership-system_leadership_move",
          title: "Resolve milestone decision",
          sourceSystem: "DOBOTH_PUBLIC_EXAMPLE",
          priority: "URGENT",
          preferredDayparts: ["MORNING"],
          tags: ["leadership-leverage-demo"]
        }),
        task({
          id: "persona_leadership-system_low_leverage",
          title: "Clean up optional notes",
          priority: "LOW"
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.taskId, "persona_leadership-system_leadership_move");
  assert.equal(plan.blocks[0]?.start, "2026-07-22T09:00:00.000Z");
  assert.equal(plan.blocks[1]?.taskId, "persona_leadership-system_low_leverage");
});
