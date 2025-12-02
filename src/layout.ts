import { Node, Edge } from '@xyflow/react';
import { BreadboardItem, ParsedBreadboard } from './types';

const VERTICAL_SPACING = 40;

// Palette of distinct colors for edges to make them easy to distinguish
const EDGE_COLORS = [
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#14b8a6', // teal-500
  '#f43f5e', // rose-500
];

interface LayoutContext {
  currentY: number;
  placeMap: Map<string, string>; // item id -> place id
}

function mapItemsToPlace(items: BreadboardItem[], placeId: string, context: LayoutContext) {
  items.forEach((item) => {
    context.placeMap.set(item.id, placeId);
    if (item.children.length > 0) {
      mapItemsToPlace(item.children, placeId, context);
    }
  });
}

export function createReactFlowElements(breadboard: ParsedBreadboard, darkMode = false): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const context: LayoutContext = {
    currentY: 50,
    placeMap: new Map()
  };

  const currentX = 50;

  // Maps to track handle colors
  const handleColors = new Map<string, string>(); // handle id -> color

  // First pass: collect all link targets and assign colors
  const linkTargets = new Set<string>();
  const placesWithIncomingLinks = new Set<string>();

  breadboard.links.forEach((link, index) => {
    // Assign color for this edge
    const edgeColor = EDGE_COLORS[index % EDGE_COLORS.length];

    // Find target item or place by name
    breadboard.nodes.forEach(node => {
      // Check if target is the place itself
      if (node.text.toLowerCase() === link.to.toLowerCase()) {
        placesWithIncomingLinks.add(node.id);
        // Store place-level target handle color
        handleColors.set(`${node.id}-place-target`, edgeColor);
        return;
      }

      // Check if target is an item within the place
      const findInItems = (items: BreadboardItem[]): boolean => {
        for (const item of items) {
          if (item.text.toLowerCase() === link.to.toLowerCase()) {
            linkTargets.add(item.id);
            // Store target handle color
            handleColors.set(`${item.id}-target`, edgeColor);
            return true;
          }
          if (item.children && findInItems(item.children)) {
            return true;
          }
        }
        return false;
      };
      findInItems(node.items);
    });

    // Store source handle color
    handleColors.set(`${link.from}-source`, edgeColor);
  });

  // Second pass: create nodes
  breadboard.nodes.forEach((node) => {
    const placeY = context.currentY;
    const placeX = currentX;

    // Map all items to this place
    mapItemsToPlace(node.items, node.id, context);

    // Add place node with items as data
    nodes.push({
      id: node.id,
      type: 'breadboardPlace',
      position: { x: placeX, y: placeY },
      data: {
        label: node.text,
        nodeType: node.type,
        items: node.items,
        placeId: node.id,
        linkTargets: linkTargets,
        hasIncomingLinks: placesWithIncomingLinks.has(node.id),
        handleColors: handleColors,
        darkMode: darkMode
      },
      draggable: true,
    });

    // Estimate height based on items (rough calculation)
    const estimatedHeight = 80 + (node.items.length * 50);
    context.currentY = placeY + estimatedHeight + VERTICAL_SPACING;
  });

  // Create edges for links - from items to places or items
  breadboard.links.forEach((link, index) => {
    // Find source place and item
    const sourcePlaceId = context.placeMap.get(link.from);
    const sourceItemId = link.from;

    // Try to find target by name - could be a place or an item
    let targetPlaceId: string | undefined;
    let targetItemId: string | undefined;

    // Search through all nodes to find matching text
    breadboard.nodes.forEach(node => {
      if (node.text.toLowerCase() === link.to.toLowerCase()) {
        targetPlaceId = node.id;
        targetItemId = undefined; // Linking to a place
      }

      const findInItems = (items: BreadboardItem[]): boolean => {
        for (const item of items) {
          if (item.text.toLowerCase() === link.to.toLowerCase()) {
            targetPlaceId = context.placeMap.get(item.id);
            targetItemId = item.id;
            return true;
          }
          if (item.children && findInItems(item.children)) {
            return true;
          }
        }
        return false;
      };
      findInItems(node.items);
    });

    if (sourcePlaceId && targetPlaceId) {
      const edgeId = `${sourceItemId}-${targetItemId || targetPlaceId}`;

      // Get the color we assigned in the first pass
      const edgeColor = EDGE_COLORS[index % EDGE_COLORS.length];

      const sourceHandleId = `${sourceItemId}-source`;
      const targetHandleId = targetItemId ? `${targetItemId}-target` : undefined;

      edges.push({
        id: edgeId,
        source: sourcePlaceId,
        sourceHandle: sourceHandleId,
        target: targetPlaceId,
        targetHandle: targetHandleId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}
