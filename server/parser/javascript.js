import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

/**
 * Parse JavaScript/React code into structured AST data.
 * Returns a structured object (not a string) for JSON responses.
 */
export function parseJavaScript(code) {
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'jsx', 'typescript', 'decorators-legacy', 'classProperties',
        'dynamicImport', 'exportDefaultFrom', 'exportNamespaceFrom',
        'nullishCoalescingOperator', 'optionalChaining',
      ],
      errorRecovery: true,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      allowUndeclaredExports: true,
    });
  } catch (parseErr) {
    return { functions: [], variables: [], control_flow: [], imports: [], exports: [], parseError: parseErr.message };
  }

  const result = {
    functions: [],
    variables: [],
    control_flow: [],
    imports: [],
    exports: [],
  };

  // Collect parse-level errors (non-fatal) reported by errorRecovery
  if (ast.errors?.length > 0) {
    result.parseWarnings = ast.errors.map(e => e.message);
  }

  try {
  traverse(ast, {
    ImportDeclaration(path) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map(s => s.local.name),
      });
    },

    FunctionDeclaration(path) {
      result.functions.push({
        name: path.node.id?.name || 'anonymous',
        params: path.node.params.map(p => paramName(p)),
        line: path.node.loc?.start.line,
      });
    },

    VariableDeclarator(path) {
      const init = path.node.init;
      const name = path.node.id?.name;
      if (!name) return;

      if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
        result.functions.push({
          name,
          params: init.params.map(p => paramName(p)),
          line: path.node.loc?.start.line,
        });
      } else if (init?.type === 'CallExpression') {
        // Handle memo(), forwardRef(), etc.
        const innerFn = init.arguments.find(
          a => a.type === 'ArrowFunctionExpression' || a.type === 'FunctionExpression'
        );
        if (innerFn) {
          result.functions.push({
            name,
            params: innerFn.params.map(p => paramName(p)),
            wrapper: init.callee?.name || init.callee?.property?.name,
            line: path.node.loc?.start.line,
          });
        } else {
          result.variables.push({ name, kind: path.parent.kind, line: path.node.loc?.start.line });
        }
      } else {
        result.variables.push({ name, kind: path.parent.kind, line: path.node.loc?.start.line });
      }
    },

    IfStatement(path) {
      result.control_flow.push({ type: 'if', line: path.node.loc?.start.line });
    },
    ForStatement(path) {
      result.control_flow.push({ type: 'for', line: path.node.loc?.start.line });
    },
    ForOfStatement(path) {
      result.control_flow.push({ type: 'for...of', line: path.node.loc?.start.line });
    },
    ForInStatement(path) {
      result.control_flow.push({ type: 'for...in', line: path.node.loc?.start.line });
    },
    WhileStatement(path) {
      result.control_flow.push({ type: 'while', line: path.node.loc?.start.line });
    },
    SwitchStatement(path) {
      result.control_flow.push({ type: 'switch', line: path.node.loc?.start.line });
    },
    TryStatement(path) {
      result.control_flow.push({ type: 'try/catch', line: path.node.loc?.start.line });
    },

    ExportDefaultDeclaration(path) {
      const name = path.node.declaration?.id?.name
        || path.node.declaration?.name
        || 'default';
      result.exports.push({ name, type: 'default' });
    },
    ExportNamedDeclaration(path) {
      if (path.node.declaration?.id) {
        result.exports.push({ name: path.node.declaration.id.name, type: 'named' });
      }
      if (path.node.declaration?.declarations) {
        for (const d of path.node.declaration.declarations) {
          if (d.id?.name) result.exports.push({ name: d.id.name, type: 'named' });
        }
      }
      if (path.node.specifiers) {
        for (const s of path.node.specifiers) {
          result.exports.push({ name: s.exported.name, type: 'named' });
        }
      }
    },
  });
  } catch (traverseErr) {
    // Return whatever we collected before traverse crashed
    result.traverseError = traverseErr.message;
  }

  return result;
}

function paramName(p) {
  if (p.type === 'Identifier') return p.name;
  if (p.type === 'AssignmentPattern') return p.left?.name || 'param';
  if (p.type === 'ObjectPattern') return '{...}';
  if (p.type === 'ArrayPattern') return '[...]';
  if (p.type === 'RestElement') return `...${p.argument?.name || 'rest'}`;
  return 'param';
}
