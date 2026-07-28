import type {
  CalendarEvent,
  CapacityWarning,
  CreateScheduleInput,
  SchedulePlan,
  SchedulingExplanation,
  SchedulingTask,
  TimeBlock,
  WorkingHours
} from "./domain.js";

export const createSchedule = (input: CreateScheduleInput): SchedulePlan => {
  const range = {
    start: parseIso(input.rangeStart, "rangeStart"),
    end: parseIso(input.rangeEnd, "rangeEnd")
  };
  const workingWindows = buildWorkingWindows(
    input.workingHours,
    range.start,
    range.end
  );
  const existingLockedBlocks = (input.existingBlocks ?? []).filter(
    (block) => block.locked || block.status === "LOCKED"
  );
  const fixedBusyBlocks = [
    ...input.calendarEvents.flatMap(eventToBusyBlock),
    ...existingLockedBlocks.map(timeBlockToBusyBlock)
  ].sort(compareBusyBlocks);

  const blocks: TimeBlock[] = [...existingLockedBlocks];
  const explanations: SchedulingExplanation[] = existingLockedBlocks.map(
    (block) => ({
      type: "BLOCK_PRESERVED",
      blockId: block.id,
      taskId: block.taskId,
      message: `Kept locked block ${block.id} from ${block.start} to ${block.end}.`,
      evidence: {
        blockId: block.id,
        locked: true,
        start: block.start,
        end: block.end
      }
    })
  );
  const capacityWarnings: CapacityWarning[] = [];
  const unscheduledTasks: Array<{ taskId: string; reason: string }> = [];

  for (const task of orderTasksForScheduling(input.tasks)) {
    const invalidReason = getInvalidReason(task, input);
    if (invalidReason) {
      unscheduledTasks.push({ taskId: task.id, reason: invalidReason });
      addUnscheduledExplanation(task, invalidReason, explanations);
      continue;
    }

    const taskBlocks = scheduleTask({
      task,
      input,
      workingWindows,
      busyBlocks: [
        ...fixedBusyBlocks,
        ...blocks.filter((block) => block.taskId !== task.id).map(timeBlockToBusyBlock)
      ],
      rangeStart: range.start,
      rangeEnd: range.end
    });

    if (!taskBlocks) {
      const availableMinutes = calculateAvailableMinutes(
        workingWindows,
        [
          ...fixedBusyBlocks,
          ...blocks.map(timeBlockToBusyBlock)
        ]
      );
      const unscheduledReason = task.deadline
        ? classifyDeadlineFailure(task, workingWindows, [
            ...fixedBusyBlocks,
            ...blocks.map(timeBlockToBusyBlock)
          ])
        : "NO_CONTIGUOUS_SLOT";
      const warningCode =
        unscheduledReason === "DEADLINE_AT_RISK"
          ? "DEADLINE_AT_RISK"
          : "NO_CONTIGUOUS_SLOT";
      unscheduledTasks.push({ taskId: task.id, reason: unscheduledReason });
      capacityWarnings.push({
        code: warningCode,
        taskId: task.id,
        availableMinutes,
        requiredMinutes: task.remainingDurationMinutes,
        message: `${task.title} needs ${task.remainingDurationMinutes} minutes, but only ${availableMinutes} available minutes fit its constraints.`
      });
      addUnscheduledExplanation(task, unscheduledReason, explanations, {
        availableMinutes,
        requiredMinutes: task.remainingDurationMinutes
      });
      continue;
    }

    blocks.push(...taskBlocks);
    for (const block of taskBlocks) {
      explanations.push({
        type: "TASK_PLACED",
        taskId: task.id,
        blockId: block.id,
        message: `Scheduled ${task.title} from ${block.start} to ${block.end} because it fit available working time before its deadline.`,
        evidence: {
          priority: task.priority,
          start: block.start,
          end: block.end,
          deadline: task.deadline ?? "",
          schedulingMode: task.schedulingMode
        }
      });
    }
  }

  if (unscheduledTasks.length > 0) {
    capacityWarnings.push({
      code: "OVER_CAPACITY",
      availableMinutes: calculateAvailableMinutes(
        workingWindows,
        [
          ...fixedBusyBlocks,
          ...blocks.map(timeBlockToBusyBlock)
        ]
      ),
      requiredMinutes: input.tasks
        .filter((task) => !unscheduledTasks.some((item) => item.taskId === task.id))
        .reduce((sum, task) => sum + task.remainingDurationMinutes, 0),
      message: `${unscheduledTasks.length} task(s) could not fit in the selected planning range.`
    });
  }

  return {
    id: input.planId ?? schedulePlanId(input),
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
    timezone: input.timezone,
    status: unscheduledTasks.length > 0 ? "FAILED" : "PROPOSED",
    blocks: blocks.sort((a, b) => parseIso(a.start, "block.start").getTime() - parseIso(b.start, "block.start").getTime()),
    unscheduledTasks,
    capacityWarnings,
    explanations
  };
};

