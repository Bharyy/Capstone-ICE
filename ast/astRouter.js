import { generateJavaScriptAST } from './jsAst.js';
import { generatePythonAST } from './pythonAst.js';
import { generateJavaAST } from './javaAst.js';

/**
 * Detect programming language from code
 * @param {string} code - Source code
 * @returns {string} - Detected language: 'javascript', 'python', 'java', or 'unknown'
 */
function detectLanguage(code) {
  // JavaScript/React indicators
  if (
    code.includes('import ') && code.includes('from ') ||
    code.includes('const ') || code.includes('let ') ||
    code.includes('=>') ||
    code.includes('function ') ||
    code.includes('export ') ||
    code.includes('jsx') ||
    code.includes('<') && code.includes('/>') ||
    code.includes('useState') || code.includes('useEffect')
  ) {
    return 'javascript';
  }

  // Python indicators
  if (
    code.includes('def ') ||
    code.includes('class ') && code.includes(':') ||
    code.includes('import ') && !code.includes('from') && !code.includes(';') ||
    code.includes('print(') ||
    code.includes('if __name__')
  ) {
    return 'python';
  }

  // Java indicators
  if (
    code.includes('public class ') ||
    code.includes('private class ') ||
    code.includes('public static void main') ||
    code.includes('System.out.println') ||
    code.match(/import\s+[\w.]+;/)
  ) {
    return 'java';
  }

  return 'unknown';
}

/**
 * Generate AST for given code
 * @param {string} code - Source code
 * @returns {object} - { language, ast }
 */
export function generateAST(code) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return {
      language: 'none',
      ast: 'No code provided'
    };
  }

  const language = detectLanguage(code);
  let ast;

  switch (language) {
    case 'javascript':
      ast = generateJavaScriptAST(code);
      break;
    case 'python':
      ast = generatePythonAST(code);
      break;
    case 'java':
      ast = generateJavaAST(code);
      break;
    default:
      ast = 'Language not detected - AST not generated';
  }

  return { language, ast };
}
