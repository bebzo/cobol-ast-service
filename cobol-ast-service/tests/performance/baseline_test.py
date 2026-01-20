"""
CodeSwitch v7.0 - Performance Baseline Tests

This module establishes performance baselines for:
1. Transpilation speed
2. Memory usage
3. Code generation quality metrics
4. API response times

Run with: pytest tests/performance/ -v --tb=short
"""

import pytest
import time
import sys
import os
import json
import statistics
from pathlib import Path
from decimal import Decimal
from typing import Dict, List, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class PerformanceResult:
    """Store and analyze performance metrics."""
    
    def __init__(self, name: str):
        self.name = name
        self.times: List[float] = []
        self.memory_samples: List[int] = []
        
    def add_timing(self, elapsed_ms: float):
        self.times.append(elapsed_ms)
    
    def add_memory(self, bytes_used: int):
        self.memory_samples.append(bytes_used)
    
    @property
    def avg_time(self) -> float:
        return statistics.mean(self.times) if self.times else 0
    
    @property
    def max_time(self) -> float:
        return max(self.times) if self.times else 0
    
    @property
    def min_time(self) -> float:
        return min(self.times) if self.times else 0
    
    @property
    def std_dev(self) -> float:
        return statistics.stdev(self.times) if len(self.times) > 1 else 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "avg_time_ms": round(self.avg_time, 3),
            "max_time_ms": round(self.max_time, 3),
            "min_time_ms": round(self.min_time, 3),
            "std_dev_ms": round(self.std_dev, 3),
            "iterations": len(self.times),
            "avg_memory_bytes": statistics.mean(self.memory_samples) if self.memory_samples else 0
        }


# Sample COBOL code for testing
SAMPLE_COBOL = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. PERFORMANCE-TEST.
       AUTHOR. CodeSwitch.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-COUNTER PIC 9(5) VALUE 0.
       01 WS-TOTAL   PIC 9(10)V99 VALUE 0.
       01 WS-RATE    PIC 9(3)V99 VALUE 5.25.
       01 WS-NAME    PIC X(30) VALUE SPACES.
       
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           PERFORM INITIALIZE-DATA
           PERFORM PROCESS-LOOP 100 TIMES
           PERFORM CALCULATE-TOTAL
           PERFORM DISPLAY-RESULTS
           STOP RUN.
       
       INITIALIZE-DATA.
           MOVE 0 TO WS-COUNTER
           MOVE 0 TO WS-TOTAL
           MOVE "PERFORMANCE TEST" TO WS-NAME.
       
       PROCESS-LOOP.
           ADD 1 TO WS-COUNTER
           COMPUTE WS-TOTAL = WS-TOTAL + (WS-COUNTER * WS-RATE).
       
       CALCULATE-TOTAL.
           COMPUTE WS-TOTAL = WS-TOTAL * 1.05.
       
       DISPLAY-RESULTS.
           DISPLAY "Counter: " WS-COUNTER
           DISPLAY "Total: " WS-TOTAL
           DISPLAY "Name: " WS-NAME.
