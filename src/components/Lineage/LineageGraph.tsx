import { useMemo } from 'react';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';
import { buildLineageLayout, type LineageLayoutNode } from './lineageLayout';

interface LineageGraphProps {
  child: Claw;
  allClaws: Claw[];
}

function nodeRole(node: LineageLayoutNode) {
  if (node.depth === 0) return 'Child';
  if (node.depth === 1) return node.parentOrigin === 'parentA' ? 'Parent A' : 'Parent B';
  return `Gen-${node.claw.generation}`;
}

function itemsForDimension(child: Claw, dimension: 'identity' | 'soul' | 'skills' | 'tools') {
  const inheritanceMap = child.lineage?.inheritanceMap ?? [];
  return Array.from(
    new Set(
      inheritanceMap
        .filter((record) => {
          if (dimension === 'skills') return record.type === 'skill';
          if (dimension === 'tools') return record.type === 'tool';
          return record.type === dimension;
        })
        .map((record) => record.label),
    ),
  );
}

function NodeCard({ node }: { node: LineageLayoutNode }) {
  return (
    <div
      className={`absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-3 backdrop-blur md:w-52 ${
        node.depth === 0
          ? 'border-amber/40 bg-jungle-800 shadow-amber'
          : 'border-jungle-700/60 bg-jungle-900'
      }`}
      style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
    >
      <div className="flex items-center gap-2">
        <ClawAvatar visual={node.claw.visual} name={node.claw.name} size={56} pulse={node.depth === 0} />
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{nodeRole(node)}</div>
          <div className="truncate font-display text-2xl text-bone">{node.claw.name}</div>
          <div className="text-xs text-bone-muted">Gen {node.claw.generation}</div>
        </div>
      </div>
    </div>
  );
}

export function LineageGraph({ child, allClaws }: LineageGraphProps) {
  const layout = useMemo(() => buildLineageLayout(child, allClaws), [allClaws, child]);
  const canvasHeight = Math.max(450, 220 + layout.maxDepth * 180);
  const nodeLookup = new Map(layout.nodes.map((node) => [node.key, node]));
  const dimensionGroups = [
    { dimension: 'Identity', items: itemsForDimension(child, 'identity') },
    { dimension: 'Soul', items: itemsForDimension(child, 'soul') },
    { dimension: 'Skills', items: itemsForDimension(child, 'skills') },
    { dimension: 'Tools', items: itemsForDimension(child, 'tools') },
  ].filter((group) => group.items.length > 0);
  const doctrine = child.lineage?.doctrine;
  const breedingConversation = child.lineage?.breedingConversation ?? [];

  return (
    <section className="space-y-4">
      {/* Stats + dimensions */}
      <div className="jp-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-2xl text-bone">{layout.maxDepth + 1} generations</span>
          <span className="jp-pill">{layout.nodes.length} nodes</span>
          <span className="jp-pill">{layout.edges.length} links</span>
        </div>

        {dimensionGroups.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {dimensionGroups.map((group) => (
              <div key={group.dimension} className="rounded-md border border-jungle-700/40 bg-jungle-950 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{group.dimension}</div>
                <div className="mt-1 text-[10px] text-bone-muted">Inherited / fused / mutated</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border border-jungle-600/30 bg-jungle-900 px-2 py-0.5 text-[10px] text-bone-dim">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {doctrine && (
          <div className="mt-4 rounded-md border border-amber/30 bg-amber/5 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber">{doctrine.title}</div>
            <div className="mt-1 text-sm font-semibold text-bone">{doctrine.creed}</div>
          </div>
        )}
      </div>

      {/* Graph canvas */}
      <div className="rounded-lg border border-jungle-700/60 bg-jungle-950 p-3 md:p-4">
        <div className="relative overflow-x-auto rounded-lg border border-jungle-800 bg-jungle-950" style={{ minHeight: `${canvasHeight}px` }}>
          <div className="relative min-w-[50rem] md:min-w-[58rem]" style={{ height: `${canvasHeight}px` }}>
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${canvasHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineage-edge" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#D4A537" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#4F7942" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {layout.edges.map((edge) => {
                const from = nodeLookup.get(edge.from);
                const to = nodeLookup.get(edge.to);
                if (!from || !to) return null;
                const startX = from.x * 1000;
                const startY = from.y * canvasHeight;
                const endX = to.x * 1000;
                const endY = to.y * canvasHeight;
                const controlY = startY + (endY - startY) * 0.5;

                return (
                  <path
                    key={`${edge.from}-${edge.to}`}
                    d={`M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="url(#lineage-edge)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {layout.nodes.map((node) => (
              <NodeCard key={node.key} node={node} />
            ))}
          </div>
        </div>
      </div>

      {breedingConversation.length > 0 && (
        <div className="jp-card p-4">
          <div className="jp-label">Breeding transcript</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {breedingConversation.map((turn) => (
              <div key={turn.id} className="rounded-md border border-jungle-700/40 bg-jungle-950 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{turn.title}</div>
                <div className="mt-1 text-sm text-bone-dim">{turn.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
