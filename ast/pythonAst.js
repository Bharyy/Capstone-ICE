/**
 * Generate AST for Python code (simple pattern-based detection)
 * @param {string} code - Python code
 * @returns {string} - Formatted AST representation
 */
export function generatePythonAST(code) {
  try {
    const lines = code.split('\n');
    const functions = [];
    const classes = [];
    const imports = [];

    // Simple regex-based detection
    const functionRegex = /^\s*def\s+(\w+)\s*\((.*?)\)/;
    const classRegex = /^\s*class\s+(\w+)/;
    const importRegex = /^\s*(?:from\s+(\S+)\s+)?import\s+(.+)/;

    lines.forEach(line => {
      const funcMatch = line.match(functionRegex);
      if (funcMatch) {
        functions.push({
          name: funcMatch[1],
          params: funcMatch[2] || ''
        });
      }

      const classMatch = line.match(classRegex);
      if (classMatch) {
        classes.push(classMatch[1]);
      }

      const importMatch = line.match(importRegex);
      if (importMatch) {
        imports.push({
          from: importMatch[1] || '',
          modules: importMatch[2]
        });
      }
    });

    // Format output
    let astSummary = '=== Python AST ===\n\n';

    if (imports.length > 0) {
      astSummary += 'Imports:\n';
      imports.forEach(imp => {
        if (imp.from) {
          astSummary += `  - from ${imp.from} import ${imp.modules}\n`;
        } else {
          astSummary += `  - import ${imp.modules}\n`;
        }
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

    if (functions.length > 0) {
      astSummary += 'Functions:\n';
      functions.forEach(fn => {
        astSummary += `  - ${fn.name}(${fn.params})\n`;
      });
    }

    return astSummary || 'AST generated (no major structures detected)';
  } catch (error) {
    return `AST Error: ${error.message}`;
  }
}
