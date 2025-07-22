import fs from 'fs/promises'
import path from 'path'
import { SchemaParser } from './schema-parser.js'

export class CodeGenerator {
  constructor(schema, projectPath) {
    this.schema = schema
    this.projectPath = projectPath
  }

  async generateAll() {
    await this.ensureDirectories()
    await this.generateSchemaFile()
    await this.generateTablesFile()
    await this.generateDataFile()
    await this.generateDbFile()
    await this.generateEntityClasses()
    await this.copyRouteTemplates()
    console.log('✅ Generated all files successfully!')
  }

  async ensureDirectories() {
    const dirs = [
      'src/lib/generated',
      'src/lib/generated/classes',
      'src/routes'
    ]

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.projectPath, dir), { recursive: true })
    }
  }

  async generateSchemaFile() {
    const imports = `import { z } from 'zod'\n\n`

    const schemas = Object.entries(this.schema.entities)
      .map(([entityName, config]) => SchemaParser.generateZodSchema(entityName, config))
      .join('\n\n')

    const joinTableSchemas = Object.entries(this.schema.joinTables)
      .map(([tableName, config]) => {
        const zodFields = Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
          return `   ${fieldName}: z.uuid()`
        }).join(',\n')

        return `const ${tableName}Schema = z.object({
${zodFields}
})

export type ${this.capitalize(tableName)}Schema = z.infer<typeof ${tableName}Schema>`
      }).join('\n\n')

    const content = imports + schemas + '\n\n' + joinTableSchemas

    await fs.writeFile(
      path.join(this.projectPath, 'src/lib/generated/schema.ts'),
      content
    )
  }

  async generateTablesFile() {
    const entityTypes = Object.keys(this.schema.entities)
      .map(entity => `${this.capitalize(entity)}Schema`)
      .join(', ')

    const joinTableTypes = Object.keys(this.schema.joinTables)
      .map(table => `${this.capitalize(table)}Schema`)
      .join(', ')

    const allTypes = [entityTypes, joinTableTypes].filter(Boolean).join(', ')

    const imports = `import type { EntityTable } from 'dexie'
import type { ${allTypes} } from './schema.js'\n\n`

    const tableInterface = this.generateTableInterface()
    const storesConfig = SchemaParser.generateStoresConfig(this.schema.entities, this.schema.joinTables)

    const content = `${imports}${tableInterface}

export const storesConfig = ${storesConfig}`

    await fs.writeFile(
      path.join(this.projectPath, 'src/lib/generated/tables.ts'),
      content
    )
  }

  generateTableInterface() {
    const entityTables = Object.keys(this.schema.entities)
      .map(entity => `   ${entity}: EntityTable<${this.capitalize(entity)}Schema, 'id'>`)

    const joinTables = Object.keys(this.schema.joinTables)
      .map(table => `   ${table}: EntityTable<${this.capitalize(table)}Schema>`)

    const allTables = [...entityTables, ...joinTables].join('\n')

    return `export interface TableNames {
${allTables}
}`
  }

  async generateDataFile() {
    const entityImports = Object.keys(this.schema.entities)
      .map(entity => `import { ${this.capitalize(entity)} } from './classes/${this.capitalize(entity)}.svelte.js'`)
      .join('\n')

    const constructors = Object.keys(this.schema.entities)
      .map(entity => `   ${entity}: ${this.capitalize(entity)}`)
      .join(',\n')

    const content = `// GENERATED FILE - DO NOT EDIT
${entityImports}

export const constructors = {
${constructors}
}

export * from './schema.js'
export * from './tables.js'
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/lib/generated/data.ts'),
      content
    )
  }

  async generateDbFile() {
    const content = `// GENERATED FILE - DO NOT EDIT
import { DexieAdapter } from '$lib/db/DexieAdapter.js'
import { storesConfig } from './tables.js'

export const db = new DexieAdapter('app-db', storesConfig)
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/lib/generated/db.ts'),
      content
    )
  }

  async generateEntityClasses() {
    for (const [entityName, config] of Object.entries(this.schema.entities)) {
      await this.generateEntityClass(entityName, config)
    }
  }

  async generateEntityClass(entityName, config) {
    const className = this.capitalize(entityName)
    const schemaType = `${className}Schema`

    // Collect all schema types needed for imports
    const relatedSchemas = Object.values(config.relations)
      .filter(rel => rel.type === 'manyToMany' || rel.type === 'hasMany')
      .map(rel => `${this.capitalize(rel.target)}Schema`)

    const allSchemas = [schemaType, ...relatedSchemas].filter((v, i, a) => a.indexOf(v) === i)

    // Generate imports
    const imports = `import type { ${allSchemas.join(', ')} } from '../schema.js'
import { BaseDB } from '$lib/classes/BaseDB.js'

`

    // Generate default data
    const defaultData = SchemaParser.generateDefaultData(entityName, config)

    // Generate relation state properties
    const relationStates = Object.entries(config.relations)
      .filter(([_, rel]) => rel.type === 'manyToMany' || rel.type === 'hasMany')
      .map(([relationName, rel]) => `   _${relationName} = $state<${this.capitalize(rel.target)}Schema[]>([])`)
      .join('\n')

    // Generate constructor relation calls
    const constructorCalls = Object.entries(config.relations)
      .filter(([_, rel]) => rel.type === 'manyToMany' || rel.type === 'hasMany')
      .map(([relationName]) => `      this.refresh${this.capitalize(relationName)}()`)
      .join('\n')

    // Generate relation methods
    const relationMethods = this.generateRelationMethods(entityName, config.relations)

    const content = `${imports}export class ${className} extends BaseDB {
   public data = $state<${schemaType}>(${defaultData})
${relationStates ? '\n' + relationStates + '\n' : ''}
   constructor(data?: ${schemaType}) {
      super()
      if (data) this.data = data
${constructorCalls ? constructorCalls + '\n' : ''}   }

${relationMethods}
   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const ${entityName} = new ${className}()
      return ${entityName}.db.put('${entityName}')(${entityName}.snapshot)
   }
}
`

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/classes/${className}.svelte.ts`),
      content
    )
  }

  generateRelationMethods(entityName, relations) {
    const methods = []

    for (const [relationName, relation] of Object.entries(relations)) {
      if (relation.type === 'belongsTo') {
        // Generate update method for foreign key
        const methodName = `update${this.capitalize(relationName.replace(/Id$/, ''))}`
        methods.push(`   ${methodName} = (id: string) => {
      this.data.${relation.foreignKey} = id
   }`)
      } else if (relation.type === 'manyToMany') {
        // Generate refresh, add, and remove methods
        const targetEntity = relation.target
        const joinTable = relation.through
        const entityIdField = `${entityName}Id`
        const targetIdField = `${targetEntity}Id`

        methods.push(`   refresh${this.capitalize(relationName)} = () => {
      return this.db.join('${entityName}')('${targetEntity}')({ ${entityIdField}: this.data.id })
         .then((res: ${this.capitalize(targetEntity)}Schema[]) => this._${relationName} = res)
   }`)

        methods.push(`   add${this.capitalize(targetEntity)} = (id: string) => {
      const ${entityIdField} = this.data.id
      const ${targetIdField} = id
      const joinRecord = { ${entityIdField}, ${targetIdField} }
      this.db.put('${joinTable}')(joinRecord)
      this.refresh${this.capitalize(relationName)}()
   }`)

        methods.push(`   remove${this.capitalize(targetEntity)} = (${targetEntity}Id: string) => {
      const ${entityIdField} = this.data.id
      this.db.del('${joinTable}')([${entityIdField}, ${targetEntity}Id])
      this.refresh${this.capitalize(relationName)}()
   }`)
      }
    }

    return methods.join('\n\n') + (methods.length > 0 ? '\n' : '')
  }

  async copyRouteTemplates() {
    // This would copy route templates from the package
    // For now, we'll generate basic route files
    await this.generateGenericRoutes()
    await this.generateLayoutFile()
  }

  async generateGenericRoutes() {
    // Create [table] route
    await fs.mkdir(path.join(this.projectPath, 'src/routes/[table]'), { recursive: true })
    await fs.mkdir(path.join(this.projectPath, 'src/routes/[table]/[id]'), { recursive: true })

    // Table list page
    const tableListContent = `<script lang="ts">
   import { page } from '$app/stores'
   import { db } from '$lib/generated/db.js'

   const tableName = $page.params.table
   let items = $state([])

   $effect(async () => {
      items = await db.all(tableName) || []
   })
</script>

<h1>{tableName.charAt(0).toUpperCase() + tableName.slice(1)}s</h1>

<ul>
   {#each items as item}
      <li>
         <a href="/{tableName}/{item.id}">
            {item.name || item.title || item.id}
         </a>
      </li>
   {/each}
</ul>

<a href="/{tableName}/new">Create New</a>
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/+page.svelte'),
      tableListContent
    )

    // Detail/edit page
    const detailContent = `<script lang="ts">
   import { page } from '$app/stores'
   import { constructors } from '$lib/generated/data.js'
   import { db } from '$lib/generated/db.js'

   const tableName = $page.params.table
   const id = $page.params.id
   const EntityClass = constructors[tableName]

   let entity = $state()

   $effect(async () => {
      if (id === 'new') {
         entity = new EntityClass()
      } else {
         const data = await db.get(tableName)(id)
         entity = new EntityClass(data)
      }
   })
</script>

{#if entity}
   {#if entity.detail}
      <entity.detail />
   {:else}
      <h1>{tableName} {id === 'new' ? 'Create' : 'Edit'}</h1>
      <pre>{JSON.stringify(entity.data, null, 2)}</pre>
   {/if}
{/if}
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/[id]/+page.svelte'),
      detailContent
    )
  }

  async generateLayoutFile() {
    const content = `import { setDB } from '$lib/dbConfig.js'
import { db } from '$lib/generated/db.js'

setDB(db)

export const ssr = false
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/+layout.ts'),
      content
    )
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  static async fromYamlFile(yamlPath, projectPath) {
    const yamlContent = await fs.readFile(yamlPath, 'utf-8')
    const schema = SchemaParser.parseYAML(yamlContent)
    return new CodeGenerator(schema, projectPath)
  }
}
