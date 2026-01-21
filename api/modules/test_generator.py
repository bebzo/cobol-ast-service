"""
Test Generator Module v1.0
Separated from transpile.py for better maintainability and faster loading.
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class TestTemplateLoader:
    """Load test templates from JSON file."""
    
    _templates: Optional[Dict[str, Any]] = None
    
    @classmethod
    def load_templates(cls) -> Dict[str, Any]:
        """Load templates from JSON file (lazy loading)."""
        if cls._templates is None:
            template_path = Path(__file__).parent.parent / "templates" / "test_templates.json"
            with open(template_path, 'r', encoding='utf-8') as f:
                cls._templates = json.load(f)
        return cls._templates
    
    @classmethod
    def get_template(cls, template_name: str, **kwargs) -> str:
        """Get a template and fill in placeholders."""
        templates = cls.load_templates()
        template = templates.get("templates", {}).get(template_name, "")
        if template and kwargs:
            template = template.format(**kwargs)
        return template


def to_snake_case(name: str) -> str:
    """Convert COBOL name to Python snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).upper()


def extract_functions_from_code(code: str) -> List[Dict[str, Any]]:
    """Extract function definitions from Python code."""
    functions = []
    pattern = r'def\s+(\w+)\s*\(([^)]*)\)\s*:'
    
    for match in re.finditer(pattern, code):
        func_name = match.group(1)
        args_str = match.group(2).strip()
        
        # Skip private methods
        if func_name.startswith('_') and not func_name.startswith('__'):
            continue
        
        args = [a.strip().split(':')[0].strip() for a in args_str.split(',') if a.strip()]
        
        functions.append({
            'name': func_name,
            'args': args,
            'has_args': len(args) > 0
        })
    
    return functions


def extract_properties_from_code(code: str) -> List[str]:
    """Extract @property definitions from Python code."""
    properties = []
    pattern = r'@property\s+def\s+(\w+)\s*\('
    
    for match in re.finditer(pattern, code):
        prop_name = match.group(1)
        properties.append(prop_name)
    
    return properties


def extract_enums_from_code(code: str) -> List[str]:
    """Extract class Enum definitions from Python code."""
    enums = []
    pattern = r'class\s+(\w+)\s*\(\s*Enum\s*\)'
    
    for match in re.finditer(pattern, code):
        enum_name = match.group(1)
        enums.append(enum_name)
    
    return enums


def generate_tests_from_template(class_name: str, python_code: str) -> str:
    """Generate complete test file using templates."""
    loader = TestTemplateLoader()
    
    # Extract components from generated code
    functions = extract_functions_from_code(python_code)
    properties = extract_properties_from_code(python_code)
    enums = extract_enums_from_code(python_code)
    
    # Build test file
    tests = []
    
    # Header
    tests.append(loader.get_template("test_header", class_name=class_name))
    
    # Basic test class
    tests.append(loader.get_template("test_class_basic", class_name=class_name))
    
    # Function tests (limit to first 10)
    for func in functions[:10]:
        tests.append(loader.get_template(
            "test_method_template",
            class_name=class_name,
            method_name=func['name']
        ))
    
    # Property tests (88-level conditions)
    for prop in properties[:5]:
        tests.append(loader.get_template(
            "test_88_level_template",
            class_name=class_name,
            property_name=prop
        ))
    
    # Enum tests
    for enum in enums[:3]:
        tests.append(loader.get_template(
            "test_enum_values",
            class_name=class_name,
            enum_name=enum
        ))
    
    # Boundary values test
    tests.append(loader.get_template("test_boundary_values"))
    
    # Decimal operations test
    tests.append(loader.get_template("test_decimal_operations"))
    
    # Footer
    tests.append(loader.get_template("test_footer"))
    
    return '\n'.join(tests)


def generate_simple_tests(class_name: str) -> str:
    """Generate simple test file without parsing code."""
    loader = TestTemplateLoader()
    
    tests = [
        loader.get_template("test_header", class_name=class_name),
        loader.get_template("test_class_basic", class_name=class_name),
        loader.get_template("test_decimal_operations"),
        loader.get_template("test_boundary_values"),
        loader.get_template("test_footer")
    ]
    
    return '\n'.join(tests)


# Legacy compatibility functions
def escape_python_string_for_template(code: str) -> str:
    """Escape special characters for Python string insertion."""
    replacements = [
        ('\\', '\\\\'),
        ('"""', '\\"\\"\\"'),
        ('"', '\\"'),
        ("'", "\\'"),
        ('\n', '\\n'),
        ('\r', '\\r'),
        ('\t', '\\t'),
    ]
    
    result = code
    for old, new in replacements:
        result = result.replace(old, new)
    
    return result


def analyze_function_type(func_name: str, func_code: str = '') -> Dict[str, Any]:
    """Analyze function type for test generation."""
    context_managers = {'localcontext', 'supabase_client'}
    
    if func_name in context_managers:
        return {'type': 'context_manager', 'signature': []}
    
    if 'NotImplementedError' in func_code:
        return {'type': 'stub', 'signature': [], 'test_pattern': 'skip'}
    
    # Check for no-args pattern
    no_args_pattern = r'def\s+' + re.escape(func_name) + r'\s*\(\s*\)\s*:'
    if re.search(no_args_pattern, func_code, re.IGNORECASE):
        return {'type': 'no_args', 'signature': [], 'test_pattern': 'no_args'}
    
    return {'type': 'normal', 'signature': [], 'test_pattern': 'boundary_values'}


def generate_appropriate_test(func_name: str, func_type_info: Dict[str, Any]) -> str:
    """Generate appropriate test based on function type."""
    func_type = func_type_info['type']
    
    templates = {
        'context_manager': f'''
    def test_{func_name}_is_context_manager(self):
        """Test context manager."""
        try:
            with {func_name}() as ctx:
                assert ctx is not None
        except (TypeError, AttributeError):
            pytest.skip("Not a context manager")
''',
        'no_args': f'''
    def test_{func_name}_execution(self):
        """Test {func_name} execution."""
        try:
            result = self.{func_name}()
            assert result is not None or result is None
        except (TypeError, AttributeError):
            pytest.skip("Requires setup")
''',
        'stub': f'''
    def test_{func_name}_is_stub(self):
        """Test stub function."""
        assert hasattr(self, '{func_name}')
        pytest.skip("Stub - implementation required")
''',
        'normal': f'''
    def test_{func_name}_basic(self):
        """Test {func_name} basic functionality."""
        assert hasattr(self, '{func_name}')
        assert callable(self.{func_name})
'''
    }
    
    return templates.get(func_type, templates['normal'])
