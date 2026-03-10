import type { Claw, InheritanceRecord, TraitOrigin } from '../../types/claw';

type ParentOrigin = 'parentA' | 'parentB';

const PARENT_ORIGINS: ParentOrigin[] = ['parentA', 'parentB'];

export interface LineageLayoutNode {
  key: string;
  branchKey: string;
  clawId: string;
  claw: Claw;
  depth: number;
  x: number;
  y: number;
  parentOrigin?: ParentOrigin;
}

export interface LineageLayoutEdge {
  from: string;
  to: string;
  origin: ParentOrigin;
}

export interface LineageSummaryGroup {
  origin: TraitOrigin;
  label: string;
  items: string[];
}

export interface LineageLayout {
  nodes: LineageLayoutNode[];
  edges: LineageLayoutEdge[];
  groups: LineageSummaryGroup[];
  maxDepth: number;
  rows: number;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function groupLabels(records: InheritanceRecord[], origin: TraitOrigin) {
  return unique(records.filter((record) => record.origin === origin).map((record) => record.label));
}

function emptyLayout(): LineageLayout {
  return {
    nodes: [],
    edges: [],
    groups: [],
    maxDepth: 0,
    rows: 0,
  };
}

export function buildLineageLayout(childOrId: Claw | string, claws: Claw[]): LineageLayout {
  const clawById = new Map<string, Claw>();

  claws.forEach((claw) => {
    clawById.set(claw.id, claw);
  });

  const child = typeof childOrId === 'string' ? clawById.get(childOrId) : childOrId;
  if (!child) {
    return emptyLayout();
  }

  clawById.set(child.id, child);

  const rows = new Map<number, LineageLayoutNode[]>();
  const edges: LineageLayoutEdge[] = [];

  const visit = (
    claw: Claw,
    key: string,
    branchKey: string,
    depth: number,
    seen: Set<string>,
    parentOrigin?: ParentOrigin,
  ) => {
    const node: LineageLayoutNode = {
      key,
      branchKey,
      clawId: claw.id,
      claw,
      depth,
      x: 0.5,
      y: 0.5,
      parentOrigin,
    };

    rows.set(depth, [...(rows.get(depth) ?? []), node]);

    if (!claw.lineage) {
      return;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(claw.id);

    PARENT_ORIGINS.forEach((origin) => {
      const parentId = claw.lineage?.[origin];
      if (!parentId || nextSeen.has(parentId)) {
        return;
      }

      const parent = clawById.get(parentId);
      if (!parent) {
        return;
      }

      const parentKey = key === 'root' ? origin : `${key}.${origin}`;
      const nextBranch = `${branchKey}${origin === 'parentA' ? '0' : '1'}`;
      edges.push({ from: parentKey, to: key, origin });
      visit(parent, parentKey, nextBranch, depth + 1, nextSeen, origin);
    });
  };

  visit(child, 'root', '', 0, new Set<string>());

  const maxDepth = Math.max(...rows.keys(), 0);
  const orderedNodes = Array.from(rows.entries())
    .sort(([depthA], [depthB]) => depthA - depthB)
    .flatMap(([, row]) => {
      const sorted = [...row].sort((left, right) => left.branchKey.localeCompare(right.branchKey));
      return sorted.map((node, index) => ({
        ...node,
        x: (index + 1) / (sorted.length + 1),
        y: maxDepth === 0 ? 0.5 : (maxDepth - node.depth + 0.5) / (maxDepth + 1),
      }));
    });

  const groups = [
    { origin: 'parentA', label: 'From Parent A', items: groupLabels(child.lineage?.inheritanceMap ?? [], 'parentA') },
    { origin: 'parentB', label: 'From Parent B', items: groupLabels(child.lineage?.inheritanceMap ?? [], 'parentB') },
    { origin: 'both', label: 'Shared', items: groupLabels(child.lineage?.inheritanceMap ?? [], 'both') },
    { origin: 'mutation', label: 'Mutation', items: groupLabels(child.lineage?.inheritanceMap ?? [], 'mutation') },
  ].filter((group): group is LineageSummaryGroup => group.items.length > 0);

  return {
    nodes: orderedNodes,
    edges,
    groups,
    maxDepth,
    rows: maxDepth + 1,
  };
}
