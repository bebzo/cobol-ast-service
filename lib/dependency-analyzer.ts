/**
 * CodeSwitch v7.0 - Dependency Analyzer
 * 
 * Features:
 * 1. Cyclic dependency detection
 * 2. Call graph generation
 * 3. Module dependency mapping
 * 4. Impact analysis
 */

export interface DependencyNode {
  id: string;
  name: string;
  type: 'program' | 'section' | 'paragraph' | 'copybook' | 'external';
  file?: string;
  line?: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'call' | 'copy' | 'perform' | 'reference';
  line?: number;
  weight?: number;
}

export interface CyclicDependency {
  cycle: string[];
  severity: 'critical' | 'warning' | 'info';
  suggestion: string;
}

export interface CallGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: CyclicDependency[];
  entryPoints: string[];
  leafNodes: string[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    avgConnections: number;
    cyclomaticComplexity: number;
  };
}

/**
 * Analyze COBOL code for dependencies
 */
export function analyzeCobolDependencies(cobolCode: string): CallGraph {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const nodeMap = new Map<string, DependencyNode>();

  const lines = cobolCode.split('\n');
  let currentSection = '';
  let currentParagraph = '';

  // Extract PROGRAM-ID
  const programMatch = cobolCode.match(/PROGRAM-ID\.\s*(\w+)/i);
  const programId = programMatch ? programMatch[1] : 'MAIN';
  
  const mainNode: DependencyNode = {
    id: programId,
    name: programId,
    type: 'program',
    line: 1
  };
  nodes.push(mainNode);
  nodeMap.set(programId, mainNode);

  // Parse code
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim().toUpperCase();

    // Section detection
    const sectionMatch = trimmed.match(/^(\w+)\s+SECTION\./);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      const node: DependencyNode = {
        id: currentSection,
        name: currentSection,
        type: 'section',
        line: lineNum
      };
      if (!nodeMap.has(currentSection)) {
        nodes.push(node);
        nodeMap.set(currentSection, node);
      }
    }

    // Paragraph detection
    const paragraphMatch = trimmed.match(/^(\w+[-\w]*)\./);
    if (paragraphMatch && !trimmed.includes('DIVISION') && !trimmed.includes('SECTION')) {
      const name = paragraphMatch[1];
      if (name !== 'PROGRAM-ID' && name !== 'AUTHOR' && !name.includes('PIC')) {
        currentParagraph = name;
        const node: DependencyNode = {
          id: name,
          name: name,
          type: 'paragraph',
          line: lineNum
        };
        if (!nodeMap.has(name)) {
          nodes.push(node);
          nodeMap.set(name, node);
        }
      }
    }

    // PERFORM detection
    const performMatch = trimmed.match(/PERFORM\s+(\w+[-\w]*)/);
    if (performMatch) {
      const target = performMatch[1];
      const source = currentParagraph || currentSection || programId;
      
      if (!nodeMap.has(target)) {
        const node: DependencyNode = {
          id: target,
          name: target,
          type: 'paragraph'
        };
        nodes.push(node);
        nodeMap.set(target, node);
      }

      edges.push({
        from: source,
        to: target,
        type: 'perform',
        line: lineNum
      });
    }

    // CALL detection
    const callMatch = trimmed.match(/CALL\s+['"]?(\w+)['"]?/);
    if (callMatch) {
      const target = callMatch[1];
      const source = currentParagraph || currentSection || programId;
      
      if (!nodeMap.has(target)) {
        const node: DependencyNode = {
          id: target,
          name: target,
          type: 'external'
        };
        nodes.push(node);
        nodeMap.set(target, node);
      }

      edges.push({
        from: source,
        to: target,
        type: 'call',
        line: lineNum
      });
    }

    // COPY detection
    const copyMatch = trimmed.match(/COPY\s+(\w+)/);
    if (copyMatch) {
      const target = copyMatch[1];
      
      if (!nodeMap.has(target)) {
        const node: DependencyNode = {
          id: target,
          name: target,
          type: 'copybook'
        };
        nodes.push(node);
        nodeMap.set(target, node);
      }

      edges.push({
        from: programId,
        to: target,
        type: 'copy',
        line: lineNum
      });
    }
  });

  // Detect cycles
  const cycles = detectCycles(nodes, edges);

  // Find entry points (nodes with no incoming edges)
  const targets = new Set(edges.map(e => e.to));
  const entryPoints = nodes
    .filter(n => !targets.has(n.id) && n.type !== 'copybook')
    .map(n => n.id);

  // Find leaf nodes (nodes with no outgoing edges)
  const sources = new Set(edges.map(e => e.from));
  const leafNodes = nodes
    .filter(n => !sources.has(n.id))
    .map(n => n.id);

  // Calculate metrics
  const maxDepth = calculateMaxDepth(nodes, edges, entryPoints[0] || programId);
  const avgConnections = edges.length / Math.max(nodes.length, 1);
  const cyclomaticComplexity = edges.length - nodes.length + 2;

  return {
    nodes,
    edges,
    cycles,
    entryPoints,
    leafNodes,
    metrics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      maxDepth,
      avgConnections: Math.round(avgConnections * 100) / 100,
      cyclomaticComplexity: Math.max(1, cyclomaticComplexity)
    }
  };
}

