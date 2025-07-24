#!/usr/bin/env node

// Simple test script for the generator
import { CodeGenerator } from '../../packages/generate/src/lib/generator.js';

const generator = await CodeGenerator.fromYamlFile('schema.yaml', '.');
await generator.generateAll();
