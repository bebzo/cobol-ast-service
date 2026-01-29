#!/usr/bin/env python3
"""
Script de Démonstration du Système de QA
=========================================

Ce script démontre les capacités du système de garantie qualité
en analysant les fichiers problématiques et en identifiant les
patterns de corruption dans le transpileur.

Auteur: MiniMax Agent
Date: 2026-01-29
"""

import sys
import json
from pathlib import Path
from transpiler_quality_assurance import (
    TranspilerQualityAssurance, 
    IssueType, 
    SeverityLevel
)


def print_section(title: str) -> None:
    """Affiche un titre de section."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def demo_audit_problematic_file():
    """Démonstration: Audit d'un fichier problématique."""
    print_section("DÉMONSTRATION 1: Audit du Fichier Problématique")
    
    # Chemin vers le fichier problématique
    problematic_file = "user_input_files/pasted-text-2026-01-29T15-12-03.txt"
    
    if not Path(problematic_file).exists():
        print(f"Fichier non trouvé: {problematic_file}")
        return
    
    qa = TranspilerQualityAssurance()
    
    # Effectuer l'audit
    print(f"Audit du fichier: {problematic_file}")
    report = qa.audit_file(problematic_file)
    
    # Afficher les résultats
    print(f"\nRÉSULTATS DE L'AUDIT:")
    print(f"   - Lignes totales: {report.total_lines}")
    print(f"   - Problèmes détectés: {report.issues_found}")
    print(f"   - Syntaxe valide: {'Oui' if report.syntax_valid else 'Non'}")
    
    # Répartition par sévérité
    print(f"\nDistribution par sévérité:")
    for severity, count in sorted(report.issues_by_severity.items()):
        icon = "CRITICAL" if severity == "CRITICAL" else "ERROR" if severity == "ERROR" else "WARNING" if severity == "WARNING" else "INFO"
        print(f"   - {icon}: {count}")
    
    # Répartition par type
    print(f"\nDistribution par type:")
    for issue_type, count in sorted(report.issues_by_type.items()):
        print(f"   - {issue_type}: {count}")
    
    # Afficher les problèmes critiques
    critical_issues = [i for i in report.issues if i['severity'] == 'CRITICAL' or i['severity'] == 'ERROR']
    
    if critical_issues:
        print(f"\nPROBLÈMES CRITIQUES ({len(critical_issues)}):")
        for issue in critical_issues[:10]:  # Afficher les 10 premiers
            print(f"\n   [{issue['issue_type']}] Ligne {issue['line_number']}")
            print(f"   Message: {issue['message']}")
            if issue['code_snippet']:
                print(f"   Code: {issue['code_snippet'][:60]}...")
            if issue['suggestion']:
                print(f"   Suggestion: {issue['suggestion']}")
        
        if len(critical_issues) > 10:
            print(f"\n   ... et {len(critical_issues) - 10} autres problèmes")


def demo_auto_fix():
    """Démonstration: Correction automatique."""
    print_section("DÉMONSTRATION 2: Correction Automatique")
    
    # Créer un fichier de test avec des erreurs connues
    test_code = '''class TestClass:
    ):
        pass
'''
    
    test_file = "test_auto_fix.py"
    
    with open(test_file, 'w') as f:
        f.write(test_code)
    
    print(f"Fichier de test créé: {test_file}")
    print(f"\nCode original:")
    print(test_code)
    
    # Appliquer les corrections automatiques
    qa = TranspilerQualityAssurance()
    report, fixes = qa.audit_and_fix(test_file, auto_fix=True)
    
    print(f"\nCorrections appliquées ({len(fixes)}):")
    for fix in fixes:
        print(f"   - {fix}")
    
    # Afficher le code corrigé
    with open(test_file, 'r') as f:
        corrected_code = f.read()
    
    print(f"\nCode corrigé:")
    print(corrected_code)
    
    # Nettoyer
    Path(test_file).unlink()


