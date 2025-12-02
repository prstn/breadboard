import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeType, BreadboardItem } from '../types';

interface PlaceNodeData {
  label: string;
  nodeType: NodeType;
  items: BreadboardItem[];
  onItemsReorder?: (placeId: string, newItems: BreadboardItem[]) => void;
  placeId: string;
  linkTargets?: Set<string>;
  hasIncomingLinks?: boolean;
  handleColors?: Map<string, string>;
  darkMode?: boolean;
}

function ItemRenderer({ item, depth = 0, onDragStart, onDragOver, onDrop, linkTargets, handleColors, darkMode }: {
  item: BreadboardItem;
  depth?: number;
  onDragStart: (item: BreadboardItem) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (item: BreadboardItem) => void;
  linkTargets?: Set<string>;
  handleColors?: Map<string, string>;
  darkMode?: boolean;
}) {
  if (item.isSeparator) {
    return <div className={`border-t my-2 ${darkMode ? 'border-gray-600' : 'border-gray-400'}`} />;
  }

  const getItemClass = () => {
    const baseClass = `px-3 py-2 rounded text-sm cursor-move border relative ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'}`;
    switch (item.type) {
      case 'button':
        return `${baseClass} ${darkMode ? 'bg-blue-900 border-blue-600' : 'bg-blue-50 border-blue-400'} font-medium`;
      case 'input':
        return `${baseClass} ${darkMode ? 'border-gray-600' : 'border-gray-400'}`;
      default:
        return `${baseClass} ${darkMode ? 'border-gray-600' : 'border-gray-300'}`;
    }
  };

  const getIcon = () => {
    const iconBorderClass = darkMode ? 'border-gray-400' : 'border-gray-600';
    switch (item.type) {
      case 'checkbox':
        return <span className={`w-4 h-4 border-2 ${iconBorderClass} rounded inline-block mr-2`}></span>;
      case 'radio':
        return <span className={`w-4 h-4 border-2 ${iconBorderClass} rounded-full inline-block mr-2`}></span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ marginLeft: `${depth * 15}px` }} className="mb-1">
      <div
        className={`${getItemClass()} flex items-center`}
        draggable
        onDragStart={() => onDragStart(item)}
        onDragOver={onDragOver}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(item);
        }}
      >
        {linkTargets?.has(item.id) && (
          <Handle
            type="target"
            position={Position.Left}
            id={`${item.id}-target`}
            style={{
              position: 'absolute',
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              border: `2px solid ${handleColors?.get(`${item.id}-target`) || '#94a3b8'}`,
              borderRadius: '50%',
              background: darkMode ? '#1f2937' : 'white',
            }}
          />
        )}
        {getIcon()}
        <span>{item.text}</span>
        {item.link && <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→ {item.link}</span>}
        {item.link && (
          <Handle
            type="source"
            position={Position.Right}
            id={`${item.id}-source`}
            style={{
              position: 'absolute',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              border: `2px solid ${handleColors?.get(`${item.id}-source`) || '#94a3b8'}`,
              borderRadius: '50%',
              background: darkMode ? '#1f2937' : 'white',
            }}
          />
        )}
      </div>
      {item.children && item.children.length > 0 && (
        <div className="mt-1">
          {item.children.map((child) => (
            <ItemRenderer
              key={child.id}
              item={child}
              depth={depth + 1}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              linkTargets={linkTargets}
              handleColors={handleColors}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BreadboardPlaceNode({ data }: { data: PlaceNodeData }) {
  const [items, setItems] = useState(data.items);
  const [draggedItem, setDraggedItem] = useState<BreadboardItem | null>(null);

  // Get styling based on node type
  const getNodeStyle = () => {
    const darkMode = data.darkMode;
    switch (data.nodeType) {
      case 'page':
        return {
          containerClass: `border-2 border-blue-500 rounded shadow-md min-w-[280px] max-w-[400px] relative ${darkMode ? 'bg-blue-950' : 'bg-blue-50'}`,
          headerClass: `px-4 py-2.5 font-semibold text-base border-b-2 border-blue-500 ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100'}`,
        };
      case 'component':
        return {
          containerClass: `border-2 border-purple-500 rounded shadow-md min-w-[280px] max-w-[400px] relative ${darkMode ? 'bg-purple-950' : 'bg-purple-50'}`,
          headerClass: `px-4 py-2.5 font-semibold text-base border-b-2 border-purple-500 ${darkMode ? 'bg-purple-900 text-purple-100' : 'bg-purple-100'}`,
        };
      case 'dialog':
        return {
          containerClass: `border-2 border-amber-500 rounded shadow-md min-w-[280px] max-w-[400px] relative ${darkMode ? 'bg-amber-950' : 'bg-amber-50'}`,
          headerClass: `px-4 py-2.5 font-semibold text-base border-b-2 border-amber-500 ${darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100'}`,
        };
      default: // 'place' and others
        return {
          containerClass: `border-2 border-gray-800 rounded shadow-md min-w-[280px] max-w-[400px] relative ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'}`,
          headerClass: `px-4 py-2.5 font-semibold text-base border-b-2 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-800'}`,
        };
    }
  };

  const nodeStyle = getNodeStyle();

  // Update items when data.items changes
  useEffect(() => {
    setItems(data.items);
  }, [data.items]);

  const handleDragStart = (item: BreadboardItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItem: BreadboardItem) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const reorderItems = (itemList: BreadboardItem[]): BreadboardItem[] => {
      const newItems = [...itemList];
      const draggedIndex = newItems.findIndex((i) => i.id === draggedItem.id);
      const targetIndex = newItems.findIndex((i) => i.id === targetItem.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
      }

      return newItems.map((item) => ({
        ...item,
        children: item.children ? reorderItems(item.children) : [],
      }));
    };

    const newItems = reorderItems(items);
    setItems(newItems);
    if (data.onItemsReorder) {
      data.onItemsReorder(data.placeId, newItems);
    }
    setDraggedItem(null);
  };

  return (
    <div className={nodeStyle.containerClass}>
      {data.hasIncomingLinks && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            left: '-4px',
            top: '20px',
            width: '8px',
            height: '8px',
            border: `2px solid ${data.handleColors?.get(`${data.placeId}-place-target`) || '#1f2937'}`,
            borderRadius: '50%',
            background: data.darkMode ? '#1f2937' : 'white',
          }}
        />
      )}
      <div className={nodeStyle.headerClass}>
        {data.label}
      </div>
      <div className="px-3 py-3 space-y-1">
        {items.map((item) => (
          <ItemRenderer
            key={item.id}
            item={item}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            linkTargets={data.linkTargets}
            handleColors={data.handleColors}
            darkMode={data.darkMode}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(BreadboardPlaceNode);
