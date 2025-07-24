import * as yaml from 'yaml';
import type { 
  DatabaseSchema, 
  EntityNode, 
  FieldNode, 
  RelationshipNode, 
  JoinTableNode,
  DataType,
  EntityMetadata
} from '../ast/index.js';

export interface RawSchema {
  [entityName: string]: {
    [fieldName: string]: string | string[];
  };
}

export class ASTBuilder {
  /**
   * Build a complete database schema AST from YAML content
   */
  static buildDatabaseSchema(yamlContent: string): DatabaseSchema {
    const rawSchema = yaml.parse(yamlContent) as RawSchema;
    
    const entities: EntityNode[] = [];
    const joinTables: JoinTableNode[] = [];
    
    // First pass: create all entities
    for (const [entityName, entityDef] of Object.entries(rawSchema)) {
      const entity = this.buildEntity(entityName, entityDef);
      entities.push(entity);
    }
    
    // Second pass: analyze relationships and create join tables
    const manyToManyRelations = this.extractManyToManyRelations(entities);
    for (const relation of manyToManyRelations) {
      const joinTable = this.buildJoinTable(relation.sourceEntity, relation.targetEntity);
      joinTables.push(joinTable);
    }
    
    return {
      type: 'DatabaseSchema',
      entities,
      joinTables,
      name: 'generated-schema'
    };
  }

  /**
   * Build an entity node from raw YAML definition
   */
  static buildEntity(entityName: string, entityDef: Record<string, any>): EntityNode {
    const fields: FieldNode[] = [];
    const relationships: RelationshipNode[] = [];
    
    // Always add ID field
    fields.push({
      type: 'Field',
      name: 'id',
      dataType: { kind: 'primitive', name: 'uuid' },
      isPrimaryKey: true,
      defaultValue: 'crypto.randomUUID()'
    });
    
    // Process each field/relation definition
    for (const [fieldName, fieldDef] of Object.entries(entityDef)) {
      if (typeof fieldDef === 'string') {
        if (this.isPrimitiveType(fieldDef)) {
          // It's a field
          const field = this.buildField(fieldName, fieldDef);
          fields.push(field);
        } else {
          // It's a belongsTo relationship
          const relationship = this.buildBelongsToRelationship(fieldName, fieldDef, entityName);
          relationships.push(relationship);
          
          // Add foreign key field
          const foreignKeyField = this.buildForeignKeyField(relationship.foreignKey!);
          fields.push(foreignKeyField);
        }
      } else if (Array.isArray(fieldDef)) {
        // It's a manyToMany relationship: tags: [tag]
        const targetEntity = fieldDef[0];
        const relationship = this.buildManyToManyRelationship(fieldName, targetEntity, entityName);
        relationships.push(relationship);
      }
    }
    
    // Generate metadata
    const metadata = this.buildEntityMetadata(fields);
    
    return {
      type: 'Entity',
      name: entityName,
      fields,
      relationships,
      metadata
    };
  }

  /**
   * Build a field node from field definition
   */
  static buildField(fieldName: string, fieldType: string): FieldNode {
    const dataType = this.buildDataType(fieldType);
    const defaultValue = this.getDefaultValue(fieldType);
    
    return {
      type: 'Field',
      name: fieldName,
      dataType,
      defaultValue,
      isPrimaryKey: false,
      isForeignKey: false
    };
  }

  /**
   * Build a belongsTo relationship
   */
  static buildBelongsToRelationship(fieldName: string, targetEntity: string, sourceEntity: string): RelationshipNode {
    const foreignKey = fieldName.endsWith('Id') ? fieldName : `${targetEntity}Id`;
    
    return {
      type: 'Relationship',
      name: fieldName,
      relationshipType: 'belongsTo',
      sourceEntity,
      targetEntity,
      foreignKey
    };
  }

