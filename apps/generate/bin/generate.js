#!/usr/bin/env node

import { CodeGenerator } from '../dist/index.js'
import { fileURLToPath } from 'url'
import path from 'path'

const args = process.argv.slice(2)
const schemaPath = args[0] || 'schema.yaml'
const outputPath = args[1] || '.'

try {
  console.log('🚀 Generating SvelteKit application...')
  
  const generator = await CodeGenerator.fromYamlFile(schemaPath, outputPath)
  await generator.generateAll()
  
  console.log('✅ Generation complete!')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
