import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeType } from '../types';

interface ItemNodeData {
  label: string;
  nodeType: NodeType;
  isSeparator?: boolean;
}

function getItemStyle(nodeType: NodeType) {
  const baseStyle = 'bg-white border border-gray-300 rounded shadow-sm px-3 py-2 min-w-[180px]';

  switch (nodeType) {
    case 'button':
      return `${baseStyle} bg-blue-50 border-blue-400 font-medium`;
    case 'input':
      return `${baseStyle} border-gray-400`;
    case 'checkbox':
    case 'radio':
      return `${baseStyle} flex items-center gap-2`;
    default:
      return baseStyle;
  }
}

function getIcon(nodeType: NodeType) {
  switch (nodeType) {
    case 'checkbox':
      return <span className="w-4 h-4 border-2 border-gray-600 rounded"></span>;
    case 'radio':
      return <span className="w-4 h-4 border-2 border-gray-600 rounded-full"></span>;
    default:
      return null;
  }
}

function BreadboardItemNode({ data }: { data: ItemNodeData }) {
  if (data.isSeparator) {
    return (
      <div className="w-full">
        <div className="border-t border-gray-400 w-48"></div>
      </div>
    );
  }

  const icon = getIcon(data.nodeType);

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className={getItemStyle(data.nodeType)}>
        {icon}
        <span className="text-sm">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

export default memo(BreadboardItemNode);