const schedulePlanId = (input: CreateScheduleInput): string =>
  [
    "plan",
    input.tenantId,
    input.workspaceId,
    input.userId,
    input.rangeStart,
    input.rangeEnd
  ]
    .map(sanitizeIdPart)
    .join("_");

const sanitizeIdPart = (value: string): string =>
  value.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

interface BusyBlock {
  start: Date;
  end: Date;
}

interface ScheduleTaskInput {
  task: SchedulingTask;
  input: CreateScheduleInput;
  workingWindows: BusyBlock[];
  busyBlocks: BusyBlock[];
  rangeStart: Date;
  rangeEnd: Date;
}

const scheduleTask = ({
  task,
  input,
  workingWindows,
  busyBlocks,
  rangeStart,
  rangeEnd
}: ScheduleTaskInput): TimeBlock[] | null => {
  const sortedBusyBlocks = [...busyBlocks].sort(compareBusyBlocks);
  const taskEarliest = task.earliestStart
    ? maxDate(parseIso(task.earliestStart, "task.earliestStart"), rangeStart)
    : rangeStart;
  const taskLatest = task.deadline
    ? minDate(parseIso(task.deadline, "task.deadline"), rangeEnd)
    : rangeEnd;

  if (taskEarliest >= taskLatest) return null;

  if (!task.splittable) {
    const slot = findSlot(
      workingWindows,
      sortedBusyBlocks,
      task.remainingDurationMinutes,
      taskEarliest,
      taskLatest,
        task.preferredDayparts
      );
    if (!slot) return null;
    return [toTimeBlock(task, input, slot.start, slot.end, 1)];
  }

  const blocks: TimeBlock[] = [];
  const tentativeBusyBlocks = [...sortedBusyBlocks];
  let remaining = task.remainingDurationMinutes;
  const minimumBlockMinutes = task.minimumBlockMinutes ?? Math.min(30, remaining);
  const maximumBlockMinutes = task.maximumBlockMinutes ?? remaining;
  const preferredBlockMinutes = task.preferredBlockMinutes ?? maximumBlockMinutes;

  while (remaining > 0) {
    const duration = Math.min(maximumBlockMinutes, preferredBlockMinutes, remaining);
    const finalBlockCanBeShort = remaining <= minimumBlockMinutes;
    const requestedDuration = finalBlockCanBeShort
      ? remaining
      : Math.max(duration, minimumBlockMinutes);
    const slot = findSlot(
      workingWindows,
      tentativeBusyBlocks,
      requestedDuration,
      taskEarliest,
      taskLatest,
      task.preferredDayparts
    );
    if (!slot) return null;
    const block = toTimeBlock(
      task,
      input,
      slot.start,
      slot.end,
      blocks.length + 1
    );
    blocks.push(block);
    tentativeBusyBlocks.push({ start: slot.start, end: slot.end });
    tentativeBusyBlocks.sort(compareBusyBlocks);
    remaining -= requestedDuration;
  }

  return blocks;
};

const findSlot = (
  workingWindows: BusyBlock[],
  busyBlocks: BusyBlock[],
  durationMinutes: number,
  earliest: Date,
  latest: Date,
  preferredDayparts: SchedulingTask["preferredDayparts"] = []
): BusyBlock | null => {
  const durationMs = durationMinutes * 60_000;
  const candidateSlots: BusyBlock[] = [];

  for (const window of workingWindows) {
    let cursor = maxDate(window.start, earliest);
    const windowEnd = minDate(window.end, latest);
    if (cursor >= windowEnd) continue;

    for (const busy of busyBlocks) {
      if (busy.end <= cursor || busy.start >= windowEnd) continue;
      if (cursor.getTime() + durationMs <= busy.start.getTime()) {
        candidateSlots.push(
          ...buildCandidateSlots(cursor, busy.start, durationMs, preferredDayparts)
        );
      }
      if (busy.end > cursor) cursor = busy.end;
      if (cursor >= windowEnd) break;
    }

    if (cursor.getTime() + durationMs <= windowEnd.getTime()) {
      candidateSlots.push(
        ...buildCandidateSlots(cursor, windowEnd, durationMs, preferredDayparts)
      );
    }
  }

  return candidateSlots.sort((a, b) =>
    compareCandidateSlots(a, b, preferredDayparts)
  )[0] ?? null;
};

