"""
Shadow Testing API Endpoint for CodeSwitch

Ce point d'API permet d'exécuter des tests en miroir (shadow tests)
pour comparer les résultats du code COBOL original avec le code Python
transpilé, garantissant la fidélité de la transpilation.

Auteur: CodeSwitch Team
Version: 1.0.0
"""

import json
import sys
import os
from typing import Any, Dict, List

# Add the parent directory to the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler
from datetime import datetime, timezone

# Import shadow testing modules
try:
    from lib.shadow_tester import (
        ShadowTester,
        ShadowTestCase,
        run_shadow_test,
        generate_shadow_test_template,
        ComparisonMode
    )
    SHADOW_TESTER_AVAILABLE = True
except ImportError as e:
    SHADOW_TESTER_AVAILABLE = False
    SHADOW_IMPORT_ERROR = str(e)

try:
    from lib.production_postprocessor import (
        ProductionPostprocessor,
        ProductionLevel,
        calculate_production_readiness
    )
    POSTPROCESSOR_AVAILABLE = True
except ImportError as e:
    POSTPROCESSOR_AVAILABLE = False
    POSTPROCESSOR_IMPORT_ERROR = str(e)


def parse_test_cases(test_cases_data: List[Dict[str, Any]]) -> List[ShadowTestCase]:
    """
    Convertit les données JSON des cas de test en objets ShadowTestCase.
    
    Args:
        test_cases_data: Liste des dictionnaires de cas de test
        
    Returns:
        Liste des objets ShadowTestCase
    """
    cases = []
    for tc in test_cases_data:
        try:
            # Déterminer le mode de comparaison
            comparison_mode = ComparisonMode.NUMERIC_TOLERANCE
            if tc.get('comparison_mode'):
                try:
                    comparison_mode = ComparisonMode(tc['comparison_mode'])
                except ValueError:
                    comparison_mode = ComparisonMode.NUMERIC_TOLERANCE
            
            case = ShadowTestCase(
                name=tc.get('name', 'Test without name'),
                cobol_input=tc.get('cobol_input', {}),
                python_input=tc.get('python_input', {}),
                description=tc.get('description'),
                tolerance=tc.get('tolerance', 0.0001),
                comparison_mode=comparison_mode,
                category=tc.get('category', 'general'),
                timeout=tc.get('timeout', 30),
                metadata=tc.get('metadata', {})
            )
            cases.append(case)
        except Exception as e:
            # En cas d'erreur, ajouter un cas avec les données brutes
            case = ShadowTestCase(
                name=tc.get('name', 'Error case'),
                cobol_input=tc.get('cobol_input', {}),
                python_input=tc.get('python_input', {}),
                metadata={'parse_error': str(e)}
            )
            cases.append(case)
    
    return cases