def demo_corruption_analysis():
    """Démonstration: Analyse des patterns de corruption."""
    print_section("DÉMONSTRATION 3: Analyse des Patterns de Corruption")
    
    qa = TranspilerQualityAssurance()
    
    # Obtenir les patterns de corruption
    patterns = qa.logger.analyze_corruption_patterns()
    
    if patterns:
        print(f"\nPatterns de corruption détectés: {len(patterns)}")
        
        for pattern in patterns:
            print(f"\nType: {pattern['error_type']}")
            print(f"   Occurrences: {pattern['occurrences']}")
            print(f"   Sévérité: {pattern['severity']}")
            print(f"   Étapes affectées: {', '.join(pattern['stages_affected'])}")
    else:
        print("\nAucun pattern de corruption historique trouvé.")
        print("   (Exécutez d'abord des audits pour collecter des données)")


def demo_test_framework():
    """Démonstration: Framework de tests."""
    print_section("DÉMONSTRATION 4: Framework de Tests du Transpileur")
    
    qa = TranspilerQualityAssurance()
    
    # Ajouter des cas de test représentatifs
    test_cases = [
        {
            'name': 'F-string multiligne',
            'cobol_code': "f'Hello\\nWorld'",
            'expected_python': 'f"""Hello\\nWorld"""',
            'transformation_type': 'FSTRING_MULTILINE'
        },
        {
            'name': 'Méthode sans def',
            'cobol_code': "    my_method():\n        pass",
            'expected_python': "    def my_method():\n        pass",
            'transformation_type': 'METHOD_DEFINITION'
        },
        {
            'name': 'Crochet fermant orphelin',
            'cobol_code': "]\n",
            'expected_python': "",
            'transformation_type': 'ORPHANED_BRACKET'
        }
    ]
    
    for tc in test_cases:
        qa.tests.add_test_case(
            name=tc['name'],
            cobol_code=tc['cobol_code'],
            expected_python=tc['expected_python'],
            transformation_type=tc['transformation_type']
        )
    
    print(f"\nCas de test ajoutés: {len(test_cases)}")
    
    # Exécuter les tests
    results = qa.tests.run_tests()
    
    print(f"\nRésultats des tests:")
    print(f"   Total: {results['total_tests']}")
    print(f"   Réussis: {results['passed']}")
    print(f"   Échoués: {results['failed']}")
    print(f"   Taux de réussite: {results['pass_rate']}")
    
    if results['results']:
        print(f"\nDétails:")
        for result in results['results']:
            status = "OK" if result['status'] == 'PASS' else "FAIL"
            print(f"   [{status}] {result['name']}: {result['status']}")
            if result.get('error'):
                print(f"      Erreur: {result['error']}")


def demo_full_quality_check():
    """Démonstration: Vérification complète."""
    print_section("DÉMONSTRATION 5: Vérification Complète de Qualité")
    
    # Vérifier le fichier problématique
    problematic_file = "user_input_files/pasted-text-2026-01-29T15-12-03.txt"
    
    if not Path(problematic_file).exists():
        print(f"Fichier non trouvé: {problematic_file}")
        return
    
    qa = TranspilerQualityAssurance()
    
    print(f"\nVérification complète de: {problematic_file}")
    
    # Effectuer la vérification complète
    results = qa.run_full_quality_check(python_file=problematic_file)
    
    print(f"\nRÉSULTATS:")
    print(f"   Statut global: {results['overall_status']}")
    
    if results.get('audit_report'):
        audit = results['audit_report']
        print(f"   Problèmes détectés: {audit['issues_found']}")
        print(f"   Syntaxe valide: {audit['syntax_valid']}")
    
    if results.get('test_results'):
        tests = results['test_results']
        print(f"   Tests réussis: {tests['passed']}/{tests['total_tests']}")
    
    # Sauvegarder le rapport complet
    report_file = "full_quality_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\nRapport sauvegardé: {report_file}")


