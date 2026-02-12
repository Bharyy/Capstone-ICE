# AST Processing Module

This module provides Abstract Syntax Tree (AST) generation for JavaScript/React, Python, and Java code.

## Files

- **jsAst.js** - JavaScript/React AST generation using @babel/parser
- **pythonAst.js** - Python AST generation using regex-based detection
- **javaAst.js** - Java AST generation using regex-based detection
- **astRouter.js** - Main router that detects language and generates appropriate AST

## Usage

```javascript
import { generateAST } from './ast/astRouter.js'

const code = `
function hello() {
  console.log("Hello World");
}
`

const { language, ast } = generateAST(code)
console.log('Detected language:', language)
console.log('AST:', ast)
```

## Features

### JavaScript/React AST
- Detects imports and their sources
- Extracts functions, arrow functions, and components
- Identifies exports

### Python AST
- Detects imports (from...import and import statements)
- Extracts class definitions
- Identifies function definitions with parameters

### Java AST
- Detects import statements
- Extracts class definitions
- Identifies method signatures with parameters

## Language Detection

The router automatically detects the programming language based on:
- JavaScript: `import/export`, `const/let`, arrow functions, JSX syntax
- Python: `def`, `class:`, python-style imports
- Java: `public class`, `import ...;`, Java-specific syntax

## Integration

This AST module is integrated into the message pipeline:
1. User submits code
2. AST is generated automatically
3. Enhanced prompt (code + AST) is sent to both Gemini and OpenRouter
4. Responses include AST information in the UI
