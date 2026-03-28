import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { Node, NodeTypes } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import type { ActiveTool } from '../types';
import type { AppNodeType, NodeData } from '../nodes/types';
import {
  buildNodeRegistrySnapshot,
  getDefaultNodeData as getStaticDefaultNodeData,
  getNodeDefinition as getStaticNodeDefinition,
  nodeRegistry as builtInNodeRegistry,
  type NodeDefinition,
  type NodeRegistryCategory,
} from '../nodes/nodeRegistry';
import type { BuiltInAppNodeType } from '../nodes/types';

export type PluginActionContext = {
  addNode: (options: {
    type: AppNodeType;
    label?: string;
    color?: string | null;
    position?: { x: number; y: number };
  }) => void;
  fitView: () => void | boolean | Promise<boolean>;
  setActiveTool: (tool: ActiveTool) => void;
  getDiagramState: () => unknown;
};

export type PluginActionHandler = (context: PluginActionContext) => void;

export type PluginAction = {
  id: string;
  label: string;
  run: PluginActionHandler;
};

export type PluginToolbarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  action: string | PluginActionHandler;
};

export type PluginSidebarItem = {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  tone?: 'blue' | 'purple' | 'orange' | 'green' | 'gray';
  indicator?: string;
  payload?: {
    type: AppNodeType;
    label: string;
    color?: string | null;
  };
  action?: string | PluginActionHandler;
};

export type PluginDefinition = {
  name: string;
  nodes?: NodeRegistryCategory[];
  actions?: PluginAction[];
  toolbarItems?: PluginToolbarItem[];
  sidebarItems?: PluginSidebarItem[];
};

export type PluginModule = {
  default?: PluginDefinition;
  plugin?: PluginDefinition;
};

export type PluginLoader = () => Promise<PluginModule>;

type ResolvedToolbarItem = Omit<PluginToolbarItem, 'action'> & {
  pluginName: string;
  run: PluginActionHandler;
};

type ResolvedSidebarItem = Omit<PluginSidebarItem, 'action'> & {
  pluginName: string;
  run?: PluginActionHandler;
};

type PluginSnapshot = {
  nodeRegistry: NodeRegistryCategory[];
  allNodeDefinitions: NodeDefinition[];
  nodeDefinitionMap: Record<string, NodeDefinition>;
  nodeTypes: NodeTypes;
  toolbarItems: ResolvedToolbarItem[];
  sidebarItems: ResolvedSidebarItem[];
};

type PluginState = PluginSnapshot & {
  plugins: PluginDefinition[];
  registerPlugin: (plugin: PluginDefinition) => void;
  unregisterPlugin: (name: string) => void;
};

const installedPluginLoaders: PluginLoader[] = [() => import('./plugins/examplePlugin')];
let builtInSnapshotCache: ReturnType<typeof buildNodeRegistrySnapshot> | null = null;
let builtInNodeTypeSetCache: Set<string> | null = null;

function getBuiltInSnapshot() {
  if (!builtInSnapshotCache) {
    builtInSnapshotCache = buildNodeRegistrySnapshot(builtInNodeRegistry);
  }

  return builtInSnapshotCache;
}

function getBuiltInNodeTypeSet() {
  if (!builtInNodeTypeSetCache) {
    builtInNodeTypeSetCache = new Set(
      getBuiltInSnapshot().allNodeDefinitions.map((definition) => definition.type),
    );
  }

  return builtInNodeTypeSetCache;
}

function createScopedActionId(pluginName: string, actionId: string) {
  return `${pluginName}:${actionId}`;
}