  /**
   * Build a manyToMany relationship
   */
  static buildManyToManyRelationship(relationName: string, targetEntity: string, sourceEntity: string): RelationshipNode {
    const joinTable = this.getJoinTableName(sourceEntity, targetEntity);
    
    return {
      type: 'Relationship',
      name: relationName,
      relationshipType: 'manyToMany',
      sourceEntity,
      targetEntity,
      joinTable
    };
  }

  /**
   * Build a join table for many-to-many relationships
   */
  static buildJoinTable(leftEntity: string, rightEntity: string): JoinTableNode {
    const tableName = this.getJoinTableName(leftEntity, rightEntity);
    
    const fields: FieldNode[] = [
      {
        type: 'Field',
        name: `${leftEntity}Id`,
        dataType: { kind: 'primitive', name: 'uuid' },
        isPrimaryKey: true,
        isForeignKey: true
      },
      {
        type: 'Field',
        name: `${rightEntity}Id`,
        dataType: { kind: 'primitive', name: 'uuid' },
        isPrimaryKey: true,
        isForeignKey: true
      }
    ];
    
    return {
      type: 'JoinTable',
      name: tableName,
      leftEntity,
      rightEntity,
      fields
    };
  }

  /**
   * Build foreign key field
   */
  static buildForeignKeyField(foreignKeyName: string): FieldNode {
    return {
      type: 'Field',
      name: foreignKeyName,
      dataType: { kind: 'primitive', name: 'uuid' },
      defaultValue: "''",
      isPrimaryKey: false,
      isForeignKey: true
    };
  }

  /**
   * Build data type from string
   */
  static buildDataType(typeString: string): DataType {
    const primitiveTypes = ['string', 'number', 'boolean', 'date', 'uuid', 'text', 'email', 'color'];
    
    if (primitiveTypes.includes(typeString)) {
      return { kind: 'primitive', name: typeString as any };
    }
    
    return { kind: 'entity', name: typeString };
  }

  /**
   * Generate entity metadata
   */
  static buildEntityMetadata(fields: FieldNode[]): EntityMetadata {
    // Find display field (name > title > id)
    let displayField = 'id';
    if (fields.some(f => f.name === 'name')) {
      displayField = 'name';
    } else if (fields.some(f => f.name === 'title')) {
      displayField = 'title';
    }
    
    // Check if has color field
    const hasColorField = fields.some(f => f.dataType.kind === 'primitive' && f.dataType.name === 'color');
    
    return {
      displayField,
      hasColorField
    };
  }

  // Helper methods
  static isPrimitiveType(type: string): boolean {
    const primitiveTypes = ['string', 'text', 'number', 'boolean', 'date', 'uuid', 'email', 'color'];
    return primitiveTypes.includes(type);
  }

  static getDefaultValue(fieldType: string): string {
    const defaults: Record<string, string> = {
      string: "''",
      text: "''",
      number: '0',
      boolean: 'false',
      date: 'new Date().toISOString()',
      uuid: 'crypto.randomUUID()',
      email: "''",
      color: "''"
    };
    
    return defaults[fieldType] || "''";
  }

  static getJoinTableName(entity1: string, entity2: string): string {
    // Sort alphabetically for consistent naming
    const sorted = [entity1, entity2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  static extractManyToManyRelations(entities: EntityNode[]): Array<{sourceEntity: string, targetEntity: string}> {
    const relations: Array<{sourceEntity: string, targetEntity: string}> = [];
    const seen = new Set<string>();
    
    for (const entity of entities) {
      for (const relationship of entity.relationships) {
        if (relationship.relationshipType === 'manyToMany') {
          const key = this.getJoinTableName(relationship.sourceEntity, relationship.targetEntity);
          if (!seen.has(key)) {
            seen.add(key);
            relations.push({
              sourceEntity: relationship.sourceEntity,
              targetEntity: relationship.targetEntity
            });
          }
        }
      }
    }
    
    return relations;
  }
}
