import type {
  BusyStatus,
  CalendarEvent,
  CalendarStatus,
  PrivacyLevel,
  SchedulingTask,
  TimeBlock
} from "./domain.js";

export interface IcsImportScope {
  tenantId: string;
  workspaceId: string;
  userId: string;
  calendarId: string;
}

export interface IcsParseOptions {
  recurrenceRangeStart?: string;
  recurrenceRangeEnd?: string;
  maxOccurrencesPerEvent?: number;
}

export interface IcsExportOptions {
  productId?: string;
  calendarName?: string;
  redactPrivateTitles?: boolean;
}

export interface ScheduleBlockIcsExportOptions extends IcsExportOptions {
  calendarId: string;
}

export interface IcsCalendarEventImportResult {
  events: CalendarEvent[];
  cancelledEventIds: string[];
  cancelledEvents: CalendarEvent[];
}

interface IcsProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

export const parseIcsCalendarEvents = (
  icsText: string,
  scope: IcsImportScope,
  options: IcsParseOptions = {}
): CalendarEvent[] => parseIcsCalendarEventImport(icsText, scope, options).events;

export const parseIcsCalendarEventImport = (
  icsText: string,
  scope: IcsImportScope,
  options: IcsParseOptions = {}
): IcsCalendarEventImportResult => {
  const properties = parseProperties(icsText);
  const events: IcsProperty[][] = [];
  let current: IcsProperty[] | null = null;

  for (const property of properties) {
    if (property.name === "BEGIN" && property.value.toUpperCase() === "VEVENT") {
      current = [];
      continue;
    }

    if (property.name === "END" && property.value.toUpperCase() === "VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }

    if (current) current.push(property);
  }

  const recurrenceExceptions = recurrenceExceptionsByUid(events, scope);
  const cancelledEventIds: string[] = [];
  const cancelledEvents: CalendarEvent[] = [];

  const expandedEvents = events.flatMap((eventProperties, index) => {
    if (getProperty(eventProperties, "RECURRENCE-ID")) return [];
    const event = eventFromProperties(eventProperties, scope, index);
    const expandedEvents = expandRecurringEvent(event, eventProperties, options);
    const exceptions = recurrenceExceptions.get(event.externalId ?? event.id);
    if (!exceptions) return expandedEvents;
    return expandedEvents.flatMap((expandedEvent) => {
      const occurrenceKey = occurrenceKeyFromExternalId(expandedEvent);
      if (!occurrenceKey || !exceptions.has(occurrenceKey)) return [expandedEvent];
      const exception = exceptions.get(occurrenceKey);
      if (exception) return [exception];
      cancelledEventIds.push(expandedEvent.id);
      cancelledEvents.push({
        ...expandedEvent,
        title: "Busy",
        status: "CANCELLED"
      });
      return [];
    });
  });

  return { events: expandedEvents, cancelledEventIds, cancelledEvents };
};

export const exportCalendarEventsToIcs = (
  events: CalendarEvent[],
  options: IcsExportOptions = {}
): string => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeText(options.productId ?? "-//ScheduleOS//EN")}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  if (options.calendarName) {
    lines.push(`X-WR-CALNAME:${escapeText(options.calendarName)}`);
  }

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(event.externalId ?? event.id)}`,
      `SUMMARY:${escapeText(summaryForEvent(event, options))}`,
      formatDateProperty("DTSTART", event.start, event.allDay),
      formatDateProperty("DTEND", event.end, event.allDay),
      `STATUS:${event.status}`,
      `TRANSP:${event.busyStatus === "FREE" ? "TRANSPARENT" : "OPAQUE"}`,
      `CLASS:${privacyToClass(event.privacyLevel)}`,
      `X-SCHEDULEOS-TENANT:${escapeText(event.tenantId)}`,
      `X-SCHEDULEOS-USER:${escapeText(event.userId)}`,
      `X-SCHEDULEOS-CALENDAR:${escapeText(event.calendarId)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
};

export const exportScheduleBlocksToIcs = (
  blocks: TimeBlock[],
  tasks: SchedulingTask[],
  options: ScheduleBlockIcsExportOptions
): string => {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const acceptedBlocks = blocks.filter(
    (block) => block.status === "ACCEPTED" || block.status === "LOCKED"
  );
  const events = acceptedBlocks.map((block) =>
    calendarEventFromBlock(block, tasksById.get(block.taskId), options.calendarId)
  );
  return exportCalendarEventsToIcs(events, {
    ...options,
    redactPrivateTitles: options.redactPrivateTitles ?? false
  });
};

const summaryForEvent = (
  event: CalendarEvent,
  options: IcsExportOptions
): string => {
  if (options.redactPrivateTitles === false) return event.title;
  if (
    event.privacyLevel === "PRIVATE" ||
    event.privacyLevel === "CONFIDENTIAL" ||
    event.privacyLevel === "BUSY_ONLY"
  ) {
    return "Busy";
  }
  return event.title;
};

const parseProperties = (icsText: string): IcsProperty[] =>
  unfoldLines(icsText)
    .filter((line) => line.trim().length > 0)
    .map(parseProperty);

const unfoldLines = (icsText: string): string[] => {
  const rawLines = icsText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];

  for (const rawLine of rawLines) {
    if (/^[ \t]/.test(rawLine) && lines.length > 0) {
      lines[lines.length - 1] += rawLine.slice(1);
    } else {
      lines.push(rawLine);
    }
  }

  return lines;
};

const parseProperty = (line: string): IcsProperty => {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) {
    throw new Error(`Invalid ICS property missing colon: ${line}`);
  }

  const head = line.slice(0, separatorIndex);
  const value = unescapeText(line.slice(separatorIndex + 1));
  const [rawName, ...rawParams] = head.split(";");
  const params: Record<string, string> = {};
  if (!rawName) throw new Error(`Invalid ICS property missing name: ${line}`);

  for (const rawParam of rawParams) {
    const equalsIndex = rawParam.indexOf("=");
    if (equalsIndex < 0) continue;
    params[rawParam.slice(0, equalsIndex).toUpperCase()] = rawParam.slice(
      equalsIndex + 1
    );
  }

  return { name: rawName.toUpperCase(), params, value };
};

const eventFromProperties = (
  properties: IcsProperty[],
  scope: IcsImportScope,
  index: number
): CalendarEvent => {
  const uid = getValue(properties, "UID") ?? `generated_${index + 1}`;
  const startProperty = getProperty(properties, "DTSTART");
  const endProperty = getProperty(properties, "DTEND");
  const durationProperty = getProperty(properties, "DURATION");

  if (!startProperty || (!endProperty && !durationProperty)) {
    throw new Error(`ICS event ${uid} must include DTSTART and DTEND or DURATION.`);
  }

const allDay =
startProperty.params.VALUE?.toUpperCase() === "DATE" ||
endProperty?.params.VALUE?.toUpperCase() === "DATE";
const timezone = startProperty.params.TZID ?? "UTC";
const start = parseIcsDate(startProperty.value, allDay, timezone);
const end = endProperty
? parseIcsDate(endProperty.value, allDay, endProperty.params.TZID ?? timezone)
: addDuration(start, durationProperty?.value ?? "");

  return {
    id: `ics_${sanitizeId(uid)}`,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    userId: scope.userId,
    calendarId: scope.calendarId,
    title: getValue(properties, "SUMMARY") ?? "Busy",
    start,
    end,
    timezone,
    allDay,
    status: parseStatus(getValue(properties, "STATUS")),
    busyStatus: parseBusyStatus(getValue(properties, "TRANSP")),
    movable: false,
    locked: true,
    privacyLevel: parsePrivacyLevel(getValue(properties, "CLASS")),
    version: 1,
    sourceSystem: "ICS",
    externalId: uid
  };
};

const addDuration = (start: string, duration: string): string => {
  const durationMs = parseIcsDuration(duration);
  return new Date(new Date(start).getTime() + durationMs).toISOString();
};

const recurrenceExceptionsByUid = (
  events: IcsProperty[][],
  scope: IcsImportScope
): Map<string, Map<string, CalendarEvent | null>> => {
  const exceptionsByUid = new Map<string, Map<string, CalendarEvent | null>>();
  events.forEach((properties, index) => {
    const recurrenceIdProperty = getProperty(properties, "RECURRENCE-ID");
    if (!recurrenceIdProperty) return;

    const uid = getValue(properties, "UID") ?? `generated_${index + 1}`;
    const overrideEvent = eventFromProperties(properties, scope, index);
    const recurrenceIdAllDay =
      recurrenceIdProperty.params.VALUE?.toUpperCase() === "DATE" || overrideEvent.allDay;
    const recurrenceIdStart = new Date(
      parseIcsDate(
        recurrenceIdProperty.value,
        recurrenceIdAllDay,
        recurrenceIdProperty.params.TZID ?? overrideEvent.timezone
      )
    );
    const occurrenceKey = formatOccurrenceKey(recurrenceIdStart);
    const exceptions =
      exceptionsByUid.get(uid) ?? new Map<string, CalendarEvent | null>();
    exceptions.set(
      occurrenceKey,
      overrideEvent.status === "CANCELLED"
        ? null
        : eventForOccurrence(
            overrideEvent,
            new Date(overrideEvent.start),
            new Date(overrideEvent.end),
            occurrenceKey
          )
    );
    exceptionsByUid.set(uid, exceptions);
  });
  return exceptionsByUid;
};

const parseIcsDuration = (value: string): number => {
  const match = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value
  );
  if (!match) throw new Error(`Invalid ICS duration: ${value}`);

  const [, weeks = "0", days = "0", hours = "0", minutes = "0", seconds = "0"] =
    match;
  const durationMs =
    (((Number(weeks) * 7 + Number(days)) * 24 + Number(hours)) * 60 +
      Number(minutes)) *
      60 *
      1000 +
    Number(seconds) * 1000;

  if (durationMs <= 0) throw new Error(`Invalid ICS duration: ${value}`);
  return durationMs;
};

