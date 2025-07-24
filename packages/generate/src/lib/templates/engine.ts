// Simple template engine using __VARIABLE__ syntax

export class TemplateEngine {
  /**
   * Render a template with the given context
   * Uses __VARIABLE__ syntax to avoid conflicts with Svelte
   * Automatically removes // @ts-nocheck lines from templates (both standalone and inside script tags)
   */
  render(template: string, context: Record<string, any>): string {
    // Remove @ts-nocheck lines - handle both standalone and inside script tags
    let cleanTemplate = template
      // Remove standalone @ts-nocheck lines at start of file or line
      .replace(/^\/\/ @ts-nocheck\s*\n?/gm, '')
      // Remove @ts-nocheck lines inside script tags (with any amount of whitespace)
      .replace(/(\s*)\/\/ @ts-nocheck\s*\n/g, '');
    
    return cleanTemplate.replace(/__([A-Z_]+)__/g, (match, variableName) => {
      const value = this.getNestedValue(context, variableName);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Support nested access like USER_NAME, ENTITY_FIELDS, etc.
   */
  private getNestedValue(obj: any, path: string): any {
    // First try the exact path as provided
    if (obj.hasOwnProperty(path)) {
      return obj[path];
    }
    
    // If not found, try normalized path for backwards compatibility
    const normalizedPath = this.normalizePath(path);
    
    if (normalizedPath.includes('.')) {
      return normalizedPath.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    return obj[normalizedPath];
  }

  /**
   * Convert template variable names to context keys
   * CLASS_NAME -> className
   * ENTITY_NAME -> entityName  
   * TARGET_LOWER -> targetLower
   */
  private normalizePath(path: string): string {
    // Handle special cases first
    const specialCases: Record<string, string> = {
      'CLASS_NAME': 'className',
      'ENTITY_NAME': 'entityName',
      'TARGET': 'target',
      'TARGET_LOWER': 'targetLower',
      'SOURCE': 'source',
      'SOURCE_LOWER': 'sourceLower',
      'SCHEMA_TYPE': 'schemaType',
      'FOREIGN_KEY': 'foreignKey',
      'JOIN_TABLE': 'joinTable',
      'RELATION_NAME': 'relationName',
      'FIELD_DEFINITIONS': 'fieldDefinitions',
      'DEFAULT_DATA': 'defaultData',
      'IMPORTS': 'imports',
      'METHODS': 'methods'
    };

    if (specialCases[path]) {
      return specialCases[path];
    }

    // Convert SCREAMING_SNAKE_CASE to camelCase
    return path.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Helper to capitalize first letter
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Helper to convert to lowercase
   */
  static lowercase(str: string): string {
    return str.toLowerCase();
  }

  /**
   * Load a template from file content
   */
  static fromTemplate(templateContent: string): TemplateEngine {
    const engine = new TemplateEngine();
    engine.templateContent = templateContent;
    return engine;
  }

  private templateContent?: string;

  /**
   * Render using the loaded template content
   */
  renderTemplate(context: Record<string, any>): string {
    if (!this.templateContent) {
      throw new Error('No template content loaded. Use fromTemplate() or render() directly.');
    }
    return this.render(this.templateContent, context);
  }
}

// Utility functions for common template operations
export const templateHelpers = {
  /**
   * Generate import statements
   */
  renderImports(imports: Array<{ name: string; from: string; isType?: boolean }>): string {
    return imports
      .map(imp => {
        const typePrefix = imp.isType ? 'type ' : '';
        return `import ${typePrefix}{ ${imp.name} } from '${imp.from}'`;
      })
      .join('\n');
  },

  /**
   * Generate field definitions for TypeScript interfaces
   */
  renderFields(fields: Array<{ name: string; type: string; optional?: boolean }>): string {
    return fields
      .map(field => {
        const optional = field.optional ? '?' : '';
        return `  ${field.name}${optional}: ${field.type}`;
      })
      .join(';\n');
  },

  /**
   * Generate method signatures
   */
  renderMethods(methods: Array<{ name: string; body: string; returnType?: string }>): string {
    return methods
      .map(method => {
        const returnType = method.returnType ? `: ${method.returnType}` : '';
        return `  ${method.name}${returnType} {\n${method.body}\n  }`;
      })
      .join('\n\n');
  }
};
