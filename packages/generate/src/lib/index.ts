// Main exports for the SvelteKite code generator library

export { CodeGenerator } from './generator.js';
export { ASTBuilder } from './builders/ast-builder.js';
export { TemplateEngine } from './templates/engine.js';

// Export AST types for advanced users
export type * from './ast/index.js';

// Export visitor types for extensibility
export { EntityClassVisitor } from './visitors/entity-class-visitor.js';

// Export builder types
export type { GeneratorOptions } from './generator.js';
