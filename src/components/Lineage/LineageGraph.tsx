import { useMemo } from 'react';
import { GitBranchPlus, ShieldAlert } from 'lucide-react';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';
import { buildLineageLayout, type LineageLayoutNode } from './lineageLayout';

interface LineageGraphProps {
  child: Claw;
  allClaws: Claw[];
}

function nodeRole(node: LineageLayoutNode) {
  if (node.depth === 0) {
    return 'Current child';
  }
  if (node.depth === 1) {
    return node.parentOrigin === 'parentA' ? 'Parent A' : 'Parent B';
  }
  return `Gen-${node.claw.generation} ancestor`;
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
      className={`absolute w-48 -translate-x-1/2 -translate-y-1/2 rounded-[1rem] border p-4 shadow-float backdrop-blur md:w-56 ${
        node.depth === 0
          ? 'border-[#8c6731] bg-[linear-gradient(180deg,rgba(45,58,47,0.96),rgba(20,28,22,0.96))] shadow-candy'
          : 'border-[#334239] bg-[#172019]'
      }`}
      style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-[0.85rem] border border-[#334239] bg-[#111813] p-2 shadow-glow">
          <ClawAvatar visual={node.claw.visual} name={node.claw.name} size={72} pulse={node.depth === 0} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8aa07b]">{nodeRole(node)}</div>
          <div className="mt-1 truncate font-display text-3xl leading-none text-ink">{node.claw.name}</div>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b8c49e]">Gen {node.claw.generation}</div>
        </div>
      </div>
    </div>
  );
}

export function LineageGraph({ child, allClaws }: LineageGraphProps) {
  const layout = useMemo(() => buildLineageLayout(child, allClaws), [allClaws, child]);
  const canvasHeight = Math.max(500, 250 + layout.maxDepth * 190);
  const nodeLookup = new Map(layout.nodes.map((node) => [node.key, node]));
  const dimensionGroups = [
    { dimension: 'Identity', items: itemsForDimension(child, 'identity') },
    { dimension: 'Soul', items: itemsForDimension(child, 'soul') },
    { dimension: 'Skills', items: itemsForDimension(child, 'skills') },
    { dimension: 'Tools', items: itemsForDimension(child, 'tools') },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="space-y-5">
      <div className="shell-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#8aa07b]">Lineage map</div>
            <h2 className="mt-3 font-display text-4xl leading-none text-ink md:text-5xl">{layout.maxDepth + 1} generations</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="candy-pill">
              <GitBranchPlus className="h-3.5 w-3.5 text-butter" />
              {layout.nodes.length} nodes
            </div>
            <div className="candy-pill">
              <ShieldAlert className="h-3.5 w-3.5 text-sky" />
              {layout.edges.length} links
            </div>
          </div>
        </div>

        {dimensionGroups.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dimensionGroups.map((group) => (
              <div key={group.dimension} className="rounded-[0.9rem] border border-[#3b4332] bg-[#171d16] p-4 shadow-glow">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8aa07b]">{group.dimension}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#7f8e71]">Inherited / fused / mutated</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border border-[#334239] bg-[#101612] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d6dfbf]">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1rem] border border-[#334239] bg-[linear-gradient(180deg,rgba(18,27,22,0.92),rgba(11,18,15,0.96))] p-3 shadow-float md:p-6">
        <div className="relative overflow-x-auto rounded-[1rem] border border-[#253028] bg-[#101612]" style={{ minHeight: `${canvasHeight}px` }}>
          <div className="relative min-w-[54rem] md:min-w-[62rem]" style={{ height: `${canvasHeight}px` }}>
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${canvasHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineage-edge" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#d7b36a" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#78b8a7" stopOpacity="0.45" />
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
                    strokeWidth="4"
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
    </section>
  );
}
