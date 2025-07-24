// Define what each relation type requires for code generation

import type { ComponentType } from './nodes.js';

export interface RelationRequirements {
  // Components needed for this relation type
  components: ComponentRequirement[];
  
  // Methods needed on the source entity class
  methods: MethodRequirement[];
  
  // Additional imports/dependencies
  imports: ImportRequirement[];
  
  // Fields that need to be added to the entity
  fields: FieldRequirement[];
}

export interface ComponentRequirement {
  type: ComponentType;
  target: 'source' | 'target'; // Which entity gets this component
  required: boolean;
}

export interface MethodRequirement {
  name: string;
  template: string; // Method template to generate
  target: 'source' | 'target';
}

export interface ImportRequirement {
  component: string;
  from: string; // Relative path or module
  target: 'source' | 'target';
}

export interface FieldRequirement {
  name: string;
  type: string;
  target: 'source' | 'target';
}

// =============================================================================
// RELATION TYPE DEFINITIONS
// =============================================================================

export const RELATION_REQUIREMENTS: Record<string, RelationRequirements> = {
  
  // Many-to-One (belongsTo) - e.g., Article belongs to User
  'manyToOne': {
    components: [
      { type: 'select', target: 'source', required: true },    // ArticleDetail needs UserSelect
      { type: 'listItem', target: 'target', required: true },  // Show user info in Article
    ],
    
    methods: [
      {
        name: 'update__TARGET__',
        template: `
   update__TARGET__ = (id: string) => {
      this.data.__FOREIGN_KEY__ = id
   }`,
        target: 'source'
      }
    ],
    
    imports: [
      { component: '__TARGET__Select', from: '../__TARGET_LOWER__/__TARGET__Select.svelte', target: 'source' },
      { component: '__TARGET__ListItem', from: '../__TARGET_LOWER__/__TARGET__ListItem.svelte', target: 'source' }
    ],
    
    fields: [
      { name: '__FOREIGN_KEY__', type: 'string', target: 'source' }
    ]
  },

  // One-to-Many (hasMany) - e.g., User has many Articles  
  'oneToMany': {
    components: [
      { type: 'list', target: 'target', required: true },     // Show list of articles
      { type: 'select', target: 'target', required: true },   // Select article to add
    ],
    
    methods: [
      {
        name: 'refresh__RELATION_NAME__',
        template: `
   refresh__RELATION_NAME__ = async () => {
      this.___RELATION_NAME__ = await this.db.where('__TARGET_LOWER__', '__FOREIGN_KEY__', this.data.id)
   }`,
        target: 'source'
      },
      {
        name: 'add__TARGET__',
        template: `
   add__TARGET__ = (id: string) => {
      // Set the foreign key on the target entity
      this.db.update('__TARGET_LOWER__', id, { __FOREIGN_KEY__: this.data.id })
      this.refresh__RELATION_NAME__()
   }`,
        target: 'source'
      },
      {
        name: 'remove__TARGET__',
        template: `
   remove__TARGET__ = (id: string) => {
      // Clear the foreign key on the target entity
      this.db.update('__TARGET_LOWER__', id, { __FOREIGN_KEY__: null })
      this.refresh__RELATION_NAME__()
   }`,
        target: 'source'
      }
    ],
    
    imports: [
      { component: '__TARGET__List', from: '../__TARGET_LOWER__/__TARGET__List.svelte', target: 'source' },
      { component: '__TARGET__Select', from: '../__TARGET_LOWER__/__TARGET__Select.svelte', target: 'source' }
    ],
    
    fields: [
      { name: '___RELATION_NAME__', type: '__TARGET__Schema[]', target: 'source' }
    ]
  },

  // Many-to-Many - e.g., Article has many Tags, Tag has many Articles
  'manyToMany': {
    components: [
      { type: 'list', target: 'source', required: true },     // Show related entities
      { type: 'select', target: 'source', required: true },   // Select entities to add
      { type: 'list', target: 'target', required: true },     // Show related entities (other direction)
      { type: 'select', target: 'target', required: true },   // Select entities to add (other direction)
    ],
    
    methods: [
      {
        name: 'refresh__RELATION_NAME__',
        template: `
   refresh__RELATION_NAME__ = async () => {
      this.___RELATION_NAME__ = await this.db.join('__SOURCE_LOWER__')('__TARGET_LOWER__')({ __SOURCE_LOWER__Id: this.data.id })
   }`,
        target: 'source'
      },
      {
        name: 'add__TARGET__',
        template: `
   add__TARGET__ = (id: string) => {
      const __SOURCE_LOWER__Id = this.data.id
      const __TARGET_LOWER__Id = id
      const joinRecord = { __SOURCE_LOWER__Id, __TARGET_LOWER__Id }
      this.db.put('__JOIN_TABLE__')(joinRecord)
      this.refresh__RELATION_NAME__()
   }`,
        target: 'source'
      },
      {
        name: 'remove__TARGET__',
        template: `
   remove__TARGET__ = (id: string) => {
      const __SOURCE_LOWER__Id = this.data.id
      this.db.del('__JOIN_TABLE__')([__SOURCE_LOWER__Id, id])
      this.refresh__RELATION_NAME__()
   }`,
        target: 'source'
      }
    ],
    
    imports: [
      { component: '__TARGET__List', from: '../__TARGET_LOWER__/__TARGET__List.svelte', target: 'source' },
      { component: '__TARGET__Select', from: '../__TARGET_LOWER__/__TARGET__Select.svelte', target: 'source' }
    ],
    
    fields: [
      { name: '___RELATION_NAME__', type: '__TARGET__Schema[]', target: 'source' }
    ]
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export class RelationAnalyzer {
  static getRequirements(relationType: string): RelationRequirements {
    return RELATION_REQUIREMENTS[relationType] || { components: [], methods: [], imports: [], fields: [] };
  }
  
  static processTemplate(template: string, context: RelationContext): string {
    return template
      .replace(/__SOURCE__/g, context.sourceEntity)
      .replace(/__SOURCE_LOWER__/g, context.sourceEntity.toLowerCase())
      .replace(/__TARGET__/g, context.targetEntity)
      .replace(/__TARGET_LOWER__/g, context.targetEntity.toLowerCase())
      .replace(/__RELATION_NAME__/g, context.relationName)
      .replace(/__FOREIGN_KEY__/g, context.foreignKey || `${context.targetEntity.toLowerCase()}Id`)
      .replace(/__JOIN_TABLE__/g, context.joinTable || `${context.sourceEntity.toLowerCase()}_${context.targetEntity.toLowerCase()}`);
  }
  
  static getComponentsNeeded(entity: EntityNode): ComponentRequirement[] {
    const requirements: ComponentRequirement[] = [];
    
    for (const relation of entity.relationships) {
      const relReqs = this.getRequirements(relation.relationshipType);
      requirements.push(...relReqs.components.filter(comp => comp.target === 'source'));
    }
    
    return requirements;
  }
}

export interface RelationContext {
  sourceEntity: string;
  targetEntity: string;
  relationName: string;
  foreignKey?: string;
  joinTable?: string;
}

// We need to import EntityNode here - let's import from the AST nodes
import type { EntityNode } from './nodes.js';
