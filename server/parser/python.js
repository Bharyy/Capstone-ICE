/**
 * Parse Python code into structured AST data using enhanced regex.
 */
export function parsePython(code) {
  const lines = code.split('\n');
  const result = {
    functions: [],
    classes: [],
    variables: [],
    control_flow: [],
    decorators: [],
    imports: [],
  };

  let pendingDecorators = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Decorators
    const decoMatch = line.match(/^\s*@(\w[\w.]*)/);
    if (decoMatch) {
      pendingDecorators.push(decoMatch[1]);
      continue;
    }

    // Functions
    const fnMatch = line.match(/^\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/);
    if (fnMatch) {
      result.functions.push({
        name: fnMatch[1],
        params: fnMatch[2].split(',').map(p => p.trim()).filter(Boolean),
        decorators: pendingDecorators.length > 0 ? [...pendingDecorators] : undefined,
        line: lineNum,
      });
      if (pendingDecorators.length > 0) {
        result.decorators.push(...pendingDecorators.map(d => ({ name: d, target: fnMatch[1], line: lineNum })));
      }
      pendingDecorators = [];
      continue;
    }

    // Classes
    const classMatch = line.match(/^\s*class\s+(\w+)(?:\(([^)]*)\))?/);
    if (classMatch) {
      result.classes.push({
        name: classMatch[1],
        bases: classMatch[2] ? classMatch[2].split(',').map(b => b.trim()).filter(Boolean) : [],
        decorators: pendingDecorators.length > 0 ? [...pendingDecorators] : undefined,
        line: lineNum,
      });
      if (pendingDecorators.length > 0) {
        result.decorators.push(...pendingDecorators.map(d => ({ name: d, target: classMatch[1], line: lineNum })));
      }
      pendingDecorators = [];
      continue;
    }

    pendingDecorators = [];

    // Imports
    const fromImport = line.match(/^\s*from\s+(\S+)\s+import\s+(.+)/);
    if (fromImport) {
      result.imports.push({ source: fromImport[1], names: fromImport[2].split(',').map(n => n.trim()) });
      continue;
    }
    const plainImport = line.match(/^\s*import\s+(.+)/);
    if (plainImport) {
      result.imports.push({ source: plainImport[1].trim(), names: [] });
      continue;
    }

    // Variables (top-level assignments)
    const varMatch = line.match(/^(\w+)\s*(?::\s*\w+)?\s*=/);
    if (varMatch && !line.match(/^\s/) && !line.startsWith('#')) {
      result.variables.push({ name: varMatch[1], line: lineNum });
      continue;
    }

    // Control flow
    if (line.match(/^\s*if\s+/)) result.control_flow.push({ type: 'if', line: lineNum });
    else if (line.match(/^\s*for\s+/)) result.control_flow.push({ type: 'for', line: lineNum });
    else if (line.match(/^\s*while\s+/)) result.control_flow.push({ type: 'while', line: lineNum });
    else if (line.match(/^\s*try\s*:/)) result.control_flow.push({ type: 'try/except', line: lineNum });
    else if (line.match(/^\s*with\s+/)) result.control_flow.push({ type: 'with', line: lineNum });
  }

  // Clean up empty arrays
  if (result.decorators.length === 0) delete result.decorators;
  return result;
}
