import { createCommandGroupDecorator } from 'necord';

export const MetaCommand = createCommandGroupDecorator({
  name: 'vgc',
  description: 'VGC Meta Analysis',
  dmPermission: true,
});
