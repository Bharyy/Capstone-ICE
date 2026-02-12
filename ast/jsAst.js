import { parse } from '@babel/parser';

/**
 * Generate AST for JavaScript/React code
 * @param {string} code - JavaScript or React code
 * @returns {string} - Formatted AST representation
 */
export function generateJavaScriptAST(code) {
  try {
    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'jsx', 
        'typescript', 
        'decorators-legacy', 
        'classProperties',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'functionBind',
        'nullishCoalescingOperator',
        'optionalChaining'
      ],
      errorRecovery: true,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowUndeclaredExports: true,
    });

    // Extract meaningful information
    const functions = [];
    const components = [];
    const imports = [];
    const exports = [];

    // Helper to extract function info
    const extractFunction = (node, name) => {
      if (!node) return null;
      const params = node.params?.map(p => {
        if (p.type === 'ObjectPattern') {
          return p.properties?.map(prop => prop.key?.name || '').filter(Boolean).join(', ') || 'props';
        }
        return p.name || 'param';
      }).join(', ') || '';
      return { name, params };
    };

    // Recursive helper to find nested functions
    const traverseFunction = (node) => {
      if (!node || !node.body) return;
      const body = node.body.type === 'BlockStatement' ? node.body.body : [];
      body.forEach(stmt => {
        if (stmt.type === 'FunctionDeclaration' && stmt.id) {
          const info = extractFunction(stmt, stmt.id.name);
          if (info) functions.push(info);
          traverseFunction(stmt);
        } else if (stmt.type === 'VariableDeclaration') {
          stmt.declarations.forEach(decl => {
            if (decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')) {
              const info = extractFunction(decl.init, decl.id?.name || 'anonymous');
              if (info) functions.push(info);
              traverseFunction(decl.init);
            }
          });
        }
      });
    };

    // Recursive helper to unwrap CallExpressions (memo, forwardRef, etc.)
    const unwrapCallExpression = (node, varName) => {
      if (node.type === 'CallExpression') {
        node.arguments.forEach(arg => {
          if (arg.type === 'FunctionExpression' || arg.type === 'ArrowFunctionExpression') {
            const name = arg.id?.name || varName || 'anonymous';
            const info = extractFunction(arg, name);
            if (info) functions.push(info);
            traverseFunction(arg);
          } else if (arg.type === 'CallExpression') {
            unwrapCallExpression(arg, varName);
          }
        });
      }
    };

    // Traverse AST
    if (ast.program && ast.program.body) {
      ast.program.body.forEach(node => {
        // Handle imports
        if (node.type === 'ImportDeclaration') {
          imports.push({
            from: node.source.value,
            specifiers: node.specifiers.map(s => s.local?.name || 'unknown')
          });
        }

        // Handle function declarations
        if (node.type === 'FunctionDeclaration' && node.id) {
          const info = extractFunction(node, node.id.name);
          if (info) functions.push(info);
          traverseFunction(node);
        }
        
        // Handle variable declarations
        if (node.type === 'VariableDeclaration') {
          node.declarations.forEach(decl => {
            const varName = decl.id?.name;
            if (decl.init) {
              if (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression') {
                const info = extractFunction(decl.init, varName || 'anonymous');
                if (info) functions.push(info);
                traverseFunction(decl.init);
              } else if (decl.init.type === 'CallExpression') {
                unwrapCallExpression(decl.init, varName);
              }
            }
          });
        }
        
        // Handle exports
        if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
          const exportName = node.declaration?.id?.name || node.declaration?.declarations?.[0]?.id?.name || 'default';
          if (exportName) exports.push(exportName);
          
          if (node.declaration) {
            if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
              const info = extractFunction(node.declaration, node.declaration.id.name);
              if (info) functions.push(info);
              traverseFunction(node.declaration);
            } else if (node.declaration.type === 'VariableDeclaration') {
              node.declaration.declarations.forEach(decl => {
                const varName = decl.id?.name;
                if (decl.init) {
                  if (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression') {
                    const info = extractFunction(decl.init, varName || 'anonymous');
                    if (info) functions.push(info);
                    traverseFunction(decl.init);
                  } else if (decl.init.type === 'CallExpression') {
                    unwrapCallExpression(decl.init, varName);
                  }
                }
              });
            }
          }
        }
      });
    }

    // Format output
    let astSummary = '=== JavaScript/React AST ===\n\n';
    
    if (imports.length > 0) {
      astSummary += 'Imports:\n';
      imports.forEach(imp => {
        astSummary += `  - from "${imp.from}": ${imp.specifiers.join(', ')}\n`;
      });
      astSummary += '\n';
    }

    if (functions.length > 0) {
      astSummary += 'Functions/Components:\n';
      functions.forEach(fn => {
        astSummary += `  - ${fn.name}(${fn.params})\n`;
      });
      astSummary += '\n';
    }

    if (exports.length > 0) {
      astSummary += 'Exports:\n';
      exports.forEach(exp => {
        astSummary += `  - ${exp}\n`;
      });
    }

    return astSummary || 'AST generated (no major structures detected)';
  } catch (error) {
    return `AST Error: ${error.message}`;
  }
}
