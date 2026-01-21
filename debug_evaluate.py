#!/usr/bin/env python3
"""
Débogage de l'analyse EVALUATE TRUE
"""

import re
from api.transpile import transpile_statements_v4

# Simuler l'analyse d'EVALUATE TRUE
statements = [
    "           EVALUATE TRUE",
    "               WHEN TRANS-DEPOSIT",
    "                   PERFORM PROCESS-DEPOSIT",
    "               WHEN TRANS-WITHDRAWAL",
    "                   PERFORM PROCESS-WITHDRAWAL",
    "           END-EVALUATE",
]

# Reproduire la logique de transpile_evaluate_v4
for i, stmt in enumerate(statements):
    stmt_stripped = stmt.strip()
    upper = stmt_stripped.upper()
    
    print(f"Statement {i}: '{stmt_stripped}'")
    
    match = re.match(r'EVALUATE\s+(.+)', upper)
    if match:
        subject = match.group(1).strip()
        print(f"  -> EVALUATE subject: '{subject}'")
        print(f"  -> is_true_eval: {subject == 'TRUE'}")
    
    when_match = re.match(r'WHEN\s+(.+)', upper)
    if when_match:
        condition = when_match.group(1).strip()
        print(f"  -> WHEN condition: '{condition}'")
