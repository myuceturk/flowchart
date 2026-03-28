import type { ComponentType, ReactNode } from 'react';
import type { NodeTypes } from 'reactflow';
import AnnotationNode from './AnnotationNode';
import ApiCallNode from './ApiCallNode';
import ConnectorNode from './ConnectorNode';
import ContainerNode from './ContainerNode';
import DatabaseAdvancedNode from './DatabaseAdvancedNode';
import DatabaseNode from './DatabaseNode';
import DecisionNode from './DecisionNode';
import DocumentNode from './DocumentNode';
import ErrorNode from './ErrorNode';
import ExternalApiNode from './ExternalApiNode';
import GroupNode from './GroupNode';
import ImageNode from './ImageNode';
import InputOutputNode from './InputOutputNode';
import ManualInputNode from './ManualInputNode';
import MicroserviceNode from './MicroserviceNode';
import ProcessNode from './ProcessNode';
import QueueNode from './QueueNode';
import ScreenNode from './ScreenNode';
import ServerNode from './ServerNode';
import StartEndNode from './StartEndNode';
import StickyNoteNode from './StickyNoteNode';
import SubprocessNode from './SubprocessNode';
import SuccessNode from './SuccessNode';
import SwimlaneNode from './SwimlaneNode';
import TextNode from './TextNode';
import UserNode from './UserNode';
import type { NodeLibraryCategory, NodeTone } from './nodeDesignSystem';
import { nodeIcons } from './nodeIcons';
import type { AppNodeType, CustomNodeProps, NodeData } from './types';

export type NodeDefinition = {
  type: AppNodeType;
  label: string;
  description: string;
  icon: ReactNode;
  tone: NodeTone;
  category: NodeLibraryCategory;
  defaultData: NodeData;
  component: ComponentType<CustomNodeProps>;
  miniMapColor: string;
  badge?: string;
};

export type NodeRegistryCategory = {
  category: NodeLibraryCategory;
  nodes: NodeDefinition[];
};

const baseData = (overrides: Partial<NodeData>): NodeData => ({
  label: '',
  color: null,
  preset: 'default',
  ...overrides,
});

