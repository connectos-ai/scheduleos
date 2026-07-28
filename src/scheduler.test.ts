import test from "node:test";
import assert from "node:assert/strict";
import { createSchedule } from "./scheduler.js";
import type {
  CalendarEvent,
  CreateScheduleInput,
  SchedulingTask,
  TimeBlock
} from "./domain.js";

const baseTask = (overrides: Partial<SchedulingTask>): SchedulingTask => ({
  id: "task",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  ownerId: "user_jordan",
  title: "Demo task",
  priority: "MEDIUM",
  estimatedDurationMinutes: 60,
  remainingDurationMinutes: 60,
  deadline: "2026-07-22T21:00:00.000Z",
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

const fixedEvent = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: "event",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  calendarId: "calendar_work",
  title: "Private event",
  start: "2026-07-22T13:00:00.000Z",
  end: "2026-07-22T14:00:00.000Z",
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

const input = (
  overrides: Partial<CreateScheduleInput>
): CreateScheduleInput => ({
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  rangeStart: "2026-07-22T09:00:00.000Z",
  rangeEnd: "2026-07-22T17:00:00.000Z",
  timezone: "UTC",
  tasks: [],
  calendarEvents: [],
  workingHours: {
    userId: "user_jordan",
    timezone: "UTC",
    daysOfWeek: [3],
    startTime: "09:00",
    endTime: "17:00"
  },
  ...overrides
});

test("schedules higher priority tasks first while avoiding fixed busy events", () => {
  const plan = createSchedule(
    input({
      tasks: [
        baseTask({ id: "medium", priority: "MEDIUM", title: "Medium" }),
        baseTask({ id: "urgent", priority: "URGENT", title: "Urgent" })
      ],
      calendarEvents: [fixedEvent({})]
    })
  );

  assert.equal(plan.unscheduledTasks.length, 0);
  assert.equal(plan.blocks.length, 2);
  assert.equal(plan.blocks[0]?.taskId, "urgent");
  assert.equal(plan.blocks[0]?.start, "2026-07-22T09:00:00.000Z");
  assert.equal(plan.blocks[0]?.end, "2026-07-22T10:00:00.000Z");
  assert.equal(plan.blocks[1]?.taskId, "medium");
  assert.notEqual(plan.blocks[1]?.start, "2026-07-22T13:00:00.000Z");
});

test("splits eligible tasks and preserves non-splittable tasks", () => {
  const plan = createSchedule(
    input({
      tasks: [
        baseTask({
          id: "splittable",
          title: "Splittable",
          remainingDurationMinutes: 180,
          estimatedDurationMinutes: 180,
          splittable: true,
          minimumBlockMinutes: 60,
          maximumBlockMinutes: 90
        }),
        baseTask({
          id: "non-splittable",
          title: "Non splittable",
          priority: "LOW",
          remainingDurationMinutes: 120,
          estimatedDurationMinutes: 120,
          splittable: false
        })
      ],
      calendarEvents: [
        fixedEvent({
          id: "midday",
          start: "2026-07-22T10:30:00.000Z",
          end: "2026-07-22T11:30:00.000Z"
        })
      ]
    })
  );

  const splitBlocks = plan.blocks.filter((block) => block.taskId === "splittable");
  const nonSplitBlocks = plan.blocks.filter(
    (block) => block.taskId === "non-splittable"
  );

  assert.equal(splitBlocks.length, 2);
  assert.equal(nonSplitBlocks.length, 1);
  assert.equal(totalMinutes(splitBlocks), 180);
  assert.equal(totalMinutes(nonSplitBlocks), 120);
});

test("does not double-book previously scheduled work when fixed events sort later", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T09:00:00.000Z",
      rangeEnd: "2026-07-22T12:00:00.000Z",
      tasks: [
        baseTask({
          id: "first",
          title: "First task",
          priority: "HIGH",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60
        }),
        baseTask({
          id: "second",
          title: "Second task",
          priority: "MEDIUM",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60
        })
      ],
      calendarEvents: [
        fixedEvent({
          id: "later-fixed",
          start: "2026-07-22T11:00:00.000Z",
          end: "2026-07-22T12:00:00.000Z"
        })
      ]
    })
  );

  assert.equal(plan.blocks.length, 2);
  assert.deepEqual(
    plan.blocks.map((block) => [block.taskId, block.start, block.end]),
    [
      ["first", "2026-07-22T09:00:00.000Z", "2026-07-22T10:00:00.000Z"],
      ["second", "2026-07-22T10:00:00.000Z", "2026-07-22T11:00:00.000Z"]
    ]
  );
});