const buildCandidateSlots = (
  gapStart: Date,
  gapEnd: Date,
  durationMs: number,
  preferredDayparts: SchedulingTask["preferredDayparts"]
): BusyBlock[] => {
  const candidates: BusyBlock[] = [
    { start: gapStart, end: new Date(gapStart.getTime() + durationMs) }
  ];

  for (const daypart of preferredDayparts ?? []) {
    const preferredStart = maxDate(gapStart, daypartStart(gapStart, daypart));
    if (preferredStart.getTime() + durationMs <= gapEnd.getTime()) {
      candidates.push({
        start: preferredStart,
        end: new Date(preferredStart.getTime() + durationMs)
      });
    }
  }

  return dedupeSlots(candidates).filter((slot) => slot.end <= gapEnd);
};

const compareCandidateSlots = (
  a: BusyBlock,
  b: BusyBlock,
  preferredDayparts: SchedulingTask["preferredDayparts"]
): number => {
  const aPreferred = matchesPreferredDaypart(a, preferredDayparts);
  const bPreferred = matchesPreferredDaypart(b, preferredDayparts);
  if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
  return a.start.getTime() - b.start.getTime();
};

const matchesPreferredDaypart = (
  slot: BusyBlock,
  preferredDayparts: SchedulingTask["preferredDayparts"]
): boolean => {
  if (!preferredDayparts || preferredDayparts.length === 0) return false;
  return preferredDayparts.some((daypart) => {
    const start = daypartStart(slot.start, daypart);
    const end = daypartEnd(slot.start, daypart);
    return slot.start >= start && slot.end <= end;
  });
};

const daypartStart = (
  date: Date,
  daypart: NonNullable<SchedulingTask["preferredDayparts"]>[number]
): Date => {
  const hour = daypart === "MORNING" ? 9 : daypart === "AFTERNOON" ? 12 : 17;
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    0,
    0,
    0
  ));
};

const daypartEnd = (
  date: Date,
  daypart: NonNullable<SchedulingTask["preferredDayparts"]>[number]
): Date => {
  const hour = daypart === "MORNING" ? 12 : daypart === "AFTERNOON" ? 17 : 21;
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    0,
    0,
    0
  ));
};

const dedupeSlots = (slots: BusyBlock[]): BusyBlock[] => {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.start.toISOString()}-${slot.end.toISOString()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildWorkingWindows = (
  workingHours: WorkingHours,
  rangeStart: Date,
  rangeEnd: Date
): BusyBlock[] => {
  const windows: BusyBlock[] = [];
  for (const localDate of enumerateLocalDates(
    workingHours.timezone,
    rangeStart,
    rangeEnd
  )) {
    const localWeekday = new Date(Date.UTC(
      localDate.year,
      localDate.month - 1,
      localDate.day
    )).getUTCDay();
    if (workingHours.daysOfWeek.includes(localWeekday)) {
      const start = localTimeToUtc(
        localDate,
        workingHours.startTime,
        workingHours.timezone
      );
      const end = localTimeToUtc(
        localDate,
        workingHours.endTime,
        workingHours.timezone
      );
      const clippedStart = maxDate(start, rangeStart);
      const clippedEnd = minDate(end, rangeEnd);
      if (clippedStart < clippedEnd) {
        windows.push(
          ...subtractBreakWindows(
            { start: clippedStart, end: clippedEnd },
            workingHours,
            localDate
          )
        );
      }
    }
  }

  return windows;
};

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

const enumerateLocalDates = (
  timezone: string,
  rangeStart: Date,
  rangeEnd: Date
): LocalDate[] => {
  const datesByKey = new Map<string, LocalDate>();
  const cursor = new Date(rangeStart.getTime() - 36 * 60 * 60_000);
  const end = new Date(rangeEnd.getTime() + 36 * 60 * 60_000);

  while (cursor <= end) {
    const localDate = getLocalDate(cursor, timezone);
    datesByKey.set(localDateKey(localDate), localDate);
    cursor.setUTCHours(cursor.getUTCHours() + 6);
  }

  return [...datesByKey.values()].sort((a, b) =>
    Date.UTC(a.year, a.month - 1, a.day) -
    Date.UTC(b.year, b.month - 1, b.day)
  );
};

const localTimeToUtc = (
  localDate: LocalDate,
  time: string,
  timezone: string
): Date => {
  const [hour, minute] = parseTime(time);
  let candidate = new Date(Date.UTC(
    localDate.year,
    localDate.month - 1,
    localDate.day,
    hour,
    minute,
    0,
    0
  ));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getLocalDateTime(candidate, timezone);
    const desiredAsUtc = Date.UTC(
      localDate.year,
      localDate.month - 1,
      localDate.day,
      hour,
      minute
    );
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute
    );
    const deltaMs = desiredAsUtc - actualAsUtc;
    if (deltaMs === 0) return candidate;
    candidate = new Date(candidate.getTime() + deltaMs);
  }

  return candidate;
};

