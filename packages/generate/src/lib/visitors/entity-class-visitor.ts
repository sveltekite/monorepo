import type { 
  DatabaseSchema, 
  EntityNode, 
  CodeArtifact,
  RelationshipNode 
} from '../ast/index.js';
import { RelationAnalyzer, type RelationContext } from '../ast/relations.js';
import { TemplateEngine, templateHelpers } from '../templates/engine.js';
import path from 'path';

export class EntityClassVisitor {
  constructor(private templateDir: string, private outputDir: string) {}

  async visitDatabaseSchema(schema: DatabaseSchema): Promise<CodeArtifact[]> {
    const artifacts: CodeArtifact[] = [];
    
    for (const entity of schema.entities) {
      // Generate entity class only
      const classArtifact = await this.visitEntity(entity);
      artifacts.push(classArtifact);
    }
    
    return artifacts;
  }

  async visitEntity(entity: EntityNode): Promise<CodeArtifact> {
    // Use inline template for now instead of reading from file
    const templateContent = this.getEntityClassTemplate();
    
    const context = this.buildContext(entity);
    const engine = new TemplateEngine();
    const generatedContent = engine.render(templateContent, context);
    
    const targetPath = path.join(this.outputDir, 'src/lib/generated/classes', `${this.capitalize(entity.name)}.svelte.ts`);
    
    return {
      type: 'CodeArtifact',
      artifactType: 'entityClass',
      targetPath,
      dependencies: this.getDependencies(entity),
      content: [{
        type: 'Code',
        language: 'typescript',
        content: {
          type: 'Literal',
          content: generatedContent
        }
      }]
    };
  }

  private buildContext(entity: EntityNode): Record<string, any> {
    const className = this.capitalize(entity.name);
    const entityName = entity.name;
    const schemaType = `${className}Schema`;
    
    // Build imports
    const imports = this.buildImports(entity);
    
    // Build default data
    const defaultData = this.buildDefaultData(entity);
    
    // Build relation state fields
    const relationStateFields = this.buildRelationStateFields(entity);
    
    // Build constructor calls
    const constructorCalls = this.buildConstructorCalls(entity);
    
    // Build relation methods
    const relationMethods = this.buildRelationMethods(entity);
    
    // Build component getters
    const componentGetters = this.buildComponentGetters(entity);
    
    return {
      className,
      entityName,
      schemaType,
      imports,
      defaultData,
      relationStateFields,
      constructorCalls,
      relationMethods,
      componentGetters
    };
  }

  private buildImports(entity: EntityNode): string {
    const imports = [];
    
    // Always include base imports
    imports.push({ name: `${this.capitalize(entity.name)}Schema`, from: '../schema.js', isType: true });
    imports.push({ name: 'BaseDB', from: 'sveltekite' });
    imports.push({ name: 'withProps, withSave, withData, withInstance', from: 'sveltekite' });
    imports.push({ name: 'DataSave', from: 'sveltekite' });
    
    // Add component imports
    const className = this.capitalize(entity.name);
    const entityLower = entity.name.toLowerCase();
    
    imports.push({ 
      name: `${className}Detail`, 
      from: `../components/${entityLower}/${className}Detail.svelte` 
    });
    imports.push({ 
      name: `${className}ListItem`, 
      from: `../components/${entityLower}/${className}ListItem.svelte` 
    });
    
    // Add relation-specific imports
    for (const relation of entity.relationships) {
      const targetClass = this.capitalize(relation.targetEntity);
      const targetLower = relation.targetEntity.toLowerCase();
      
      if (relation.relationshipType === 'belongsTo') {
        imports.push({ 
          name: `${targetClass}Select`, 
          from: `../components/${targetLower}/${targetClass}Select.svelte` 
        });
        imports.push({ 
          name: `${targetClass}ListItem`, 
          from: `../components/${targetLower}/${targetClass}ListItem.svelte` 
        });
      } else if (relation.relationshipType === 'manyToMany') {
        imports.push({ 
          name: `${targetClass}Select`, 
          from: `../components/${targetLower}/${targetClass}Select.svelte` 
        });
        imports.push({ 
          name: `${targetClass}List`, 
          from: `../components/${targetLower}/${targetClass}List.svelte` 
        });
      }
    }
    
    return templateHelpers.renderImports(imports);
  }

  private buildDefaultData(entity: EntityNode): string {
    const fields = entity.fields.map(field => {
      // Generate dynamic default values for string/text fields
      if ((field.dataType.kind === 'primitive' && 
           (field.dataType.name === 'string' || field.dataType.name === 'text')) && 
          field.name !== 'id') {
        return `      ${field.name}: 'new ${entity.name} ${field.name}'`;
      }
      return `      ${field.name}: ${field.defaultValue || "''"}`;
    });
    
    return `{\n${fields.join(',\n')}\n   }`;
  }

