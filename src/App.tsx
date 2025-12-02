import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Moon, Sun } from 'lucide-react';

import BreadboardPlaceNode from './nodes/BreadboardPlaceNode';
import { parseBreadboard } from './parser';
import { createReactFlowElements } from './layout';
import { getInitialTextFromUrl, updateUrlHash } from './utils/urlState';

const nodeTypes: NodeTypes = {
  breadboardPlace: BreadboardPlaceNode,
};

const defaultText = `Login Page
- Username.input
- Password.input
- [] Remember me
- Login.button => Dashboard

Dashboard
- Welcome message
- Recent items
- ---
- Logout.button => Login Page`;

function App() {
  const [text, setText] = useState(() => getInitialTextFromUrl(defaultText));
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hasManualLayout, setHasManualLayout] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Generate new layout from text
  const newLayout = useMemo(() => {
    try {
      const parsed = parseBreadboard(text);
      return createReactFlowElements(parsed, darkMode);
    } catch (error) {
      console.error('Parse error:', error);
      return { nodes: [], edges: [] };
    }
  }, [text, darkMode]);

  // Update nodes and edges when layout changes
  useEffect(() => {
    if (hasManualLayout) {
      // Preserve user-positioned nodes, only update data
      setNodes((currentNodes) => {
        const newNodesMap = new Map(newLayout.nodes.map(n => [n.id, n]));

        // Update existing nodes with new data but keep positions
        const updatedNodes = currentNodes
          .filter(node => newNodesMap.has(node.id))
          .map(node => ({
            ...newNodesMap.get(node.id)!,
            position: node.position, // Keep existing position
          }));

        // Add any new nodes with auto-layout positions
        const existingIds = new Set(currentNodes.map(n => n.id));
        const newNodes = newLayout.nodes
          .filter(node => !existingIds.has(node.id))
          .map(node => ({
            ...node,
            position: nodePositionsRef.current.get(node.id) || node.position,
          }));

        return [...updatedNodes, ...newNodes];
      });

      // Update edges
      setEdges(newLayout.edges);
    } else {
      // Use auto-layout
      setNodes(newLayout.nodes);
      setEdges(newLayout.edges);
    }
  }, [newLayout, hasManualLayout]);

  // Sync text to URL with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrlHash(text);
    }, 1000);

    return () => clearTimeout(timer);
  }, [text]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);

      // Check if any change is a position change (drag)
      const hasPositionChange = changes.some(
        change => change.type === 'position' && change.dragging
      );

      if (hasPositionChange) {
        setHasManualLayout(true);
        // Save positions
        updatedNodes.forEach(node => {
          nodePositionsRef.current.set(node.id, node.position);
        });
      }

      return updatedNodes;
    });
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breadboard.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <div className={`flex h-screen w-screen ${darkMode ? 'dark' : ''}`}>
      {/* Left Panel - Text Editor */}
      <div className={`w-full max-w-[400px] flex flex-col border-r ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className={`px-4 py-2 flex items-center justify-between border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          <h1 className={`font-semibold text-lg ${darkMode ? 'text-white' : ''}`}>Breadboard Editor</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleExport}
              className={`p-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
              title="Export Markdown"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}
          placeholder="Enter your breadboard here..."
          spellCheck={false}
        />
      </div>

      {/* Right Panel - React Flow Canvas */}
      <div className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView={!hasManualLayout}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          colorMode={darkMode ? 'dark' : 'light'}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