const getLocalDate = (date: Date, timezone: string): LocalDate => {
  const parts = getLocalDateTime(date, timezone);
  return { year: parts.year, month: parts.month, day: parts.day };
};

const getLocalDateTime = (
  date: Date,
  timezone: string
): LocalDate & { hour: number; minute: number } => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((item) => item.type === type);
    if (!part) throw new Error(`Missing ${type} time-zone part.`);
    return Number(part.value);
  };

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: normalizeHour(value("hour")),
    minute: value("minute")
  };
};

const normalizeHour = (hour: number): number => hour === 24 ? 0 : hour;

const localDateKey = (localDate: LocalDate): string =>
  `${localDate.year}-${localDate.month}-${localDate.day}`;

const subtractBreakWindows = (
  window: BusyBlock,
  workingHours: WorkingHours,
  localDate: LocalDate
): BusyBlock[] => {
  let availableWindows: BusyBlock[] = [window];

  for (const breakWindow of workingHours.breakWindows ?? []) {
    const breakBlock = {
      start: localTimeToUtc(
        localDate,
        breakWindow.startTime,
        workingHours.timezone
      ),
      end: localTimeToUtc(localDate, breakWindow.endTime, workingHours.timezone)
    };

    availableWindows = availableWindows.flatMap((availableWindow) =>
      subtractBusyBlock(availableWindow, breakBlock)
    );
  }

  return availableWindows;
};

const subtractBusyBlock = (
  window: BusyBlock,
  busyBlock: BusyBlock
): BusyBlock[] => {
  if (busyBlock.end <= window.start || busyBlock.start >= window.end) {
    return [window];
  }

  const remaining: BusyBlock[] = [];
  if (busyBlock.start > window.start) {
    remaining.push({ start: window.start, end: minDate(busyBlock.start, window.end) });
  }
  if (busyBlock.end < window.end) {
    remaining.push({ start: maxDate(busyBlock.end, window.start), end: window.end });
  }
  return remaining.filter((item) => item.start < item.end);
};

const eventToBusyBlock = (event: CalendarEvent): BusyBlock[] => {
  if (event.status === "CANCELLED" || event.busyStatus === "FREE") return [];
  const start = new Date(
    parseIso(event.start, "event.start").getTime() -
      ((event.bufferBeforeMinutes ?? 0) + (event.travelBeforeMinutes ?? 0)) * 60_000
  );
  const end = new Date(
    parseIso(event.end, "event.end").getTime() +
      ((event.bufferAfterMinutes ?? 0) + (event.travelAfterMinutes ?? 0)) * 60_000
  );
  return [{ start, end }];
};

const timeBlockToBusyBlock = (block: TimeBlock): BusyBlock => ({
  start: parseIso(block.start, "block.start"),
  end: parseIso(block.end, "block.end")
});

const toTimeBlock = (
  task: SchedulingTask,
  input: CreateScheduleInput,
  start: Date,
  end: Date,
  sequence: number
): TimeBlock => ({
  id: `block_${task.id}_${sequence}`,
  taskId: task.id,
  tenantId: input.tenantId,
  workspaceId: input.workspaceId,
  userId: input.userId,
  start: start.toISOString(),
  end: end.toISOString(),
  status: "PROPOSED",
  locked: false
});

