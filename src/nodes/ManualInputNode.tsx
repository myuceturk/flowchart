import { createNodeComponent } from './createNodeComponent';

export default createNodeComponent({
  type: 'manualInput',
  className: 'node-manual-input',
  labelPlaceholder: 'Manual Input',
  contentClassName: 'node-manual-input__content',
});
