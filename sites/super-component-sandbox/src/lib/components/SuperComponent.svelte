<script lang="ts">
   import { setContext } from 'svelte'
   import { type SuperComponent } from '$lib/classes/SuperComponent.svelte';
	import type { HttpError as HttpErrorType } from '@sveltejs/kit';
	import HttpError from './HttpError.svelte';

   let { instance }: { instance: SuperComponent } = $props()

   const [ data, errors ] = $derived.by(() => {
      if (!instance.queries) return [{}, {}]
      if (Object.values(instance.queries).some(q => q.loading === true)) return [{}, {}]
      const _data: Record<string, any> = {}
      const _errors: Record<string, HttpErrorType> = {}
      for ( const [key, query] of Object.entries(instance.queries) ) {
         if (query.current) _data[key] = query.current
         if (query.error) _errors[key] = query.error
      }
      return [ _data, _errors]
   })

   setContext(instance.id, { getData: (key: string) => data[key] })
</script>

{#each Object.entries(errors) as [key, error]}
   <HttpError {key} {error} />
{/each}

{#if data && instance.component}
   <instance.component {instance} {...data} />
{/if}