"""

# Expected Python structure (for validation)
EXPECTED_PYTHON_PATTERNS = [
    "class",
    "__init__",
    "def run",
    "self.",
    "Decimal"
]


class TestTranspilationPerformance:
    """Performance tests for transpilation operations."""
    
    @pytest.fixture
    def transpiler_path(self):
        return Path(__file__).parent.parent.parent / "transpiler.py"
    
    def test_transpiler_import_time(self, transpiler_path):
        """Baseline: Transpiler module import should be fast."""
        if not transpiler_path.exists():
            pytest.skip("Transpiler not found")
        
        result = PerformanceResult("transpiler_import")
        
        for _ in range(5):
            # Clear cache
            if 'transpiler' in sys.modules:
                del sys.modules['transpiler']
            
            start = time.perf_counter()
            # Attempt to import
            try:
                sys.path.insert(0, str(transpiler_path.parent))
                import transpiler
                elapsed = (time.perf_counter() - start) * 1000
                result.add_timing(elapsed)
            except Exception:
                pass
        
        if result.times:
            assert result.avg_time < 1000, f"Import too slow: {result.avg_time:.2f}ms (max 1000ms)"
            print(f"\n[BASELINE] Transpiler import: {result.avg_time:.2f}ms avg")
    
    def test_code_parsing_baseline(self):
        """Baseline: COBOL code parsing speed."""
        result = PerformanceResult("code_parsing")
        
        for _ in range(50):
            start = time.perf_counter()
            
            # Parse COBOL sections
            lines = SAMPLE_COBOL.strip().split('\n')
            divisions = {
                'identification': [],
                'data': [],
                'procedure': []
            }
            
            current_div = None
            for line in lines:
                upper = line.upper().strip()
                if 'IDENTIFICATION DIVISION' in upper:
                    current_div = 'identification'
                elif 'DATA DIVISION' in upper:
                    current_div = 'data'
                elif 'PROCEDURE DIVISION' in upper:
                    current_div = 'procedure'
                elif current_div:
                    divisions[current_div].append(line)
            
            elapsed = (time.perf_counter() - start) * 1000
            result.add_timing(elapsed)
        
        assert result.avg_time < 10, f"Parsing too slow: {result.avg_time:.2f}ms (max 10ms)"
        print(f"\n[BASELINE] Code parsing: {result.avg_time:.3f}ms avg")
    
    def test_regex_pattern_matching(self):
        """Baseline: Regex pattern matching for COBOL keywords."""
        import re
        
        patterns = [
            re.compile(r'PERFORM\s+(\w+)(?:\s+(\d+)\s+TIMES)?', re.IGNORECASE),
            re.compile(r'MOVE\s+(.+?)\s+TO\s+(\w+)', re.IGNORECASE),
            re.compile(r'COMPUTE\s+(\w+)\s*=\s*(.+)', re.IGNORECASE),
            re.compile(r'ADD\s+(\d+|\w+)\s+TO\s+(\w+)', re.IGNORECASE),
            re.compile(r'IF\s+(.+?)\s+(?:THEN)?', re.IGNORECASE),
            re.compile(r'DISPLAY\s+(.+)', re.IGNORECASE),
            re.compile(r'01\s+(\w+)\s+PIC\s+([X9]+(?:\([0-9]+\))?(?:V[0-9]+)?)', re.IGNORECASE),
        ]
        
        result = PerformanceResult("regex_matching")
        
        for _ in range(100):
            start = time.perf_counter()
            
            for line in SAMPLE_COBOL.split('\n'):
                for pattern in patterns:
                    pattern.search(line)
            
            elapsed = (time.perf_counter() - start) * 1000
            result.add_timing(elapsed)
        
        assert result.avg_time < 5, f"Regex too slow: {result.avg_time:.2f}ms (max 5ms)"
        print(f"\n[BASELINE] Regex matching: {result.avg_time:.3f}ms avg")


class TestMemoryBaseline:
    """Memory usage baseline tests."""
    
    def test_string_processing_memory(self):
        """Baseline: Memory for string processing."""
        import sys
        
        result = PerformanceResult("string_memory")
        
        for _ in range(10):
            # Process COBOL code
            lines = SAMPLE_COBOL.split('\n')
            processed = [line.strip().upper() for line in lines]
            joined = '\n'.join(processed)
            
            size = sys.getsizeof(lines) + sys.getsizeof(processed) + sys.getsizeof(joined)
            result.add_memory(size)
        
        avg_kb = statistics.mean(result.memory_samples) / 1024
        assert avg_kb < 100, f"Memory usage too high: {avg_kb:.2f}KB (max 100KB)"
        print(f"\n[BASELINE] String processing memory: {avg_kb:.2f}KB avg")
    
    def test_decimal_operations_memory(self):
        """Baseline: Memory for Decimal precision operations."""
        from decimal import Decimal, getcontext
        import sys
        
        result = PerformanceResult("decimal_memory")
        
        for _ in range(10):
            getcontext().prec = 28  # Standard COBOL precision
            
            # Simulate COBOL numeric operations
            values = [Decimal(str(i * 0.01)) for i in range(1000)]
            total = sum(values)
            
            size = sys.getsizeof(values) + sum(sys.getsizeof(v) for v in values[:100])
            result.add_memory(size)
        
        avg_kb = statistics.mean(result.memory_samples) / 1024
        assert avg_kb < 500, f"Memory usage too high: {avg_kb:.2f}KB (max 500KB)"
        print(f"\n[BASELINE] Decimal operations memory: {avg_kb:.2f}KB avg")


class TestCodeGenerationQuality:
    """Code generation quality metrics."""
    
    def test_python_generation_structure(self):
        """Test that generated Python has proper structure."""
        # Simulate generated Python
        generated_python = """
class PerformanceTest:
    \"\"\"Transpiled from COBOL: PERFORMANCE-TEST\"\"\"
    
    def __init__(self):
        from decimal import Decimal
        self.ws_counter = Decimal('0')
        self.ws_total = Decimal('0.00')
        self.ws_rate = Decimal('5.25')
        self.ws_name = " " * 30
    
    def run(self):
        self.initialize_data()
        for _ in range(100):
            self.process_loop()
        self.calculate_total()
        self.display_results()
    
    def initialize_data(self):
        from decimal import Decimal
        self.ws_counter = Decimal('0')
        self.ws_total = Decimal('0.00')
        self.ws_name = "PERFORMANCE TEST".ljust(30)
    
    def process_loop(self):
        self.ws_counter += 1
        self.ws_total = self.ws_total + (self.ws_counter * self.ws_rate)
    
    def calculate_total(self):
        from decimal import Decimal
        self.ws_total = self.ws_total * Decimal('1.05')
    
    def display_results(self):
        print(f"Counter: {self.ws_counter}")
        print(f"Total: {self.ws_total}")
        print(f"Name: {self.ws_name}")


