import { createRawSnippet, mount, unmount } from 'svelte'
import DataLoad from '$lib/components/DataLoad.svelte';

export function withInstance(ChildComponent: any, propName: string, loader: Function, constructor: any) {
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
                     [propName]: new constructor(loadedData() as any)
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
