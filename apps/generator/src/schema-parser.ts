import yaml from 'js-yaml'

export interface FieldConfig {
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'uuid' | 'email' | 'color'
  min?: number
  max?: number
  default?: string
  required?: boolean
}

export interface RelationConfig {
  type: 'belongsTo' | 'hasMany' | 'manyToMany'
  target: string
  foreignKey?: string
  through?: string
}

export interface EntityConfig {
  fields: Record<string, FieldConfig>
  relations: Record<string, RelationConfig>
}

export interface Schema {
  entities: Record<string, EntityConfig>
  joinTables: Record<string, {
    fields: Record<string, FieldConfig>
  }>
}

export class SchemaParser {
  static parseYAML(yamlContent: string): Schema {
    const rawSchema = yaml.load(yamlContent) as Record<string, any>

    const entities: Record<string, EntityConfig> = {}
    const joinTables: Record<string, any> = {}

    for (const [entityName, entityDef] of Object.entries(rawSchema)) {
      const fields: Record<string, FieldConfig> = {
        // Always add ID field
        id: {
          type: 'uuid',
          default: 'crypto.randomUUID()'
        }
      }

      const relations: Record<string, RelationConfig> = {}

      for (const [fieldName, fieldDef] of Object.entries(entityDef)) {
        if (typeof fieldDef === 'string') {
          // Simple field type
          if (this.isRelation(fieldDef)) {
            const relation = this.parseRelation(fieldName, fieldDef, entityName)
            relations[fieldName] = relation

            // Add foreign key field to the entity's fields
            if (relation.type === 'belongsTo') {
              fields[relation.foreignKey!] = {
                type: 'uuid',
                default: "''"
              }
            }

            // Create join table for many-to-many
            if (relation.type === 'manyToMany') {
              const joinTableName = relation.through!
              joinTables[joinTableName] = {
                fields: {
                  [`${entityName}Id`]: { type: 'uuid' },
                  [`${relation.target}Id`]: { type: 'uuid' }
                }
              }
            }
          } else {
            fields[fieldName] = this.parseField(fieldDef)
          }
        } else if (Array.isArray(fieldDef)) {
          // Array notation for many-to-many: tags: [tag]
          const targetEntity = fieldDef[0]
          const relationName = fieldName
          const joinTableName = this.getJoinTableName(entityName, targetEntity)

          relations[relationName] = {
            type: 'manyToMany',
            target: targetEntity,
            through: joinTableName
          }

          joinTables[joinTableName] = {
            fields: {
              [`${entityName}Id`]: { type: 'uuid' },
              [`${targetEntity}Id`]: { type: 'uuid' }
            }
          }
        }
      }

      entities[entityName] = { fields, relations }
    }

    return { entities, joinTables }
  }

  private static isRelation(fieldDef: string): boolean {
    // Check if it's a reference to another entity (not a primitive type)
    const primitiveTypes = ['string', 'text', 'number', 'boolean', 'date', 'uuid', 'email', 'color']
    return !primitiveTypes.includes(fieldDef)
  }

  private static parseRelation(fieldName: string, fieldDef: string, _: string): RelationConfig {
    const targetEntity = fieldDef

    // Infer relation type from field name
    if (fieldName.endsWith('Id') || fieldName.endsWith('_id')) {
      return {
        type: 'belongsTo',
        target: targetEntity,
        foreignKey: fieldName
      }
    } else {
      // Default to belongsTo, add foreign key field
      const foreignKey = `${fieldDef}Id`
      return {
        type: 'belongsTo',
        target: targetEntity,
        foreignKey: foreignKey
      }
    }
  }

  private static parseField(fieldDef: string): FieldConfig {
    const defaults: Record<string, string> = {
      string: "''",
      text: "''",
      number: '0',
      boolean: 'false',
      date: 'new Date().toISOString()',
      uuid: 'crypto.randomUUID()',
      email: "''",
      color: "''"
    }

    const field: FieldConfig = {
      type: fieldDef as FieldConfig['type'],
      default: defaults[fieldDef] || "''"
    }

    // Add validation constraints based on type
    if (fieldDef === 'string') {
      field.min = 1
      field.max = 255
    } else if (fieldDef === 'email') {
      field.type = 'string' // Treat as string with email validation
    }

    return field
  }

  private static getJoinTableName(entity1: string, entity2: string): string {
    // Sort alphabetically for consistent naming
    const sorted = [entity1, entity2].sort()
    return `${sorted[0]}_${sorted[1]}`
  }

  static generateZodSchema(entityName: string, config: EntityConfig): string {
    const zodFields = Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
      let zodType = this.getZodType(fieldConfig)

      if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
        zodType += `.min(${fieldConfig.min}).max(${fieldConfig.max})`
      } else if (fieldConfig.min !== undefined) {
        zodType += `.min(${fieldConfig.min})`
      } else if (fieldConfig.max !== undefined) {
        zodType += `.max(${fieldConfig.max})`
      }

      return `   ${fieldName}: ${zodType}`
    }).join(',\n')

    return `const ${entityName}Schema = z.object({
${zodFields}
})

export type ${this.capitalize(entityName)}Schema = z.infer<typeof ${entityName}Schema>`
  }

  private static getZodType(fieldConfig: FieldConfig): string {
    switch (fieldConfig.type) {
      case 'string':
      case 'text':
      case 'email':
      case 'color':
        return 'z.string()'
      case 'number':
        return 'z.number()'
      case 'boolean':
        return 'z.boolean()'
      case 'date':
        return 'z.string()'
      case 'uuid':
        return 'z.uuid()'
      default:
        return 'z.string()'
    }
  }

  static generateDefaultData(_: string, config: EntityConfig): string {
    const defaults = Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
      return `      ${fieldName}: ${fieldConfig.default || "''"}`
    }).join(',\n')

    return `{
${defaults}
   }`
  }

  static generateStoresConfig(entities: Record<string, EntityConfig>, joinTables: Record<string, any>): string {
    const stores: string[] = []

    // Entity stores
    for (const [entityName, config] of Object.entries(entities)) {
      const fields = Object.keys(config.fields)
      const foreignKeys = Object.values(config.relations)
        .filter(rel => rel.type === 'belongsTo')
        .map(rel => rel.foreignKey)
        .filter(Boolean) as string[]

      const allFields = [...fields, ...foreignKeys].filter((v, i, a) => a.indexOf(v) === i)
      stores.push(`      ${entityName}: "&id, ${allFields.filter(f => f !== 'id').join(', ')}"`)
    }

    // Join table stores
    for (const [tableName, config] of Object.entries(joinTables)) {
      const fields = Object.keys(config.fields)
      stores.push(`      ${tableName}: "&[${fields.join('+')}], ${fields.join(', ')}"`)
    }

    return `{
${stores.join(',\n')}
   }`
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