export const nodeRegistry: NodeRegistryCategory[] = [
  {
    category: 'Flowchart',
    nodes: [
      {
        type: 'process',
        category: 'Flowchart',
        label: 'Process',
        description: 'Actions and standard workflow steps',
        icon: nodeIcons.process,
        tone: 'blue',
        defaultData: baseData({ width: 160, height: 72, minWidth: 120, minHeight: 56 }),
        component: ProcessNode,
        miniMapColor: '#6366f1',
      },
      {
        type: 'decision',
        category: 'Flowchart',
        label: 'Decision',
        description: 'Branching logic and yes or no paths',
        icon: nodeIcons.decision,
        tone: 'blue',
        defaultData: baseData({ width: 132, height: 132, minWidth: 110, minHeight: 110, aspectRatio: 1 }),
        component: DecisionNode,
        miniMapColor: '#f59e0b',
      },
      {
        type: 'startEnd',
        category: 'Flowchart',
        label: 'Start / End',
        description: 'Entry and exit points in the flow',
        icon: nodeIcons.startEnd,
        tone: 'blue',
        defaultData: baseData({ width: 168, height: 64, minWidth: 132, minHeight: 56 }),
        component: StartEndNode,
        miniMapColor: '#10b981',
      },
      {
        type: 'inputOutput',
        category: 'Flowchart',
        label: 'Input / Output',
        description: 'Data input or rendered output steps',
        icon: nodeIcons.inputOutput,
        tone: 'blue',
        defaultData: baseData({ width: 172, height: 74, minWidth: 132, minHeight: 58 }),
        component: InputOutputNode,
        miniMapColor: '#3b82f6',
      },
      {
        type: 'document',
        category: 'Flowchart',
        label: 'Document',
        description: 'Reports, files, and generated artifacts',
        icon: nodeIcons.document,
        tone: 'blue',
        defaultData: baseData({ width: 172, height: 84, minWidth: 136, minHeight: 64 }),
        component: DocumentNode,
        miniMapColor: '#8b5cf6',
      },
      {
        type: 'database',
        category: 'Flowchart',
        label: 'Database',
        description: 'Persistent storage in a simple flowchart form',
        icon: nodeIcons.database,
        tone: 'blue',
        defaultData: baseData({ width: 170, height: 86, minWidth: 136, minHeight: 66 }),
        component: DatabaseNode,
        miniMapColor: '#64748b',
      },
      {
        type: 'subprocess',
        category: 'Flowchart',
        label: 'Subprocess',
        description: 'A nested or reusable workflow segment',
        icon: nodeIcons.subprocess,
        tone: 'blue',
        defaultData: baseData({ width: 176, height: 76, minWidth: 136, minHeight: 58 }),
        component: SubprocessNode,
        miniMapColor: '#4f46e5',
      },
      {
        type: 'manualInput',
        category: 'Flowchart',
        label: 'Manual Input',
        description: 'Manual data entry or user-prompted steps',
        icon: nodeIcons.manualInput,
        tone: 'blue',
        defaultData: baseData({ width: 172, height: 72, minWidth: 140, minHeight: 60 }),
        component: ManualInputNode,
        miniMapColor: '#0369a1',
      },
    ],
  },
  {
    category: 'Product',
    nodes: [
      {
        type: 'user',
        category: 'Product',
        label: 'User',
        description: 'Actors and participants in a product flow',
        icon: nodeIcons.user,
        tone: 'purple',
        defaultData: baseData({ width: 156, height: 84, minWidth: 126, minHeight: 64 }),
        component: UserNode,
        miniMapColor: '#14b8a6',
      },
      {
        type: 'screen',
        category: 'Product',
        label: 'Screen',
        description: 'UI surfaces like pages and app screens',
        icon: nodeIcons.screen,
        tone: 'purple',
        defaultData: baseData({ width: 172, height: 92, minWidth: 136, minHeight: 72 }),
        component: ScreenNode,
        miniMapColor: '#0ea5e9',
      },
      {
        type: 'apiCall',
        category: 'Product',
        label: 'API Call',
        description: 'Requests between product and service layers',
        icon: nodeIcons.apiCall,
        tone: 'purple',
        defaultData: baseData({ width: 170, height: 78, minWidth: 132, minHeight: 60 }),
        component: ApiCallNode,
        miniMapColor: '#7c3aed',
      },
      {
        type: 'success',
        category: 'Product',
        label: 'Success',
        description: 'Positive outcomes and completed states',
        icon: nodeIcons.success,
        tone: 'purple',
        defaultData: baseData({ width: 150, height: 64, minWidth: 124, minHeight: 52 }),
        component: SuccessNode,
        miniMapColor: '#22c55e',
      },
      {
        type: 'error',
        category: 'Product',
        label: 'Error',
        description: 'Failures, edge cases, and blocked states',
        icon: nodeIcons.error,
        tone: 'purple',
        defaultData: baseData({ width: 150, height: 64, minWidth: 124, minHeight: 52 }),
        component: ErrorNode,
        miniMapColor: '#ef4444',
      },
    ],
  },
  {
    category: 'Technical',
    nodes: [
      {
        type: 'server',
        category: 'Technical',
        label: 'Server',
        description: 'Application or runtime infrastructure nodes',
        icon: nodeIcons.server,
        tone: 'orange',
        defaultData: baseData({ width: 168, height: 88, minWidth: 134, minHeight: 68 }),
        component: ServerNode,
        miniMapColor: '#475569',
      },
      {
        type: 'databaseAdvanced',
        category: 'Technical',
        label: 'Database Cluster',
        description: 'Advanced data systems and clustered storage',
        icon: nodeIcons.databaseAdvanced,
        tone: 'orange',
        defaultData: baseData({ width: 178, height: 92, minWidth: 140, minHeight: 72 }),
        component: DatabaseAdvancedNode,
        miniMapColor: '#2563eb',
      },
      {
        type: 'queue',
        category: 'Technical',
        label: 'Queue',
        description: 'Async jobs, retries, and event buffering',
        icon: nodeIcons.queue,
        tone: 'orange',
        defaultData: baseData({ width: 164, height: 74, minWidth: 130, minHeight: 58 }),
        component: QueueNode,
        miniMapColor: '#f59e0b',
      },
      {
        type: 'microservice',
        category: 'Technical',
        label: 'Microservice',
        description: 'Independent services with scoped ownership',
        icon: nodeIcons.microservice,
        tone: 'orange',
        defaultData: baseData({ width: 180, height: 84, minWidth: 140, minHeight: 64 }),
        component: MicroserviceNode,
        miniMapColor: '#8b5cf6',
      },
      {
        type: 'externalApi',
        category: 'Technical',
        label: 'External API',
        description: 'Third-party integrations and remote services',
        icon: nodeIcons.externalApi,
        tone: 'orange',
        defaultData: baseData({ width: 176, height: 80, minWidth: 138, minHeight: 62 }),
        component: ExternalApiNode,
        miniMapColor: '#f43f5e',
      },
    ],
  },
  {
    category: 'Content',
    nodes: [
      {
        type: 'text',
        category: 'Content',
        label: 'Text',
        description: 'Lightweight annotations and copy blocks',
        icon: nodeIcons.text,
        tone: 'green',
        defaultData: baseData({ width: 176, height: 76, minWidth: 138, minHeight: 58 }),
        component: TextNode,
        miniMapColor: '#a855f7',
      },
      {
        type: 'stickyNote',
        category: 'Content',
        label: 'Sticky Note',
        description: 'Fast notes for planning and ideation',
        icon: nodeIcons.stickyNote,
        tone: 'green',
        defaultData: baseData({ width: 180, height: 120, minWidth: 144, minHeight: 96, color: '#fef3c7' }),
        component: StickyNoteNode,
        miniMapColor: '#f59e0b',
      },
      {
        type: 'image',
        category: 'Content',
        label: 'Image',
        description: 'Visual placeholders and media blocks',
        icon: nodeIcons.image,
        tone: 'green',
        defaultData: baseData({ width: 190, height: 120, minWidth: 152, minHeight: 96 }),
        component: ImageNode,
        miniMapColor: '#0ea5e9',
      },
      {
        type: 'annotation',
        category: 'Content',
        label: 'Annotation',
        description: 'Comments and explanatory notes',
        icon: nodeIcons.annotation,
        tone: 'green',
        defaultData: baseData({ width: 180, height: 110, minWidth: 144, minHeight: 96, color: '#fef3c7' }),
        component: AnnotationNode,
        miniMapColor: '#eab308',
      },
    ],
  },
  {
    category: 'Advanced',
    nodes: [
      {
        type: 'group',
        category: 'Advanced',
        label: 'Group',
        description: 'Placeholder wrapper for grouped content',
        icon: nodeIcons.group,
        tone: 'gray',
        defaultData: baseData({ width: 220, height: 140, minWidth: 180, minHeight: 120 }),
        component: GroupNode,
        miniMapColor: '#94a3b8',
        badge: 'Beta',
      },
      {
        type: 'container',
        category: 'Advanced',
        label: 'Container',
        description: 'Placeholder frame for bounded regions',
        icon: nodeIcons.container,
        tone: 'gray',
        defaultData: baseData({ width: 260, height: 170, minWidth: 220, minHeight: 140 }),
        component: ContainerNode,
        miniMapColor: '#64748b',
        badge: 'Beta',
      },
      {
        type: 'swimlane',
        category: 'Advanced',
        label: 'Swimlane',
        description: 'Lane for grouping steps by department or role',
        icon: nodeIcons.swimlane,
        tone: 'gray',
        defaultData: baseData({ width: 400, height: 180, minWidth: 300, minHeight: 120 }),
        component: SwimlaneNode,
        miniMapColor: '#475569',
      },
      {
        type: 'connector',
        category: 'Advanced',
        label: 'Connector',
        description: 'Off-page reference indicating flow continues elsewhere',
        icon: nodeIcons.connector,
        tone: 'gray',
        defaultData: baseData({ width: 88, height: 56, minWidth: 72, minHeight: 48 }),
        component: ConnectorNode,
        miniMapColor: '#334155',
      },
    ],
  },
];

