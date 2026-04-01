/**
 * Build a prompt for code explanation.
 * @param {string} code - Source code
 * @param {object|null} ast - Parsed AST structure
 * @param {string} language - Detected language
 * @param {string} mode - "with_ast" or "without_ast"
 * @returns {string}
 */
export function buildPrompt(code, ast, language, mode) {
  const hasUsableAst = ast && !ast.parseError && !ast.error;
  if (mode === 'with_ast' && hasUsableAst) {
    return WITH_AST(code, ast, language);
  }
  return WITHOUT_AST(code, language);
}

function WITH_AST(code, ast, language) {
  const astJson = JSON.stringify(ast, null, 2);
  return `You are an expert code analyst. Explain the following ${language} code clearly and thoroughly.

## Source Code
\`\`\`${language}
${code}
\`\`\`

## AST Analysis (Pre-parsed)
The code has been statically analyzed. Here is the structured AST:
\`\`\`json
${astJson}
\`\`\`

## Instructions
Using both the source code AND the AST analysis above:
1. **Overview**: Describe what this code does in 1-2 sentences.
2. **Key Components**: Walk through each function, class, or significant structure identified in the AST.
3. **Control Flow**: Explain the logic flow, referencing specific control structures from the AST.
4. **Dependencies**: Note any imports/exports and their roles.
5. **Potential Issues**: Flag any bugs, anti-patterns, or improvements.

Be precise and reference specific line numbers or structure names from the AST when possible.`;
}

function WITHOUT_AST(code, language) {
  return `You are an expert code analyst. Explain the following ${language || 'unknown'} code clearly and thoroughly.

\`\`\`${language || ''}
${code}
\`\`\`

Please provide:
1. **Overview**: What this code does in 1-2 sentences.
2. **Key Components**: Walk through functions, classes, or significant structures.
3. **Control Flow**: Explain the logic flow.
4. **Potential Issues**: Flag any bugs, anti-patterns, or improvements.`;
}
