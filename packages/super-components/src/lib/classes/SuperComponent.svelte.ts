import Super from '$lib/components/Super.svelte'
import { type Component } from "svelte"
import { type RemoteQuery } from "@sveltejs/kit"
import { withProps } from "$lib/functions/withProps.js"
import { withContext } from '$lib/functions/withContext.js'
import { hash } from '$lib/functions/hash.js'

type GetterMap = {
   [key:string]: [ Component<any>, string[] ]
}

export class SuperComponent {
   public component = $state<Component<any>>()
   public queries = $state<Record<string, RemoteQuery<any>>>()
   public hash: string

   constructor(component: Component<any>, queries: Record<string, RemoteQuery<any>>, getterMap: GetterMap) {
      this.hash = hash(component, queries, getterMap)
      this.queries = queries
      this.component = component

      for (const [ getterName, [ getterComponent, propKeys ] ] of Object.entries(getterMap)) {
         Object.defineProperty(this, getterName, {
            get: () => withContext(this.hash, getterComponent, propKeys),
            enumerable: true,
            configurable: true
         })
      }
   }

   get Super() {
      return Super
   }

   get svelte() {
      return withProps(Super, { instance: this })
   }
}
