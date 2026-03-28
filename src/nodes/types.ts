import type { NodeProps } from 'reactflow';

export type BuiltInAppNodeType =
  | 'process'
  | 'decision'
  | 'startEnd'
  | 'inputOutput'
  | 'document'
  | 'database'
  | 'subprocess'
  | 'user'
  | 'screen'
  | 'apiCall'
  | 'success'
  | 'error'
  | 'server'
  | 'databaseAdvanced'
  | 'queue'
  | 'microservice'
  | 'externalApi'
  | 'text'
  | 'stickyNote'
  | 'image'
  | 'group'
  | 'container'
  | 'swimlane'
  | 'annotation'
  | 'manualInput'
  | 'connector';

export type AppNodeType = BuiltInAppNodeType | (string & {});

export interface NodeData {
  label: string;
  color?: string | null;
  preset?: 'default' | 'text' | 'sticky';
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
}

export type CustomNodeProps = NodeProps<NodeData>;
