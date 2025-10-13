'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import dagre from 'dagre';

interface Monitor {
  id: string;
  name: string;
  status: string;
}

interface Dependency {
  id: string;
  monitorId: string;
  dependsOnId: string;
  required: boolean;
}

interface DependencyGraphProps {
  monitors: Monitor[];
  dependencies: Dependency[];
}

// Status color mapping
const statusColors = {
  OK: '#10B981', // green-500
  LATE: '#F59E0B', // yellow-500
  MISSED: '#F97316', // orange-500
  FAILING: '#EF4444', // red-500
  DISABLED: '#6B7280', // gray-500
  DEGRADED: '#F59E0B', // yellow-500
};

// Dagre layout algorithm for auto-positioning nodes
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
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
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function DependencyGraph({ monitors, dependencies }: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Build nodes from monitors
    const initialNodes: Node[] = monitors.map((monitor) => ({
      id: monitor.id,
      type: 'default',
      data: {
        label: (
          <div className="flex flex-col items-center justify-center p-2">
            <div className="font-semibold text-sm text-center mb-1">{monitor.name}</div>
            <Badge
              variant={
                monitor.status === 'OK'
                  ? 'default'
                  : monitor.status === 'LATE' || monitor.status === 'DEGRADED'
                  ? 'secondary'
                  : 'destructive'
              }
              className="text-xs"
            >
              {monitor.status}
            </Badge>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        background: statusColors[monitor.status as keyof typeof statusColors] || '#6B7280',
        color: 'white',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '4px',
        width: 200,
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }));

    // Build edges from dependencies
    const initialEdges: Edge[] = dependencies.map((dep) => ({
      id: `e-${dep.dependsOnId}-${dep.monitorId}`,
      source: dep.dependsOnId, // Dependency (runs first)
      target: dep.monitorId, // Dependent (runs second)
      type: 'smoothstep',
      animated: true,
      label: dep.required ? 'required' : 'optional',
      labelStyle: {
        fontSize: 10,
        fill: '#666',
      },
      labelBgStyle: {
        fill: '#fff',
        fillOpacity: 0.8,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: dep.required ? '#3B82F6' : '#9CA3AF',
      },
      style: {
        stroke: dep.required ? '#3B82F6' : '#9CA3AF',
        strokeWidth: dep.required ? 2 : 1,
      },
    }));

    // Apply dagre layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'TB' // Top to bottom
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [monitors, dependencies, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (monitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No monitors found. Create monitors and configure dependencies to visualize the graph.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (dependencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependency Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="flex flex-col items-center p-4 border rounded-lg"
                style={{
                  backgroundColor: statusColors[monitor.status as keyof typeof statusColors] || '#6B7280',
                  color: 'white',
                }}
              >
                <div className="font-semibold mb-2">{monitor.name}</div>
                <Badge variant="outline" className="bg-white text-gray-800">
                  {monitor.status}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4">
            No dependencies configured. Add dependencies to monitors to see the relationship graph.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle>Dependency Graph</CardTitle>
        <div className="text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>Required Dependency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400"></div>
              <span>Optional Dependency</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}

