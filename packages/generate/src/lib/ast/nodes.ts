// AST Node Types for SvelteKite Code Generator

// Base AST Node
export interface ASTNode {
  type: string;
  location?: SourceLocation;
}

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
}

// =============================================================================
// SCHEMA LEVEL NODES
// =============================================================================

export interface DatabaseSchema extends ASTNode {
  type: 'DatabaseSchema';
  entities: EntityNode[];
  joinTables: JoinTableNode[];
  name?: string;
}

export interface EntityNode extends ASTNode {
  type: 'Entity';
  name: string;
  fields: FieldNode[];
  relationships: RelationshipNode[];
  metadata?: EntityMetadata;
}

export interface JoinTableNode extends ASTNode {
  type: 'JoinTable';
  name: string;
  leftEntity: string;
  rightEntity: string;
  fields: FieldNode[];
}

export interface FieldNode extends ASTNode {
  type: 'Field';
  name: string;
  dataType: DataType;
  constraints?: FieldConstraints;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

export interface RelationshipNode extends ASTNode {
  type: 'Relationship';
  name: string;
  relationshipType: 'belongsTo' | 'hasMany' | 'manyToMany';
  sourceEntity: string;
  targetEntity: string;
  foreignKey?: string;
  joinTable?: string;
  metadata?: RelationshipMetadata;
}

// =============================================================================
// DATA TYPES AND CONSTRAINTS
// =============================================================================

export type DataType = 
  | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'text' | 'email' | 'color' }
  | { kind: 'entity'; name: string }
  | { kind: 'array'; elementType: DataType };

export interface FieldConstraints {
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface EntityMetadata {
  displayField?: string; // Which field to use for display (name, title, etc.)
  hasColorField?: boolean;
  customDisplayLogic?: string;
}

export interface RelationshipMetadata {
  cascadeDelete?: boolean;
  eager?: boolean;
  inverse?: string; // Name of the inverse relationship
}

// =============================================================================
// CODE GENERATION NODES
// =============================================================================

export interface CodeArtifact extends ASTNode {
  type: 'CodeArtifact';
  artifactType: ArtifactType;
  targetPath: string;
  dependencies: string[];
  content: CodeNode[];
}

export type ArtifactType = 
  | 'schema'           // Zod schemas
  | 'entityClass'      // Entity class files
  | 'component'        // Svelte components
  | 'route'           // SvelteKit routes
  | 'database'        // Database configuration
  | 'types';          // TypeScript type definitions

export interface CodeNode extends ASTNode {
  type: 'Code';
  language: 'typescript' | 'svelte' | 'javascript';
  content: TemplateNode | LiteralNode;
}

export interface TemplateNode extends ASTNode {
  type: 'Template';
  templateName: string;
  variables: Record<string, any>;
  slots?: Record<string, ASTNode[]>;
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  content: string;
}

// =============================================================================
// TYPESCRIPT SPECIFIC NODES
// =============================================================================

export interface ClassNode extends ASTNode {
  type: 'Class';
  name: string;
  extends?: string;
  implements?: string[];
  imports: ImportNode[];
  fields: ClassFieldNode[];
  methods: MethodNode[];
  getters: GetterNode[];
}

export interface ImportNode extends ASTNode {
  type: 'Import';
  source: string;
  imports: ImportSpecifier[];
}

export interface ImportSpecifier {
  name: string;
  alias?: string;
  isDefault?: boolean;
  isType?: boolean;
}

export interface ClassFieldNode extends ASTNode {
  type: 'ClassField';
  name: string;
  dataType: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic?: boolean;
  isReadonly?: boolean;
  initializer?: string;
  decorator?: string; // e.g., '$state'
}

export interface MethodNode extends ASTNode {
  type: 'Method';
  name: string;
  parameters: ParameterNode[];
  returnType?: string;
  body: string;
  isAsync?: boolean;
  isStatic?: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface GetterNode extends ASTNode {
  type: 'Getter';
  name: string;
  returnType?: string;
  body: string;
}

export interface ParameterNode extends ASTNode {
  type: 'Parameter';
  name: string;
  dataType: string;
  optional?: boolean;
  defaultValue?: string;
}

// =============================================================================
// SVELTE SPECIFIC NODES
// =============================================================================

export interface SvelteComponentNode extends ASTNode {
  type: 'SvelteComponent';
  name: string;
  props: PropNode[];
  script: ScriptNode;
  style?: StyleNode;
  template: TemplateContentNode;
}

export interface PropNode extends ASTNode {
  type: 'Prop';
  name: string;
  dataType: string;
  required?: boolean;
  defaultValue?: string;
}

export interface ScriptNode extends ASTNode {
  type: 'Script';
  lang?: 'ts' | 'js';
  imports: ImportNode[];
  declarations: string[];
  reactiveStatements: string[];
}

export interface StyleNode extends ASTNode {
  type: 'Style';
  lang?: 'css' | 'scss' | 'postcss';
  content: string;
}

export interface TemplateContentNode extends ASTNode {
  type: 'TemplateContent';
  elements: TemplateElementNode[];
}

export interface TemplateElementNode extends ASTNode {
  type: 'TemplateElement';
  kind: 'element' | 'text' | 'expression' | 'block';
  content: string;
  attributes?: Record<string, string>;
  children?: TemplateElementNode[];
}

// =============================================================================
// BUILDER INTERFACES
// =============================================================================

// These would be used to construct the AST
export interface ASTBuilder {
  buildDatabaseSchema(rawSchema: any): DatabaseSchema;
  buildEntity(name: string, definition: any): EntityNode;
  buildRelationship(name: string, source: string, definition: any): RelationshipNode;
}

export interface CodeArtifactBuilder {
  buildEntityClass(entity: EntityNode): CodeArtifact;
  buildComponent(entity: EntityNode, componentType: ComponentType): CodeArtifact;
  buildRoute(entities: EntityNode[]): CodeArtifact;
  buildSchema(entities: EntityNode[]): CodeArtifact;
}

export type ComponentType = 'detail' | 'list' | 'listItem' | 'select' | 'delete';
