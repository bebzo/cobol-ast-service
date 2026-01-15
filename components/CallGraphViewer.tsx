"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  GitBranch,
  AlertTriangle,
  Circle,
  ArrowRight,
  Layers,
  Target,
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  analyzeCobolDependencies,
  generateMermaidGraph,
  analyzeImpact,
  formatDependencyReport,
  CallGraph,
  CyclicDependency,
} from '@/lib/dependency-analyzer';

interface CallGraphViewerProps {
  cobolCode: string;
  onNodeSelect?: (nodeId: string) => void;
}

export default function CallGraphViewer({ cobolCode, onNodeSelect }: CallGraphViewerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCycles, setShowCycles] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'mermaid'>('graph');

  // Analyze dependencies
  const graph = useMemo(() => {
    if (!cobolCode.trim()) return null;
    return analyzeCobolDependencies(cobolCode);
  }, [cobolCode]);

  // Impact analysis for selected node
  const impact = useMemo(() => {
    if (!graph || !selectedNode) return null;
    return analyzeImpact(graph, selectedNode);
  }, [graph, selectedNode]);

  // Mermaid code
  const mermaidCode = useMemo(() => {
    if (!graph) return '';
    return generateMermaidGraph(graph);
  }, [graph]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    onNodeSelect?.(nodeId);
  }, [selectedNode, onNodeSelect]);

  const handleExportReport = useCallback(() => {
    if (!graph) return;
    const report = formatDependencyReport(graph);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dependency_report.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [graph]);

  if (!graph) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 text-center">
        <GitBranch className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">Load COBOL code to analyze dependencies</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-purple-900/30 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Call Graph & Dependencies</h3>
            {graph.cycles.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {graph.cycles.length} cycle(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'graph' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Graph
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('mermaid')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'mermaid' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Mermaid
              </button>
            </div>

            {/* Zoom */}
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={handleExportReport}
              className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
              title="Exporter le rapport"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      {showMetrics && (
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-400">Noeuds:</span>
            <span className="text-white font-medium">{graph.metrics.totalNodes}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-green-400" />
            <span className="text-slate-400">Edges:</span>
            <span className="text-white font-medium">{graph.metrics.totalEdges}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Profondeur max:</span>
            <span className="text-white font-medium">{graph.metrics.maxDepth}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">Complexity:</span>
            <span className="text-white font-medium">{graph.metrics.cyclomaticComplexity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-purple-400" />
            <span className="text-slate-400">Connexions moy:</span>
            <span className="text-white font-medium">{graph.metrics.avgConnections}</span>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 min-h-[400px]">
          {viewMode === 'graph' && (
            <div 
              className="relative w-full h-[500px] bg-slate-950 rounded-lg overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
              style={{ cursor: 'grab' }}
            >
              {/* SVG Graph Visualization - larger viewBox for better scrolling */}
              <svg 
                className="min-w-[1200px] min-h-[800px]" 
                viewBox="0 0 1200 800"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#22d3ee" />
                  </marker>
                  <marker id="arrow-cycle" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                  </marker>
                </defs>

                {/* Render edges */}
                {graph.edges.map((edge, idx) => {
                  const fromNode = graph.nodes.find(n => n.id === edge.from);
                  const toNode = graph.nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const fromIdx = graph.nodes.indexOf(fromNode);
                  const toIdx = graph.nodes.indexOf(toNode);
                  
                  const fromX = 120 + (fromIdx % 5) * 200;
                  const fromY = 80 + Math.floor(fromIdx / 5) * 120;
                  const toX = 120 + (toIdx % 5) * 200;
                  const toY = 80 + Math.floor(toIdx / 5) * 120;

                  const inCycle = graph.cycles.some(c => 
                    c.cycle.includes(edge.from) && c.cycle.includes(edge.to)
                  );

                  return (
                    <g key={idx}>
                      <line
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke={inCycle ? '#ef4444' : '#22d3ee'}
                        strokeWidth={inCycle ? 2 : 1}
                        strokeDasharray={edge.type === 'copy' ? '5,5' : undefined}
                        markerEnd={inCycle ? 'url(#arrow-cycle)' : 'url(#arrow)'}
                        opacity={0.6}
                      />
                    </g>
                  );
                })}

                {/* Render nodes */}
                {graph.nodes.map((node, idx) => {
                  const x = 120 + (idx % 5) * 200;
                  const y = 80 + Math.floor(idx / 5) * 120;
                  const isSelected = selectedNode === node.id;
                  const inCycle = graph.cycles.some(c => c.cycle.includes(node.id));

                  const colors = {
                    program: { fill: '#4f46e5', stroke: '#312e81' },
                    section: { fill: '#0891b2', stroke: '#155e75' },
                    paragraph: { fill: '#16a34a', stroke: '#166534' },
                    external: { fill: '#dc2626', stroke: '#991b1b' },
                    copybook: { fill: '#ca8a04', stroke: '#854d0e' },
                  };

                  const color = colors[node.type] || colors.paragraph;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => handleNodeClick(node.id)}
                    >
                      {/* Node shape */}
                      {node.type === 'program' ? (
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 38 : 34}
                          fill={color.fill}
                          stroke={inCycle ? '#ef4444' : isSelected ? '#fff' : color.stroke}
                          strokeWidth={isSelected ? 3 : inCycle ? 3 : 2}
                        />
                      ) : (
                        <rect
                          x={x - 70}
                          y={y - 24}
                          width={140}
                          height={48}
                          rx={node.type === 'copybook' ? 24 : 8}
                          fill={color.fill}
                          stroke={inCycle ? '#ef4444' : isSelected ? '#fff' : color.stroke}
                          strokeWidth={isSelected ? 3 : inCycle ? 3 : 2}
                        />
                      )}
                      
                      {/* Node label */}
                      <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        className="fill-white text-[13px] font-semibold pointer-events-none"
                      >
                        {node.name.length > 16 ? node.name.slice(0, 14) + '..' : node.name}
                      </text>

                      {/* Cycle indicator */}
                      {inCycle && (
                        <circle cx={x + 55} cy={y - 20} r={10} fill="#ef4444">
                          <title>Dans un cycle</title>
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Entry Points */}
              <div>
                <h4 className="text-sm font-medium text-indigo-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Entry Points
                </h4>
                <div className="flex flex-wrap gap-2">
                  {graph.entryPoints.map(ep => (
                    <span
                      key={ep}
                      className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded cursor-pointer hover:bg-indigo-500/30"
                      onClick={() => handleNodeClick(ep)}
                    >
                      {ep}
                    </span>
                  ))}
                </div>
              </div>

              {/* All Nodes by Type */}
              <div className="grid grid-cols-2 gap-4">
                {(['section', 'paragraph', 'external', 'copybook'] as const).map(type => {
                  const nodesOfType = graph.nodes.filter(n => n.type === type);
                  if (nodesOfType.length === 0) return null;

                  const colors = {
                    section: 'cyan',
                    paragraph: 'green',
                    external: 'red',
                    copybook: 'amber'
                  };
                  const color = colors[type];

                  return (
                    <div key={type}>
                      <h4 className={`text-sm font-medium text-${color}-400 mb-2 capitalize`}>
                        {type}s ({nodesOfType.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {nodesOfType.map(node => {
                          const inCycle = graph.cycles.some(c => c.cycle.includes(node.id));
                          return (
                            <span
                              key={node.id}
                              className={`px-2 py-0.5 text-xs rounded cursor-pointer transition
                                ${inCycle ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500' : `bg-${color}-500/20 text-${color}-300 hover:bg-${color}-500/30`}
                                ${selectedNode === node.id ? 'ring-2 ring-white' : ''}`}
                              onClick={() => handleNodeClick(node.id)}
                            >
                              {node.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leaf Nodes */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Noeuds terminaux ({graph.leafNodes.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {graph.leafNodes.map(ln => (
                    <span
                      key={ln}
                      className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded cursor-pointer hover:bg-slate-600"
                      onClick={() => handleNodeClick(ln)}
                    >
                      {ln}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'mermaid' && (
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto max-h-[400px]">
              <pre>{mermaidCode}</pre>
            </div>
          )}
        </div>

        {/* Side Panel - Cycles & Impact */}
        <div className="w-72 border-l border-slate-700 bg-slate-800/30">
          {/* Cycles Section */}
          {showCycles && graph.cycles.length > 0 && (
            <div className="p-4 border-b border-slate-700">
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cyclic Dependencies
              </h4>
              <div className="space-y-3">
                {graph.cycles.map((cycle, idx) => (
                  <CycleCard key={idx} cycle={cycle} index={idx} onNodeClick={handleNodeClick} />
                ))}
              </div>
            </div>
          )}

          {/* Impact Analysis */}
          {selectedNode && impact && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Analyse d'Impact: {selectedNode}
              </h4>
              
              <div className={`mb-3 px-3 py-2 rounded-lg ${
                impact.riskLevel === 'critical' ? 'bg-red-500/20 text-red-300' :
                impact.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
                impact.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                <div className="text-xs uppercase mb-1">Niveau de risque</div>
                <div className="text-lg font-bold capitalize">{impact.riskLevel}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Impact direct:</span>
                  <span className="text-white ml-2">{impact.directlyAffected.length} module(s)</span>
                </div>
                {impact.directlyAffected.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-2">
                    {impact.directlyAffected.slice(0, 5).map(n => (
                      <span key={n} className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                        {n}
                      </span>
                    ))}
                    {impact.directlyAffected.length > 5 && (
                      <span className="text-slate-500">+{impact.directlyAffected.length - 5}</span>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-slate-400">Impact indirect:</span>
                  <span className="text-white ml-2">{impact.indirectlyAffected.length} module(s)</span>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Impact total:</span>
                  <span className="text-white ml-2 font-medium">
                    {impact.totalImpact} / {graph.nodes.length} ({Math.round(impact.totalImpact / graph.nodes.length * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="p-4 border-t border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Programme</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-slate-300">Section</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-slate-300">Paragraphe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-slate-300">External</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">Copybook</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cycle Card Component
function CycleCard({ 
  cycle, 
  index, 
  onNodeClick 
}: { 
  cycle: CyclicDependency; 
  index: number;
  onNodeClick: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg p-2 ${
      cycle.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
      'bg-amber-500/10 border border-amber-500/30'
    }`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-xs font-medium ${
          cycle.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
        }`}>
          Cycle {index + 1}
        </span>
        <span className="text-xs text-slate-500">{cycle.cycle.length - 1} noeuds</span>
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {cycle.cycle.map((nodeId, idx) => (
              <React.Fragment key={idx}>
                <span 
                  className="px-1.5 py-0.5 bg-slate-700 text-slate-200 text-xs rounded cursor-pointer hover:bg-slate-600"
                  onClick={(e) => { e.stopPropagation(); onNodeClick(nodeId); }}
                >
                  {nodeId}
                </span>
                {idx < cycle.cycle.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic">{cycle.suggestion}</p>
        </div>
      )}
    </div>
  );
}
