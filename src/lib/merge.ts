// Three-way merge for property documents.
//
// A property is saved as one JSON document, and every edit used to replace the
// whole thing with whatever the editing phone last loaded — so a phone holding
// a stale copy silently wiped out everyone else's changes. Merging instead
// compares three versions:
//   base   — the copy the editor started from
//   mine   — the copy after the editor's change
//   theirs — what the server holds now (other people's changes included)
// and keeps both sides' changes. Only when both sides changed the very same
// field to different values does one have to win; the save that lands last does.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

// JSON.stringify with keys sorted and undefined dropped, so equal content
// compares equal whatever order Postgres (jsonb) or the client put keys in.
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (isObj(value)) {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

const same = (a: unknown, b: unknown) => stable(a) === stable(b);

// Identifies an array item across the three versions: rooms and log entries by
// id, equipment by name (that's how the app addresses it), anything else
// (photo URLs, …) by its content. Repeats get an occurrence suffix so two
// items sharing a key still line up one-to-one.
function indexItems(items: unknown[], field: string): Map<string, unknown> {
  const seen = new Map<string, number>();
  const out = new Map<string, unknown>();
  for (const item of items) {
    let key: string;
    if (isObj(item) && typeof item.id === "string") key = `id:${item.id}`;
    else if (field === "equipment" && isObj(item) && typeof item.name === "string") key = `name:${item.name}`;
    else key = `json:${stable(item)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    out.set(`${key}#${n}`, item);
  }
  return out;
}

function mergeArrays(base: unknown[], mine: unknown[], theirs: unknown[], field: string): unknown[] {
  const b = indexItems(base, field);
  const m = indexItems(mine, field);
  const t = indexItems(theirs, field);
  const out: unknown[] = [];

  // Their order is the backbone; my additions follow.
  for (const [key, theirItem] of Array.from(t)) {
    if (m.has(key)) {
      out.push(merge3(b.get(key), m.get(key), theirItem, field));
    } else if (b.has(key)) {
      // I removed it. If they edited it meanwhile, their edit beats my delete.
      if (!same(b.get(key), theirItem)) out.push(theirItem);
    } else {
      out.push(theirItem); // they added it
    }
  }
  for (const [key, myItem] of Array.from(m)) {
    if (t.has(key)) continue;
    if (!b.has(key)) out.push(myItem); // I added it
    else if (!same(b.get(key), myItem)) out.push(myItem); // they removed it, but I edited it — keep my edit
  }
  return out;
}

export function merge3(base: unknown, mine: unknown, theirs: unknown, field = ""): unknown {
  if (same(mine, base)) return theirs; // I didn't change this part
  if (same(theirs, base)) return mine; // they didn't
  if (same(mine, theirs)) return mine; // we agree

  if (isObj(mine) && isObj(theirs) && (isObj(base) || base === undefined)) {
    const b = (base ?? {}) as Obj;
    const out: Obj = {};
    for (const key of Array.from(new Set([...Object.keys(b), ...Object.keys(mine), ...Object.keys(theirs)]))) {
      const merged = merge3(b[key], mine[key], theirs[key], key);
      if (merged !== undefined) out[key] = merged;
    }
    return out;
  }

  if (Array.isArray(mine) && Array.isArray(theirs) && (Array.isArray(base) || base === undefined)) {
    return mergeArrays((base ?? []) as unknown[], mine, theirs, field);
  }

  // Both sides changed the same value to different things: the save that
  // lands last wins, as it always did — but only for this one field.
  return mine;
}
