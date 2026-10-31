import type { Property } from "@/lib/data";
import { stable } from "@/lib/merge";

const MAX_ISSUE_NOTE = 1000;

// Drops the only two fields a client account is allowed to change.
function withoutIssueFields(p: Property) {
  return {
    ...p,
    rooms: p.rooms.map((r) => ({
      ...r,
      equipment: r.equipment.map(({ issueNote, issueReportedAt, ...rest }) => {
        void issueNote;
        void issueReportedAt;
        return rest;
      }),
    })),
  };
}

// A client account may only report or clear an issue on equipment in a
// property they own: issueNote / issueReportedAt may differ, and nothing else
// — rooms, equipment details, dates, photos, maintenance, assignment, or any
// extra field — may change in the same request. Everything is compared
// rather than trusting the client's word for what changed, and anything not
// explicitly allowed counts as a change.
export function onlyIssueFieldsChanged(existing: Property, next: unknown): boolean {
  const n = next as Property | null;
  if (!n || typeof n !== "object" || !Array.isArray(n.rooms)) return false;
  if (n.rooms.some((r) => !r || !Array.isArray(r.equipment))) return false;

  for (const r of n.rooms) {
    for (const e of r.equipment) {
      if (e.issueNote !== undefined && (typeof e.issueNote !== "string" || e.issueNote.length > MAX_ISSUE_NOTE)) return false;
      if (e.issueReportedAt !== undefined && typeof e.issueReportedAt !== "string") return false;
    }
  }

  return stable(withoutIssueFields(existing)) === stable(withoutIssueFields(n));
}