function dedupeByKey<T>(items: T[], scope: string, getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      console.warn(`[pluginSystem] Duplicate ${scope} id "${key}" was ignored.`);
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sanitizePluginDefinition(plugin: PluginDefinition): PluginDefinition {
  const builtInNodeTypeSet = getBuiltInNodeTypeSet();
  const nodes = plugin.nodes?.reduce<NodeRegistryCategory[]>((categories, category) => {
    const safeNodes = dedupeByKey(
      category.nodes.filter((node) => {
        if (builtInNodeTypeSet.has(node.type as BuiltInAppNodeType)) {
          console.warn(
            `[pluginSystem] Plugin "${plugin.name}" attempted to overwrite built-in node type "${node.type}".`,
          );
          return false;
        }

        return true;
      }),
      `node for plugin "${plugin.name}"`,
      (node) => node.type,
    );

    if (safeNodes.length === 0) {
      return categories;
    }

    categories.push({
      category: category.category,
      nodes: safeNodes,
    });

    return categories;
  }, []);

  return {
    ...plugin,
    nodes,
    actions: dedupeByKey(plugin.actions ?? [], `action for plugin "${plugin.name}"`, (item) => item.id),
    toolbarItems: dedupeByKey(
      plugin.toolbarItems ?? [],
      `toolbar item for plugin "${plugin.name}"`,
      (item) => item.id,
    ),
    sidebarItems: dedupeByKey(
      plugin.sidebarItems ?? [],
      `sidebar item for plugin "${plugin.name}"`,
      (item) => item.id,
    ),
  };
}

function mergePluginNodeRegistry(plugins: PluginDefinition[]) {
  const categories = new Map<string, NodeRegistryCategory>();
  const builtInSnapshot = getBuiltInSnapshot();
  const registeredTypes = new Set<string>(
    builtInSnapshot.allNodeDefinitions.map((definition) => definition.type),
  );

  builtInSnapshot.nodeRegistry.forEach((section) => {
    categories.set(section.category, {
      category: section.category,
      nodes: [...section.nodes],
    });
  });

  plugins.forEach((plugin) => {
    plugin.nodes?.forEach((section) => {
      const existing = categories.get(section.category);
      const nextNodes = section.nodes.filter((node) => {
        if (registeredTypes.has(node.type)) {
          console.warn(
            `[pluginSystem] Node type "${node.type}" from plugin "${plugin.name}" is already registered and was ignored.`,
          );
          return false;
        }

        registeredTypes.add(node.type);
        return true;
      });

      if (nextNodes.length === 0) {
        return;
      }

      if (existing) {
        existing.nodes = [...existing.nodes, ...nextNodes];
      } else {
        categories.set(section.category, {
          category: section.category,
          nodes: [...nextNodes],
        });
      }
    });
  });

  return Array.from(categories.values());
}

function resolveActionHandler(
  pluginName: string,
  action: string | PluginActionHandler | undefined,
  actions: Map<string, PluginActionHandler>,
) {
  if (!action) {
    return undefined;
  }

  if (typeof action === 'function') {
    return action;
  }

  return actions.get(action.includes(':') ? action : createScopedActionId(pluginName, action));
}

function buildPluginSnapshot(plugins: PluginDefinition[]): PluginSnapshot {
  const actions = new Map<string, PluginActionHandler>();

  plugins.forEach((plugin) => {
    plugin.actions?.forEach((action) => {
      actions.set(createScopedActionId(plugin.name, action.id), action.run);
    });
  });

  const mergedRegistry = mergePluginNodeRegistry(plugins);
  const mergedNodeSnapshot = buildNodeRegistrySnapshot(mergedRegistry);
  const toolbarItems = plugins.reduce<ResolvedToolbarItem[]>((accumulator, plugin) => {
    (plugin.toolbarItems ?? []).forEach((item) => {
      const run = resolveActionHandler(plugin.name, item.action, actions);

      if (!run) {
        return;
      }

      accumulator.push({
        id: item.id,
        label: item.label,
        icon: item.icon,
        pluginName: plugin.name,
        run,
      });
    });

    return accumulator;
  }, []);

  return {
    nodeRegistry: mergedNodeSnapshot.nodeRegistry,
    allNodeDefinitions: mergedNodeSnapshot.allNodeDefinitions,
    nodeDefinitionMap: mergedNodeSnapshot.nodeDefinitionMap as Record<string, NodeDefinition>,
    nodeTypes: mergedNodeSnapshot.nodeTypes,
    toolbarItems,
    sidebarItems: plugins.flatMap((plugin) =>
      (plugin.sidebarItems ?? []).map((item) => ({
        ...item,
        pluginName: plugin.name,
        run: resolveActionHandler(plugin.name, item.action, actions),
      })),
    ),
  };
}

const usePluginStore = create<PluginState>((set) => ({
  plugins: [],
  nodeRegistry: [],
  allNodeDefinitions: [],
  nodeDefinitionMap: {},
  nodeTypes: {},
  toolbarItems: [],
  sidebarItems: [],
  registerPlugin: (plugin) =>
    set((state) => {
      const sanitizedPlugin = sanitizePluginDefinition(plugin);
      const nextPlugins = [
        ...state.plugins.filter((entry) => entry.name !== sanitizedPlugin.name),
        sanitizedPlugin,
      ];
      return {
        plugins: nextPlugins,
        ...buildPluginSnapshot(nextPlugins),
      };
    }),
  unregisterPlugin: (name) =>
    set((state) => {
      const nextPlugins = state.plugins.filter((plugin) => plugin.name !== name);
      return {
        plugins: nextPlugins,
        ...buildPluginSnapshot(nextPlugins),
      };
    }),
}));

export function registerPlugin(plugin: PluginDefinition) {
  usePluginStore.getState().registerPlugin(plugin);
}

export function unregisterPlugin(name: string) {
  usePluginStore.getState().unregisterPlugin(name);
}

export async function loadPlugin(
  loader: PluginLoader,
) {
  try {
    const loaded = await loader();
    const plugin = loaded.default ?? loaded.plugin;

    if (!plugin) {
      return null;
    }

    registerPlugin(plugin);
    return plugin;
  } catch (error) {
    console.error('[pluginSystem] Failed to load plugin.', error);
    return null;
  }
}

let installedPluginsPromise: Promise<Array<PluginDefinition | null>> | null = null;

export function loadInstalledPlugins() {
  if (!installedPluginsPromise) {
    installedPluginsPromise = Promise.all(installedPluginLoaders.map((loader) => loadPlugin(loader)));
  }

  return installedPluginsPromise;
}

export function registerPluginLoader(loader: PluginLoader) {
  installedPluginLoaders.push(loader);
  installedPluginsPromise = null;
}

export function usePluginNodeRegistry() {
  return usePluginStore((state) =>
    state.nodeRegistry.length > 0 ? state.nodeRegistry : getBuiltInSnapshot().nodeRegistry,
  );
}

export function usePluginNodeTypes() {
  return usePluginStore((state) => {
    const currentNodeTypes = Object.keys(state.nodeTypes);
    return currentNodeTypes.length > 0 ? state.nodeTypes : getBuiltInSnapshot().nodeTypes;
  });
}

export function usePluginToolbarItems() {
  return usePluginStore((state) => state.toolbarItems);
}

export function usePluginSidebarItems() {
  return usePluginStore((state) => state.sidebarItems);
}

export function getPluginNodeDefinition(type: AppNodeType | string) {
  const definitionMap = usePluginStore.getState().nodeDefinitionMap;
  const pluginDefinition = Object.keys(definitionMap).length > 0 ? definitionMap[type] : undefined;
  return pluginDefinition ?? getStaticNodeDefinition(type);
}

export function getPluginDefaultNodeData(type: AppNodeType): NodeData {
  const definition = getPluginNodeDefinition(type);

  if (!definition) {
    return getStaticDefaultNodeData(type);
  }

  return {
    ...definition.defaultData,
    label: definition.label,
  };
}

export function createPluginActionContext(
  input: PluginActionContext,
): PluginActionContext {
  return input;
}

export function createPluginNode(
  type: AppNodeType,
  position: { x: number; y: number },
  overrides?: { label?: string; color?: string | null },
) {
  const defaults = getPluginDefaultNodeData(type);

  return {
    id: uuidv4(),
    type,
    position,
    width: defaults.width,
    height: defaults.height,
    data: {
      ...defaults,
      label: overrides?.label ?? defaults.label,
      color: overrides?.color ?? defaults.color ?? null,
    },
  } satisfies Node<NodeData>;
}
