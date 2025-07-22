import { createRawSnippet, mount, unmount } from 'svelte'
import DataLoad from '$lib/components/DataLoad.svelte';

export function withData(ChildComponent: any, propName: string, loader: Function) {
   return function ($$anchor: any, $$props: any) {
      const loadProps = {
         loader,
         children: createRawSnippet((loadedData) => ({
            render: () => `<div class="boundary"></div>`,
            setup: (target) => {
               const childInstance = mount(ChildComponent, {
                  target,
                  props: {
                     ...$$props, // Spread the original props first
                     [propName]: loadedData() // Then add/override with the loaded data
                  }
               });
               return () => unmount(childInstance);
            }
         }))
      };

      // Remove the propName from $$props to avoid passing it to the Load component
      const { [propName]: _, ...propsForLoad } = $$props;
      const mergedProps = { ...loadProps, ...propsForLoad };

      return DataLoad($$anchor, mergedProps);
   };
}
