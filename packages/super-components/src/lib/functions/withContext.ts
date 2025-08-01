import { type Component } from "svelte"
import LoadContext from '$lib/components/LoadContext.svelte'
import { withProps } from "./withProps.js"

export function withContext(contextKey: string, Component: Component<any>, keys: string[]) {
   return withProps(LoadContext, { contextKey, keys, Child: Component })
}
