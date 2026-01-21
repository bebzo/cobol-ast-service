#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test du Générateur de Tests Déterministe (v9.0)
Valide que le générateur produit du code Python valide et professionnel.
"""

import sys
import os

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.transpile import generate_deterministic_tests

# Code Python de test (simule du code COBOL transpilé)
TEST_PYTHON_CODE = '''
from decimal import Decimal
from typing import Optional

class AccountProcessor:
    """Processeur de comptes bancaires transpilé depuis COBOL."""
    
    def __init__(self):
        self.balance: Decimal = Decimal("0")
        self.status: str = "A"
    
    @property
    def is_active(self) -> bool:
        """88-level condition: STATUS = 'A'"""
        return self.status == "A"
    
    @property
    def is_overdrawn(self) -> bool:
        """88-level condition: BALANCE < 0"""
        return self.balance < Decimal("0")
    
    def calculate_interest(self, amount: Decimal, rate: Decimal) -> Decimal:
        """Calculer l'intérêt avec arrondi banker."""
        if amount <= Decimal("0"):
            return Decimal("0")
        return (amount * rate).quantize(Decimal("0.01"), rounding="ROUND_HALF_EVEN")
    
    def process_deposit(self, amount: Decimal) -> bool:
        """Traiter un dépôt."""
        if amount <= Decimal("0"):
            raise ValueError("Le montant doit être positif")
        self.balance += amount
        return True
    
    def get_status_code(self, code: str) -> str:
        """Récupérer le code statut."""
        return f"STATUS_{code}"
'''

def test_deterministic_generator():
    """Tester le générateur de tests déterministe."""
    print("=" * 70)
    print("TEST: Générateur de Tests Déterministe (v9.0)")
    print("=" * 70)
    print()
    
    # Générer les tests
    print("1. Génération des tests...")
    test_code = generate_deterministic_tests(TEST_PYTHON_CODE, "AccountProcessor")
    print(f"   ✓ Tests générés ({len(test_code)} caractères)")
    print()
    
    # Vérifier la structure du code généré
    print("2. Vérification de la structure...")
    checks = [
        ("Imports pytest", "import pytest" in test_code),
        ("Imports Decimal", "from decimal import Decimal" in test_code),
        ("Fixture pytest", "@pytest.fixture" in test_code),
        ("Tests d'initialisation", "TestAccountProcessorInitialization" in test_code),
        ("Tests de fonctions", "TestCalculateInterest" in test_code or "Test" in test_code and "process" in test_code),
        ("Tests de propriétés", "TestIsActive" in test_code or "Properties" in test_code),
        ("Tests de cas limites", "TestBoundaryValues" in test_code),
        ("Tests de propriétés mathématiques", "TestMathematicalProperties" in test_code),
        ("Tests d'équivalence COBOL", "TestCobolEquivalence" in test_code),
        ("Échappement avec repr()", "repr(" in test_code),
        ("Classe de test", "class Test" in test_code),
    ]
    
    all_passed = True
    for check_name, result in checks:
        status = "✓" if result else "✗"
        print(f"   {status} {check_name}")
        if not result:
            all_passed = False
    
    print()
    
    # Compiler le code généré pour vérifier la syntaxe
    print("3. Vérification syntaxique (compilation)...")
    try:
        compile(test_code, '<generated>', 'exec')
        print("   ✓ Code syntaxiquement valide")
    except SyntaxError as e:
        print(f"   ✗ Erreur de syntaxe: {e}")
        all_passed = False
    
    print()
    
    # Compter le nombre de tests
    test_count = test_code.count("def test_")
    print(f"4. Nombre de tests générés: {test_count}")
    print()
    
    # Afficher un extrait du code généré
    print("5. Extrait du code généré:")
    print("-" * 70)
    lines = test_code.split('\n')
    for i, line in enumerate(lines[:50]):  # Afficher les 50 premières lignes
        print(f"{i+1:3}: {line}")
    print("   ...")
    print("-" * 70)
    print()
    
    # Résultat final
    print("=" * 70)
    if all_passed and test_count >= 15:
        print("RÉSULTAT: ✓ TOUS LES TESTS PASSENT")
        print(f"         Le générateur produit {test_count} tests professionnels.")
        print("         Prêt pour le déploiement!")
    else:
        print("RÉSULTAT: ✗ CERTAINS TESTS ONT ÉCHOUÉ")
        print("         Le générateur nécessite des corrections.")
    print("=" * 70)
    
    return all_passed and test_count >= 15

if __name__ == "__main__":
    success = test_deterministic_generator()
    sys.exit(0 if success else 1)
