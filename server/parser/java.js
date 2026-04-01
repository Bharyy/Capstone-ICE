/**
 * Parse Java code into structured AST data using enhanced regex.
 */
export function parseJava(code) {
  const lines = code.split('\n');
  const result = {
    classes: [],
    methods: [],
    fields: [],
    control_flow: [],
    imports: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Imports
    const importMatch = line.match(/^\s*import\s+(static\s+)?(.+);/);
    if (importMatch) {
      result.imports.push({
        name: importMatch[2].trim(),
        static: !!importMatch[1],
      });
      continue;
    }

    // Classes / Interfaces / Enums
    const classMatch = line.match(
      /(?:public|private|protected)?\s*(?:abstract|final|static)?\s*(?:class|interface|enum)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/
    );
    if (classMatch) {
      result.classes.push({
        name: classMatch[1],
        extends: classMatch[2] || undefined,
        implements: classMatch[3] ? classMatch[3].split(',').map(s => s.trim()) : undefined,
        line: lineNum,
      });
      continue;
    }

    // Methods
    const methodMatch = line.match(
      /(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[\w,\s?]+>\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{?/
    );
    if (methodMatch && !line.match(/\b(?:class|interface|enum|new|return|if|for|while)\b/)) {
      result.methods.push({
        name: methodMatch[2],
        returnType: methodMatch[1],
        params: methodMatch[3] ? methodMatch[3].split(',').map(p => p.trim()).filter(Boolean) : [],
        line: lineNum,
      });
      continue;
    }

    // Fields
    const fieldMatch = line.match(
      /^\s*(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/
    );
    if (fieldMatch && !line.includes('(')) {
      result.fields.push({
        name: fieldMatch[2],
        type: fieldMatch[1],
        line: lineNum,
      });
      continue;
    }

    // Control flow
    if (line.match(/\bif\s*\(/)) result.control_flow.push({ type: 'if', line: lineNum });
    else if (line.match(/\bfor\s*\(/)) result.control_flow.push({ type: 'for', line: lineNum });
    else if (line.match(/\bwhile\s*\(/)) result.control_flow.push({ type: 'while', line: lineNum });
    else if (line.match(/\bswitch\s*\(/)) result.control_flow.push({ type: 'switch', line: lineNum });
    else if (line.match(/\btry\s*\{/)) result.control_flow.push({ type: 'try/catch', line: lineNum });
  }

  return result;
}
