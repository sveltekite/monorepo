<!-- src/routes/db/+page.svelte -->
<script>
  import { onMount } from 'svelte'
  import { getDatabaseInfo, createTestUser, getTestUser, cleanupTestUsers } from '$lib/remote/db-test.remote.js'

  let dbStatus = $state('Testing...')
  let tables = $state([])
  let testResults = $state([])
  let error = $state(null)
  let isRunning = $state(false)

  async function runDatabaseTests() {
    isRunning = true
    testResults = []
    error = null
    dbStatus = 'Testing...'

    try {
      // Test 1: Check if we can connect and get tables
      dbStatus = 'Testing database connection...'
      const dbInfo = await getDatabaseInfo()

      tables = dbInfo.tables
      testResults.push({
        test: 'Database Connection',
        status: '✅ Connected',
        details: `Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`
      })

      // Test 2: Try to create a test record
      dbStatus = 'Testing record creation...'
      const createResult = await createTestUser()

      testResults.push({
        test: 'Create Record',
        status: '✅ Success',
        details: `Created user with ID: ${createResult.userId}`
      })

      // Test 3: Try to read the record back
      dbStatus = 'Testing record retrieval...'
      const readResult = await getTestUser(createResult.userId)

      if (readResult.found && readResult.user) {
        testResults.push({
          test: 'Read Record',
          status: '✅ Success',
          details: `Found user: ${readResult.user.name} (${readResult.user.email})`
        })
      } else {
        testResults.push({
          test: 'Read Record',
          status: '❌ Failed',
          details: 'Could not find the user that was just created'
        })
      }

      dbStatus = '✅ All tests passed! Database is working correctly.'
      error = null

    } catch (err) {
      dbStatus = '❌ Database tests failed'
      error = err.message
      testResults.push({
        test: 'Database Test',
        status: '❌ Failed',
        details: err.message
      })
    } finally {
      isRunning = false
    }
  }

  async function cleanup() {
    try {
      const result = await cleanupTestUsers()
      alert(result.message)
      // Refresh the table info
      const dbInfo = await getDatabaseInfo()
      tables = dbInfo.tables
    } catch (err) {
      alert(`Cleanup failed: ${err.message}`)
    }
  }

  onMount(runDatabaseTests)
</script>

<div class="container">
  <h1>Database Test</h1>

  <div class="status">
    <h2>Status: {dbStatus}</h2>
    {#if error}
      <div class="error">
        <strong>Error:</strong> {error}
      </div>
    {/if}
  </div>

  <div class="test-results">
    <h3>Test Results</h3>
    {#if isRunning}
      <p>🔄 Running tests...</p>
    {:else if testResults.length === 0}
      <p>No tests run yet</p>
    {:else}
      {#each testResults as result}
        <div class="test-item">
          <div class="test-name">{result.test}</div>
          <div class="test-status">{result.status}</div>
          <div class="test-details">{result.details}</div>
        </div>
      {/each}
    {/if}
  </div>

  {#if tables.length > 0}
    <div class="tables-info">
      <h3>Database Tables</h3>
      {#each tables as table}
        <div class="table-info">
          <strong>{table.name}</strong>
          <span class="row-count">({table.count} rows)</span>
          <div class="columns">
            Columns: {table.columns.map(c => `${c.name} (${c.type})`).join(', ')}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="actions">
    <button onclick={runDatabaseTests} disabled={isRunning}>
      {isRunning ? 'Running Tests...' : 'Rerun Tests'}
    </button>
    <button onclick={cleanup} disabled={isRunning}>
      Clean Up Test Data
    </button>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .status h2 {
    color: #333;
  }

  .error {
    background: #fee;
    border: 1px solid #fcc;
    padding: 1rem;
    border-radius: 4px;
    color: #c33;
    margin: 1rem 0;
  }

  .test-results {
    margin: 2rem 0;
  }

  .test-item {
    display: grid;
    grid-template-columns: 1fr auto 2fr;
    gap: 1rem;
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
    align-items: center;
  }

  .test-name {
    font-weight: 600;
  }

  .test-status {
    font-family: monospace;
    white-space: nowrap;
  }

  .test-details {
    color: #666;
    font-size: 0.9em;
  }

  .tables-info {
    margin: 2rem 0;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }

  .table-info {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }

  .row-count {
    color: #666;
    font-size: 0.9em;
  }

  .columns {
    color: #666;
    font-size: 0.85em;
    margin-top: 0.25rem;
  }

  .actions {
    margin: 2rem 0;
    display: flex;
    gap: 1rem;
  }

  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
</style>
