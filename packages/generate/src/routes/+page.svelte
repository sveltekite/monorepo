<script lang="ts">
	import { onMount } from 'svelte';

	let yamlInput = `# Example schema
user:
  name: string
  email: string

post:
  title: string
  content: text
  user: user  # belongsTo relationship
  tags: [tag]  # manyToMany relationship

tag:
  name: string
  color: color`;

	let generatedSchema = $state<any>(null);
	let generatedArtifacts = $state<any[]>([]);
	let isGenerating = $state(false);
	let error = $state<string | null>(null);
	let isDarkMode = $state(false);

	// Load dark mode preference
	onMount(() => {
		const saved = localStorage.getItem('darkMode');
		isDarkMode = saved === 'true';
		updateDarkMode();
		generateCode();
	});

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		localStorage.setItem('darkMode', isDarkMode.toString());
		updateDarkMode();
	}

	function updateDarkMode() {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	async function generateCode() {
		try {
			isGenerating = true;
			error = null;
			
			// Call our API endpoint
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					yamlContent: yamlInput,
					options: {}
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				generatedSchema = result.schema;
				generatedArtifacts = result.artifacts;
			} else {
				error = result.error;
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('Generation error:', err);
		} finally {
			isGenerating = false;
		}
	}

	// Generate on mount with example
	// (moved to onMount above)
</script>

<svelte:head>
	<title>SvelteKite Code Generator</title>
</svelte:head>

<div class="container">
	<header>
		<h1>🪁 SvelteKite Code Generator</h1>
		<button onclick={toggleDarkMode} class="dark-mode-toggle" title="Toggle dark mode">
			{isDarkMode ? '☀️' : '🌙'}
		</button>
	</header>
	<p>Generate SvelteKit applications from YAML schemas using AST-based code generation.</p>

	<div class="editor-section">
		<h2>📝 Schema Editor</h2>
		<div class="editor-container">
			<textarea 
				bind:value={yamlInput}
				placeholder="Enter your YAML schema here..."
				rows="15"
				class="schema-editor"
			></textarea>
			<button onclick={generateCode} disabled={isGenerating} class="generate-btn">
				{isGenerating ? '⚙️ Generating...' : '🚀 Generate'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="error">
			<h3>❌ Error</h3>
			<pre>{error}</pre>
		</div>
	{/if}

	{#if generatedSchema}
		<div class="results-section">
			<h2>🎯 Parsed Schema</h2>
			<div class="schema-preview">
				<h3>Entities ({generatedSchema.entities.length})</h3>
				{#each generatedSchema.entities as entity}
					<div class="entity-card">
						<h4>{entity.name}</h4>
						<div class="fields">
							<strong>Fields:</strong>
							{#each entity.fields as field}
								<span class="field-tag">{field.name}: {field.dataType.kind === 'primitive' ? field.dataType.name : field.dataType.kind}</span>
							{/each}
						</div>
						{#if entity.relationships.length > 0}
							<div class="relationships">
								<strong>Relationships:</strong>
								{#each entity.relationships as rel}
									<span class="rel-tag">{rel.name} → {rel.targetEntity} ({rel.relationshipType})</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}

				{#if generatedSchema.joinTables.length > 0}
					<h3>Join Tables ({generatedSchema.joinTables.length})</h3>
					{#each generatedSchema.joinTables as joinTable}
						<div class="join-table-card">
							<h4>{joinTable.name}</h4>
							<span>{joinTable.leftEntity} ↔ {joinTable.rightEntity}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}

	{#if generatedArtifacts.length > 0}
		<div class="artifacts-section">
			<h2>📦 Generated Artifacts</h2>
			<p>{generatedArtifacts.length} files would be generated:</p>
			
			{#each generatedArtifacts as artifact}
				<div class="artifact-card">
					<div class="artifact-header">
						<h4>{artifact.targetPath}</h4>
						<span class="artifact-type">{artifact.artifactType}</span>
					</div>
					<details>
						<summary>View generated content</summary>
						<pre class="code-preview">{artifact.content[0]?.content?.content || 'No content'}</pre>
					</details>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(html) {
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) {
		color-scheme: dark;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
		background-color: var(--bg-color);
		color: var(--text-color);
		min-height: 100vh;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(:root) {
		--bg-color: #ffffff;
		--text-color: #333333;
		--card-bg: #f8f9fa;
		--border-color: #ddd;
		--input-bg: #ffffff;
		--button-bg: #ff3e00;
		--button-hover: #e63946;
		--error-bg: #fee;
		--error-border: #fcc;
		--code-bg: #2d3748;
		--code-text: #e2e8f0;
	}

	:global(.dark) {
		--bg-color: #1a1a1a;
		--text-color: #e0e0e0;
		--card-bg: #2d2d2d;
		--border-color: #404040;
		--input-bg: #2d2d2d;
		--button-bg: #ff3e00;
		--button-hover: #e63946;
		--error-bg: #3d1a1a;
		--error-border: #5a2d2d;
		--code-bg: #1e1e1e;
		--code-text: #e0e0e0;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	h1 {
		color: #ff3e00;
		margin: 0;
	}

	.dark-mode-toggle {
		background: none;
		border: 2px solid var(--border-color);
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		cursor: pointer;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		color: var(--text-color);
		background-color: var(--card-bg);
	}

	.dark-mode-toggle:hover {
		transform: scale(1.1);
		border-color: #ff3e00;
	}

	.editor-section {
		margin-bottom: 2rem;
	}

	.editor-container {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.schema-editor {
		flex: 1;
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 14px;
		resize: vertical;
		background-color: var(--input-bg);
		color: var(--text-color);
	}

	.generate-btn {
		padding: 1rem 2rem;
		background: var(--button-bg);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
		white-space: nowrap;
	}

	.generate-btn:hover {
		background: var(--button-hover);
	}

	.generate-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		background: var(--error-bg);
		border: 2px solid var(--error-border);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.error pre {
		color: #c00;
		margin: 0;
	}

	.results-section {
		margin-bottom: 2rem;
	}

	.schema-preview {
		background: var(--card-bg);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.entity-card {
		background: var(--input-bg);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.entity-card h4 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color);
	}

	.fields, .relationships {
		margin-bottom: 0.5rem;
	}

	.field-tag, .rel-tag {
		display: inline-block;
		background: #e9ecef;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		margin: 0.25rem 0.25rem 0 0;
		color: #333; /* Keep dark text for contrast against light background */
	}

	.rel-tag {
		background: #d1ecf1;
		color: #333; /* Keep dark text for contrast against light background */
	}

	.join-table-card {
		background: var(--input-bg);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 0.5rem;
	}

	.join-table-card h4 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color);
	}

	.artifacts-section {
		margin-top: 2rem;
	}

	.artifact-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.artifact-header {
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--input-bg);
	}

	.artifact-header h4 {
		margin: 0;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.875rem;
		color: var(--text-color);
	}

	.artifact-type {
		background: #007bff;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.code-preview {
		padding: 1rem;
		background: var(--code-bg);
		color: var(--code-text);
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 12px;
		line-height: 1.5;
		overflow-x: auto;
		margin: 0;
	}

	details {
		background: var(--input-bg);
	}

	summary {
		padding: 0.75rem 1rem;
		cursor: pointer;
		border-top: 1px solid var(--border-color);
		background: var(--card-bg);
		color: var(--text-color);
	}

	summary:hover {
		background: var(--border-color);
	}
</style>
