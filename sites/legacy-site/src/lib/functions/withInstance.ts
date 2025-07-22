import { createRawSnippet, mount, unmount } from 'svelte'
import DataLoad from '$lib/components/DataLoad.svelte';
// probably want constructor to be passed in, maybe?
import { constructors } from '$lib/generated/data.js'

// type loadedData properly as a constructor (might want to pass a Monad through the load process)

export function withInstance(ChildComponent: any, propName: keyof typeof constructors, loader: Function) {
   return function ($$anchor: any, $$props: any) {
      const loadProps = {
         loader,
         children: createRawSnippet((loadedData) => ({
            render: () => `<div class="boundary"></div>`,
            setup: (target) => {
               const childInstance = mount(ChildComponent, {
                  target,
                  props: {
                     ...$$props,
                     [propName]: new constructors[propName](loadedData() as any)
                  }
               });
               return () => unmount(childInstance);
            }
         }))
      };
      const mergedProps = { ...loadProps, ...$$props };
      return DataLoad($$anchor, mergedProps);
   };
}
