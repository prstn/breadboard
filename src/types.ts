export type NodeType =
  | 'place'
  | 'item'
  | 'input'
  | 'button'
  | 'checkbox'
  | 'radio'
  | 'page'
  | 'component'
  | 'dialog';

export interface BreadboardItem {
  id: string;
  text: string;
  type: NodeType;
  children: BreadboardItem[];
  link?: string;
  isSeparator?: boolean;
  depth: number;
}

export interface BreadboardNode {
  id: string;
  text: string;
  type: NodeType;
  items: BreadboardItem[];
}

export interface ParsedBreadboard {
  nodes: BreadboardNode[];
  links: Array<{ from: string; to: string }>;
}
