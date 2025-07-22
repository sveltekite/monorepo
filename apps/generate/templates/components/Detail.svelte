<script lang="ts">
   import { type {{ClassName}} } from '$lib/generated/classes/{{ClassName}}.svelte.js'

   let { {{entityName}} }: { {{entityName}}: {{ClassName}} } = $props()
</script>

{{fieldInputs}}

{{relationSelectors}}
