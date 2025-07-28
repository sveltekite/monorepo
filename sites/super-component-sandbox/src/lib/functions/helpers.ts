import { type Component } from "svelte"
import LoadContext from '$lib/components/LoadContext.svelte'

export function withProps(Component: Component<any>, defaultProps: Record<string, any>) {
   return function ($$anchor: any, $$props: any) {
      const mergedProps = { ...defaultProps, ...$$props };
      return Component($$anchor, mergedProps);
   };
}

export function withContext(contextKey: string, Component: Component<any>, keys: string[]) {
   return withProps(LoadContext, { contextKey, keys, Child: Component })
}
