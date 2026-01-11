"""AST Validator for generated Python code - v7.16"""
import ast
import sys
import json
from typing import Dict, List, Any, Set


class ASTValidator(ast.NodeVisitor):
    """Analyze Python code for structural issues."""
    
    def __init__(self, source_code: str):
        self.source = source_code
        self.lines = source_code.split('\n')
        self.issues: List[Dict[str, Any]] = []
        self.methods: List[Dict[str, Any]] = []
        self.current_method: str = ""
        self.current_method_line: int = 0
        self.defined_vars: Set[str] = set()
        self.used_vars: Set[str] = set()
        self.method_calls: Set[str] = set()
        self.defined_methods: Set[str] = set()
    
    def analyze(self) -> Dict[str, Any]:
        """Run full analysis."""
        try:
            tree = ast.parse(self.source)
            self.visit(tree)
            
            # Check for undefined method calls
            undefined_calls = self.method_calls - self.defined_methods - {'info', 'error', 'debug', 'warning', 'get', 'append', 'keys', 'values', 'items', 'format', 'strip', 'split', 'join', 'lower', 'upper'}
            if undefined_calls:
                self.issues.append({
                    'type': 'undefined_methods',
                    'severity': 'HIGH',
                    'methods': list(undefined_calls)[:10],
                    'message': f'{len(undefined_calls)} undefined method calls'
                })
            
            return {
                'valid': True,
                'issues': self.issues,
                'methods': self.methods,
                'stats': {
                    'total_methods': len(self.methods),
                    'problematic_methods': len([m for m in self.methods if m.get('has_issues')]),
                    'total_issues': len(self.issues)
                }
            }
        except SyntaxError as e:
            return {
                'valid': False,
                'error': str(e),
                'line': e.lineno,
                'issues': [{
                    'type': 'syntax_error',
                    'severity': 'CRITICAL',
                    'line': e.lineno,
                    'message': str(e)
                }],
                'methods': [],
                'stats': {'total_methods': 0, 'problematic_methods': 0, 'total_issues': 1}
            }
    
    def visit_FunctionDef(self, node: ast.FunctionDef):
        """Analyze each method."""
        self.current_method = node.name
        self.current_method_line = node.lineno
        self.defined_methods.add(node.name)
        
        local_vars: Set[str] = {'self'}
        used_before_defined: List[str] = []
        complexity = 1
        has_pass_only = False
        
        # Check method body
        body_statements = 0
        for stmt in ast.walk(node):
            if isinstance(stmt, ast.If):
                complexity += 1
            elif isinstance(stmt, ast.For):
                complexity += 1
            elif isinstance(stmt, ast.While):
                complexity += 1
            elif isinstance(stmt, ast.ExceptHandler):
                complexity += 1
            elif isinstance(stmt, ast.BoolOp):
                complexity += len(stmt.values) - 1
            
            # Track assignments
            if isinstance(stmt, ast.Assign):
                for target in stmt.targets:
                    if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name) and target.value.id == 'self':
                        local_vars.add(target.attr)
                    elif isinstance(target, ast.Name):
                        local_vars.add(target.id)
            
            # Track method calls
            if isinstance(stmt, ast.Call):
                if isinstance(stmt.func, ast.Attribute):
                    self.method_calls.add(stmt.func.attr)
        
        # Check for pass-only methods
        if len(node.body) == 1:
            stmt = node.body[0]
            if isinstance(stmt, ast.Pass):
                has_pass_only = True
            elif isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Constant):
                # Just a docstring
                has_pass_only = True
        
        method_info = {
            'name': node.name,
            'line_start': node.lineno,
            'line_end': node.end_lineno or node.lineno,
            'complexity': complexity,
            'has_pass_only': has_pass_only,
            'has_issues': False,
            'issue_types': []
        }
        
        if has_pass_only:
            method_info['has_issues'] = True
            method_info['issue_types'].append('empty_method')
        
        if complexity > 10:
            method_info['has_issues'] = True
            method_info['issue_types'].append('high_complexity')
        
        self.methods.append(method_info)
        self.generic_visit(node)
    
    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Load):
            self.used_vars.add(node.id)
        self.generic_visit(node)


def validate_code(code: str) -> Dict[str, Any]:
    """Main entry point for validation."""
    validator = ASTValidator(code)
    return validator.analyze()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Read from stdin
        code = sys.stdin.read()
    else:
        with open(sys.argv[1], 'r') as f:
            code = f.read()
    
    result = validate_code(code)
    print(json.dumps(result))
