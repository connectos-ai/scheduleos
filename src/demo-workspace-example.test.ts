import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSchedule } from "./scheduler.js";
import type { CalendarEvent, SchedulingTask, TimeBlock, WorkingHours } from "./domain.js";

interface DemoWorkspace {
  status: "fictional-demo-only";
  tenantId: string;
  workspaceId: string;
  userId: string;
  timezone: string;
  rangeStart: string;
  rangeEnd: string;
  workingHours: WorkingHours;
  calendarEvents: CalendarEvent[];
  tasks: SchedulingTask[];
  leadershipSystemPublicGuidance: Array<{
    taskId: string;
    sourceSystem: string;
    strategicPriority: SchedulingTask["priority"];
    ownerOnly: boolean;
    preferredDayparts?: SchedulingTask["preferredDayparts"];
    tags?: string[];
  }>;
  newMeetingForReplan: CalendarEvent;
}

const loadDemo = (): DemoWorkspace =>
  JSON.parse(
    readFileSync(new URL("../examples/fictional-demo-workspace.json", import.meta.url), "utf8")
  ) as DemoWorkspace;

const minutes = (block: TimeBlock): number =>
  (new Date(block.end).getTime() - new Date(block.start).getTime()) / 60_000;

const blocksDoNotOverlap = (blocks: TimeBlock[]): boolean =>
  blocks
    .slice()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .every((block, index, sorted) => {
      const next = sorted[index + 1];
      return !next || block.end <= next.start;
    });

test("fictional demo workspace validates required open-source example coverage", () => {
  const demo = loadDemo();

  assert.equal(demo.status, "fictional-demo-only");
  assert.equal(demo.tenantId, "tenant_demo");
  assert.ok(demo.calendarEvents.some((event) => event.id === "event_harbor_fixed_meeting"));
  assert.ok(demo.calendarEvents.some((event) => event.sourceSystem === "CONNECTOS"));
  assert.ok(demo.tasks.some((task) => task.title.includes("deep work")));
  assert.ok(demo.tasks.some((task) => task.schedulingMode === "HABIT"));
  assert.ok(demo.tasks.some((task) => task.splittable));
  assert.ok(demo.tasks.some((task) => (task.dependencies ?? []).length > 0));
  assert.ok(demo.tasks.some((task) => task.sourceSystem === "OWNEROPS"));
  assert.ok(demo.leadershipSystemPublicGuidance.length > 0);
});

test("fictional demo workspace creates schedule, overload evidence, and replan proof", () => {
  const demo = loadDemo();
  const guidedTasks: SchedulingTask[] = demo.tasks.map((task) => {
    const guidance = demo.leadershipSystemPublicGuidance.find((item) => item.taskId === task.id);
    if (!guidance) return task;
    const guided: SchedulingTask = {
      ...task,
      sourceSystem: guidance.sourceSystem,
      priority: guidance.strategicPriority,
      tags: [...new Set([...(task.tags ?? []), ...(guidance.tags ?? [])])]
    };
    const preferredDayparts = guidance.preferredDayparts ?? task.preferredDayparts;
    if (preferredDayparts) {
      guided.preferredDayparts = preferredDayparts;
    }
    return guided;
  });

  const plan = createSchedule({
    tenantId: demo.tenantId,
    workspaceId: demo.workspaceId,
    userId: demo.userId,
    rangeStart: demo.rangeStart,
    rangeEnd: demo.rangeEnd,
    timezone: demo.timezone,
    workingHours: demo.workingHours,
    calendarEvents: demo.calendarEvents,
    tasks: guidedTasks
  });

  assert.ok(plan.blocks.some((block) => block.taskId === "task_riverstone_deep_work"));
  assert.ok(plan.blocks.some((block) => block.taskId === "task_northstar_split_report"));
  assert.equal(
    plan.blocks.filter((block) => block.taskId === "task_northstar_split_report").length,
    2
  );
  assert.equal(blocksDoNotOverlap(plan.blocks), true);
  assert.ok(
    guidedTasks.some(
      (task) =>
        task.id === "task_harbor_follow_up" &&
        (task.dependencies ?? []).includes("task_riverstone_deep_work")
    )
  );
  assert.ok(
    plan.unscheduledTasks.some((task) => task.taskId === "task_over_capacity"),
    "demo should include an honest overload example"
  );
  assert.ok(
    plan.unscheduledTasks.some((task) => task.taskId === "task_harbor_follow_up"),
    "dependent follow-up should stay unscheduled when the day is already full"
  );
  assert.ok(plan.capacityWarnings.some((warning) => warning.code === "OVER_CAPACITY"));
  assert.ok(
    plan.explanations.some(
      (explanation) =>
        explanation.taskId === "task_over_capacity" && explanation.type === "TASK_UNSCHEDULED"
    )
  );

  const firstBlock = plan.blocks[0];
  assert.ok(firstBlock);
  const lockedBlock: TimeBlock = { ...firstBlock, status: "LOCKED", locked: true };
  const replanned = createSchedule({
    tenantId: demo.tenantId,
    workspaceId: demo.workspaceId,
    userId: demo.userId,
    rangeStart: demo.rangeStart,
    rangeEnd: demo.rangeEnd,
    timezone: demo.timezone,
    workingHours: demo.workingHours,
    calendarEvents: [...demo.calendarEvents, demo.newMeetingForReplan],
    tasks: guidedTasks.filter((task) => task.id !== lockedBlock.taskId),
    existingBlocks: [lockedBlock]
  });

  assert.deepEqual(replanned.blocks.find((block) => block.id === lockedBlock.id), lockedBlock);
  assert.ok(replanned.explanations.some((explanation) => explanation.type === "BLOCK_PRESERVED"));
  assert.ok(replanned.blocks.every((block) => minutes(block) > 0));
});
