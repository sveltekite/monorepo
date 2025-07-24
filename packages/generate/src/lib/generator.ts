import type { DatabaseSchema, CodeArtifact } from './ast/index.js';
import { ASTBuilder } from './builders/ast-builder.js';
import { EntityClassVisitor } from './visitors/entity-class-visitor.js';
import { ComponentVisitor } from './visitors/component-visitor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GeneratorOptions {
  outputDir?: string;
  templateDir?: string;
  dbName?: string;
  generateRoutes?: boolean;
}

export class CodeGenerator {
  private schema: DatabaseSchema;
  private options: GeneratorOptions;

  constructor(schema: DatabaseSchema, options: GeneratorOptions = {}) {
    this.schema = schema;
    this.options = {
      outputDir: '.',
      templateDir: path.join(__dirname, '..', 'templates'),
      dbName: 'app-db',
      generateRoutes: true,
      ...options
    };
  }

  /**
   * Generate all code artifacts
   */
  async generateAll(): Promise<void> {
    console.log('🚀 Generating SvelteKit application with AST...');
    
    await this.ensureDirectories();
    
    // Generate using visitors
    const visitors = [
      new EntityClassVisitor(this.options.templateDir!, this.options.outputDir!),
      new ComponentVisitor(this.options.templateDir!, this.options.outputDir!)
    ];
    
    const allArtifacts: CodeArtifact[] = [];
    
    for (const visitor of visitors) {
      const artifacts = await visitor.visitDatabaseSchema(this.schema);
      allArtifacts.push(...artifacts);
    }
    
    // Write all artifacts to files
    await this.writeArtifacts(allArtifacts);
    
    console.log('✅ Generation complete!');
    console.log(`📁 Generated ${allArtifacts.length} files`);
  }

  /**
   * Ensure output directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      'src/lib/generated',
      'src/lib/generated/classes',
      'src/lib/generated/components'
    ];

    if (this.options.generateRoutes !== false) {
      dirs.push('src/routes');
    }

    // Create entity-specific component directories
    for (const entity of this.schema.entities) {
      dirs.push(`src/lib/generated/components/${entity.name.toLowerCase()}`);
    }

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.options.outputDir!, dir), { recursive: true });
    }
  }

  /**
   * Write all code artifacts to files
   */
  private async writeArtifacts(artifacts: CodeArtifact[]): Promise<void> {
    for (const artifact of artifacts) {
      await this.writeArtifact(artifact);
    }
  }

  /**
   * Write a single code artifact to file
   */
  private async writeArtifact(artifact: CodeArtifact): Promise<void> {
    // Ensure target directory exists
    const targetDir = path.dirname(artifact.targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Extract content from the artifact
    let content = '';
    for (const codeNode of artifact.content) {
      if (codeNode.content.type === 'Literal') {
        content += codeNode.content.content;
      } else if (codeNode.content.type === 'Template') {
        // Handle template nodes if needed
        console.warn('Template nodes not yet implemented in writeArtifact');
      }
    }
    
    await fs.writeFile(artifact.targetPath, content, 'utf-8');
    console.log(`   ✅ Generated: ${path.relative(this.options.outputDir!, artifact.targetPath)}`);
  }

  /**
   * Create a generator from YAML file
   */
  static async fromYamlFile(yamlPath: string, options?: GeneratorOptions): Promise<CodeGenerator> {
    const yamlContent = await fs.readFile(yamlPath, 'utf-8');
    return this.fromYamlString(yamlContent, options);
  }

  /**
   * Create a generator from YAML string
   */
  static fromYamlString(yamlContent: string, options?: GeneratorOptions): CodeGenerator {
    const schema = ASTBuilder.buildDatabaseSchema(yamlContent);
    return new CodeGenerator(schema, options);
  }

  /**
   * Get the parsed schema
   */
  getSchema(): DatabaseSchema {
    return this.schema;
  }

  /**
   * Preview what would be generated without writing files
   */
  async preview(): Promise<CodeArtifact[]> {
    const visitors = [
      new EntityClassVisitor(this.options.templateDir!, this.options.outputDir!),
      new ComponentVisitor(this.options.templateDir!, this.options.outputDir!)
    ];
    
    const allArtifacts: CodeArtifact[] = [];
    
    for (const visitor of visitors) {
      const artifacts = await visitor.visitDatabaseSchema(this.schema);
      allArtifacts.push(...artifacts);
    }
    
    return allArtifacts;
  }
}

// Re-export important types for library users
export type { DatabaseSchema, CodeArtifact, EntityNode } from './ast/index.js';
export { ASTBuilder } from './builders/ast-builder.js';
