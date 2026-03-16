import React, { useCallback, useMemo, useRef, useEffect } from 'react';
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

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  if (!nodes || !nodes.length) return { nodes: [], edges: edges || [] };

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
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

const FamilyTree = ({ nodes: incomingNodes = [], edges: incomingEdges = [], onNodeClick }) => {
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

    const formattedEdges = incomingEdges.map(edge => ({
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

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(formattedNodes, formattedEdges);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [incomingNodes, incomingEdges, setNodes, setEdges]);

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
