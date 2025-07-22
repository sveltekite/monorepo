import { createRawSnippet, mount, unmount } from 'svelte'

export function withSave(SaveComponent: any, ChildComponent: any, props: Record<string, any>, saver: Function) {
  return function($$anchor: any, $$props: any) {
    const mergedProps = { ...props, ...$$props };

    const saveProps = {
      ...mergedProps,
      saver,
      children: createRawSnippet((restProps) => ({
        render: () => `<div class="boundary save"></div>`,
        setup: (target) => {
          const childInstance = mount(ChildComponent, {
            target,
            props: { ...restProps, ...mergedProps }
          });
          return () => unmount(childInstance);
        }
      }))
    };

    return SaveComponent($$anchor, saveProps);
  };
}