interface RecurrenceRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count?: number;
  until?: string;
  byDays?: RecurrenceByDay[];
  byMonthDays?: number[];
  byMonths?: number[];
  byYearDays?: number[];
  byWeekNumbers?: number[];
  byHours?: number[];
 byMinutes?: number[];
 bySeconds?: number[];
  bySetPositions?: number[];
  weekStart?: number;
}

interface RecurrenceByDay {
  weekday: number;
  ordinal?: number;
}

interface IcsOccurrenceCandidate {
  start: Date;
  durationMs?: number;
}

interface IcsLocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}

interface IcsExclusionMatcher {
  exactStarts: Set<string>;
  wholeUtcDates: Set<string>;
}

const expandRecurringEvent = (
  event: CalendarEvent,
  properties: IcsProperty[],
  options: IcsParseOptions
): CalendarEvent[] => {
  const rule = parseRecurrenceRule(getValue(properties, "RRULE"));
  const rdateOccurrences = additionalOccurrences(properties, event.allDay);
  if (
    (!rule && rdateOccurrences.length === 0) ||
    !options.recurrenceRangeStart ||
    !options.recurrenceRangeEnd
  ) {
    return [event];
  }

  const rangeStart = new Date(options.recurrenceRangeStart);
  const rangeEnd = new Date(options.recurrenceRangeEnd);
  if (!isValidDate(rangeStart) || !isValidDate(rangeEnd) || rangeEnd <= rangeStart) {
    throw new Error("ICS recurrence range must include valid start and end dates.");
  }

  const maxOccurrences = options.maxOccurrencesPerEvent ?? 366;
  const start = new Date(event.start);
 const end = new Date(event.end);
 const durationMs = end.getTime() - start.getTime();
 const occurrences: CalendarEvent[] = [];
 const exclusions = excludedOccurrenceMatcher(properties, event.allDay);
  const occurrenceCandidates: IcsOccurrenceCandidate[] = rule ? [] : [{ start }];

  if (rule) {
    let generatedCount = 0;
    for (const occurrenceStart of recurrenceStarts(start, rule, maxOccurrences, properties, event.allDay)) {
      if (rule.count && generatedCount >= rule.count) break;
      generatedCount += 1;
      if (rule.until && occurrenceStart.getTime() > new Date(rule.until).getTime()) break;
      occurrenceCandidates.push({ start: occurrenceStart });
    }
  }

  for (const occurrence of sortUniqueOccurrences([
    ...occurrenceCandidates,
    ...rdateOccurrences
  ])) {
    const occurrenceStart = occurrence.start;
 const occurrenceEnd = new Date(
 occurrenceStart.getTime() + (occurrence.durationMs ?? durationMs)
 );
 if (
 !isOccurrenceExcluded(exclusions, occurrenceStart) &&
 occurrenceEnd > rangeStart &&
      occurrenceStart < rangeEnd
    ) {
      occurrences.push(eventForOccurrence(event, occurrenceStart, occurrenceEnd));
    }
    if (occurrenceStart >= rangeEnd && occurrenceEnd >= rangeEnd) break;
  }

  return occurrences;
};

const parseRecurrenceRule = (value: string | undefined): RecurrenceRule | undefined => {
  if (!value) return undefined;

  const parts = Object.fromEntries(
    value.split(";").flatMap((part) => {
      const [key, rawValue = ""] = part.split("=");
      return key ? [[key.toUpperCase(), rawValue.toUpperCase()]] : [];
    })
  ) as Record<string, string>;
  if (parts.FREQ !== "DAILY" && parts.FREQ !== "WEEKLY" && parts.FREQ !== "MONTHLY" && parts.FREQ !== "YEARLY") return undefined;

  const interval = Number(parts.INTERVAL ?? "1");
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error(`Invalid ICS RRULE INTERVAL: ${parts.INTERVAL}`);
  }

  const count = parts.COUNT ? Number(parts.COUNT) : undefined;
  if (count !== undefined && (!Number.isInteger(count) || count < 1)) {
    throw new Error(`Invalid ICS RRULE COUNT: ${parts.COUNT}`);
  }

  const rule: RecurrenceRule = {
    freq: parts.FREQ,
    interval
  };
  if (count !== undefined) rule.count = count;
  const byDays = parseByDays(parts.BYDAY);
  if (byDays) rule.byDays = byDays;
  const byMonthDays = parseByMonthDays(parts.BYMONTHDAY);
  if (byMonthDays) rule.byMonthDays = byMonthDays;
  const byMonths = parseByMonths(parts.BYMONTH);
  if (byMonths) rule.byMonths = byMonths;
  const byHours = parseByHours(parts.BYHOUR);
  if (byHours) {
    if (parts.FREQ !== "DAILY" && parts.FREQ !== "WEEKLY" && parts.FREQ !== "MONTHLY" && parts.FREQ !== "YEARLY") {
      throw new Error(
        "ICS RRULE BYHOUR currently supported only for DAILY, WEEKLY, MONTHLY, or YEARLY recurrence."
      );
    }
    rule.byHours = byHours;
  }
  const byMinutes = parseByMinutes(parts.BYMINUTE);
  if (byMinutes) {
    if (parts.FREQ !== "DAILY" && parts.FREQ !== "WEEKLY" && parts.FREQ !== "MONTHLY" && parts.FREQ !== "YEARLY") {
      throw new Error(
        "ICS RRULE BYMINUTE currently supported only for DAILY, WEEKLY, MONTHLY, or YEARLY recurrence."
      );
    }
    rule.byMinutes = byMinutes;
  }
  const bySeconds = parseBySeconds(parts.BYSECOND);
  if (bySeconds) {
    if (parts.FREQ !== "DAILY" && parts.FREQ !== "WEEKLY" && parts.FREQ !== "MONTHLY" && parts.FREQ !== "YEARLY") {
      throw new Error(
        "ICS RRULE BYSECOND currently supported only for DAILY, WEEKLY, MONTHLY, or YEARLY recurrence."
      );
    }
    rule.bySeconds = bySeconds;
  }
 const byYearDays = parseByYearDays(parts.BYYEARDAY);
  if (byYearDays) {
    if (parts.FREQ !== "YEARLY") {
      throw new Error(
        "ICS RRULE BYYEARDAY is currently supported only for YEARLY recurrence."
      );
    }
    rule.byYearDays = byYearDays;
  }
  const byWeekNumbers = parseByWeekNumbers(parts.BYWEEKNO);
  if (byWeekNumbers) {
    if (parts.FREQ !== "YEARLY") {
      throw new Error(
        "ICS RRULE BYWEEKNO is currently supported only for YEARLY recurrence."
      );
    }
    rule.byWeekNumbers = byWeekNumbers;
  }
  const bySetPositions = parseBySetPositions(parts.BYSETPOS);
  if (bySetPositions) rule.bySetPositions = bySetPositions;
  const weekStart = parseWeekStart(parts.WKST);
  if (weekStart !== undefined) rule.weekStart = weekStart;
  if (parts.UNTIL) rule.until = parseRecurrenceUntil(parts.UNTIL);
  return rule;
};

const hasOrdinalByDays = (rule: RecurrenceRule): boolean =>
  rule.byDays?.some((byDay) => byDay.ordinal !== undefined) ?? false;

const supportsMonthlyByDayZonedWallTime = (rule: RecurrenceRule): boolean =>
  rule.freq === "MONTHLY" &&
  !!rule.byDays?.length &&
  !rule.byMonthDays?.length &&
  !rule.bySetPositions?.length;

const supportsYearlyByDayZonedWallTime = (rule: RecurrenceRule): boolean =>
 rule.freq === "YEARLY" &&
 !!rule.byDays?.length &&
 !rule.byMonthDays?.length &&
 !rule.byYearDays?.length &&
 !rule.byWeekNumbers?.length &&
 !rule.bySetPositions?.length;

const supportsYearlyByYearDayZonedWallTime = (rule: RecurrenceRule): boolean =>
 rule.freq === "YEARLY" &&
 !!rule.byYearDays?.length &&
 !rule.byDays?.length &&
 !rule.byMonthDays?.length &&
 !rule.byWeekNumbers?.length &&
 !rule.bySetPositions?.length;

const supportsYearlyByWeekNumberZonedWallTime = (rule: RecurrenceRule): boolean =>
 rule.freq === "YEARLY" &&
 !!rule.byWeekNumbers?.length &&
 !rule.byDays?.some((byDay) => byDay.ordinal !== undefined) &&
 !rule.byMonthDays?.length &&
 !rule.byYearDays?.length &&
 !rule.bySetPositions?.length;

const supportsDailyTimeZonedWallTime = (rule: RecurrenceRule): boolean =>
  rule.freq === "DAILY" &&
  (!!rule.byHours?.length || !!rule.byMinutes?.length || !!rule.bySeconds?.length) &&
  !rule.byDays?.length &&
  !rule.byMonthDays?.length &&
  !rule.byMonths?.length;

const supportsWeeklyTimeZonedWallTime = (rule: RecurrenceRule): boolean =>
  rule.freq === "WEEKLY" &&
  !!rule.byDays?.length &&
  (!!rule.byHours?.length || !!rule.byMinutes?.length || !!rule.bySeconds?.length) &&
  !rule.byDays.some((byDay) => byDay.ordinal !== undefined) &&
  !rule.byMonthDays?.length &&
  !rule.byMonths?.length;

