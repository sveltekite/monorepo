import Super from '$lib/components/SuperComponent.svelte'
import { type Component } from "svelte"
import { type RemoteQuery } from "@sveltejs/kit"
import { withProps, withContext } from "$lib/functions/helpers"

type GetterMap = {
   [key:string]: [ Component<any>, string[] ]
}

export class SuperComponent {
   public id = crypto.randomUUID()
   public component = $state<Component<any>>()
   public queries = $state<Record<string, RemoteQuery<any>>>()
   constructor(component: Component<any>, queries: Record<string, RemoteQuery<any>>, getterMap: GetterMap) {
      this.queries = queries
      this.component = component

      for (const [ getterName, [ getterComponent, propKeys ] ] of Object.entries(getterMap)) {
         Object.defineProperty(this, getterName, {
            get: () => withContext(this.id, getterComponent, propKeys),
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
