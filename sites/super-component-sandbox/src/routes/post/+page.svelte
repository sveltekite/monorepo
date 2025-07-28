<script lang="ts">
   import { getPosts, addPost, resetPosts } from "$lib/remote/post.remote";
</script>

<p>
   <button onclick={() => addPost()}>Add Post</button>
   <button onclick={() => resetPosts()}>Reset Posts</button>
</p>

<ul>
   {#each await getPosts() as { id, value }}
      <li><a href={`/post/${id}`}>{id}: {value}</a></li>
   {/each}
</ul>
