import { createNodeComponent } from './createNodeComponent';

export default createNodeComponent({
  type: 'connector',
  className: 'node-connector',
  labelPlaceholder: 'Ref',
  contentClassName: 'node-connector__content',
});
