import React from 'react';
import NodeShell from './NodeShell';
import type { AppNodeType, CustomNodeProps } from './types';

type NodeComponentConfig = {
  type: AppNodeType;
  className: string;
  labelPlaceholder: string;
  contentClassName?: string;
};

export function createNodeComponent(config: NodeComponentConfig) {
  const Component: React.FC<CustomNodeProps> = (props) => (
    <NodeShell
      {...props}
      nodeType={config.type}
      className={config.className}
      labelPlaceholder={config.labelPlaceholder}
      contentClassName={config.contentClassName}
    />
  );

  Component.displayName = `${config.type}Node`;

  return React.memo(Component);
}