test("preserves locked blocks when replanning around a new meeting", () => {
  const lockedBlock: TimeBlock = {
    id: "locked_focus",
    taskId: "locked-task",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    start: "2026-07-22T09:00:00.000Z",
    end: "2026-07-22T10:00:00.000Z",
    status: "LOCKED",
    locked: true
  };

  const plan = createSchedule(
    input({
      existingBlocks: [lockedBlock],
      tasks: [
        baseTask({
          id: "new-task",
          title: "New task",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60
        })
      ],
      calendarEvents: [
        fixedEvent({
          id: "new-meeting",
          start: "2026-07-22T10:00:00.000Z",
          end: "2026-07-22T11:00:00.000Z"
        })
      ]
    })
  );

  assert.deepEqual(plan.blocks.find((block) => block.id === "locked_focus"), lockedBlock);
  const newTaskBlock = plan.blocks.find((block) => block.taskId === "new-task");
  assert.equal(newTaskBlock?.start, "2026-07-22T11:00:00.000Z");
  assert.ok(
    plan.explanations.some(
      (explanation) =>
        explanation.type === "BLOCK_PRESERVED" &&
        explanation.blockId === "locked_focus"
    )
  );
});

test("reports impossible capacity honestly with grounded explanation", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T09:00:00.000Z",
      rangeEnd: "2026-07-22T12:00:00.000Z",
      tasks: [
        baseTask({
          id: "too-large",
          title: "Too large",
          remainingDurationMinutes: 90,
          estimatedDurationMinutes: 90,
          deadline: "2026-07-22T12:00:00.000Z"
        })
      ],
      calendarEvents: [
        fixedEvent({
          id: "busy",
          start: "2026-07-22T10:00:00.000Z",
          end: "2026-07-22T11:00:00.000Z"
        })
      ]
    })
  );

  assert.equal(plan.blocks.length, 0);
  assert.deepEqual(plan.unscheduledTasks, [
    { taskId: "too-large", reason: "NO_CONTIGUOUS_SLOT" }
  ]);
  assert.equal(plan.capacityWarnings[0]?.code, "NO_CONTIGUOUS_SLOT");
  assert.match(plan.capacityWarnings[0]?.message ?? "", /available/);
  assert.ok(
    plan.explanations.some(
      (explanation) =>
        explanation.type === "TASK_UNSCHEDULED" &&
        explanation.taskId === "too-large"
    )
  );
});

test("does not schedule blocked, ineligible, or wrong-scope tasks", () => {
  const plan = createSchedule(
    input({
      tasks: [
        baseTask({ id: "blocked", blocked: true }),
        baseTask({ id: "ineligible", schedulingEligible: false }),
        baseTask({ id: "wrong-scope", tenantId: "tenant_other" })
      ]
    })
  );

  assert.equal(plan.blocks.length, 0);
  assert.deepEqual(plan.unscheduledTasks, [
    { taskId: "blocked", reason: "BLOCKED" },
    { taskId: "ineligible", reason: "SCHEDULING_INELIGIBLE" },
    { taskId: "wrong-scope", reason: "WRONG_SCOPE" }
  ]);
});

test("schedules only remaining duration after partial completion", () => {
  const plan = createSchedule(
    input({
      tasks: [
        baseTask({
          id: "partial",
          title: "Partially completed",
          estimatedDurationMinutes: 180,
          remainingDurationMinutes: 45,
          splittable: false
        })
      ]
    })
  );

  assert.equal(plan.blocks.length, 1);
  assert.equal(totalMinutes(plan.blocks), 45);
});

test("flags deadline risk when required work cannot fit before deadline", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T09:00:00.000Z",
      rangeEnd: "2026-07-22T17:00:00.000Z",
      tasks: [
        baseTask({
          id: "deadline-risk",
          title: "Deadline risk",
          remainingDurationMinutes: 180,
          estimatedDurationMinutes: 180,
          deadline: "2026-07-22T11:00:00.000Z"
        })
      ],
      calendarEvents: [
        fixedEvent({
          id: "busy-before-deadline",
          start: "2026-07-22T10:00:00.000Z",
          end: "2026-07-22T11:00:00.000Z"
        })
      ]
    })
  );

  assert.equal(plan.blocks.length, 0);
  assert.deepEqual(plan.unscheduledTasks, [
    { taskId: "deadline-risk", reason: "DEADLINE_AT_RISK" }
  ]);
  assert.equal(plan.capacityWarnings[0]?.code, "DEADLINE_AT_RISK");
});