export function buildNodeRegistrySnapshot(registry: NodeRegistryCategory[]) {
  const allNodeDefinitions = registry.flatMap((section) => section.nodes);
  const nodeDefinitionMap = allNodeDefinitions.reduce(
    (accumulator, definition) => {
      accumulator[definition.type] = definition;
      return accumulator;
    },
    {} as Record<AppNodeType, NodeDefinition>,
  );

  const nodeTypes: NodeTypes = allNodeDefinitions.reduce((accumulator, definition) => {
    accumulator[definition.type] = definition.component;
    return accumulator;
  }, {} as NodeTypes);

  return {
    nodeRegistry: registry,
    allNodeDefinitions,
    nodeDefinitionMap,
    nodeTypes,
  };
}

export const {
  nodeRegistry: staticNodeRegistry,
  allNodeDefinitions,
  nodeDefinitionMap,
  nodeTypes,
} = buildNodeRegistrySnapshot(nodeRegistry);

export function getNodeDefinition(type: AppNodeType | string) {
  return nodeDefinitionMap[type as AppNodeType];
}

export function getDefaultNodeData(type: AppNodeType): NodeData {
  const definition = getNodeDefinition(type);

  if (!definition) {
    return baseData({ width: 160, height: 72, minWidth: 120, minHeight: 56 });
  }

  return {
    ...definition.defaultData,
    label: definition.label,
  };
}

export function getAllNodeTypes(): NodeDefinition[] {
  return allNodeDefinitions;
}

export function getNodesByCategory(category: NodeLibraryCategory): NodeDefinition[] {
  return allNodeDefinitions.filter((def) => def.category === category);
}

export function getNodeComponent(type: AppNodeType | string): ComponentType<CustomNodeProps> | undefined {
  return getNodeDefinition(type)?.component;
}