  private buildRelationStateFields(entity: EntityNode): string {
    const stateFields = entity.relationships
      .filter(rel => rel.relationshipType === 'manyToMany' || rel.relationshipType === 'hasMany')
      .map(rel => `   _${rel.name} = $state<${this.capitalize(rel.targetEntity)}Schema[]>([])`)
      .join('\n');
    
    return stateFields ? '\n' + stateFields + '\n' : '';
  }

  private buildConstructorCalls(entity: EntityNode): string {
    const calls = entity.relationships
      .filter(rel => rel.relationshipType === 'manyToMany' || rel.relationshipType === 'hasMany')
      .map(rel => `      this.refresh${this.capitalize(rel.name)}()`)
      .join('\n');
    
    return calls ? calls + '\n' : '';
  }

  private buildRelationMethods(entity: EntityNode): string {
    const methods: string[] = [];
    
    for (const relation of entity.relationships) {
      const requirements = RelationAnalyzer.getRequirements(relation.relationshipType);
      const context: RelationContext = {
        sourceEntity: this.capitalize(relation.sourceEntity),
        targetEntity: this.capitalize(relation.targetEntity),
        relationName: relation.name,
        foreignKey: relation.foreignKey,
        joinTable: relation.joinTable
      };
      
      for (const methodReq of requirements.methods) {
        if (methodReq.target === 'source') {
          const processedMethod = RelationAnalyzer.processTemplate(methodReq.template, context);
          methods.push(processedMethod);
        }
      }
    }
    
    return methods.join('\n\n') + (methods.length > 0 ? '\n' : '');
  }

  private buildComponentGetters(entity: EntityNode): string {
    const getters: string[] = [];
    const className = this.capitalize(entity.name);
    const entityName = entity.name;
    
    // Always generate detail and listItem getters
    getters.push(`   get detail() {
      return withSave(DataSave, ${className}Detail, { ${entityName}: this }, () => this.db.put('${entityName}')(this.snapshot))
   }`);

    getters.push(`   get listItem() {
      return withProps(${className}ListItem, { ${entityName}: this })
   }`);

    // Generate getters for relations
    for (const relation of entity.relationships) {
      const targetClass = this.capitalize(relation.targetEntity);
      const targetEntity = relation.targetEntity;
      
      if (relation.relationshipType === 'belongsTo') {
        // Selector for choosing the related entity
        getters.push(`   get select${targetClass}() {
      return withData(${targetClass}Select, '${targetEntity}s', () => this.db.all('${targetEntity}')) as any
   }`);

        // Display component for the related entity
        const relationDisplayName = relation.name.replace(/Id$/, '');
        getters.push(`   get ${relationDisplayName}() {
      return withInstance(${targetClass}ListItem, '${targetEntity}', () => this.db.get('${targetEntity}')(this.data.${relation.foreignKey}), ${targetClass}) as any
   }`);
      } else if (relation.relationshipType === 'manyToMany') {
        // List component for showing related entities
        getters.push(`   get ${relation.name}() {
      return withProps(${targetClass}List, { ${relation.name}: this._${relation.name}, remove: this.remove${targetClass} }) as any
   }`);

        // Selector for adding related entities
        getters.push(`   get select${this.capitalize(relation.name)}() {
      return withData(${targetClass}Select, '${relation.name}', () => this.db.all('${targetEntity}')) as any
   }`);
      }
    }
    
    return getters.join('\n\n') + (getters.length > 0 ? '\n' : '');
  }

  private getDependencies(entity: EntityNode): string[] {
    const deps = ['sveltekite'];
    
    // Add dependencies for related entities
    for (const relation of entity.relationships) {
      deps.push(`../components/${relation.targetEntity.toLowerCase()}`);
    }
    
    return deps;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getEntityClassTemplate(): string {
    return `__IMPORTS__

export class __CLASS_NAME__ extends BaseDB {
   public data = $state<__SCHEMA_TYPE__>(__DEFAULT_DATA__)
__RELATION_STATE_FIELDS__

   constructor(data?: __SCHEMA_TYPE__) {
      super()
      if (data) this.data = data
__CONSTRUCTOR_CALLS__
   }

__RELATION_METHODS__

__COMPONENT_GETTERS__

   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const __ENTITY_NAME__ = new __CLASS_NAME__()
      return __ENTITY_NAME__.db.put('__ENTITY_NAME__')(__ENTITY_NAME__.snapshot)
   }
}`;
  }
}