test("schedules dependent tasks after their prerequisites", () => {
  const plan = createSchedule(
    input({
      tasks: [
        baseTask({
          id: "task_review",
          title: "Review outline",
          priority: "URGENT",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60,
          dependencies: ["task_draft"]
        }),
        baseTask({
          id: "task_draft",
          title: "Draft outline",
          priority: "LOW",
          remainingDurationMinutes: 90,
          estimatedDurationMinutes: 90
        })
      ]
    })
  );

  const draft = plan.blocks.find((block) => block.taskId === "task_draft");
  const review = plan.blocks.find((block) => block.taskId === "task_review");

  assert.equal(draft?.start, "2026-07-22T09:00:00.000Z");
  assert.equal(draft?.end, "2026-07-22T10:30:00.000Z");
  assert.equal(review?.start, "2026-07-22T10:30:00.000Z");
});

test("prefers matching daypart slots when hard constraints allow it", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T07:00:00.000Z",
      rangeEnd: "2026-07-22T12:00:00.000Z",
      workingHours: {
        userId: "user_jordan",
        timezone: "UTC",
        daysOfWeek: [3],
        startTime: "07:00",
        endTime: "12:00"
      },
      tasks: [
        baseTask({
          id: "task_morning_focus",
          title: "Morning focus",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60,
          preferredDayparts: ["MORNING"]
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.start, "2026-07-22T09:00:00.000Z");
});

test("protects recurring break windows inside working hours", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-22T11:00:00.000Z",
      rangeEnd: "2026-07-22T15:00:00.000Z",
      workingHours: {
        userId: "user_jordan",
        timezone: "UTC",
        daysOfWeek: [3],
        startTime: "11:00",
        endTime: "15:00",
        breakWindows: [
          {
            label: "Lunch",
            startTime: "12:00",
            endTime: "13:00"
          }
        ]
      },
      tasks: [
        baseTask({
          id: "task_after_lunch",
          title: "After lunch focus",
          remainingDurationMinutes: 90,
          estimatedDurationMinutes: 90
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.start, "2026-07-22T13:00:00.000Z");
  assert.equal(plan.blocks[0]?.end, "2026-07-22T14:30:00.000Z");
});

test("uses working-hours timezone during daylight-saving time", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-07-06T00:00:00.000Z",
      rangeEnd: "2026-07-07T00:00:00.000Z",
      workingHours: {
        userId: "user_jordan",
        timezone: "America/New_York",
        daysOfWeek: [1],
        startTime: "09:00",
        endTime: "10:00"
      },
      tasks: [
        baseTask({
          id: "task_dst",
          title: "DST local morning",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60,
          deadline: "2026-07-06T23:00:00.000Z"
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.start, "2026-07-06T13:00:00.000Z");
  assert.equal(plan.blocks[0]?.end, "2026-07-06T14:00:00.000Z");
});

test("uses working-hours timezone during standard time", () => {
  const plan = createSchedule(
    input({
      rangeStart: "2026-01-05T00:00:00.000Z",
      rangeEnd: "2026-01-06T00:00:00.000Z",
      workingHours: {
        userId: "user_jordan",
        timezone: "America/New_York",
        daysOfWeek: [1],
        startTime: "09:00",
        endTime: "10:00"
      },
      tasks: [
        baseTask({
          id: "task_standard",
          title: "Standard local morning",
          remainingDurationMinutes: 60,
          estimatedDurationMinutes: 60,
          deadline: "2026-01-05T23:00:00.000Z"
        })
      ]
    })
  );

  assert.equal(plan.blocks[0]?.start, "2026-01-05T14:00:00.000Z");
  assert.equal(plan.blocks[0]?.end, "2026-01-05T15:00:00.000Z");
});

const totalMinutes = (blocks: TimeBlock[]): number =>
  blocks.reduce(
    (sum, block) =>
      sum +
      (new Date(block.end).getTime() - new Date(block.start).getTime()) /
        60_000,
    0
  );