def show_usage_instructions():
    """Affiche les instructions d'utilisation."""
    print_section("INSTRUCTIONS D'UTILISATION")
    
    print("""
UTILISATION DU SYSTÈME DE QA:

1. AUDIT SIMPLE:
   python demo_qa_system.py --audit <fichier_python>

2. AUDIT AVEC CORRECTION AUTOMATIQUE:
   from transpiler_quality_assurance import TranspilerQualityAssurance
   
   qa = TranspilerQualityAssurance()
   report, fixes = qa.audit_and_fix('fichier.py', auto_fix=True)

3. VÉRIFICATION COMPLÈTE:
   qa = TranspilerQualityAssurance()
   results = qa.run_full_quality_check(python_file='fichier.py')

4. CRÉATION DE TESTS:
   from transpiler_quality_assurance import TranspilerTestFramework
   
   tests = TranspilerTestFramework()
   tests.add_test_case('nom', cobol_code, expected_python, 'TYPE')
   results = tests.run_tests()

5. ANALYSE DES PATRONS DE CORRUPTION:
   qa = TranspilerQualityAssurance()
   patterns = qa.logger.analyze_corruption_patterns()

FICHIERS GÉNÉRÉS:
   - transpiler_qa.log: Log des opérations
   - transpiler_logs/transformations.log: Log des transformations
   - transpiler_logs/errors.log: Log des erreurs
   - audit_*.json: Rapports d'audit
   - full_quality_report.json: Rapport complet

TYPES DE PROBLÈMES DÉTECTÉS:
   - SYNTAX_ERROR: Erreur de syntaxe Python
   - UNTERMINATED_STRING: Chaîne non fermée
   - INDENTATION_ERROR: Problème d'indentation
   - INVALID_SYNTAX: Syntaxe invalide
   - CORRUPTED_LINE: Ligne corrompue
   - MALFORMED_DOCSTRING: Docstring malformée
   - ORPHANED_BRACKET: Crochet fermant orphelin
   - MIXED_TABS_SPACES: Mélange tabs/espaces
""")


def main():
    """Point d'entrée principal."""
    print_section("SYSTÈME DE GARANTIE QUALITÉ - TRANSPYLEUR COBOL → PYTHON")
    
    # Analyser les arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == '--demo':
            # Mode démonstration
            demo_audit_problematic_file()
            demo_auto_fix()
            demo_corruption_analysis()
            demo_test_framework()
            demo_full_quality_check()
            show_usage_instructions()
        
        elif command == '--audit':
            # Audit simple
            if len(sys.argv) > 2:
                file_path = sys.argv[2]
                qa = TranspilerQualityAssurance()
                report = qa.audit_file(file_path)
                report.to_json(f"audit_{Path(file_path).stem}.json")
                print(f"Audit terminé. Rapport: audit_{Path(file_path).stem}.json")
            else:
                print("Usage: python demo_qa_system.py --audit <fichier>")
        
        elif command == '--fix':
            # Audit avec correction
            if len(sys.argv) > 2:
                file_path = sys.argv[2]
                qa = TranspilerQualityAssurance()
                report, fixes = qa.audit_and_fix(file_path, auto_fix=True)
                print(f"Corrections appliquées: {len(fixes)}")
                for fix in fixes:
                    print(f"  - {fix}")
            else:
                print("Usage: python demo_qa_system.py --fix <fichier>")
        
        else:
            print(f"Commande inconnue: {command}")
            print("Options: --demo, --audit <fichier>, --fix <fichier>")
    
    else:
        # Mode interactif par défaut
        print("\nAnalyse du fichier problématique...")
        
        problematic_file = "user_input_files/pasted-text-2026-01-29T15-12-03.txt"
        
        if Path(problematic_file).exists():
            demo_audit_problematic_file()
            show_usage_instructions()
        else:
            print(f"Fichier non trouvé: {problematic_file}")
            print("\nOptions disponibles:")
            print("  --demo    : Exécuter toutes les démonstrations")
            print("  --audit <fichier> : Auditer un fichier spécifique")
            print("  --fix <fichier>   : Auditer et corriger un fichier")


if __name__ == '__main__':
    main()
