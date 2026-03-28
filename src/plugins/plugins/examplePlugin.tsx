import { Rocket, WandSparkles } from 'lucide-react';
import { createNodeComponent } from '../../nodes/createNodeComponent';
import type { PluginDefinition } from '../pluginSystem';

const DeployNoteNode = createNodeComponent({
  type: 'deployNote',
  className: 'node-card',
  labelPlaceholder: 'Deployment note',
});

const examplePlugin: PluginDefinition = {
  name: 'deployment-kit',
  nodes: [
    {
      category: 'Technical',
      nodes: [
        {
          type: 'deployNote',
          category: 'Technical',
          label: 'Deploy Note',
          description: 'Release and rollout checkpoints for ops flows',
          icon: <Rocket size={18} strokeWidth={1.9} />,
          tone: 'orange',
          defaultData: {
            label: 'Deploy',
            color: 'var(--theme-node-surface)',
            preset: 'default',
            width: 172,
            height: 76,
            minWidth: 132,
            minHeight: 58,
          },
          component: DeployNoteNode,
          miniMapColor: '#f97316',
          badge: 'Plugin',
        },
      ],
    },
  ],
  actions: [
    {
      id: 'seedDeployNode',
      label: 'Seed deploy note',
      run: ({ addNode }) => {
        addNode({
          type: 'deployNote',
          label: 'Plugin Deploy',
        });
      },
    },
    {
      id: 'focusCanvas',
      label: 'Focus canvas',
      run: ({ fitView }) => {
        void fitView();
      },
    },
  ],
  toolbarItems: [
    {
      id: 'seedDeployNode',
      label: 'Deploy Note',
      icon: <Rocket size={16} strokeWidth={1.9} />,
      action: 'seedDeployNode',
    },
  ],
  sidebarItems: [
    {
      id: 'pluginDeployNote',
      label: 'Plugin Deploy',
      description: 'Create a deployment milestone from the plugin catalog',
      icon: <WandSparkles size={18} strokeWidth={1.9} />,
      tone: 'orange',
      indicator: 'Plugin',
      payload: {
        type: 'deployNote',
        label: 'Plugin Deploy',
      },
    },
  ],
};

export default examplePlugin;