/**
 * Detect cyclic dependencies using DFS
 */
function detectCycles(nodes: DependencyNode[], edges: DependencyEdge[]): CyclicDependency[] {
  const cycles: CyclicDependency[] = [];
  const adjacency = new Map<string, string[]>();

  // Build adjacency list
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => {
    const adj = adjacency.get(e.from);
    if (adj) adj.push(e.to);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycle.push(neighbor); // Complete the cycle
        
        const severity = cycle.length > 3 ? 'critical' : 'warning';
        cycles.push({
          cycle,
          severity,
          suggestion: generateCycleSuggestion(cycle)
        });
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return cycles;
}

/**
 * Generate suggestion for breaking a cycle
 */
function generateCycleSuggestion(cycle: string[]): string {
  if (cycle.length <= 2) {
    return `Direct recursion in ${cycle[0]}. Consider adding a termination condition.`;
  }
  if (cycle.length === 3) {
    return `Mutual dependency between ${cycle[0]} and ${cycle[1]}. Consider extracting shared logic.`;
  }
  return `Complex cycle involving ${cycle.length - 1} modules. Consider introducing an intermediary service or refactoring to break the dependency chain.`;
}

/**
 * Calculate maximum call depth
 */
function calculateMaxDepth(
  nodes: DependencyNode[],
  edges: DependencyEdge[],
  startNode: string
): number {
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => {
    const adj = adjacency.get(e.from);
    if (adj) adj.push(e.to);
  });

  const visited = new Set<string>();
  
  function getDepth(nodeId: string, currentDepth: number): number {
    if (visited.has(nodeId)) return currentDepth;
    visited.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    if (neighbors.length === 0) return currentDepth;

    let maxChildDepth = currentDepth;
    for (const neighbor of neighbors) {
      const childDepth = getDepth(neighbor, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    visited.delete(nodeId);
    return maxChildDepth;
  }

  return getDepth(startNode, 1);
}

/**
 * Generate Mermaid diagram for call graph
 */
export function generateMermaidGraph(graph: CallGraph): string {
  let mermaid = 'flowchart TD\n';

  // Style definitions
  mermaid += '  classDef program fill:#4f46e5,stroke:#312e81,color:#fff\n';
  mermaid += '  classDef section fill:#0891b2,stroke:#155e75,color:#fff\n';
  mermaid += '  classDef paragraph fill:#16a34a,stroke:#166534,color:#fff\n';
  mermaid += '  classDef external fill:#dc2626,stroke:#991b1b,color:#fff\n';
  mermaid += '  classDef copybook fill:#ca8a04,stroke:#854d0e,color:#fff\n';
  mermaid += '  classDef cycle fill:#ef4444,stroke:#b91c1c,color:#fff,stroke-width:3px\n\n';

  // Nodes
  graph.nodes.forEach(node => {
    const shape = node.type === 'program' ? `((${node.name}))` :
                  node.type === 'external' ? `[/${node.name}/]` :
                  node.type === 'copybook' ? `[(${node.name})]` :
                  `[${node.name}]`;
    mermaid += `  ${node.id}${shape}\n`;
  });

  mermaid += '\n';

  // Edges
  graph.edges.forEach(edge => {
    const arrow = edge.type === 'call' ? '==>' :
                  edge.type === 'copy' ? '-..->' :
                  '-->';
    const label = edge.type !== 'perform' ? `|${edge.type}|` : '';
    mermaid += `  ${edge.from} ${arrow}${label} ${edge.to}\n`;
  });

  mermaid += '\n';

  // Apply classes
  graph.nodes.forEach(node => {
    const inCycle = graph.cycles.some(c => c.cycle.includes(node.id));
    const className = inCycle ? 'cycle' : node.type;
    mermaid += `  class ${node.id} ${className}\n`;
  });

  return mermaid;
}

/**
 * Analyze impact of changing a node
 */
export function analyzeImpact(graph: CallGraph, nodeId: string): {
  directlyAffected: string[];
  indirectlyAffected: string[];
  totalImpact: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const directlyAffected: string[] = [];
  const indirectlyAffected: string[] = [];

  // Find all nodes that call this node (reverse edges)
  graph.edges.forEach(edge => {
    if (edge.to === nodeId) {
      directlyAffected.push(edge.from);
    }
  });

  // Find indirect callers (BFS)
  const visited = new Set<string>([nodeId, ...directlyAffected]);
  const queue = [...directlyAffected];

  while (queue.length > 0) {
    const current = queue.shift()!;
    graph.edges.forEach(edge => {
      if (edge.to === current && !visited.has(edge.from)) {
        visited.add(edge.from);
        indirectlyAffected.push(edge.from);
        queue.push(edge.from);
      }
    });
  }

  const totalImpact = directlyAffected.length + indirectlyAffected.length;
  const impactRatio = totalImpact / Math.max(graph.nodes.length, 1);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (impactRatio > 0.5) riskLevel = 'critical';
  else if (impactRatio > 0.3) riskLevel = 'high';
  else if (impactRatio > 0.1) riskLevel = 'medium';

  return {
    directlyAffected,
    indirectlyAffected,
    totalImpact,
    riskLevel
  };
}

/**
 * Format dependency analysis report
 */
export function formatDependencyReport(graph: CallGraph): string {
  let report = `# Dependency Analysis Report\n\n`;

  report += `## Overview\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Nodes | ${graph.metrics.totalNodes} |\n`;
  report += `| Total Edges | ${graph.metrics.totalEdges} |\n`;
  report += `| Max Depth | ${graph.metrics.maxDepth} |\n`;
  report += `| Avg Connections | ${graph.metrics.avgConnections} |\n`;
  report += `| Cyclomatic Complexity | ${graph.metrics.cyclomaticComplexity} |\n\n`;

  report += `## Entry Points\n`;
  graph.entryPoints.forEach(ep => {
    report += `- ${ep}\n`;
  });
  report += '\n';

  report += `## Leaf Nodes\n`;
  graph.leafNodes.forEach(ln => {
    report += `- ${ln}\n`;
  });
  report += '\n';

  if (graph.cycles.length > 0) {
    report += `## Cyclic Dependencies (${graph.cycles.length})\n\n`;
    graph.cycles.forEach((cycle, idx) => {
      report += `### Cycle ${idx + 1} (${cycle.severity})\n`;
      report += `**Path:** ${cycle.cycle.join(' → ')}\n`;
      report += `**Suggestion:** ${cycle.suggestion}\n\n`;
    });
  } else {
    report += `## Cyclic Dependencies\n`;
    report += `No cyclic dependencies detected.\n\n`;
  }

  return report;
}
