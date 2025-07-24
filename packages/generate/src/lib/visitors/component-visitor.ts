import type { 
  DatabaseSchema, 
  EntityNode, 
  CodeArtifact 
} from '../ast/index.js';
import { RelationAnalyzer } from '../ast/relations.js';
import { TemplateEngine } from '../templates/engine.js';
import path from 'path';

export class ComponentVisitor {
  constructor(private templateDir: string, private outputDir: string) {}

  async visitDatabaseSchema(schema: DatabaseSchema): Promise<CodeArtifact[]> {
    const artifacts: CodeArtifact[] = [];
    
    for (const entity of schema.entities) {
      const componentArtifacts = await this.visitEntity(entity);
      artifacts.push(...componentArtifacts);
    }
    
    return artifacts;
  }

  async visitEntity(entity: EntityNode): Promise<CodeArtifact[]> {
    const artifacts: CodeArtifact[] = [];
    const entityLower = entity.name.toLowerCase();
    
    // Always generate these basic components for every entity
    const basicComponents = ['detail', 'listItem', 'select'];
    
    for (const componentType of basicComponents) {
      const artifact = await this.generateComponent(entity, componentType as ComponentType);
      artifacts.push(artifact);
    }
    
    // Generate additional components based on relationships
    const componentRequirements = RelationAnalyzer.getComponentsNeeded(entity);
    const additionalComponents = new Set<string>();
    
    for (const req of componentRequirements) {
      if (req.required && !basicComponents.includes(req.type)) {
        additionalComponents.add(req.type);
      }
    }
    
    // Generate list and delete components if needed
    if (this.needsListComponent(entity)) {
      additionalComponents.add('list');
    }
    
    if (this.needsDeleteComponent(entity)) {
      additionalComponents.add('delete');
    }
    
    for (const componentType of additionalComponents) {
      const artifact = await this.generateComponent(entity, componentType as ComponentType);
      artifacts.push(artifact);
    }
    
    return artifacts;
  }

  private async generateComponent(entity: EntityNode, componentType: ComponentType): Promise<CodeArtifact> {
    const templateContent = this.getComponentTemplate(componentType);
    const context = this.buildComponentContext(entity, componentType);
    
    const engine = new TemplateEngine();
    const generatedContent = engine.render(templateContent, context);
    
    const className = this.capitalize(entity.name);
    const componentName = `${className}${this.capitalize(componentType)}`;
    const targetPath = path.join(
      this.outputDir, 
      'src/lib/generated/components', 
      entity.name.toLowerCase(), 
      `${componentName}.svelte`
    );
    
    return {
      type: 'CodeArtifact',
      artifactType: 'component',
      targetPath,
      dependencies: this.getComponentDependencies(entity, componentType),
      content: [{
        type: 'Code',
        language: 'svelte',
        content: {
          type: 'Literal',
          content: generatedContent
        }
      }]
    };
  }

  private buildComponentContext(entity: EntityNode, componentType: ComponentType): Record<string, any> {
    const className = this.capitalize(entity.name);
    const entityName = entity.name;
    const displayField = entity.metadata?.displayField || 'id';
    const hasColorField = entity.metadata?.hasColorField || false;
    
    const context = {
      // Match the template variable names exactly
      CLASS_NAME: className,
      ENTITY_NAME: entityName,
      DISPLAY_FIELD: displayField,
      ENTITY_DISPLAY_NAME: this.capitalize(entityName)
    };
    
    // Add component-specific context
    if (componentType === 'detail') {
      context.FIELD_INPUTS = this.generateFieldInputs(entity);
      context.RELATION_SELECTORS = this.generateRelationSelectors(entity);
    } else if (componentType === 'list') {
      context.RELATION_NAME = entityName + 's'; // pluralize
      context.STYLE_ATTRIBUTE = hasColorField 
        ? `style={\`color: black; background-color: \${${entityName}.color || 'grey'}; padding: 0.25em .5em; border-radius: 0.25em;\`}`
        : `style="padding: 0.25em .5em; border-radius: 0.25em; background-color: #f0f0f0;"`;
    }
    
    return context;
  }

  private generateFieldInputs(entity: EntityNode): string {
    const inputs = entity.fields
      .filter(field => field.name !== 'id') // Skip ID field
      .map(field => {
        if (field.dataType.kind === 'primitive' && field.dataType.name === 'text') {
          return `<label for="${field.name}">${this.capitalize(field.name)}</label><br />
<textarea name="${field.name}" bind:value={${entity.name}.data.${field.name}} rows="10" cols="40"></textarea>`;
        } else if (field.dataType.kind === 'primitive' && field.dataType.name === 'color') {
          return `<input type="color" bind:value={${entity.name}.data.${field.name}} />`;
        } else {
          return `<input type="text" bind:value={${entity.name}.data.${field.name}} />`;
        }
      });
    
    return inputs.join('\n');
  }

