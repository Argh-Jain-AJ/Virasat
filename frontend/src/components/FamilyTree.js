import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import PersonNode from './PersonNode';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 130;
const H_GAP = 100;   // horizontal gap between sibling nodes
const V_GAP = 220;   // vertical gap between generations

/**
 * Custom family-aware layout:
 * 1. Build parent->children adjacency from 'parent'/'child' edges.
 * 2. BFS from root nodes to assign each person a strict generation number.
 * 3. Propagate same generation to spouses/siblings.
 * 4. Group by generation and distribute evenly on X axis.
 */
function computeFamilyLayout(nodes, edges) {
  const ids = nodes.map(n => n.id);
  
  // Build adjacency: parent -> [children]
  // An edge "person1 IS parent OF person2" means person1.gen + 1 = person2.gen
  const parentOf = {};   // parentOf[id] = [childId, ...]
  const childOf = {};    // childOf[id] = [parentId, ...]
  const sameGen = {};    // sameGen[id] = [siblingId/spouseId, ...]

  ids.forEach(id => {
    parentOf[id] = [];
    childOf[id] = [];
    sameGen[id] = [];
  });

  edges.forEach(e => {
    const type = e.data?.relationship_type;
    const src = e.source;
    const tgt = e.target;
    if (!ids.includes(src) || !ids.includes(tgt)) return;

    if (type === 'parent') {
      // src is parent of tgt
      parentOf[src].push(tgt);
      childOf[tgt].push(src);
    } else if (type === 'child') {
      // src is child of tgt
      parentOf[tgt].push(src);
      childOf[src].push(tgt);
    } else if (type === 'spouse' || type === 'sibling') {
      sameGen[src].push(tgt);
      sameGen[tgt].push(src);
    }
  });

  // Find roots: nodes that have no parents
  const hasParent = new Set();
  ids.forEach(id => { if (childOf[id].length > 0) hasParent.add(id); });
  let roots = ids.filter(id => !hasParent.has(id));
  if (roots.length === 0) roots = [ids[0]];

  // BFS to assign generations
  const genMap = {};
  ids.forEach(id => { genMap[id] = null; });

  const queue = roots.map(r => ({ id: r, gen: 0 }));

  while (queue.length > 0) {
    const { id, gen } = queue.shift();
    if (genMap[id] !== null) continue;
    genMap[id] = gen;

    // Children are one generation below
    parentOf[id].forEach(childId => {
      if (genMap[childId] === null) {
        queue.push({ id: childId, gen: gen + 1 });
      }
    });
    // Spouses/siblings are at the same generation
    sameGen[id].forEach(peerId => {
      if (genMap[peerId] === null) {
        queue.push({ id: peerId, gen: gen });
      }
    });
    // Parents are one generation above
    childOf[id].forEach(parentId => {
      if (genMap[parentId] === null) {
        queue.push({ id: parentId, gen: gen - 1 });
      }
    });
  }

  // Assign gen 0 to any disconnected nodes
  ids.forEach(id => { if (genMap[id] === null) genMap[id] = 0; });

  // Normalize: shift so min generation is 0
  const minGen = Math.min(...Object.values(genMap));
  ids.forEach(id => { genMap[id] -= minGen; });

  // Group nodes by generation
  const genGroups = {};
  ids.forEach(id => {
    const g = genMap[id];
    if (!genGroups[g]) genGroups[g] = [];
    genGroups[g].push(id);
  });

  // Assign X positions within each generation row (evenly spaced, centered)
  const positions = {};
  Object.entries(genGroups).forEach(([gen, members]) => {
    const totalWidth = members.length * NODE_WIDTH + (members.length - 1) * H_GAP;
    const startX = -totalWidth / 2;
    members.forEach((id, i) => {
      positions[id] = {
        x: startX + i * (NODE_WIDTH + H_GAP),
        y: Number(gen) * (NODE_HEIGHT + V_GAP),
      };
    });
  });

  return positions;
}

// Auto-zooms after layout settles
const LayoutUpdater = ({ nodesCount, edgesCount }) => {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodesCount > 0) {
      setTimeout(() => fitView({ duration: 800, padding: 0.25, maxZoom: 1 }), 100);
    }
  }, [nodesCount, edgesCount, fitView]);
  return null;
};

const FamilyTreeInner = ({ nodes: incomingNodes = [], edges: incomingEdges = [], onNodeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!incomingNodes || incomingNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const formattedNodes = incomingNodes.map(node => ({
      ...node,
      type: 'personNode',
    }));

    const formattedEdges = incomingEdges.map(edge => {
      const isHorizontal = edge.data?.relationship_type === 'spouse' || edge.data?.relationship_type === 'sibling';
      return {
        ...edge,
        label: edge.label,
        type: isHorizontal ? 'straight' : 'smoothstep',
        animated: !isHorizontal,
        labelStyle: { fill: isHorizontal ? '#f43f5e' : '#a3a3a3', fontWeight: 700, fontSize: 11 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#111', fillOpacity: 0.9, stroke: '#333', strokeWidth: 1 },
        markerEnd: isHorizontal ? undefined : {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#6b7280',
        },
        style: { 
          stroke: isHorizontal ? '#f43f5e' : '#6b7280', 
          strokeWidth: isHorizontal ? 2 : 2,
          strokeDasharray: isHorizontal ? '6,4' : '0'
        }
      };
    });

    // Compute our custom positions
    const positions = computeFamilyLayout(formattedNodes, formattedEdges);

    const layoutedNodes = formattedNodes.map(node => ({
      ...node,
      position: positions[node.id] || { x: 0, y: 0 },
    }));

    setNodes(layoutedNodes);
    setEdges(formattedEdges);
  }, [incomingNodes, incomingEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ personNode: PersonNode }), []);

  const handleNodeClick = (_, node) => {
    if (onNodeClick && node.data?.person?.id) {
      onNodeClick(node.data.person.id);
    }
  };

  const reactFlowWrapper = useRef(null);

  const onExportClick = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    toPng(reactFlowWrapper.current, {
      backgroundColor: '#0a0a0a',
      width: reactFlowWrapper.current.offsetWidth,
      height: reactFlowWrapper.current.offsetHeight,
      style: { width: '100%', height: '100%' },
    })
    .then(dataUrl => {
      const link = document.createElement('a');
      link.download = 'KINSphere-Lineage-Export.png';
      link.href = dataUrl;
      link.click();
    })
    .catch(err => console.error('Export error:', err));
  }, []);

  return (
    <div
      className="relative w-full h-full border border-white/10 rounded-2xl bg-black/60 backdrop-blur-xl overflow-hidden"
      ref={reactFlowWrapper}
    >
      <button 
        onClick={onExportClick} 
        className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md hover:bg-rose-600 hover:border-rose-500 transition-all duration-300"
      >
        Export as PNG
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        nodesDraggable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        minZoom={0.05}
        maxZoom={2}
      >
        <LayoutUpdater nodesCount={nodes.length} edgesCount={edges.length} />
        <Controls className="bg-black/50 border-white/10 fill-white" />
        <Background color="#222" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};

const FamilyTree = (props) => (
  <ReactFlowProvider>
    <FamilyTreeInner {...props} />
  </ReactFlowProvider>
);

export default FamilyTree;
