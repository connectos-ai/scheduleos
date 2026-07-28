import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApiServer } from "./api.js";

type RequestResult = {
  status: number;
  body: any;
};

const request = async (
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<RequestResult> => {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, init);

  return {
    status: response.status,
    body: await response.json()
  };
};

const providerExportFixtures = [
  {
    templateId: "todoist",
    expectedSourceSystem: "TODOIST_CSV",
    expectedTitle: "Prepare launch, checklist",
    expectedPriority: "URGENT",
    expectedDuration: 45,
    expectedProject: "Launch",
    expectedTags: ["ops", "planning"],
    csv: [
      "Task ID,Content,Due Date,Priority,Duration Minutes,Project,Labels,URL,Created At,Assignee",
      'todoist_export_demo_1,"Prepare launch, checklist",2026-07-31T17:00:00.000Z,p1,45,Launch,ops;planning,https://todoist.example/tasks/export_demo_1,2026-07-20,Jordan',
      ""
    ].join("\n")
  },
  {
    templateId: "linear",
    expectedSourceSystem: "LINEAR_CSV",
    expectedTitle: "Triage scheduler import edge case",
    expectedPriority: "HIGH",
    expectedDuration: 55,
    expectedProject: "Scheduling",
    expectedTags: ["bug", "csv"],
    csv: [
      "Issue ID,Title,Priority,Estimate,Team,Labels,Link,Cycle",
      "SCH-101,Triage scheduler import edge case,high,55,Scheduling,bug|csv,https://linear.example/SCH-101,July release"
    ].join("\n")
  },
  {
    templateId: "asana",
    expectedSourceSystem: "ASANA_CSV",
    expectedTitle: "Confirm care follow-up path",
    expectedPriority: "MEDIUM",
    expectedDuration: 35,
    expectedProject: "Care",
    expectedTags: ["follow-up", "team"],
    csv: [
      "Task ID,Name,Due Date,Priority,Estimate Minutes,Project,Tags,URL,Completed",
      "asana_export_demo_1,Confirm care follow-up path,2026-08-01T15:00:00.000Z,normal,35,Care,follow-up;team,https://asana.example/tasks/export_demo_1,false"
    ].join("\n")
  },
  {
    templateId: "clickup",
    expectedSourceSystem: "CLICKUP_CSV",
    expectedTitle: "Review Sunday plan",
    expectedPriority: "LOW",
    expectedDuration: 25,
    expectedProject: "Operations",
    expectedTags: ["schedule", "review"],
    csv: [
      "Task ID,Task Name,Due Date,Priority,Estimate Minutes,Folder,Tags,Link,Status",
      "clickup_export_demo_1,Review Sunday plan,2026-08-02T20:00:00.000Z,lowest,25,Operations,schedule|review,https://clickup.example/t/export_demo_1,in progress"
    ].join("\n")
  },
  {
    templateId: "trello",
    expectedSourceSystem: "TRELLO_CSV",
    expectedTitle: "Move community board card",
    expectedPriority: "MEDIUM",
    expectedDuration: 30,
    expectedProject: "Doing",
    expectedTags: ["community", "board"],
    csv: [
      "Card ID,Card Name,List,Due,Labels,Link,Duration Minutes,Board",
      "tr-77,Move community board card,Doing,2026-08-03T16:00:00.000Z,community;board,https://trello.example/c/tr-77,30,Launch Board"
    ].join("\n")
  },
  {
    templateId: "microsoft_planner",
    expectedSourceSystem: "MICROSOFT_PLANNER_CSV",
    expectedTitle: "Confirm volunteer rotation",
    expectedPriority: "HIGH",
    expectedDuration: 40,
    expectedProject: "This week",
    expectedTags: ["volunteers", "schedule"],
    csv: [
      "Task ID,Task Name,Plan Name,Deadline,Priority,Duration Minutes,Tags,Link,Progress",
      "planner_export_demo_1,Confirm volunteer rotation,This week,2026-08-04T15:00:00.000Z,high,40,volunteers|schedule,https://planner.example/tasks/export_demo_1,Not started"
    ].join("\n")
  },
  {
    templateId: "github_issues",
    expectedSourceSystem: "GITHUB_ISSUES_CSV",
    expectedTitle: "Document CSV import evidence",
    expectedPriority: "MEDIUM",
    expectedDuration: 50,
    expectedProject: "scheduleos",
    expectedTags: ["docs", "csv"],
    csv: [
      "Issue Number,Title,Deadline,Priority,Duration Minutes,Project,Tags,Link,Milestone",
      "88,Document CSV import evidence,2026-08-05T14:00:00.000Z,medium,50,scheduleos,docs;csv,https://github.example/scheduleos/issues/88,release-readiness"
    ].join("\n")
  }
];

test("local API dry-runs provider export-shaped CSV fixtures without task mutation", async () => {
  const server = createApiServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address, "object");
  assert.notEqual(address, null);
  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    for (const fixture of providerExportFixtures) {
      const preview = await request(baseUrl, "POST", "/api/task-sources/csv/import", {
        tenantId: "tenant_demo",
        workspaceId: "workspace_demo",
        userId: "user_jordan",
        templateId: fixture.templateId,
        dryRun: true,
        csv: fixture.csv
      });

      assert.equal(preview.status, 200, `${fixture.templateId} export fixture should preview`);
      assert.equal(preview.body.dryRun, true);
      assert.equal(preview.body.errors.length, 0);
      assert.equal(preview.body.data.length, 1);
      assert.equal(preview.body.createdCount, 0);
      assert.equal(preview.body.updatedCount, 0);

      const task = preview.body.data[0];
      assert.equal(task.sourceSystem, fixture.expectedSourceSystem);
      assert.equal(task.title, fixture.expectedTitle);
      assert.equal(task.priority, fixture.expectedPriority);
      assert.equal(task.estimatedDurationMinutes, fixture.expectedDuration);
      assert.equal(task.projectId, fixture.expectedProject);
      assert.deepEqual(task.tags, fixture.expectedTags);
      assert.match(task.sourceUrl, /^https:\/\/[a-z_]+\.example\//);
    }

    const tasks = await request(
      baseUrl,
      "GET",
      "/api/tasks?tenantId=tenant_demo&workspaceId=workspace_demo&userId=user_jordan"
    );
    assert.equal(tasks.status, 200);
    assert.equal(tasks.body.data.length, 0);
  } finally {
    server.close();
    await once(server, "close");
  }
});
