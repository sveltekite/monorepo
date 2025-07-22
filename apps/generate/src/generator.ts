import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { SchemaParser, type Schema, type EntityConfig, type RelationConfig } from './schema-parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface GeneratorOptions {
  outputDir?: string
  dbName?: string
  generateRoutes?: boolean
}

export class CodeGenerator {
  constructor(private schema: Schema, private projectPath: string, private options: GeneratorOptions = {}) {}

  private async readTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '..', 'templates', 'components', `${templateName}.svelte`)
    return await fs.readFile(templatePath, 'utf-8')
  }

  private replaceTemplateVars(template: string, vars: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    }
    return result
  }

  async generateAll(): Promise<void> {
    await this.ensureDirectories()
    await this.generateSchemaFile()
    await this.generateTablesFile()
    await this.generateDataFile()
    await this.generateDbFile()
    await this.generateEntityClasses()
    await this.generateComponents()

    if (this.options.generateRoutes !== false) {
      await this.generateGenericRoutes()
      await this.generateLayoutFile()
      await this.generateLayoutSvelte()
    }

    console.log('✅ Generated all files successfully!')
    console.log('\n📁 Generated:')
    console.log('   ✅ Schemas and database configuration')
    console.log('   ✅ Entity classes with reactive state')
    console.log('   ✅ Default Svelte components')
    if (this.options.generateRoutes !== false) {
      console.log('   ✅ Generic CRUD routes')
      console.log('   ✅ Navigation layout')
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      'src/lib/generated',
      'src/lib/generated/classes',
      'src/lib/generated/components'
    ]

    if (this.options.generateRoutes !== false) {
      dirs.push('src/routes')
    }

    // Create entity-specific component directories
    for (const entityName of Object.keys(this.schema.entities)) {
      dirs.push(`src/lib/generated/components/${entityName.toLowerCase()}`)
    }

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.projectPath, dir), { recursive: true })
    }
  }

  async generateSchemaFile(): Promise<void> {
    const imports = `import { z } from 'zod'\n\n`

    const schemas = Object.entries(this.schema.entities)
      .map(([entityName, config]) => SchemaParser.generateZodSchema(entityName, config))
      .join('\n\n')

    const joinTableSchemas = Object.entries(this.schema.joinTables)
      .map(([tableName, config]) => {
        const zodFields = Object.entries(config.fields).map(([fieldName]) => {
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

  async generateTablesFile(): Promise<void> {
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

  private generateTableInterface(): string {
    const entityTables = Object.keys(this.schema.entities)
      .map(entity => `   ${entity}: EntityTable<${this.capitalize(entity)}Schema, 'id'>`)

    const joinTables = Object.keys(this.schema.joinTables)
      .map(table => `   ${table}: EntityTable<${this.capitalize(table)}Schema>`)

    const allTables = [...entityTables, ...joinTables].join('\n')

    return `export interface TableNames {
${allTables}
}`
  }

  async generateDataFile(): Promise<void> {
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

  async generateDbFile(): Promise<void> {
    const dbName = this.options.dbName || 'app-db'
    const content = `// GENERATED FILE - DO NOT EDIT
import { DexieAdapter } from 'sveltekite'
import { storesConfig } from './tables.js'

export const db = new DexieAdapter('${dbName}', storesConfig)
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/lib/generated/db.ts'),
      content
    )
  }

  async generateEntityClasses(): Promise<void> {
    for (const [entityName, config] of Object.entries(this.schema.entities)) {
      await this.generateEntityClass(entityName, config)
    }
  }

  async generateComponents(): Promise<void> {
    for (const [entityName, config] of Object.entries(this.schema.entities)) {
      await this.generateEntityComponents(entityName, config)
    }

    // Generate List and Delete components for entities that are targets of many-to-many relations
    const manyToManyTargets = new Set<string>()
    for (const [_, config] of Object.entries(this.schema.entities)) {
      for (const [_, relation] of Object.entries(config.relations)) {
        if (relation.type === 'manyToMany') {
          manyToManyTargets.add(relation.target)
        }
      }
    }

    // Generate List and Delete components for target entities
    for (const targetEntity of manyToManyTargets) {
      const config = this.schema.entities[targetEntity]
      if (config) {
        await this.generateListComponent(targetEntity, config)
        await this.generateDeleteComponent(targetEntity, config)
      }
    }
  }

  async generateEntityClass(entityName: string, config: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)
    const schemaType = `${className}Schema`

    // Collect all schema types needed for imports
    const relatedSchemas = Object.values(config.relations)
      .filter(rel => rel.type === 'manyToMany' || rel.type === 'hasMany')
      .map(rel => `${this.capitalize(rel.target)}Schema`)

    const allSchemas = [schemaType, ...relatedSchemas].filter((v, i, a) => a.indexOf(v) === i)

    // Generate imports
    const schemaImports = `import type { ${allSchemas.join(', ')} } from '../schema.js'`
    const baseImport = `import { BaseDB } from 'sveltekite'`
    const withImports = `import { withProps, withSave, withData, withInstance } from 'sveltekite'`
    const dataSaveImport = `import { DataSave } from 'sveltekite'`

    // Generate component imports
    const componentImports = this.generateComponentImports(entityName, config)

    const imports = `${schemaImports}
${baseImport}
${withImports}
${dataSaveImport}
${componentImports}

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

    // Generate component getters
    const componentGetters = this.generateComponentGetters(entityName, config)

    const content = `${imports}export class ${className} extends BaseDB {
   public data = $state<${schemaType}>(${defaultData})
${relationStates ? '\n' + relationStates + '\n' : ''}
   constructor(data?: ${schemaType}) {
      super()
      if (data) this.data = data
${constructorCalls ? constructorCalls + '\n' : ''}   }

${relationMethods}
${componentGetters}
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

  private generateRelationMethods(entityName: string, relations: Record<string, RelationConfig>): string {
    const methods: string[] = []

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
        const joinTable = relation.through!
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

  private generateComponentImports(entityName: string, config: EntityConfig): string {
    const className = this.capitalize(entityName)
    const imports: string[] = []

    // Always import own components (updated paths for new folder structure)
    imports.push(`import ${className}Detail from '../components/${entityName.toLowerCase()}/${className}Detail.svelte'`)
    imports.push(`import ${className}ListItem from '../components/${entityName.toLowerCase()}/${className}ListItem.svelte'`)

    // Import related entity components for selectors
    for (const [_relationName, relation] of Object.entries(config.relations)) {
      if (relation.type === 'belongsTo') {
        const targetClass = this.capitalize(relation.target)
        const targetEntity = relation.target
        imports.push(`import ${targetClass}Select from '../components/${targetEntity.toLowerCase()}/${targetClass}Select.svelte'`)
        imports.push(`import ${targetClass}ListItem from '../components/${targetEntity.toLowerCase()}/${targetClass}ListItem.svelte'`)
      } else if (relation.type === 'manyToMany') {
        const targetClass = this.capitalize(relation.target)
        const targetEntity = relation.target
        imports.push(`import ${targetClass}Select from '../components/${targetEntity.toLowerCase()}/${targetClass}Select.svelte'`)
        imports.push(`import ${targetClass}List from '../components/${targetEntity.toLowerCase()}/${targetClass}List.svelte'`)
      }
    }

    // Remove duplicates and return
    const uniqueImports = [...new Set(imports)]
    return uniqueImports.join('\n')
  }

  private generateComponentGetters(entityName: string, config: EntityConfig): string {
    const className = this.capitalize(entityName)
    const getters: string[] = []

    // Always generate detail and listItem getters
    getters.push(`   get detail() {
      return withSave(DataSave, ${className}Detail, { ${entityName}: this }, () => this.db.put('${entityName}')(this.snapshot))
   }`)

    getters.push(`   get listItem() {
      return withProps(${className}ListItem, { ${entityName}: this })
   }`)

    // Generate getters for relations
    for (const [relationName, relation] of Object.entries(config.relations)) {
      if (relation.type === 'belongsTo') {
        const targetEntity = relation.target
        const targetClass = this.capitalize(targetEntity)

        // Selector for choosing the related entity
        getters.push(`   get select${targetClass}() {
      return withData(${targetClass}Select, '${targetEntity}s', () => this.db.all('${targetEntity}')) as any
   }`)

        // Display component for the related entity
        const relationDisplayName = relationName.replace(/Id$/, '')
        getters.push(`   get ${relationDisplayName}() {
      return withInstance(${targetClass}ListItem, '${targetEntity}', () => this.db.get('${targetEntity}')(this.data.${relation.foreignKey}), ${targetClass}) as any
   }`)
      } else if (relation.type === 'manyToMany') {
        const targetEntity = relation.target
        const targetClass = this.capitalize(targetEntity)

        // List component for showing related entities
        getters.push(`   get ${relationName}() {
      return withProps(${targetClass}List, { ${relationName}: this._${relationName}, remove: this.remove${targetClass} }) as any
   }`)

        // Selector for adding related entities
        getters.push(`   get select${this.capitalize(relationName)}() {
      return withData(${targetClass}Select, '${relationName}', () => this.db.all('${targetEntity}')) as any
   }`)
      }
    }

    return getters.join('\n\n') + (getters.length > 0 ? '\n' : '')
  }

  async generateEntityComponents(entityName: string, config: EntityConfig): Promise<void> {
    // Generate Detail component
    await this.generateDetailComponent(entityName, config)

    // Generate ListItem component
    await this.generateListItemComponent(entityName, config)

    // Generate Select component for relations
    await this.generateSelectComponent(entityName, config)
  }

  private async generateDetailComponent(entityName: string, config: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)

    // Generate input fields for each field
    const fieldInputs = Object.entries(config.fields)
      .filter(([fieldName]) => fieldName !== 'id') // Skip ID field
      .map(([fieldName, fieldConfig]) => {
        if (fieldConfig.type === 'text') {
          return `<label for="${fieldName}">${this.capitalize(fieldName)}</label><br />
<textarea name="${fieldName}" bind:value={${entityName}.data.${fieldName}} rows="10" cols="40"></textarea>`
        } else if (fieldConfig.type === 'color') {
          return `<input type="color" bind:value={${entityName}.data.${fieldName}} />`
        } else {
          return `<input type="text" bind:value={${entityName}.data.${fieldName}} />`
        }
      })

    // Generate relation selectors
    const relationSelectors = Object.entries(config.relations)
      .map(([relationName, relation]) => {
        if (relation.type === 'belongsTo') {
          const targetClass = this.capitalize(relation.target)
          return `<${entityName}.select${targetClass} callback={${entityName}.update${targetClass}} />`
        } else if (relation.type === 'manyToMany') {
          const targetClass = this.capitalize(relation.target)
          return `<div>
   <${entityName}.${relationName} /><br />
   Add ${this.capitalize(relation.target)}: <${entityName}.select${this.capitalize(relationName)} callback={${entityName}.add${targetClass}} />
</div>`
        }
        return ''
      })
      .filter(Boolean)

    // Read template and replace variables
    const template = await this.readTemplate('Detail')
    const content = this.replaceTemplateVars(template, {
      ClassName: className,
      entityName: entityName,
      fieldInputs: fieldInputs.join('\n'),
      relationSelectors: relationSelectors.join('\n')
    })

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/components/${entityName.toLowerCase()}/${className}Detail.svelte`),
      content
    )
  }

  private async generateListItemComponent(entityName: string, config: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)
    const displayField = config.fields.name ? 'name' : config.fields.title ? 'title' : 'id'

    const template = await this.readTemplate('ListItem')
    const content = this.replaceTemplateVars(template, {
      ClassName: className,
      entityName: entityName,
      displayField: displayField
    })

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/components/${entityName.toLowerCase()}/${className}ListItem.svelte`),
      content
    )
  }

  private async generateSelectComponent(entityName: string, config: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)
    const displayField = config.fields.name ? 'name' : config.fields.title ? 'title' : 'id'

    const template = await this.readTemplate('Select')
    const content = this.replaceTemplateVars(template, {
      ClassName: className,
      EntityName: this.capitalize(entityName),
      entityName: entityName,
      displayField: displayField
    })

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/components/${entityName.toLowerCase()}/${className}Select.svelte`),
      content
    )
  }

  private async generateListComponent(entityName: string, config: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)
    const displayField = config.fields.name ? 'name' : config.fields.title ? 'title' : 'id'
    const hasColorField = config.fields.color

    const styleAttribute = hasColorField
      ? `style={\`color: black; background-color: \${${entityName}.color || 'grey'}; padding: 0.25em .5em; border-radius: 0.25em;\`}`
      : `style="padding: 0.25em .5em; border-radius: 0.25em; background-color: #f0f0f0;"`

    const template = await this.readTemplate('List')
    const content = this.replaceTemplateVars(template, {
      ClassName: className,
      entityName: entityName,
      displayField: displayField,
      styleAttribute: styleAttribute
    })

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/components/${entityName.toLowerCase()}/${className}List.svelte`),
      content
    )
  }

  private async generateDeleteComponent(entityName: string, _: EntityConfig): Promise<void> {
    const className = this.capitalize(entityName)

    const template = await this.readTemplate('Delete')
    const content = this.replaceTemplateVars(template, {
      ClassName: className,
      entityName: entityName
    })

    await fs.writeFile(
      path.join(this.projectPath, `src/lib/generated/components/${entityName.toLowerCase()}/${className}Delete.svelte`),
      content
    )
  }

  private async generateGenericRoutes(): Promise<void> {
    // Create [table] route
    await fs.mkdir(path.join(this.projectPath, 'src/routes/[table]'), { recursive: true })
    await fs.mkdir(path.join(this.projectPath, 'src/routes/[table]/[id]'), { recursive: true })

    // Generate table list page load function
    await this.generateTableListLoad()

    // Generate table list page
    await this.generateTableListPage()

    // Generate detail page load function
    await this.generateDetailLoad()

    // Generate detail page
    await this.generateDetailPage()
  }

  private async generateTableListLoad(): Promise<void> {
    const content = `import type { PageLoad } from "./$types.js";
import { db } from '$lib/generated/db.js'
import { constructors } from "$lib/generated/data.js";
import type { TableNames } from "$lib/generated/tables.js";

// Type for valid table names that have constructors
type ValidTableName = keyof typeof constructors;

// Type guard to check if a string is a valid table name
function isValidTableName(tableName: string): tableName is ValidTableName {
   return tableName in constructors;
}

// Type guard to check if table exists in database
function tableExistsInDb(tableName: string): tableName is keyof TableNames {
   return db.tables.some(table => table.name === tableName);
}

export const load: PageLoad = async ({ params }) => {
   const tableName = params.table;

   // Type-safe validation
   if (tableExistsInDb(tableName) && isValidTableName(tableName)) {
      const result = await db.all(tableName) as any[];

      // Type-safe constructor access
      const Constructor = constructors[tableName];

      return {
         entries: result.map(data => new Constructor(data)),
         constructor: Constructor,
         table: params.table
      };
   } else {
      return {};
   }
}
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/+page.ts'),
      content
    )
  }

  private async generateTableListPage(): Promise<void> {
    const content = `<script lang="ts">
   import { invalidateAll } from "$app/navigation";

   type ValidClass = {
      create: Function
   }

   type Data = {
      entries: any[];
      constructor: ValidClass;
      table: string;
   };

   let { data }: { data: Data } = $props();

   function add() {
      data.constructor.create();
      invalidateAll();
   }
</script>

<h2>{data.table}s</h2>
<button onclick={add}>add</button>
<ul>
   {#each data.entries as el}
      <li><a href={\`/\${data.table}/\${el.data.id}\`}><el.listItem /></a></li>
   {/each}
</ul>
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/+page.svelte'),
      content
    )
  }

  private async generateDetailLoad(): Promise<void> {
    const content = `import type { PageLoad } from "./$types.js";
import { db } from '$lib/generated/db.js'
import { constructors } from "$lib/generated/data.js";
import type { TableNames } from "$lib/generated/tables.js";

type ValidTableName = keyof typeof constructors;

function isValidTableName(tableName: string): tableName is ValidTableName {
   return tableName in constructors;
}

function tableExistsInDb(tableName: string): tableName is keyof TableNames {
   return db.tables.some(table => table.name === tableName);
}

export const load: PageLoad = async ({ params }) => {
   const tableName = params.table;

   if (tableExistsInDb(tableName) && isValidTableName(tableName)) {
      const data = await db.get(params.table as keyof TableNames)(params.id)

      const Constructor = constructors[tableName];

      return {
         // @ts-ignore
         [tableName]: new Constructor(data)
      };
   } else {
      return {};
   }
}
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/[id]/+page.ts'),
      content
    )
  }

  private async generateDetailPage(): Promise<void> {
    const content = `<script lang="ts">
   let { data }: { data: Record<string, Record<string, any>>} = $props()
</script>

{#each Object.values(data) as obj}
   <obj.detail />
{/each}
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/[table]/[id]/+page.svelte'),
      content
    )
  }

  private async generateLayoutFile(): Promise<void> {
    const content = `import { setDB } from 'sveltekite'
import { db } from '$lib/generated/db.js'

setDB(db)

export const ssr = false
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/+layout.ts'),
      content
    )
  }

  private async generateLayoutSvelte(): Promise<void> {
    const content = `<script lang="ts">
   import { db } from '$lib/generated/db.js'
</script>

{#if db}
<nav>
   <ul>
      <li><a href="/">Home</a></li>
      {#each db.tables.filter(t => !t.name.includes('_')) as { name }}
         <li><a href={\`/\${name}\`}>{name}</a></li>
      {/each}
   </ul>
</nav>
<slot />
{:else}
   No Database Configured
{/if}
`

    await fs.writeFile(
      path.join(this.projectPath, 'src/routes/+layout.svelte'),
      content
    )
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  static async fromYamlFile(yamlPath: string, projectPath: string, options?: GeneratorOptions): Promise<CodeGenerator> {
    const yamlContent = await fs.readFile(yamlPath, 'utf-8')
    const schema = SchemaParser.parseYAML(yamlContent)
    return new CodeGenerator(schema, projectPath, options)
  }

  static fromYamlString(yamlContent: string, projectPath: string, options?: GeneratorOptions): CodeGenerator {
    const schema = SchemaParser.parseYAML(yamlContent)
    return new CodeGenerator(schema, projectPath, options)
  }
}
