import { BreadboardNode, BreadboardItem, ParsedBreadboard, NodeType } from './types';

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function isListItem(line: string): boolean {
  return /^\s*-\s+/.test(line);
}

function isSeparator(line: string): boolean {
  // Match "- ---" (list item with three or more dashes)
  return /^\s*-\s+-{3,}\s*$/.test(line);
}

function parseNodeType(text: string): { type: NodeType; cleanText: string; link?: string } {
  let cleanText = text.trim();
  let type: NodeType = 'item';
  let link: string | undefined;

  // Check for link syntax (=>)
  const linkMatch = cleanText.match(/^(.+?)\s*=>\s*(.+)$/);
  if (linkMatch) {
    cleanText = linkMatch[1].trim();
    link = linkMatch[2].trim();
  }

  // Check for checkbox prefix
  if (cleanText.startsWith('[]')) {
    type = 'checkbox';
    cleanText = cleanText.substring(2).trim();
  }
  // Check for radio prefix
  else if (cleanText.startsWith('()')) {
    type = 'radio';
    cleanText = cleanText.substring(2).trim();
  }
  // Check for type annotations
  else if (cleanText.includes('.')) {
    const typeMatch = cleanText.match(/^(.+?)\.(input|button|page|component|dialog)$/);
    if (typeMatch) {
      cleanText = typeMatch[1].trim();
      type = typeMatch[2] as NodeType;
    }
  }

  return { type, cleanText, link };
}

function parseItems(lines: string[], startIndex: number, parentDepth: number): { items: BreadboardItem[]; nextIndex: number } {
  const items: BreadboardItem[] = [];
  let i = startIndex;
  let itemIdCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const depth = getIndentLevel(line);

    // If we've returned to a shallower level, we're done
    if (depth < parentDepth) {
      break;
    }

    // If line is empty, skip it
    if (!line.trim()) {
      i++;
      continue;
    }

    // If line is not a list item, we've reached the end of this section
    if (!isListItem(line)) {
      break;
    }

    // Check if this is a list item at the current level
    if (depth === parentDepth) {
      // Check for separator (---)
      if (isSeparator(line)) {
        items.push({
          id: `separator-${i}`,
          text: '',
          type: 'item',
          isSeparator: true,
          children: [],
          depth
        });
        i++;
        continue;
      }

      // Remove the "- " prefix and parse
      const content = line.replace(/^\s*-\s+/, '');
      const { type, cleanText, link } = parseNodeType(content);
      const item: BreadboardItem = {
        id: `item-${i}-${itemIdCounter++}`,
        text: cleanText,
        type,
        children: [],
        link,
        depth
      };

      i++;

      // Check for nested children (items with greater indentation and -)
      if (i < lines.length) {
        const nextDepth = getIndentLevel(lines[i]);
        if (nextDepth > depth && isListItem(lines[i])) {
          const { items: children, nextIndex } = parseItems(lines, i, nextDepth);
          item.children = children;
          i = nextIndex;
        }
      }

      items.push(item);
    } else {
      i++;
    }
  }

  return { items, nextIndex: i };
}

export function parseBreadboard(text: string): ParsedBreadboard {
  const lines = text.split('\n');
  const nodes: BreadboardNode[] = [];
  const links: Array<{ from: string; to: string }> = [];
  let nodeIdCounter = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const depth = getIndentLevel(line);

    // Top-level non-list items are places
    if (depth === 0 && line.trim() && !isListItem(line)) {
      const { type, cleanText } = parseNodeType(line.trim());
      const placeType = type === 'page' || type === 'component' || type === 'dialog' ? type : 'place';

      const node: BreadboardNode = {
        id: `place-${nodeIdCounter++}`,
        text: cleanText,
        type: placeType,
        items: []
      };

      i++;

      // Skip empty lines
      while (i < lines.length && !lines[i].trim()) {
        i++;
      }

      // Parse markdown list items under this place
      if (i < lines.length && isListItem(lines[i])) {
        const firstItemDepth = getIndentLevel(lines[i]);
        const { items, nextIndex } = parseItems(lines, i, firstItemDepth);
        node.items = items;
        i = nextIndex;
      }

      nodes.push(node);

      // Extract links from all items
      const extractLinks = (items: BreadboardItem[]) => {
        items.forEach(item => {
          if (item.link) {
            links.push({ from: item.id, to: item.link });
          }
          if (item.children.length > 0) {
            extractLinks(item.children);
          }
        });
      };
      extractLinks(node.items);
    } else {
      i++;
    }
  }

  return { nodes, links };
}