const supportsMonthlyTimeZonedWallTime = (rule: RecurrenceRule): boolean =>
  rule.freq === "MONTHLY" &&
  !!rule.byMonthDays?.length &&
  (!!rule.byHours?.length || !!rule.byMinutes?.length || !!rule.bySeconds?.length) &&
  !rule.byDays?.length &&
  !rule.byMonths?.length;

const supportsYearlyTimeZonedWallTime = (rule: RecurrenceRule): boolean =>
  rule.freq === "YEARLY" &&
  !!rule.byMonths?.length &&
  !!rule.byMonthDays?.length &&
(!!rule.byHours?.length || !!rule.byMinutes?.length || !!rule.bySeconds?.length) &&
!rule.byDays?.length &&
!rule.byYearDays?.length &&
!rule.byWeekNumbers?.length;

const localDateTimeStart = (
  properties: IcsProperty[],
  allDay: boolean
): IcsLocalDateTime | undefined => {
  if (allDay) return undefined;
  const property = getProperty(properties, "DTSTART");
  const timezone = property?.params.TZID;
  if (!property || !timezone || timezone === "UTC" || property.value.endsWith("Z")) {
    return undefined;
  }

  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(property.value);
  if (!match) return undefined;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6]),
    timezone
  };
};

const zonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
  if (rule.freq === "WEEKLY" && rule.byDays?.length) {
    yield* weeklyByDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
    return;
  }

  if (supportsYearlyByDayZonedWallTime(rule)) {
 yield* yearlyByDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
 return;
 }

 if (supportsYearlyByYearDayZonedWallTime(rule)) {
 yield* yearlyByYearDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
 return;
 }

 if (supportsYearlyByWeekNumberZonedWallTime(rule)) {
 yield* yearlyByWeekNumberZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
 return;
 }

 if (rule.freq === "YEARLY" && (rule.byMonthDays?.length || rule.byMonths?.length)) {
 yield* yearlyByMonthDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
 return;
 }

  if (rule.freq === "MONTHLY" && rule.byMonthDays?.length) {
    yield* monthlyByMonthDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
    return;
  }

  if (supportsMonthlyByDayZonedWallTime(rule)) {
    yield* monthlyByDayZonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
    return;
  }

  const weekdays = rule.byDays?.length
    ? new Set(rule.byDays.map((day) => day.weekday))
    : undefined;
  let yielded = 0;
  const maxScannedOccurrences = maxOccurrences * 366;
  let localDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));

  for (let scanned = 0; yielded < maxOccurrences && scanned < maxScannedOccurrences; scanned += 1) {
    if (!weekdays || weekdays.has(weekdayNumberFromDate(localDate))) {
      yield new Date(
        zonedDateTimeToUtc(
          localDate.getUTCFullYear(),
          localDate.getUTCMonth() + 1,
          localDate.getUTCDate(),
          localStart.hour,
          localStart.minute,
          localStart.second,
          localStart.timezone
        )
      );
      yielded += 1;
    }
    localDate = advanceLocalRecurrenceDate(localDate, rule);
  }
};

const weeklyByDayZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
 const ruleWeekStart = rule.weekStart ?? 0;
 const monthFilter = rule.byMonths ? new Set(rule.byMonths) : undefined;
 const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));
 const weekStart = startOfUtcWeek(startLocalDate, ruleWeekStart);
  const weekDays = [...(rule.byDays ?? [])].sort(
    (left, right) =>
      relativeWeekdayOffset(left.weekday, ruleWeekStart) -
      relativeWeekdayOffset(right.weekday, ruleWeekStart)
  );
  let yielded = 0;
  const maxScannedWeeks = maxOccurrences * 366;

  for (
    let weekIndex = 0, scannedWeeks = 0;
    yielded < maxOccurrences && scannedWeeks < maxScannedWeeks;
    weekIndex += rule.interval, scannedWeeks += 1
  ) {
    for (const day of weekDays) {
      const localDate = new Date(
        Date.UTC(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth(),
          weekStart.getUTCDate() + weekIndex * 7 + relativeWeekdayOffset(day.weekday, ruleWeekStart)
        )
 );
 if (localDate < startLocalDate) continue;
 if (monthFilter && !monthFilter.has(localDate.getUTCMonth() + 1)) continue;

 yield new Date(
 zonedDateTimeToUtc(
          localDate.getUTCFullYear(),
          localDate.getUTCMonth() + 1,
          localDate.getUTCDate(),
          localStart.hour,
          localStart.minute,
          localStart.second,
          localStart.timezone
        )
      );
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const advanceLocalRecurrenceDate = (date: Date, rule: RecurrenceRule): Date => {
  if (rule.freq === "MONTHLY" || rule.freq === "YEARLY") {
    const targetMonthIndex = date.getUTCMonth() + (rule.freq === "MONTHLY" ? rule.interval : rule.interval * 12);
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const targetDay = Math.min(date.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));
    return new Date(Date.UTC(targetYear, targetMonth, targetDay));
  }

  const dayInterval = rule.freq === "WEEKLY" ? rule.interval * 7 : rule.interval;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + dayInterval)
  );
};

const monthlyByMonthDayZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
  const monthDays = rule.byMonthDays ?? [localStart.day];
  let yielded = 0;
  const maxScannedMonths = maxOccurrences * 366;
  const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));

  for (
    let monthOffset = 0, scanned = 0;
    yielded < maxOccurrences && scanned < maxScannedMonths;
    monthOffset += rule.interval, scanned += 1
  ) {
    const monthIndex = localStart.month - 1 + monthOffset;
    const year = localStart.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const daysInMonth = daysInUtcMonth(year, month);
    const candidateDays = monthDays
      .map((monthDay) => (monthDay > 0 ? monthDay : daysInMonth + monthDay + 1))
      .filter((monthDay) => monthDay >= 1 && monthDay <= daysInMonth)
      .sort((left, right) => left - right);

    for (const day of candidateDays) {
      const localDate = new Date(Date.UTC(year, month, day));
      if (localDate < startLocalDate) continue;
      yield new Date(
        zonedDateTimeToUtc(
          year,
          month + 1,
          day,
          localStart.hour,
          localStart.minute,
          localStart.second,
          localStart.timezone
        )
      );
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const monthlyByDayZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
  const byDays = rule.byDays ?? [];
  let yielded = 0;
  const maxScannedMonths = maxOccurrences * 366;
  const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));
  const midnight = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };

  for (
    let monthOffset = 0, scanned = 0;
    yielded < maxOccurrences && scanned < maxScannedMonths;
    monthOffset += rule.interval, scanned += 1
  ) {
    const monthIndex = localStart.month - 1 + monthOffset;
    const year = localStart.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const ordinalByDays = byDays.filter((byDay) => byDay.ordinal !== undefined);
    const plainByDays = byDays.filter((byDay) => byDay.ordinal === undefined);
    const candidateDates = ordinalByDays
      .map((byDay) =>
        utcDateForOrdinalWeekday(year, month, byDay.weekday, byDay.ordinal ?? 0, midnight)
      )
      .filter((candidate): candidate is Date => candidate !== undefined);

    if (plainByDays.length) {
      const weekdays = new Set(plainByDays.map((byDay) => byDay.weekday));
      const daysInMonth = daysInUtcMonth(year, month);
      for (let monthDay = 1; monthDay <= daysInMonth; monthDay += 1) {
        const localDate = new Date(Date.UTC(year, month, monthDay));
        if (weekdays.has(weekdayNumberFromDate(localDate))) {
          candidateDates.push(localDate);
        }
      }
    }

    for (const localDate of sortUniqueDates(candidateDates)) {
      if (localDate < startLocalDate) continue;
      yield new Date(
        zonedDateTimeToUtc(
          localDate.getUTCFullYear(),
          localDate.getUTCMonth() + 1,
          localDate.getUTCDate(),
          localStart.hour,
          localStart.minute,
          localStart.second,
          localStart.timezone
        )
      );
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const yearlyByDayZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
  const byDays = rule.byDays ?? [];
  const months = rule.byMonths ?? [localStart.month];
  let yielded = 0;
  const maxScannedYears = maxOccurrences * 366;
  const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));
  const midnight = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };

  for (
    let yearOffset = 0, scanned = 0;
    yielded < maxOccurrences && scanned < maxScannedYears;
    yearOffset += rule.interval, scanned += 1
  ) {
    const year = localStart.year + yearOffset;
    const ordinalByDays = byDays.filter((byDay) => byDay.ordinal !== undefined);
    const plainByDays = byDays.filter((byDay) => byDay.ordinal === undefined);
    const candidateDates = months.flatMap((monthNumber) => {
      const month = monthNumber - 1;
      const dates = ordinalByDays
        .map((byDay) =>
          utcDateForOrdinalWeekday(year, month, byDay.weekday, byDay.ordinal ?? 0, midnight)
        )
        .filter((candidate): candidate is Date => candidate !== undefined);

      if (plainByDays.length) {
        const weekdays = new Set(plainByDays.map((byDay) => byDay.weekday));
        const daysInMonth = daysInUtcMonth(year, month);
        for (let monthDay = 1; monthDay <= daysInMonth; monthDay += 1) {
          const localDate = new Date(Date.UTC(year, month, monthDay));
          if (weekdays.has(weekdayNumberFromDate(localDate))) {
            dates.push(localDate);
          }
        }
      }

      return dates;
    });

    for (const localDate of sortUniqueDates(candidateDates)) {
      if (localDate < startLocalDate) continue;
      yield new Date(
        zonedDateTimeToUtc(
          localDate.getUTCFullYear(),
          localDate.getUTCMonth() + 1,
          localDate.getUTCDate(),
          localStart.hour,
          localStart.minute,
          localStart.second,
          localStart.timezone
        )
      );
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
 }
};

