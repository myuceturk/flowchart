import { createNodeComponent } from './createNodeComponent';

export default createNodeComponent({
  type: 'inputOutput',
  className: 'node-input-output',
  labelPlaceholder: 'Input / Output',
  contentClassName: 'node-input-output__content',
});