class handler(BaseHTTPRequestHandler):
    """Handler HTTP pour les opérations de shadow testing."""
    
    def do_POST(self):
        """Handle POST requests for shadow testing."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            
            # Vérifier la disponibilité des modules
            if not SHADOW_TESTER_AVAILABLE:
                self.send_json_response({
                    'success': False,
                    'error': 'Shadow tester module not available',
                    'import_error': SHADOW_IMPORT_ERROR
                }, 500)
                return
            
            cobol_code = data.get('cobol_code', '')
            python_code = data.get('python_code', '')
            test_cases_data = data.get('test_cases', [])
            settings = data.get('settings', {})
            
            # Vérifier les paramètres requis
            if not cobol_code and not test_cases_data:
                self.send_json_response({
                    'success': False,
                    'error': 'Either cobol_code or test_cases is required'
                }, 400)
                return
            
            # Générer des cas de test par défaut si non fournis
            if not test_cases_data and cobol_code:
                test_cases_data = generate_shadow_test_template(cobol_code, python_code or '')
            
            # Parser les cas de test
            test_cases = parse_test_cases(test_cases_data)
            
            # Configuration du tester
            cobol_executor = settings.get('cobol_executor', 'cobc')
            python_executor = settings.get('python_executor', 'python3')
            working_dir = settings.get('working_dir', '/tmp/codeswitch_shadow_tests')
            parallel = settings.get('parallel', True)
            
            # Créer et exécuter le tester
            tester = ShadowTester(
                cobol_executor=cobol_executor,
                python_executor=python_executor,
                working_dir=working_dir
            )
            
            try:
                report = tester.run_batch(test_cases, parallel=parallel)
                result = report.to_dict()
                
                # Ajouter les recommandations de production si disponible
                if POSTPROCESSOR_AVAILABLE and python_code:
                    readiness = calculate_production_readiness(python_code)
                    result['production_readiness'] = readiness
                
                result['success'] = True
                result['modules_loaded'] = {
                    'shadow_tester': SHADOW_TESTER_AVAILABLE,
                    'postprocessor': POSTPROCESSOR_AVAILABLE
                }
                
                self.send_json_response(result)
                
            finally:
                tester.shutdown()
        
        except json.JSONDecodeError:
            self.send_json_response({
                'success': False,
                'error': 'Invalid JSON'
            }, 400)
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e),
                'type': type(e).__name__
            }, 500)
    
    def do_GET(self):
        """Handle GET requests for shadow testing info."""
        self.send_json_response({
            'name': 'Shadow Testing API',
            'version': '1.0.0',
            'description': 'COBOL vs Python output comparison testing',
            'modules_available': {
                'shadow_tester': SHADOW_TESTER_AVAILABLE,
                'postprocessor': POSTPROCESSOR_AVAILABLE
            },
            'features': [
                'Parallel execution of COBOL and Python',
                'Numeric tolerance comparison',
                'Detailed difference reporting',
                'Performance metrics collection',
                'Production readiness scoring',
                'Batch test execution'
            ],
            'comparison_modes': [mode.value for mode in ComparisonMode],
            'usage': {
                'method': 'POST',
                'content_type': 'application/json',
                'body': {
                    'cobol_code': 'string (optional)',
                    'python_code': 'string (optional)',
                    'test_cases': [
                        {
                            'name': 'string',
                            'cobol_input': {'field': 'value'},
                            'python_input': {'field': 'value'},
                            'tolerance': 0.0001,
                            'comparison_mode': 'numeric_tolerance'
                        }
                    ],
                    'settings': {
                        'cobol_executor': 'cobc',
                        'python_executor': 'python3',
                        'parallel': True
                    }
                }
            }
        })
    
    def send_json_response(self, data: dict, status: int = 200):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


# Endpoint pour l'amélioration du code vers la production
class ProductionEnhancerHandler(BaseHTTPRequestHandler):
    """Handler pour l'amélioration du code vers la production."""
    
    def do_POST(self):
        """Handle POST requests for production enhancement."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            
            if not POSTPROCESSOR_AVAILABLE:
                self.send_json_response({
                    'success': False,
                    'error': 'Postprocessor module not available',
                    'import_error': POSTPROCESSOR_IMPORT_ERROR
                }, 500)
                return
            
            cobol_code = data.get('cobol_code', '')
            python_code = data.get('python_code', '')
            level = data.get('level', 'bank_grade')
            user_id = data.get('user_id')
            session_id = data.get('session_id')
            
            if not python_code:
                self.send_json_response({
                    'success': False,
                    'error': 'python_code is required'
                }, 400)
                return
            
            # Déterminer le niveau de production
            try:
                production_level = ProductionLevel(level)
            except ValueError:
                production_level = ProductionLevel.BANK_GRADE
            
            # Créer le post-processeur
            postprocessor = ProductionPostprocessor(
                production_level=production_level
            )
            
            # Générer le code de production
            production_code, report = postprocessor.process(
                original_cobol=cobol_code,
                transpiled_python=python_code,
                metadata={'user_id': user_id, 'session_id': session_id}
            )
            
            # Calculer le score de production readiness
            readiness = calculate_production_readiness(production_code)
            
            result = {
                'success': True,
                'original_python': python_code,
                'production_code': production_code,
                'report': {
                    'overall_score': report.overall_score,
                    'production_level': production_level.value,
                    'checks': [c.to_dict() for c in report.checks],
                    'injected_patterns': report.injected_patterns,
                    'code_size': report.code_size,
                    'production_size': report.production_size,
                    'recommendations': report.recommendations
                },
                'readiness': readiness,
                'modules_loaded': {
                    'postprocessor': POSTPROCESSOR_AVAILABLE,
                    'shadow_tester': SHADOW_TESTER_AVAILABLE
                }
            }
            
            self.send_json_response(result)
        
        except json.JSONDecodeError:
            self.send_json_response({
                'success': False,
                'error': 'Invalid JSON'
            }, 400)
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e),
                'type': type(e).__name__
            }, 500)
    
    def do_GET(self):
        """Handle GET requests for production enhancement info."""
        self.send_json_response({
            'name': 'Production Enhancement API',
            'version': '1.0.0',
            'description': 'Enhance transpiled Python code with production patterns',
            'modules_available': {
                'postprocessor': POSTPROCESSOR_AVAILABLE
            },
            'production_levels': [level.value for level in ProductionLevel],
            'features': [
                'ThreadSafeRuntime injection',
                'UnitOfWork transaction management',
                'SOX audit logging',
                'Error handling decorators',
                'Input validation',
                'Comprehensive documentation'
            ],
            'usage': {
                'method': 'POST',
                'content_type': 'application/json',
                'body': {
                    'python_code': 'string (required)',
                    'cobol_code': 'string (optional)',
                    'level': 'basic|standard|enhanced|bank_grade',
                    'user_id': 'string (optional)',
                    'session_id': 'string (optional)'
                }
            }
        })
    
    def send_json_response(self, data: dict, status: int = 200):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


# Endpoint pour le calcul du score de production readiness
class ReadinessScoreHandler(BaseHTTPRequestHandler):
    """Handler pour calculer le score de production readiness."""
    
    def do_POST(self):
        """Handle POST requests for readiness scoring."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            
            if not POSTPROCESSOR_AVAILABLE:
                self.send_json_response({
                    'success': False,
                    'error': 'Postprocessor module not available',
                    'import_error': POSTPROCESSOR_IMPORT_ERROR
                }, 500)
                return
            
            python_code = data.get('python_code', '')
            
            if not python_code:
                self.send_json_response({
                    'success': False,
                    'error': 'python_code is required'
                }, 400)
                return
            
            # Calculer le score
            readiness = calculate_production_readiness(python_code)
            
            result = {
                'success': True,
                'readiness': readiness,
                'is_production_ready': readiness['is_production_ready'],
                'modules_loaded': {
                    'postprocessor': POSTPROCESSOR_AVAILABLE
                }
            }
            
            self.send_json_response(result)
        
        except json.JSONDecodeError:
            self.send_json_response({
                'success': False,
                'error': 'Invalid JSON'
            }, 400)
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e),
                'type': type(e).__name__
            }, 500)
    
    def do_GET(self):
        """Handle GET requests for readiness scoring info."""
        self.send_json_response({
            'name': 'Production Readiness Score API',
            'version': '1.0.0',
            'description': 'Calculate production readiness score for transpiled code',
            'categories_evaluated': [
                'error_handling',
                'logging',
                'documentation',
                'thread_safety',
                'transaction_management'
            ],
            'usage': {
                'method': 'POST',
                'content_type': 'application/json',
                'body': {
                    'python_code': 'string (required)'
                },
                'response': {
                    'overall_score': 'number (0-100)',
                    'category_scores': 'object',
                    'is_production_ready': 'boolean (>=80%)',
                    'critical_missing': 'array',
                    'recommendations': 'array'
                }
            }
        })
    
    def send_json_response(self, data: dict, status: int = 200):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
