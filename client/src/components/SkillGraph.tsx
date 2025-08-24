import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink, X, BookOpen, Play, Code } from 'lucide-react';

interface SkillNodeData {
  label: string;
  type: 'current' | 'learningPath' | 'goal';
  description: string;
  resources: { title: string; url: string }[];
}

interface SkillGraphProps {
  nodes: Node<SkillNodeData>[];
  edges: Edge[];
}

// Custom node types for different skill categories
const CustomNode = ({ data, selected }: { data: SkillNodeData; selected?: boolean }) => {
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '2px solid',
      fontWeight: '600',
      fontSize: '14px',
      textAlign: 'center' as const,
      minWidth: '120px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };

    switch (data.type) {
      case 'current':
        return {
          ...baseStyle,
          backgroundColor: '#10b981',
          color: 'white',
          borderColor: '#059669',
        };
      case 'learningPath':
        return {
          ...baseStyle,
          backgroundColor: '#3b82f6',
          color: 'white',
          borderColor: '#2563eb',
        };
      case 'goal':
        return {
          ...baseStyle,
          backgroundColor: '#8b5cf6',
          color: 'white',
          borderColor: '#7c3aed',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={getNodeStyle()}>
      {data.label}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

function SkillGraph({ nodes: initialNodes, edges: initialEdges }: SkillGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<SkillNodeData> | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Transform nodes to use custom node type
  const transformedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      type: 'custom',
    }));
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<SkillNodeData>) => {
    setSelectedNode(node);
    setShowModal(true);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSelectedNode(null);
  };

  const getResourceIcon = (title: string) => {
    if (title.toLowerCase().includes('video') || title.toLowerCase().includes('course')) {
      return <Play className="w-4 h-4" />;
    } else if (title.toLowerCase().includes('project') || title.toLowerCase().includes('github')) {
      return <Code className="w-4 h-4" />;
    } else {
      return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-[600px] w-full">
      <ReactFlow
        nodes={transformedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
      </ReactFlow>

      {/* Node Details Modal */}
      {showModal && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedNode.data.type === 'current' ? 'bg-green-500' :
                  selectedNode.data.type === 'learningPath' ? 'bg-blue-500' :
                  'bg-purple-600'
                }`} />
                {selectedNode.data.label}
              </CardTitle>
              <Button
                onClick={closeModal}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 leading-relaxed">
                  {selectedNode.data.description}
                </p>
              </div>

              {/* Skill Type */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Skill Category</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedNode.data.type === 'current' ? 'bg-green-500' :
                    selectedNode.data.type === 'learningPath' ? 'bg-blue-500' :
                    'bg-purple-600'
                  }`} />
                  <span className="capitalize text-gray-700">
                    {selectedNode.data.type === 'current' ? 'Current Skill' :
                     selectedNode.data.type === 'learningPath' ? 'Learning Path' :
                     'Career Goal'}
                  </span>
                </div>
              </div>

              {/* Learning Resources */}
              {selectedNode.data.resources && selectedNode.data.resources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Learning Resources</h4>
                  <div className="space-y-3">
                    {selectedNode.data.resources.map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getResourceIcon(resource.title)}
                          <span className="text-gray-800 font-medium">{resource.title}</span>
                        </div>
                        <Button
                          onClick={() => window.open(resource.url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    // Add to learning list or mark as started
                    console.log('Started learning:', selectedNode.data.label);
                  }}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
                <Button
                  onClick={closeModal}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SkillGraph;
