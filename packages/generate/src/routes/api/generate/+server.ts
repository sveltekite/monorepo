import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { CodeGenerator } from '$lib/generator.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { yamlContent, options } = await request.json();
    
    // Create generator from YAML
    const generator = CodeGenerator.fromYamlString(yamlContent, {
      outputDir: '/tmp', // We won't actually write files, just generate content
      ...options
    });
    
    // Get the parsed schema
    const schema = generator.getSchema();
    
    // Preview what would be generated
    const artifacts = await generator.preview();
    
    return json({
      success: true,
      schema,
      artifacts
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 400 });
  }
};
