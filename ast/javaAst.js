/**
 * Generate AST for Java code (simple pattern-based detection)
 * @param {string} code - Java code
 * @returns {string} - Formatted AST representation
 */
export function generateJavaAST(code) {
  try {
    const lines = code.split('\n');
    const classes = [];
    const methods = [];
    const imports = [];

    // Simple regex-based detection
    const classRegex = /(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)/;
    const methodRegex = /(?:public|private|protected)?\s*(?:static)?\s*(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)/;
    const importRegex = /^\s*import\s+(.+);/;

    lines.forEach(line => {
      const classMatch = line.match(classRegex);
      if (classMatch) {
        classes.push(classMatch[1]);
      }

      const methodMatch = line.match(methodRegex);
      if (methodMatch && !line.includes('class')) {
        methods.push({
          name: methodMatch[1],
          params: methodMatch[2] || ''
        });
      }

      const importMatch = line.match(importRegex);
      if (importMatch) {
        imports.push(importMatch[1]);
      }
    });

    // Format output
    let astSummary = '=== Java AST ===\n\n';

    if (imports.length > 0) {
      astSummary += 'Imports:\n';
      imports.forEach(imp => {
        astSummary += `  - ${imp}\n`;
      });
      astSummary += '\n';
    }

    if (classes.length > 0) {
      astSummary += 'Classes:\n';
      classes.forEach(cls => {
        astSummary += `  - ${cls}\n`;
      });
      astSummary += '\n';
    }

    if (methods.length > 0) {
      astSummary += 'Methods:\n';
      methods.forEach(method => {
        astSummary += `  - ${method.name}(${method.params})\n`;
      });
    }

    return astSummary || 'AST generated (no major structures detected)';
  } catch (error) {
    return `AST Error: ${error.message}`;
  }
}
