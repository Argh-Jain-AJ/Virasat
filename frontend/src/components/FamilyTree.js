import React, { useCallback, useMemo, useRef } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import PersonNode from './PersonNode';

// Configure Dagre layout instance
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

// Auto-align nodes hierarchically using Dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  if (!nodes.length) return { nodes, edges };

  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,
    ranksep: 120
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Center the node
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

const FamilyTree = ({ initialNodes = [], initialEdges = [], onNodeClick }) => {
  // Add label mapping and styling to incoming edges
  const formattedEdges = initialEdges.map(edge => ({
    ...edge,
    label: edge.data?.relationship_type || edge.label,
    labelStyle: { fill: '#333', fontWeight: 700 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#aaa',
    },
    style: { stroke: '#aaa', strokeWidth: 2 }
  }));

  // Add custom node bindings to incoming nodes
  const formattedNodes = initialNodes.map(node => ({
    ...node,
    type: 'personNode',
  }));

  // Perform layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(formattedNodes, formattedEdges);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Re-layout if initial props change
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
      initialNodes.map(n => ({ ...n, type: 'personNode' })),
      initialEdges.map(e => ({
        ...e,
        label: e.data?.relationship_type || e.label,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#aaa', strokeWidth: 2 }
      }))
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Hook up our custom node type
  const nodeTypes = useMemo(() => ({ personNode: PersonNode }), []);

  const handleNodeClick = (_, node) => {
    if (onNodeClick && node.data?.person?.id) {
      onNodeClick(node.data.person.id);
    }
  };

  const reactFlowWrapper = useRef(null);

  const onExportClick = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    toPng(reactFlowWrapper.current, {
      backgroundColor: '#f9f9f9',
      width: reactFlowWrapper.current.offsetWidth,
      height: reactFlowWrapper.current.offsetHeight,
      style: {
        width: '100%',
        height: '100%',
      },
    })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'family-tree-export.png';
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => console.error('Error exporting graph as image:', err));
  }, []);

  return (
    <div className="relative w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50" ref={reactFlowWrapper}>
      {/* Export Button Overlay */}
      <button 
        onClick={onExportClick} 
        className="absolute top-4 right-4 z-10 bg-white border border-gray-300 shadow-sm text-gray-700 px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 transition"
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
        nodesDraggable={true}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <MiniMap zoomable pannable />
        <Controls />
        <Background color="#ccc" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;