  private generateRelationSelectors(entity: EntityNode): string {
    const selectors = entity.relationships.map(rel => {
      if (rel.relationshipType === 'belongsTo') {
        const targetClass = this.capitalize(rel.targetEntity);
        return `<${entity.name}.select${targetClass} callback={${entity.name}.update${targetClass}} />`;
      } else if (rel.relationshipType === 'manyToMany') {
        const targetClass = this.capitalize(rel.targetEntity);
        return `<div>
   <${entity.name}.${rel.name} /><br />
   Add ${this.capitalize(rel.targetEntity)}: <${entity.name}.select${this.capitalize(rel.name)} callback={${entity.name}.add${targetClass}} />
</div>`;
      }
      return '';
    }).filter(Boolean);
    
    return selectors.join('\n');
  }

  private needsListComponent(entity: EntityNode): boolean {
    // Generate List component if this entity is the target of manyToMany relationships
    return entity.relationships.some(rel => rel.relationshipType === 'manyToMany');
  }

  private needsDeleteComponent(entity: EntityNode): boolean {
    // Generate Delete component for entities that might need deletion UI
    return true; // For now, generate for all entities
  }

  private getComponentDependencies(entity: EntityNode, componentType: ComponentType): string[] {
    const deps = ['sveltekite'];
    
    // Add entity class dependency
    deps.push(`../classes/${this.capitalize(entity.name)}`);
    
    // Add related entity dependencies for selectors
    if (componentType === 'detail') {
      for (const rel of entity.relationships) {
        deps.push(`../${rel.targetEntity.toLowerCase()}`);
      }
    }
    
    return deps;
  }

  private getComponentTemplate(componentType: ComponentType): string {
    switch (componentType) {
      case 'detail':
        return this.getDetailTemplate();
      case 'listItem':
        return this.getListItemTemplate();
      case 'select':
        return this.getSelectTemplate();
      case 'list':
        return this.getListTemplate();
      case 'delete':
        return this.getDeleteTemplate();
      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }
  }

  private getDetailTemplate(): string {
    return `<script lang="ts">
   import { type __CLASS_NAME__ } from '$lib/generated/classes/__CLASS_NAME__.svelte.js'

   let { __ENTITY_NAME__ }: { __ENTITY_NAME__: __CLASS_NAME__ } = $props()
</script>

__FIELD_INPUTS__

__RELATION_SELECTORS__`;
  }

  private getListItemTemplate(): string {
    return `<script lang="ts">
   import { type __CLASS_NAME__ } from '$lib/generated/classes/__CLASS_NAME__.svelte.js'

   let { __ENTITY_NAME__ }: { __ENTITY_NAME__: __CLASS_NAME__ } = $props()
</script>

<span>{__ENTITY_NAME__.data.__DISPLAY_FIELD__}</span>`;
  }

  private getSelectTemplate(): string {
    return `<script lang="ts">
   import { type __CLASS_NAME__Schema } from "$lib/generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { __ENTITY_NAME__s, callback }: { __ENTITY_NAME__s: __CLASS_NAME__Schema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select __ENTITY_DISPLAY_NAME__</option>
   {#each __ENTITY_NAME__s as __ENTITY_NAME__}
      <option value={__ENTITY_NAME__.id}>{__ENTITY_NAME__.__DISPLAY_FIELD__}</option>
   {/each}
</select>`;
  }

  private getListTemplate(): string {
    return `<script lang="ts">
   import { type __CLASS_NAME__Schema } from "$lib/generated/data.js";

   let { __RELATION_NAME__, remove }: { __RELATION_NAME__: __CLASS_NAME__Schema[], remove: (id: string) => void } = $props()
</script>

{#each __RELATION_NAME__ as __ENTITY_NAME__}
   <span __STYLE_ATTRIBUTE__>
      {__ENTITY_NAME__.__DISPLAY_FIELD__}
      <button onclick={() => remove(__ENTITY_NAME__.id)}>×</button>
   </span>
{/each}`;
  }

  private getDeleteTemplate(): string {
    return `<script lang="ts">
   import { type __CLASS_NAME__ } from '$lib/generated/classes/__CLASS_NAME__.svelte.js'

   let { __ENTITY_NAME__ }: { __ENTITY_NAME__: __CLASS_NAME__ } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this __ENTITY_DISPLAY_NAME__?')) {
         __ENTITY_NAME__.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete __ENTITY_DISPLAY_NAME__
</button>

<style>
   .delete-button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
   }
   
   .delete-button:hover {
      background-color: #c82333;
   }
</style>`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Import ComponentType from nodes
import type { ComponentType } from '../ast/index.js';
