import { parseJavaScript } from './javascript.js';
import { parsePython } from './python.js';
import { parseJava } from './java.js';

/**
 * Detect programming language from code.
 */
export function detectLanguage(code) {
  // JavaScript / React indicators
  if (
    (code.includes('import ') && code.includes('from ')) ||
    code.includes('const ') || code.includes('let ') ||
    code.includes('=>') ||
    /\bfunction\s/.test(code) ||
    code.includes('export ') ||
    (code.includes('<') && code.includes('/>')) ||
    code.includes('useState') || code.includes('useEffect')
  ) {
    return 'javascript';
  }

  // Python indicators
  if (
    /\bdef\s/.test(code) ||
    (/\bclass\s/.test(code) && code.includes(':')) ||
    (code.includes('import ') && !code.includes(';')) ||
    code.includes('print(') ||
    code.includes('if __name__')
  ) {
    return 'python';
  }

  // Java indicators
  if (
    code.includes('public class ') || code.includes('private class ') ||
    code.includes('public static void main') ||
    code.includes('System.out.println') ||
    /import\s+[\w.]+;/.test(code)
  ) {
    return 'java';
  }

  return 'unknown';
}

/**
 * Parse code into structured AST.
 * @param {string} code - Source code
 * @param {string} [language] - Force language (optional)
 * @returns {{ language: string, ast: object }}
 */
export function parseCode(code, language) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return { language: 'none', ast: null };
  }

  const lang = language || detectLanguage(code);

  let ast;
  try {
    switch (lang) {
      case 'javascript':
        ast = parseJavaScript(code);
        break;
      case 'python':
        ast = parsePython(code);
        break;
      case 'java':
        ast = parseJava(code);
        break;
      default:
        ast = null;
    }
  } catch (err) {
    ast = { parseError: err.message, functions: [], variables: [], control_flow: [], imports: [], exports: [] };
  }

  return { language: lang, ast };
}
