<script lang="ts">
   import { type {{ClassName}}Schema } from '$lib/generated/data.js'

   let { {{entityName}}, callback }: { {{entityName}}: {{ClassName}}Schema, callback: (id: string) => void } = $props()
</script>

<button onclick={() => callback({{entityName}}.id)}>x</button>