const yearlyByYearDayZonedWallTimeRecurrenceStarts = function* (
 localStart: IcsLocalDateTime,
 rule: RecurrenceRule,
 maxOccurrences: number
): Generator<Date> {
 const yearDays = rule.byYearDays ?? [];
 const monthFilter = rule.byMonths ? new Set(rule.byMonths) : undefined;
 let yielded = 0;
 const maxScannedYears = maxOccurrences * 366;
 const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));

 for (
 let yearOffset = 0, scanned = 0;
 yielded < maxOccurrences && scanned < maxScannedYears;
 yearOffset += rule.interval, scanned += 1
 ) {
 const year = localStart.year + yearOffset;
 const daysInYear = daysInUtcYear(year);
 const candidateDates = yearDays
 .map((yearDay) => {
 const resolvedYearDay = yearDay < 0 ? daysInYear + yearDay + 1 : yearDay;
 if (resolvedYearDay < 1 || resolvedYearDay > daysInYear) return undefined;
 return new Date(Date.UTC(year, 0, resolvedYearDay));
 })
 .filter((candidate): candidate is Date => candidate !== undefined)
 .filter((candidate) => !monthFilter || monthFilter.has(candidate.getUTCMonth() + 1));

 for (const localDate of sortUniqueDates(candidateDates)) {
 if (localDate < startLocalDate) continue;
 yield new Date(
 zonedDateTimeToUtc(
 localDate.getUTCFullYear(),
 localDate.getUTCMonth() + 1,
 localDate.getUTCDate(),
 localStart.hour,
 localStart.minute,
 localStart.second,
 localStart.timezone
 )
 );
 yielded += 1;
 if (yielded >= maxOccurrences) return;
 }
 }
};

const yearlyByWeekNumberZonedWallTimeRecurrenceStarts = function* (
 localStart: IcsLocalDateTime,
 rule: RecurrenceRule,
 maxOccurrences: number
): Generator<Date> {
 const weekNumbers = rule.byWeekNumbers ?? [];
 const weekStart = rule.weekStart ?? 0;
 const weekdays = rule.byDays?.length
 ? rule.byDays.map((byDay) => byDay.weekday)
 : [weekdayNumberFromDate(new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day)))];
 const monthFilter = rule.byMonths ? new Set(rule.byMonths) : undefined;
 let yielded = 0;
 const maxScannedYears = maxOccurrences * 366;
 const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));
 const midnight = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };

 for (
 let yearOffset = 0, scanned = 0;
 yielded < maxOccurrences && scanned < maxScannedYears;
 yearOffset += rule.interval, scanned += 1
 ) {
 const year = localStart.year + yearOffset;
 const candidateDates = weekNumbers.flatMap((weekNumber) =>
 weekdays
 .map((weekday) => utcDateForYearWeekNumber(year, weekNumber, weekday, weekStart, midnight))
 .filter((candidate): candidate is Date => candidate !== undefined)
 .filter((candidate) => !monthFilter || monthFilter.has(candidate.getUTCMonth() + 1))
 );

 for (const localDate of sortUniqueDates(candidateDates)) {
 if (localDate < startLocalDate) continue;
 yield new Date(
 zonedDateTimeToUtc(
 localDate.getUTCFullYear(),
 localDate.getUTCMonth() + 1,
 localDate.getUTCDate(),
 localStart.hour,
 localStart.minute,
 localStart.second,
 localStart.timezone
 )
 );
 yielded += 1;
 if (yielded >= maxOccurrences) return;
 }
 }
};

const yearlyByMonthDayZonedWallTimeRecurrenceStarts = function* (
 localStart: IcsLocalDateTime,
 rule: RecurrenceRule,
 maxOccurrences: number
): Generator<Date> {
  const monthDays = rule.byMonthDays ?? [localStart.day];
  const months = rule.byMonths ?? [localStart.month];
  let yielded = 0;
  const maxScannedYears = maxOccurrences * 366;
  const startLocalDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day));

  for (
    let yearOffset = 0, scanned = 0;
    yielded < maxOccurrences && scanned < maxScannedYears;
    yearOffset += rule.interval, scanned += 1
  ) {
    const year = localStart.year + yearOffset;
    for (const monthNumber of months) {
      const month = monthNumber - 1;
      const daysInMonth = daysInUtcMonth(year, month);
      const candidateDays = monthDays
        .map((monthDay) => (monthDay > 0 ? monthDay : daysInMonth + monthDay + 1))
        .filter((monthDay) => monthDay >= 1 && monthDay <= daysInMonth)
        .sort((left, right) => left - right);

      for (const day of candidateDays) {
        const localDate = new Date(Date.UTC(year, month, day));
        if (localDate < startLocalDate) continue;
        yield new Date(
          zonedDateTimeToUtc(
            year,
            monthNumber,
            day,
            localStart.hour,
            localStart.minute,
            localStart.second,
            localStart.timezone
          )
        );
        yielded += 1;
        if (yielded >= maxOccurrences) return;
      }
    }
  }
};