const getInvalidReason = (
  task: SchedulingTask,
  input: CreateScheduleInput
): string | null => {
  if (
    task.tenantId !== input.tenantId ||
    task.workspaceId !== input.workspaceId ||
    task.userId !== input.userId
  ) {
    return "WRONG_SCOPE";
  }
  if (!task.schedulingEligible) return "SCHEDULING_INELIGIBLE";
  if (task.blocked) return "BLOCKED";
  if (task.waiting) return "WAITING";
  if (task.schedulingMode === "DO_NOT_SCHEDULE") return "DO_NOT_SCHEDULE";
  if (task.remainingDurationMinutes <= 0 || task.estimatedDurationMinutes <= 0) {
    return "INVALID_DURATION";
  }
  if (!task.deadline && task.schedulingMode === "DEADLINE_DRIVEN") {
    return "MISSING_DEADLINE";
  }
  if (!task.splittable && task.minimumBlockMinutes && task.remainingDurationMinutes < task.minimumBlockMinutes) {
    return "INVALID_MINIMUM_BLOCK";
  }
  return null;
};

const addUnscheduledExplanation = (
  task: SchedulingTask,
  reason: string,
  explanations: SchedulingExplanation[],
  extra: Record<string, string | number | boolean | string[]> = {}
): void => {
  explanations.push({
    type: "TASK_UNSCHEDULED",
    taskId: task.id,
    message: `${task.title} could not be scheduled because ${reason}.`,
    evidence: {
      reason,
      requiredMinutes: task.remainingDurationMinutes,
      ...extra
    }
  });
};

const orderTasksForScheduling = (tasks: SchedulingTask[]): SchedulingTask[] => {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const baseOrder = [...tasks].sort(compareTasks);
  const ordered: SchedulingTask[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (task: SchedulingTask): void => {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) {
      return;
    }

    visiting.add(task.id);
    for (const dependencyId of task.dependencies ?? []) {
      const dependency = tasksById.get(dependencyId);
      if (dependency) visit(dependency);
    }
    visiting.delete(task.id);
    visited.add(task.id);
    ordered.push(task);
  };

  for (const task of baseOrder) visit(task);

  return ordered;
};

const calculateAvailableMinutes = (
  workingWindows: BusyBlock[],
  busyBlocks: BusyBlock[]
): number => {
  let total = 0;
  for (const window of workingWindows) {
    let cursor = window.start;
    for (const busy of [...busyBlocks].sort(compareBusyBlocks)) {
      if (busy.end <= cursor || busy.start >= window.end) continue;
      if (busy.start > cursor) {
        total += (busy.start.getTime() - cursor.getTime()) / 60_000;
      }
      if (busy.end > cursor) cursor = busy.end;
    }
    if (cursor < window.end) {
      total += (window.end.getTime() - cursor.getTime()) / 60_000;
    }
  }
  return Math.max(0, total);
};

const classifyDeadlineFailure = (
  task: SchedulingTask,
  workingWindows: BusyBlock[],
  busyBlocks: BusyBlock[]
): "DEADLINE_AT_RISK" | "NO_CONTIGUOUS_SLOT" => {
  if (!task.deadline) return "NO_CONTIGUOUS_SLOT";
  const deadline = parseIso(task.deadline, "task.deadline");
  const minutesBeforeDeadline = calculateAvailableMinutes(
    workingWindows.map((window) => ({
      start: window.start,
      end: minDate(window.end, deadline)
    })).filter((window) => window.start < window.end),
    busyBlocks
  );
  return minutesBeforeDeadline < task.remainingDurationMinutes
    ? "DEADLINE_AT_RISK"
    : "NO_CONTIGUOUS_SLOT";
};

const compareTasks = (a: SchedulingTask, b: SchedulingTask): number => {
  const priority = priorityWeight(a.priority) - priorityWeight(b.priority);
  if (priority !== 0) return priority;
  const deadlineA = a.deadline ? parseIso(a.deadline, "task.deadline").getTime() : Number.MAX_SAFE_INTEGER;
  const deadlineB = b.deadline ? parseIso(b.deadline, "task.deadline").getTime() : Number.MAX_SAFE_INTEGER;
  if (deadlineA !== deadlineB) return deadlineA - deadlineB;
  return parseIso(a.createdAt, "task.createdAt").getTime() - parseIso(b.createdAt, "task.createdAt").getTime();
};

const priorityWeight = (priority: SchedulingTask["priority"]): number => {
  switch (priority) {
    case "URGENT":
      return 0;
    case "HIGH":
      return 1;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 3;
  }
};

const parseIso = (value: string, field: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date for ${field}`);
  }
  return date;
};

const parseTime = (value: string): [number, number] => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  return [hour, minute];
};

const compareBusyBlocks = (a: BusyBlock, b: BusyBlock): number =>
  a.start.getTime() - b.start.getTime();

const maxDate = (a: Date, b: Date): Date => (a > b ? a : b);
const minDate = (a: Date, b: Date): Date => (a < b ? a : b);