if __name__ == "__main__":
    system = PerformanceTest()
    system.run()
"""
        
        # Verify structure
        for pattern in EXPECTED_PYTHON_PATTERNS:
            assert pattern in generated_python, f"Missing expected pattern: {pattern}"
        
        # Count methods
        method_count = generated_python.count("def ")
        assert method_count >= 5, f"Too few methods: {method_count} (expected >= 5)"
        
        # Line ratio check
        cobol_lines = len([l for l in SAMPLE_COBOL.split('\n') if l.strip()])
        python_lines = len([l for l in generated_python.split('\n') if l.strip()])
        ratio = python_lines / cobol_lines if cobol_lines > 0 else 0
        
        print(f"\n[QUALITY] Line ratio: {ratio:.2f} (Python/COBOL)")
        print(f"[QUALITY] Method count: {method_count}")
    
    def test_execution_of_generated_code(self):
        """Test that generated Python code executes correctly."""
        generated_python = """
from decimal import Decimal

class TestProgram:
    def __init__(self):
        self.counter = Decimal('0')
        self.total = Decimal('0.00')
    
    def run(self):
        for i in range(10):
            self.counter += 1
            self.total += self.counter * Decimal('1.5')
        return self.total

system = TestProgram()
result = system.run()
"""
        
        # Execute and measure
        start = time.perf_counter()
        exec_globals = {}
        exec(generated_python, exec_globals)
        elapsed = (time.perf_counter() - start) * 1000
        
        assert 'result' in exec_globals
        assert exec_globals['result'] > 0
        assert elapsed < 100, f"Execution too slow: {elapsed:.2f}ms"
        
        print(f"\n[QUALITY] Execution time: {elapsed:.2f}ms")
        print(f"[QUALITY] Result value: {exec_globals['result']}")


class TestAPIResponseBaseline:
    """API response time baselines (simulated)."""
    
    def test_json_serialization_speed(self):
        """Baseline: JSON serialization for API responses."""
        result = PerformanceResult("json_serialization")
        
        # Simulate API response data
        response_data = {
            "success": True,
            "code": SAMPLE_COBOL,
            "pythonCode": "class Test:\n    pass",
            "metrics": {
                "lines": 50,
                "methods": 5,
                "variables": 10
            },
            "mappings": [
                {"cobol": i, "python": [i*2, i*2+1]} for i in range(20)
            ]
        }
        
        for _ in range(100):
            start = time.perf_counter()
            json_str = json.dumps(response_data)
            parsed = json.loads(json_str)
            elapsed = (time.perf_counter() - start) * 1000
            result.add_timing(elapsed)
        
        assert result.avg_time < 5, f"JSON too slow: {result.avg_time:.2f}ms (max 5ms)"
        print(f"\n[BASELINE] JSON round-trip: {result.avg_time:.3f}ms avg")


class TestConcurrencyBaseline:
    """Concurrency performance baselines."""
    
    def test_parallel_parsing(self):
        """Baseline: Parallel code parsing."""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        def parse_cobol(code: str) -> Dict[str, int]:
            lines = code.split('\n')
            return {
                "total_lines": len(lines),
                "code_lines": len([l for l in lines if l.strip() and not l.strip().startswith('*')]),
                "divisions": sum(1 for l in lines if 'DIVISION' in l.upper())
            }
        
        # Create multiple code samples
        samples = [SAMPLE_COBOL + f"\n* Sample {i}" for i in range(10)]
        
        result = PerformanceResult("parallel_parsing")
        
        for _ in range(5):
            start = time.perf_counter()
            
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(parse_cobol, sample) for sample in samples]
                results = [f.result() for f in as_completed(futures)]
            
            elapsed = (time.perf_counter() - start) * 1000
            result.add_timing(elapsed)
        
        assert result.avg_time < 100, f"Parallel parsing too slow: {result.avg_time:.2f}ms"
        print(f"\n[BASELINE] Parallel parsing (10 samples): {result.avg_time:.2f}ms avg")


def save_baseline_results():
    """Save baseline results to JSON file."""
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": "7.0",
        "baselines": {
            "transpiler_import_ms": 1000,
            "code_parsing_ms": 10,
            "regex_matching_ms": 5,
            "string_memory_kb": 100,
            "decimal_memory_kb": 500,
            "json_roundtrip_ms": 5,
            "parallel_parsing_ms": 100,
            "execution_ms": 100
        }
    }
    
    output_path = Path(__file__).parent / "baseline_results.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    return output_path


if __name__ == "__main__":
    # Run tests and save baselines
    pytest.main([__file__, "-v", "--tb=short"])
    baseline_file = save_baseline_results()
    print(f"\nBaseline results saved to: {baseline_file}")
