import yaml from 'js-yaml'
import { z } from 'zod'

export class SchemaParser {
  static parseYAML(yamlContent) {
    const rawSchema = yaml.load(yamlContent)

    const entities = {}
    const joinTables = {}

    for (const [entityName, entityDef] of Object.entries(rawSchema)) {
      console.log(`Processing entity: ${entityName}`)
      console.log(`Entity definition:`, entityDef)

      const fields = {
        // Always add ID field
        id: {
          type: 'uuid',
          default: 'crypto.randomUUID()'
        }
      }

      const relations = {}

      for (const [fieldName, fieldDef] of Object.entries(entityDef)) {
        console.log(`Processing field: ${fieldName} = ${fieldDef} (type: ${typeof fieldDef})`)

        if (typeof fieldDef === 'string') {
          // Simple field type
          if (this.isRelation(fieldDef)) {
            console.log(`*** ENTERING RELATION PROCESSING FOR ${fieldName} ***`)
            console.log(`${fieldName} is a relation to ${fieldDef}`)
            const relation = this.parseRelation(fieldName, fieldDef, entityName)
            console.log(`Created relation:`, relation)
            relations[fieldName] = relation

            // Add foreign key field to the entity's fields
            if (relation.type === 'belongsTo') {
              console.log(`*** Adding foreign key ${relation.foreignKey} to ${entityName} ***`)
              fields[relation.foreignKey] = {
                type: 'uuid',
                default: "''"
              }
              console.log(`Fields after adding FK:`, Object.keys(fields))
            }

            // Create join table for many-to-many
            if (relation.type === 'manyToMany') {
              const joinTableName = relation.through
              joinTables[joinTableName] = {
                fields: {
                  [`${entityName}Id`]: { type: 'uuid' },
                  [`${relation.target}Id`]: { type: 'uuid' }
                }
              }
            }
          } else {
            console.log(`${fieldName} is a regular field of type ${fieldDef}`)
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

  static isRelation(fieldDef) {
    // Check if it's a reference to another entity (not a primitive type)
    const primitiveTypes = ['string', 'text', 'number', 'boolean', 'date', 'uuid', 'email', 'color']
    const isRelation = !primitiveTypes.includes(fieldDef)
    console.log(`isRelation(${fieldDef}) = ${isRelation}`)
    return isRelation
  }

  static parseRelation(fieldName, fieldDef, entityName) {
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

  static parseField(fieldDef) {
    const defaults = {
      string: "''",
      text: "''",
      number: '0',
      boolean: 'false',
      date: 'new Date().toISOString()',
      uuid: 'crypto.randomUUID()',
      email: "''",
      color: "''"
    }

    const field = {
      type: fieldDef,
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

  static getJoinTableName(entity1, entity2) {
    // Sort alphabetically for consistent naming
    const sorted = [entity1, entity2].sort()
    return `${sorted[0]}_${sorted[1]}`
  }

  static generateZodSchema(entityName, config) {
    console.log(`Generating Zod schema for ${entityName}`)
    console.log(`Fields available:`, Object.keys(config.fields))

    const zodFields = Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
      console.log(`Processing field: ${fieldName} with config:`, fieldConfig)
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

  static getZodType(fieldConfig) {
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

  static generateDefaultData(entityName, config) {
    const defaults = Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
      return `      ${fieldName}: ${fieldConfig.default || "''"}`
    }).join(',\n')

    return `{
${defaults}
   }`
  }

  static generateStoresConfig(entities, joinTables) {
    const stores = []

    // Entity stores
    for (const [entityName, config] of Object.entries(entities)) {
      const fields = Object.keys(config.fields)
      const foreignKeys = Object.values(config.relations)
        .filter(rel => rel.type === 'belongsTo')
        .map(rel => rel.foreignKey)
        .filter(Boolean)

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

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