const recurrenceStarts = function* (
  start: Date,
  rule: RecurrenceRule,
  maxOccurrences: number,
  properties: IcsProperty[] = [],
  allDay = false
): Generator<Date> {
 const localStart = localDateTimeStart(properties, allDay);
  if (localStart && supportsDailyTimeZonedWallTime(rule)) {
    yield* dailyTimeZonedWallTimeRecurrenceStarts(localStart, rule, start, maxOccurrences);
    return;
  }
  if (localStart && supportsWeeklyTimeZonedWallTime(rule)) {
    yield* weeklyTimeZonedWallTimeRecurrenceStarts(localStart, rule, start, maxOccurrences);
    return;
  }
  if (localStart && supportsMonthlyTimeZonedWallTime(rule)) {
    yield* monthlyTimeZonedWallTimeRecurrenceStarts(localStart, rule, start, maxOccurrences);
    return;
  }
  if (localStart && supportsYearlyTimeZonedWallTime(rule)) {
    yield* yearlyTimeZonedWallTimeRecurrenceStarts(localStart, rule, start, maxOccurrences);
    return;
  }

  if (
    localStart &&
    (rule.freq === "DAILY" || rule.freq === "WEEKLY" || rule.freq === "MONTHLY" || rule.freq === "YEARLY") &&
    !(rule.freq === "MONTHLY" && rule.byDays?.length && !supportsMonthlyByDayZonedWallTime(rule)) &&
    !rule.byHours?.length &&
 !rule.byMinutes?.length &&
 !rule.bySeconds?.length &&
 (!rule.byMonths?.length || rule.freq === "YEARLY" || (rule.freq === "WEEKLY" && !!rule.byDays?.length)) &&
 (!rule.byYearDays?.length || supportsYearlyByYearDayZonedWallTime(rule)) &&
 (!rule.byWeekNumbers?.length || supportsYearlyByWeekNumberZonedWallTime(rule)) &&
 (!hasOrdinalByDays(rule) ||
 supportsMonthlyByDayZonedWallTime(rule) ||
 supportsYearlyByDayZonedWallTime(rule)) &&
    !rule.bySetPositions?.length
  ) {
    yield* zonedWallTimeRecurrenceStarts(localStart, rule, maxOccurrences);
    return;
  }

  if (
    rule.freq === "DAILY" &&
    (rule.byHours?.length || rule.byMinutes?.length || rule.bySeconds?.length)
 ) {
    yield* dailyTimeRecurrenceStarts(start, rule, maxOccurrences);
    return;
  }

  if (
    rule.freq !== "WEEKLY" &&
    (rule.byMonthDays?.length ||
      rule.byMonths?.length ||
      rule.byYearDays?.length ||
      rule.byWeekNumbers?.length ||
      hasOrdinalByDays(rule) ||
      rule.bySetPositions?.length)
  ) {
    yield* filteredMonthRecurrenceStarts(start, rule, maxOccurrences);
    return;
  }

  if (rule.freq === "DAILY" && rule.byDays?.length) {
    const weekdays = new Set(rule.byDays.map((day) => day.weekday));
    let occurrenceStart = start;
    let yielded = 0;

    while (yielded < maxOccurrences) {
      if (weekdays.has(weekdayNumberFromDate(occurrenceStart))) {
        yield occurrenceStart;
        yielded += 1;
      }
      occurrenceStart = addRecurrenceInterval(occurrenceStart, rule);
    }
    return;
  }

  if (rule.freq !== "WEEKLY" || !rule.byDays?.length) {
    let occurrenceStart = start;
    for (let index = 0; index < maxOccurrences; index += 1) {
      yield occurrenceStart;
      occurrenceStart = addRecurrenceInterval(occurrenceStart, rule);
    }
    return;
  }

  const ruleWeekStart = rule.weekStart ?? 0;
  const weekStart = startOfUtcWeek(start, ruleWeekStart);
 const hours = rule.byHours ?? [start.getUTCHours()];
 const minutes = rule.byMinutes ?? [start.getUTCMinutes()];
 const seconds = rule.bySeconds ?? [start.getUTCSeconds()];
 const milliseconds = start.getUTCMilliseconds();
  let yielded = 0;

  const weekDays = [...rule.byDays].sort(
    (left, right) =>
      relativeWeekdayOffset(left.weekday, ruleWeekStart) -
      relativeWeekdayOffset(right.weekday, ruleWeekStart)
  );
  const maxScannedWeeks = maxOccurrences * 366;
  for (
    let weekIndex = 0, scannedWeeks = 0;
    yielded < maxOccurrences && scannedWeeks < maxScannedWeeks;
    weekIndex += rule.interval, scannedWeeks += 1
  ) {
    const weekCandidates: Date[] = [];

    for (const day of weekDays) {
      const dayStart = new Date(
        weekStart.getTime() +
          (weekIndex * 7 + relativeWeekdayOffset(day.weekday, ruleWeekStart)) *
            24 *
            60 *
            60 *
            1000
      );
      for (const hour of hours) {
        for (const minute of minutes) {
          for (const second of seconds) {
            const occurrenceStart = new Date(
              Date.UTC(
                dayStart.getUTCFullYear(),
                dayStart.getUTCMonth(),
                dayStart.getUTCDate(),
                hour,
                minute,
                second,
                milliseconds
              )
            );
            if (occurrenceStart < start) continue;
            if (!occurrenceMatchesRuleFilters(occurrenceStart, rule)) continue;
            weekCandidates.push(occurrenceStart);
          }
        }
      }
    }

    for (const occurrenceStart of applyBySetPositions(
      sortUniqueDates(weekCandidates),
      rule.bySetPositions
    )) {
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const filteredMonthRecurrenceStarts = function* (
  start: Date,
  rule: RecurrenceRule,
  maxOccurrences: number
): Generator<Date> {
  const time = {
    hours: start.getUTCHours(),
    minutes: start.getUTCMinutes(),
    seconds: start.getUTCSeconds(),
    milliseconds: start.getUTCMilliseconds()
  };
  const startDay = start.getUTCDate();
  let yielded = 0;

  if (rule.freq === "YEARLY") {
    const months = rule.byMonths ?? [start.getUTCMonth() + 1];
    const yearDays = rule.byYearDays ?? [];
    const weekNumbers = rule.byWeekNumbers ?? [];
    const ordinalByDays = rule.byDays?.filter(
      (byDay) => byDay.ordinal !== undefined
    );
    const plainByDays = rule.byDays?.filter(
      (byDay) => byDay.ordinal === undefined
    );
    const monthDays =
      rule.byMonthDays ??
      (yearDays.length ||
      weekNumbers.length ||
      ordinalByDays?.length ||
      plainByDays?.length
        ? []
        : [startDay]);

    for (
      let year = start.getUTCFullYear();
      yielded < maxOccurrences;
      year += rule.interval
    ) {
      const yearCandidates: Date[] = [];

      for (const yearDay of yearDays) {
        const occurrenceStart = utcDateIfYearDayExists(year, yearDay, time);
        if (
          occurrenceStart &&
          occurrenceStart >= start &&
          (!rule.byMonths ||
            rule.byMonths.includes(occurrenceStart.getUTCMonth() + 1))
      ) {
        yearCandidates.push(occurrenceStart);
      }
    }

      if (weekNumbers.length) {
        const weekDays = plainByDays?.length
          ? plainByDays.map((byDay) => byDay.weekday)
          : [weekdayNumberFromDate(start)];

        for (const weekNumber of weekNumbers) {
          for (const weekday of weekDays) {
            const occurrenceStart = utcDateForYearWeekNumber(
              year,
              weekNumber,
              weekday,
              rule.weekStart ?? 0,
              time
            );
            if (
              occurrenceStart &&
              occurrenceStart >= start &&
              (!rule.byMonths ||
                rule.byMonths.includes(occurrenceStart.getUTCMonth() + 1))
            ) {
              yearCandidates.push(occurrenceStart);
            }
          }
        }
      }

      for (const month of months) {
        for (const byDay of ordinalByDays ?? []) {
          const occurrenceStart = utcDateForOrdinalWeekday(
            year,
            month - 1,
            byDay.weekday,
            byDay.ordinal ?? 0,
            time
          );
          if (occurrenceStart && occurrenceStart >= start) {
            yearCandidates.push(occurrenceStart);
          }
        }

        if (plainByDays?.length && !weekNumbers.length) {
          const weekdays = new Set(
            plainByDays.map((byDay) => byDay.weekday)
          );
          for (let monthDay = 1; monthDay <= daysInUtcMonth(year, month - 1); monthDay += 1) {
            const occurrenceStart = utcDateIfMonthDayExists(
              year,
              month - 1,
              monthDay,
              time
            );
            if (
              occurrenceStart &&
              occurrenceStart >= start &&
              weekdays.has(weekdayNumberFromDate(occurrenceStart))
            ) {
              yearCandidates.push(occurrenceStart);
            }
          }
        }

        for (const monthDay of monthDays) {
          const occurrenceStart = utcDateIfMonthDayExists(
            year,
            month - 1,
            monthDay,
            time
          );
          if (occurrenceStart && occurrenceStart >= start) {
            yearCandidates.push(occurrenceStart);
          }
        }
      }

      const timeCandidates = sortUniqueDates(yearCandidates).flatMap((occurrenceStart) =>
        recurrenceTimeCandidates(occurrenceStart, rule)
      );

      for (const occurrenceStart of applyBySetPositions(
        sortUniqueDates(timeCandidates),
        rule.bySetPositions
      )) {
        if (occurrenceStart < start) continue;
        yield occurrenceStart;
        yielded += 1;
        if (yielded >= maxOccurrences) return;
      }
    }
    return;
  }

  if (rule.freq === "MONTHLY") {
    for (let index = 0; yielded < maxOccurrences; index += 1) {
      const targetMonthIndex = start.getUTCMonth() + index * rule.interval;
      const year = start.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
      const month = ((targetMonthIndex % 12) + 12) % 12;
      if (rule.byMonths && !rule.byMonths.includes(month + 1)) continue;

 const candidates = monthlyRecurrenceCandidates(
 year,
 month,
 startDay,
 rule,
 time
 )
 .flatMap((occurrenceStart) => recurrenceTimeCandidates(occurrenceStart, rule))
 .filter((occurrenceStart) => occurrenceStart >= start);

      for (const occurrenceStart of applyBySetPositions(
        candidates,
        rule.bySetPositions
      )) {
        yield occurrenceStart;
        yielded += 1;
        if (yielded >= maxOccurrences) return;
      }
    }
    return;
  }

  const weekDays = rule.byDays?.filter((byDay) => byDay.ordinal === undefined);
  const weekdayFilter = weekDays?.length
    ? new Set(weekDays.map((byDay) => byDay.weekday))
    : undefined;
  const maxScannedIntervals = maxOccurrences * 366;
  let occurrenceStart = start;

  for (
    let scanned = 0;
    yielded < maxOccurrences && scanned < maxScannedIntervals;
    scanned += 1
  ) {
    if (
      (!rule.byMonths || rule.byMonths.includes(occurrenceStart.getUTCMonth() + 1)) &&
      (!rule.byMonthDays || monthDayMatches(occurrenceStart, rule.byMonthDays)) &&
      (!weekdayFilter || weekdayFilter.has(weekdayNumberFromDate(occurrenceStart)))
    ) {
      yield occurrenceStart;
      yielded += 1;
    }
    occurrenceStart = addRecurrenceInterval(occurrenceStart, rule);
  }
};

const dailyTimeRecurrenceStarts = function* (
start: Date,
rule: RecurrenceRule,
maxOccurrences: number
): Generator<Date> {
  const hours = rule.byHours ?? [start.getUTCHours()];
  const minutes = rule.byMinutes ?? [start.getUTCMinutes()];
 const seconds = rule.bySeconds ?? [start.getUTCSeconds()];
  const milliseconds = start.getUTCMilliseconds();
  const weekDays = rule.byDays?.filter((byDay) => byDay.ordinal === undefined);
  const weekdayFilter = weekDays?.length
    ? new Set(weekDays.map((byDay) => byDay.weekday))
    : undefined;
  const maxScannedDays = maxOccurrences * 366;
  let yielded = 0;

  for (
    let dayIndex = 0, scannedDays = 0;
    yielded < maxOccurrences && scannedDays < maxScannedDays;
    dayIndex += rule.interval, scannedDays += 1
  ) {
    const baseDay = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + dayIndex
      )
    );

    if (
      (rule.byMonths && !rule.byMonths.includes(baseDay.getUTCMonth() + 1)) ||
      (rule.byMonthDays && !monthDayMatches(baseDay, rule.byMonthDays)) ||
      (weekdayFilter && !weekdayFilter.has(weekdayNumberFromDate(baseDay)))
    ) {
      continue;
    }

    const candidates: Date[] = [];
    for (const hour of hours) {
      for (const minute of minutes) {
        for (const second of seconds) {
          candidates.push(
            new Date(
              Date.UTC(
                baseDay.getUTCFullYear(),
                baseDay.getUTCMonth(),
                baseDay.getUTCDate(),
                hour,
                minute,
                second,
                milliseconds
              )
            )
          );
        }
      }
    }

    for (const occurrenceStart of applyBySetPositions(
      sortUniqueDates(candidates),
      rule.bySetPositions
    )) {
      if (occurrenceStart < start) continue;
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
}
};

const dailyTimeZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  start: Date,
  maxOccurrences: number
): Generator<Date> {
 const hours = rule.byHours ?? [localStart.hour];
 const minutes = rule.byMinutes ?? [localStart.minute];
 const seconds = rule.bySeconds ?? [localStart.second];
 const maxScannedDays = maxOccurrences * 366;
 let yielded = 0;

 for (
 let dayIndex = 0, scannedDays = 0;
 yielded < maxOccurrences && scannedDays < maxScannedDays;
 dayIndex += rule.interval, scannedDays += 1
 ) {
 const localDate = new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day + dayIndex));
 const candidates: Date[] = [];

 for (const hour of hours) {
 for (const minute of minutes) {
 for (const second of seconds) {
 const occurrenceStart = new Date(
 zonedDateTimeToUtc(
 localDate.getUTCFullYear(),
 localDate.getUTCMonth() + 1,
 localDate.getUTCDate(),
 hour,
 minute,
 second,
 localStart.timezone
 )
 );
 if (occurrenceStart < start) continue;
 candidates.push(occurrenceStart);
 }
 }
 }

    for (const occurrenceStart of applyBySetPositions(sortUniqueDates(candidates), rule.bySetPositions)) {
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
 }
  }
};

const weeklyTimeZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  start: Date,
  maxOccurrences: number
): Generator<Date> {
  const ruleWeekStart = rule.weekStart ?? 0;
  const weekStart = startOfUtcWeek(
    new Date(Date.UTC(localStart.year, localStart.month - 1, localStart.day)),
    ruleWeekStart
  );
  const hours = rule.byHours ?? [localStart.hour];
  const minutes = rule.byMinutes ?? [localStart.minute];
  const seconds = rule.bySeconds ?? [localStart.second];
  const weekDays = [...(rule.byDays ?? [])].sort(
    (left, right) =>
      relativeWeekdayOffset(left.weekday, ruleWeekStart) -
      relativeWeekdayOffset(right.weekday, ruleWeekStart)
  );
  const maxScannedWeeks = maxOccurrences * 366;
  let yielded = 0;

  for (
    let weekIndex = 0, scannedWeeks = 0;
    yielded < maxOccurrences && scannedWeeks < maxScannedWeeks;
    weekIndex += rule.interval, scannedWeeks += 1
  ) {
    const weekCandidates: Date[] = [];

    for (const day of weekDays) {
      const localDate = new Date(
        weekStart.getTime() +
          (weekIndex * 7 + relativeWeekdayOffset(day.weekday, ruleWeekStart)) *
            24 *
            60 *
            60 *
            1000
      );

      for (const hour of hours) {
        for (const minute of minutes) {
          for (const second of seconds) {
            const occurrenceStart = new Date(
              zonedDateTimeToUtc(
                localDate.getUTCFullYear(),
                localDate.getUTCMonth() + 1,
                localDate.getUTCDate(),
                hour,
                minute,
                second,
                localStart.timezone
              )
            );
            if (occurrenceStart < start) continue;
            weekCandidates.push(occurrenceStart);
          }
        }
      }
    }

    for (const occurrenceStart of applyBySetPositions(sortUniqueDates(weekCandidates), rule.bySetPositions)) {
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const monthlyTimeZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  start: Date,
  maxOccurrences: number
): Generator<Date> {
  const monthDays = rule.byMonthDays ?? [localStart.day];
  const hours = rule.byHours ?? [localStart.hour];
  const minutes = rule.byMinutes ?? [localStart.minute];
  const seconds = rule.bySeconds ?? [localStart.second];
  const maxScannedMonths = maxOccurrences * 366;
  let yielded = 0;

  for (
    let monthOffset = 0, scannedMonths = 0;
    yielded < maxOccurrences && scannedMonths < maxScannedMonths;
    monthOffset += rule.interval, scannedMonths += 1
  ) {
    const monthIndex = localStart.month - 1 + monthOffset;
    const year = localStart.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const daysInMonth = daysInUtcMonth(year, month);
    const candidateDays = monthDays
      .map((monthDay) => (monthDay > 0 ? monthDay : daysInMonth + monthDay + 1))
      .filter((monthDay) => monthDay >= 1 && monthDay <= daysInMonth)
      .sort((left, right) => left - right);
    const monthCandidates: Date[] = [];

    for (const day of candidateDays) {
      for (const hour of hours) {
        for (const minute of minutes) {
          for (const second of seconds) {
            const occurrenceStart = new Date(
              zonedDateTimeToUtc(
                year,
                month + 1,
                day,
                hour,
                minute,
                second,
                localStart.timezone
              )
            );
            if (occurrenceStart < start) continue;
            monthCandidates.push(occurrenceStart);
          }
        }
      }
    }

    for (const occurrenceStart of applyBySetPositions(sortUniqueDates(monthCandidates), rule.bySetPositions)) {
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const yearlyTimeZonedWallTimeRecurrenceStarts = function* (
  localStart: IcsLocalDateTime,
  rule: RecurrenceRule,
  start: Date,
  maxOccurrences: number
): Generator<Date> {
  const months = rule.byMonths ?? [localStart.month];
  const monthDays = rule.byMonthDays ?? [localStart.day];
  const hours = rule.byHours ?? [localStart.hour];
  const minutes = rule.byMinutes ?? [localStart.minute];
  const seconds = rule.bySeconds ?? [localStart.second];
  const maxScannedYears = maxOccurrences * 366;
  let yielded = 0;

  for (
    let yearOffset = 0, scannedYears = 0;
    yielded < maxOccurrences && scannedYears < maxScannedYears;
    yearOffset += rule.interval, scannedYears += 1
  ) {
    const year = localStart.year + yearOffset;
    const yearCandidates: Date[] = [];

    for (const monthNumber of months) {
      const month = monthNumber - 1;
      const daysInMonth = daysInUtcMonth(year, month);
      const candidateDays = monthDays
        .map((monthDay) => (monthDay > 0 ? monthDay : daysInMonth + monthDay + 1))
        .filter((monthDay) => monthDay >= 1 && monthDay <= daysInMonth)
        .sort((left, right) => left - right);

      for (const day of candidateDays) {
        for (const hour of hours) {
          for (const minute of minutes) {
            for (const second of seconds) {
              const occurrenceStart = new Date(
                zonedDateTimeToUtc(
                  year,
                  monthNumber,
                  day,
                  hour,
                  minute,
                  second,
                  localStart.timezone
                )
              );
              if (occurrenceStart < start) continue;
              yearCandidates.push(occurrenceStart);
            }
          }
        }
      }
    }

for (const occurrenceStart of applyBySetPositions(sortUniqueDates(yearCandidates), rule.bySetPositions)) {
      yield occurrenceStart;
      yielded += 1;
      if (yielded >= maxOccurrences) return;
    }
  }
};

const recurrenceTimeCandidates = (
  occurrenceStart: Date,
  rule: RecurrenceRule
): Date[] => {
 const hours = rule.byHours ?? [occurrenceStart.getUTCHours()];
 const minutes = rule.byMinutes ?? [occurrenceStart.getUTCMinutes()];
 const seconds = rule.bySeconds ?? [occurrenceStart.getUTCSeconds()];
 const milliseconds = occurrenceStart.getUTCMilliseconds();
 const candidates: Date[] = [];

 for (const hour of hours) {
 for (const minute of minutes) {
 for (const second of seconds) {
 candidates.push(
 new Date(
 Date.UTC(
 occurrenceStart.getUTCFullYear(),
 occurrenceStart.getUTCMonth(),
 occurrenceStart.getUTCDate(),
 hour,
 minute,
 second,
 milliseconds
 )
 )
 );
 }
 }
 }

 return sortUniqueDates(candidates);
};

const addRecurrenceInterval = (date: Date, rule: RecurrenceRule): Date => {
  if (rule.freq === "MONTHLY" || rule.freq === "YEARLY") {
    const monthInterval = rule.freq === "MONTHLY" ? rule.interval : rule.interval * 12;
    const targetMonthIndex = date.getUTCMonth() + monthInterval;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const targetDay = Math.min(
      date.getUTCDate(),
      daysInUtcMonth(targetYear, targetMonth)
    );
    return new Date(
      Date.UTC(
        targetYear,
        targetMonth,
        targetDay,
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
      )
    );
  }

  const next = new Date(date);
  next.setUTCDate(
    next.getUTCDate() + (rule.freq === "DAILY" ? 1 : 7) * rule.interval
  );
  return next;
};

const daysInUtcMonth = (year: number, zeroBasedMonth: number): number =>
  new Date(Date.UTC(year, zeroBasedMonth + 1, 0)).getUTCDate();

const utcDateIfMonthDayExists = (
  year: number,
  zeroBasedMonth: number,
  monthDay: number,
  time: { hours: number; minutes: number; seconds: number; milliseconds: number }
): Date | undefined => {
  const daysInMonth = daysInUtcMonth(year, zeroBasedMonth);
  const resolvedMonthDay = monthDay < 0 ? daysInMonth + monthDay + 1 : monthDay;
  if (resolvedMonthDay < 1 || resolvedMonthDay > daysInMonth) return undefined;
  return new Date(
    Date.UTC(
      year,
      zeroBasedMonth,
      resolvedMonthDay,
      time.hours,
      time.minutes,
      time.seconds,
      time.milliseconds
    )
  );
};

const monthDayMatches = (date: Date, monthDays: number[]): boolean => {
  const daysInMonth = daysInUtcMonth(date.getUTCFullYear(), date.getUTCMonth());
  return monthDays.some((monthDay) => {
    const resolvedMonthDay = monthDay < 0 ? daysInMonth + monthDay + 1 : monthDay;
    return resolvedMonthDay === date.getUTCDate();
  });
};

const occurrenceMatchesRuleFilters = (
  occurrenceStart: Date,
  rule: RecurrenceRule
): boolean =>
  (!rule.byMonths ||
    rule.byMonths.includes(occurrenceStart.getUTCMonth() + 1)) &&
  (!rule.byMonthDays ||
    monthDayMatches(occurrenceStart, rule.byMonthDays));

const daysInUtcYear = (year: number): number =>
  Math.floor(
    (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / (24 * 60 * 60 * 1000)
  );

const utcDateIfYearDayExists = (
  year: number,
  yearDay: number,
  time: { hours: number; minutes: number; seconds: number; milliseconds: number }
): Date | undefined => {
  const daysInYear = daysInUtcYear(year);
  const resolvedYearDay = yearDay < 0 ? daysInYear + yearDay + 1 : yearDay;
  if (resolvedYearDay < 1 || resolvedYearDay > daysInYear) return undefined;

  return new Date(
    Date.UTC(
      year,
      0,
      resolvedYearDay,
      time.hours,
      time.minutes,
      time.seconds,
      time.milliseconds
    )
  );
};

const utcDateForYearWeekNumber = (
  year: number,
  weekNumber: number,
  weekday: number,
  weekStart: number,
  time: { hours: number; minutes: number; seconds: number; milliseconds: number }
): Date | undefined => {
  const weekOneStart = startOfUtcWeek(new Date(Date.UTC(year, 0, 4)), weekStart);
  const nextYearWeekOneStart = startOfUtcWeek(
    new Date(Date.UTC(year + 1, 0, 4)),
    weekStart
  );
  const weeksInYear = Math.round(
    (nextYearWeekOneStart.getTime() - weekOneStart.getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  const resolvedWeekNumber =
    weekNumber < 0 ? weeksInYear + weekNumber + 1 : weekNumber;
  if (resolvedWeekNumber < 1 || resolvedWeekNumber > weeksInYear) {
    return undefined;
  }

  const dayStart = new Date(
    weekOneStart.getTime() +
      ((resolvedWeekNumber - 1) * 7 +
        relativeWeekdayOffset(weekday, weekStart)) *
        24 *
        60 *
        60 *
        1000
  );

  return new Date(
    Date.UTC(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth(),
      dayStart.getUTCDate(),
      time.hours,
      time.minutes,
      time.seconds,
      time.milliseconds
    )
  );
};

const utcDateForOrdinalWeekday = (
  year: number,
  zeroBasedMonth: number,
  weekday: number,
  ordinal: number,
  time: { hours: number; minutes: number; seconds: number; milliseconds: number }
): Date | undefined => {
  if (ordinal === 0) return undefined;
  const daysInMonth = daysInUtcMonth(year, zeroBasedMonth);

  if (ordinal > 0) {
    const firstOfMonth = new Date(Date.UTC(year, zeroBasedMonth, 1));
    const offset = (weekday - weekdayNumberFromDate(firstOfMonth) + 7) % 7;
    const monthDay = 1 + offset + (ordinal - 1) * 7;
    if (monthDay > daysInMonth) return undefined;
    return utcDateIfMonthDayExists(year, zeroBasedMonth, monthDay, time);
  }

  const lastOfMonth = new Date(Date.UTC(year, zeroBasedMonth, daysInMonth));
  const offset = (weekdayNumberFromDate(lastOfMonth) - weekday + 7) % 7;
  const monthDay = daysInMonth - offset + (ordinal + 1) * 7;
  if (monthDay < 1) return undefined;
  return utcDateIfMonthDayExists(year, zeroBasedMonth, monthDay, time);
};

const weekdayNumberFromDate = (date: Date): number =>
  (date.getUTCDay() + 6) % 7;

const monthlyRecurrenceCandidates = (
  year: number,
  zeroBasedMonth: number,
  defaultMonthDay: number,
  rule: RecurrenceRule,
  time: { hours: number; minutes: number; seconds: number; milliseconds: number }
): Date[] => {
  const ordinalByDays =
    rule.byDays?.filter((byDay) => byDay.ordinal !== undefined) ?? [];
  const plainByDays =
    rule.byDays?.filter((byDay) => byDay.ordinal === undefined) ?? [];
  const monthDays =
    rule.byMonthDays ?? (ordinalByDays.length || plainByDays.length ? [] : [defaultMonthDay]);
  const candidates: Date[] = [];

  for (const byDay of ordinalByDays) {
    const occurrenceStart = utcDateForOrdinalWeekday(
      year,
      zeroBasedMonth,
      byDay.weekday,
      byDay.ordinal ?? 0,
      time
    );
    if (occurrenceStart) candidates.push(occurrenceStart);
  }

  for (const monthDay of monthDays) {
    const occurrenceStart = utcDateIfMonthDayExists(
      year,
      zeroBasedMonth,
      monthDay,
      time
    );
    if (occurrenceStart) candidates.push(occurrenceStart);
  }

  if (plainByDays.length) {
    const weekdays = new Set(plainByDays.map((byDay) => byDay.weekday));
    const daysInMonth = daysInUtcMonth(year, zeroBasedMonth);
    for (let monthDay = 1; monthDay <= daysInMonth; monthDay += 1) {
      const occurrenceStart = utcDateIfMonthDayExists(
        year,
        zeroBasedMonth,
        monthDay,
        time
      );
      if (
        occurrenceStart &&
        weekdays.has(weekdayNumberFromDate(occurrenceStart))
      ) {
        candidates.push(occurrenceStart);
      }
    }
  }

  return sortUniqueDates(candidates);
};

const applyBySetPositions = (
  candidates: Date[],
  positions: number[] | undefined
): Date[] => {
  if (!positions?.length) return candidates;
  const selected: Date[] = [];
  for (const position of positions) {
    const index = position > 0 ? position - 1 : candidates.length + position;
    const candidate = candidates[index];
    if (candidate) selected.push(candidate);
  }
  return sortUniqueDates(selected);
};

const parseByDays = (
  value: string | undefined
): RecurrenceByDay[] | undefined => {
  if (!value) return undefined;

  const days = value.split(",").map((day) => {
    const match = /^([+-]?\d{1,2})?([A-Z]{2})$/.exec(day);
    if (!match) throw new Error(`Invalid ICS RRULE BYDAY: ${day}`);
    const ordinal = match[1] ? Number(match[1]) : undefined;
    const weekday = weekdayNumber(match[2] ?? "");
    if (
      weekday === undefined ||
      (ordinal !== undefined &&
        (!Number.isInteger(ordinal) ||
          ordinal === 0 ||
          ordinal < -53 ||
          ordinal > 53))
    ) {
      throw new Error(`Invalid ICS RRULE BYDAY: ${day}`);
    }
    return ordinal === undefined ? { weekday } : { weekday, ordinal };
  });
  const uniqueDays = new Map(
    days.map((day) => [`${day.ordinal ?? ""}:${day.weekday}`, day])
  );
  return [...uniqueDays.values()].sort(
    (left, right) =>
      (left.ordinal ?? 0) - (right.ordinal ?? 0) ||
      left.weekday - right.weekday
  );
};

const parseByMonthDays = (value: string | undefined): number[] | undefined =>
  parseSignedIntegerList(value, "BYMONTHDAY", -31, 31);

const parseByMonths = (value: string | undefined): number[] | undefined =>
  parsePositiveIntegerList(value, "BYMONTH", 1, 12);

const parseByHours = (value: string | undefined): number[] | undefined =>
  parsePositiveIntegerList(value, "BYHOUR", 0, 23);

const parseByMinutes = (value: string | undefined): number[] | undefined =>
 parsePositiveIntegerList(value, "BYMINUTE", 0, 59);

const parseBySeconds = (value: string | undefined): number[] | undefined =>
 parsePositiveIntegerList(value, "BYSECOND", 0, 59);

const parseByYearDays = (value: string | undefined): number[] | undefined =>
  parseSignedIntegerList(value, "BYYEARDAY", -366, 366);

const parseByWeekNumbers = (value: string | undefined): number[] | undefined =>
  parseSignedIntegerList(value, "BYWEEKNO", -53, 53);

const parseBySetPositions = (value: string | undefined): number[] | undefined =>
  parseSignedIntegerList(value, "BYSETPOS", -366, 366);

const parseWeekStart = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const weekStart = weekdayNumber(value);
  if (weekStart === undefined) {
    throw new Error(`Invalid ICS RRULE WKST: ${value}`);
  }
  return weekStart;
};

const parsePositiveIntegerList = (
  value: string | undefined,
  fieldName: string,
  min: number,
  max: number
): number[] | undefined => {
  if (!value) return undefined;
  const values = value.split(",").map((rawValue) => {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new Error(`Invalid ICS RRULE ${fieldName}: ${rawValue}`);
    }
    return parsed;
  });
  return [...new Set(values)].sort((left, right) => left - right);
};

const parseSignedIntegerList = (
  value: string | undefined,
  fieldName: string,
  min: number,
  max: number
): number[] | undefined => {
  if (!value) return undefined;
  const values = value.split(",").map((rawValue) => {
    const parsed = Number(rawValue);
    if (
      !Number.isInteger(parsed) ||
      parsed === 0 ||
      parsed < min ||
      parsed > max
    ) {
      throw new Error(`Invalid ICS RRULE ${fieldName}: ${rawValue}`);
    }
    return parsed;
  });
  return [...new Set(values)].sort((left, right) => left - right);
};

const excludedOccurrenceMatcher = (
 properties: IcsProperty[],
 allDay: boolean
): IcsExclusionMatcher => {
 const exactStarts = new Set<string>();
 const wholeUtcDates = new Set<string>();

 for (const property of properties.filter((candidate) => candidate.name === "EXDATE")) {
 const valueType = property.params.VALUE?.toUpperCase();
 const propertyAllDay = allDay || valueType === "DATE";
 for (const value of property.value.split(",")) {
 const parsed = parseIcsDate(value, propertyAllDay, property.params.TZID);
 if (propertyAllDay) {
 wholeUtcDates.add(utcDateKey(new Date(parsed)));
 } else {
 exactStarts.add(parsed);
 }
 }
 }

 return { exactStarts, wholeUtcDates };
};

const isOccurrenceExcluded = (
 exclusions: IcsExclusionMatcher,
 occurrenceStart: Date
): boolean =>
 exclusions.exactStarts.has(occurrenceStart.toISOString()) ||
 exclusions.wholeUtcDates.has(utcDateKey(occurrenceStart));

const additionalOccurrences = (
  properties: IcsProperty[],
  allDay: boolean
): IcsOccurrenceCandidate[] => {
  const occurrences: IcsOccurrenceCandidate[] = [];
  for (const property of properties.filter((candidate) => candidate.name === "RDATE")) {
    const valueType = property.params.VALUE?.toUpperCase();
    const propertyAllDay = allDay || valueType === "DATE";
    for (const value of property.value.split(",")) {
      if (valueType === "PERIOD") {
 occurrences.push(parseIcsPeriod(value, propertyAllDay, property.params.TZID));
 } else {
 occurrences.push({
 start: new Date(parseIcsDate(value, propertyAllDay, property.params.TZID))
 });
      }
    }
  }
  return occurrences;
};

const parseDateListProperties = (
  properties: IcsProperty[],
  propertyName: "EXDATE" | "RDATE",
  allDay: boolean
): string[] => {
  const parsed: string[] = [];
  for (const property of properties.filter((candidate) => candidate.name === propertyName)) {
    const propertyAllDay =
      allDay || property.params.VALUE?.toUpperCase() === "DATE";
    for (const value of property.value.split(",")) {
 parsed.push(parseIcsDate(value, propertyAllDay, property.params.TZID));
    }
  }
  return parsed;
};

const sortUniqueDates = (dates: Date[]): Date[] =>
  [...new Map(dates.map((date) => [date.toISOString(), date])).values()].sort(
    (left, right) => left.getTime() - right.getTime()
  );

const sortUniqueOccurrences = (
  occurrences: IcsOccurrenceCandidate[]
): IcsOccurrenceCandidate[] =>
  [
    ...new Map(
      occurrences.map((occurrence) => [
        occurrence.start.toISOString(),
        occurrence
      ])
    ).values()
  ].sort((left, right) => left.start.getTime() - right.start.getTime());

const utcDateKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;

const weekdayNumber = (value: string): number | undefined => {
  switch (value) {
    case "MO":
      return 0;
    case "TU":
      return 1;
    case "WE":
      return 2;
    case "TH":
      return 3;
    case "FR":
      return 4;
    case "SA":
      return 5;
    case "SU":
      return 6;
    default:
      return undefined;
  }
};

const relativeWeekdayOffset = (weekday: number, weekStart: number): number =>
  (weekday - weekStart + 7) % 7;

const startOfUtcWeek = (date: Date, weekStart: number = 0): Date => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const currentWeekday = weekdayNumberFromDate(start);
  start.setUTCDate(start.getUTCDate() - relativeWeekdayOffset(currentWeekday, weekStart));
  return start;
};

const eventForOccurrence = (
  event: CalendarEvent,
  start: Date,
  end: Date,
  occurrenceKey = formatOccurrenceKey(start)
): CalendarEvent => {
  return {
    ...event,
    id: `${event.id}_${sanitizeId(occurrenceKey)}`,
    start: start.toISOString(),
    end: end.toISOString(),
    externalId: `${event.externalId ?? event.id}:${occurrenceKey}`
  };
};

const formatOccurrenceKey = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, "").replace(".000", "");

const occurrenceKeyFromExternalId = (event: CalendarEvent): string | undefined => {
  const externalId = event.externalId ?? event.id;
  const separatorIndex = externalId.lastIndexOf(":");
  return separatorIndex >= 0 ? externalId.slice(separatorIndex + 1) : undefined;
};

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const calendarEventFromBlock = (
  block: TimeBlock,
  task: SchedulingTask | undefined,
  calendarId: string
): CalendarEvent => ({
  id: `scheduleos_${block.id}`,
  tenantId: block.tenantId,
  workspaceId: block.workspaceId,
  userId: block.userId,
  calendarId,
  title: task?.title ?? `Scheduled work ${block.taskId}`,
  start: block.start,
  end: block.end,
  timezone: "UTC",
  allDay: false,
  status: "CONFIRMED",
  busyStatus: "BUSY",
  movable: false,
  locked: block.locked || block.status === "LOCKED",
  privacyLevel: "BUSY_ONLY",
  version: 1,
  sourceSystem: "SCHEDULEOS",
  externalId: block.id
});

const getProperty = (
  properties: IcsProperty[],
  name: string
): IcsProperty | undefined => properties.find((property) => property.name === name);

const getValue = (properties: IcsProperty[], name: string): string | undefined =>
  getProperty(properties, name)?.value;

const parseIcsDate = (
 value: string,
 allDay: boolean,
 timezone: string = "UTC"
): string => {
 if (allDay) {
 const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
 if (!match) throw new Error(`Invalid all-day ICS date: ${value}`);
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    ).toISOString();
  }

 const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(value);
 if (!match) throw new Error(`Invalid ICS date-time: ${value}`);
 if (!value.endsWith("Z") && timezone !== "UTC") {
 return zonedDateTimeToUtc(
 Number(match[1]),
 Number(match[2]),
 Number(match[3]),
 Number(match[4]),
 Number(match[5]),
 Number(match[6]),
 timezone
 );
 }
 return new Date(
 Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    )
 ).toISOString();
};

const zonedDateTimeToUtc = (
 year: number,
 month: number,
 day: number,
 hour: number,
 minute: number,
 second: number,
 timezone: string
): string => {
 const targetWallTime = Date.UTC(year, month - 1, day, hour, minute, second);
 let utcGuess = targetWallTime;

 for (let attempt = 0; attempt < 4; attempt += 1) {
 const wallParts = utcDatePartsInTimeZone(new Date(utcGuess), timezone);
 const actualWallTime = Date.UTC(
 wallParts.year,
 wallParts.month - 1,
 wallParts.day,
 wallParts.hour,
 wallParts.minute,
 wallParts.second
 );
 const offset = targetWallTime - actualWallTime;
 utcGuess += offset;
 if (offset === 0) break;
 }

 return new Date(utcGuess).toISOString();
};

const utcDatePartsInTimeZone = (
 date: Date,
 timezone: string
): {
 year: number;
 month: number;
 day: number;
 hour: number;
 minute: number;
 second: number;
} => {
 let parts: Intl.DateTimeFormatPart[];
 try {
 parts = new Intl.DateTimeFormat("en-US", {
 timeZone: timezone,
 calendar: "gregory",
 numberingSystem: "latn",
 hourCycle: "h23",
 year: "numeric",
 month: "2-digit",
 day: "2-digit",
 hour: "2-digit",
 minute: "2-digit",
 second: "2-digit"
 }).formatToParts(date);
 } catch {
 throw new Error(`Invalid ICS TZID: ${timezone}`);
 }

 const values = Object.fromEntries(
 parts
 .filter((part) => part.type !== "literal")
 .map((part) => [part.type, Number(part.value)])
 );
 const yearPart = values.year;
 const monthPart = values.month;
 const dayPart = values.day;
 const hourPart = values.hour;
 const minutePart = values.minute;
 const secondPart = values.second;

 if (
 yearPart === undefined ||
 monthPart === undefined ||
 dayPart === undefined ||
 hourPart === undefined ||
 minutePart === undefined ||
 secondPart === undefined
 ) {
 throw new Error(`Invalid ICS TZID: ${timezone}`);
 }

 return {
 year: yearPart,
 month: monthPart,
 day: dayPart,
 hour: hourPart,
 minute: minutePart,
 second: secondPart
 };
};

const parseRecurrenceUntil = (value: string): string => {
  const dateOnlyMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (!dateOnlyMatch) return parseIcsDate(value, false);

  return new Date(
    Date.UTC(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
      23,
      59,
      59,
      999
    )
  ).toISOString();
};

const parseIcsPeriod = (
value: string,
allDay: boolean,
timezone: string = "UTC"
): IcsOccurrenceCandidate => {
  const [startValue, endOrDuration, extra] = value.split("/");
  if (!startValue || !endOrDuration || extra !== undefined) {
    throw new Error(`Invalid ICS period: ${value}`);
  }

 const start = new Date(parseIcsDate(startValue, allDay, timezone));
  let durationMs: number;

  if (/^\+?P/.test(endOrDuration)) {
 durationMs = parseIcsDuration(endOrDuration.replace(/^\+/, ""));
 } else {
 const end = new Date(parseIcsDate(endOrDuration, allDay, timezone));
    durationMs = end.getTime() - start.getTime();
  }

  if (durationMs <= 0) throw new Error(`Invalid ICS period: ${value}`);
  return { start, durationMs };
};

const parseStatus = (value: string | undefined): CalendarStatus => {
  switch (value?.toUpperCase()) {
    case "TENTATIVE":
      return "TENTATIVE";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "CONFIRMED";
  }
};

const parseBusyStatus = (value: string | undefined): BusyStatus =>
  value?.toUpperCase() === "TRANSPARENT" ? "FREE" : "BUSY";

const parsePrivacyLevel = (value: string | undefined): PrivacyLevel => {
  switch (value?.toUpperCase()) {
    case "PUBLIC":
      return "PUBLIC";
    case "PRIVATE":
      return "PRIVATE";
    case "CONFIDENTIAL":
      return "CONFIDENTIAL";
    default:
      return "UNKNOWN";
  }
};

const privacyToClass = (privacyLevel: PrivacyLevel): string => {
  switch (privacyLevel) {
    case "PUBLIC":
      return "PUBLIC";
    case "CONFIDENTIAL":
      return "CONFIDENTIAL";
    default:
      return "PRIVATE";
  }
};

const formatDateProperty = (
  name: "DTSTART" | "DTEND",
  value: string,
  allDay: boolean
): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid event date: ${value}`);

  if (allDay) {
    return `${name};VALUE=DATE:${date.getUTCFullYear()}${pad2(
      date.getUTCMonth() + 1
    )}${pad2(date.getUTCDate())}`;
  }

  return `${name}:${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(
    date.getUTCDate()
  )}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(
    date.getUTCSeconds()
  )}Z`;
};

const escapeText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

const unescapeText = (value: string): string =>
  value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");

const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);

  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }

  return chunks.join("\r\n");
};

const sanitizeId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "event";

const pad2 = (value: number): string => String(value).padStart(2, "0");
