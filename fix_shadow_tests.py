#!/usr/bin/env python3
"""
Script de connexion à Supabase pour accéder aux templates de tests d'ombre
et corriger les problèmes identifiés :

1. Erreur "unterminated string literal" à la ligne 2162
2. Erreurs "Function signature mismatch" pour localcontext, get_cobol_context, safe_compute
"""
import os
from supabase import create_client, Client

# Configuration Supabase
SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2OTkyOCwiZXhwIjoyMDgyMTQ1OTI4fQ.HZykwqxvcQuwYqbWudpi7LUceko44YqSirRvzYs85TU'

def connect_to_supabase():
    """Établit la connexion avec Supabase."""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connexion à Supabase établie avec succès")
        return client
    except Exception as e:
        print(f"❌ Erreur de connexion à Supabase: {e}")
        return None

def list_tables(client: Client):
    """Liste toutes les tables disponibles dans Supabase."""
    try:
        # Récupérer la liste des tables via l'API de Supabase
        result = client.table('information_schema.tables').select('table_name').execute()
        print("\n📋 Tables disponibles:")
        for row in result.data:
            print(f"  - {row['table_name']}")
    except Exception as e:
        print(f"⚠️ Impossible de lister les tables: {e}")

def search_test_templates(client: Client):
    """Recherche les templates de tests dans la base de données."""
    # Tables potentielles pour les templates de tests
    template_tables = [
        'test_templates',
        'shadow_test_templates', 
        'pytest_templates',
        'testing_templates',
        'templates',
        'analysis_templates'
    ]
    
    for table_name in template_tables:
        try:
            result = client.table(table_name).select('*').limit(10).execute()
            if result.data:
                print(f"\n📄 Table '{table_name}' trouvée avec {len(result.data)} entrées:")
                for i, row in enumerate(result.data):
                    print(f"  [{i+1}] {row}")
                return table_name
        except Exception:
            continue
    
    print("\n⚠️ Aucune table de templates de tests n'a été trouvée")
    return None

def search_for_functions(client: Client):
    """Recherche les fonctions liées aux tests dans la base de données."""
    # Rechercher dans les tables de configuration ou de fonctions
    potential_tables = [
        'functions',
        'sql_functions', 
        'test_functions',
        'runtime_functions',
        'cobol_functions',
        'config'
    ]
    
    for table_name in potential_tables:
        try:
            result = client.table(table_name).select('*').limit(20).execute()
            if result.data:
                print(f"\n⚙️ Table '{table_name}' trouvée:")
                for i, row in enumerate(result.data[:5]):  # Afficher seulement les 5 premiers
                    print(f"  [{i+1}] {row}")
                return table_name
        except Exception:
            continue
    
    print("\n⚠️ Aucune table de fonctions n'a été trouvée")
    return None

def analyze_test_generation_logic():
    """
    Analyse la logique de génération de tests et identifie les problèmes.
    
    Problèmes identifiés :
    1. "unterminated string literal (line 2162)" - Vrai positif
       → Causé par un template avec une chaîne non fermée
    
    2. "Function signature mismatch" pour localcontext, get_cobol_context, safe_compute
       → Faux positifs - le générateur applique des tests génériques à des 
         fonctions avec des signatures spécifiques
    """
    print("\n🔍 ANALYSE DES PROBLÈMES DE GÉNÉRATION DE TESTS")
    print("=" * 60)
    
    problems = [
        {
            "id": "P001",
            "type": "Syntax Error",
            "description": "unterminated string literal (detected at line 2162)",
            "cause": "Template de test avec chaîne de caractères non fermée",
            "solution": "Échapper les caractères spéciaux ou utiliser des triples quotes"
        },
        {
            "id": "P002", 
            "type": "False Positive",
            "description": "Function signature mismatch: localcontext",
            "cause": "Test générique appliquée à un context manager Python",
            "solution": "Créer des tests spécifiques pour les context managers"
        },
        {
            "id": "P003",
            "type": "False Positive",
            "description": "Function signature mismatch: get_cobol_context",
            "cause": "Test avec arguments alors que la fonction n'en accepte pas",
            "solution": "Détecter automatiquement les signatures de fonctions"
        },
        {
            "id": "P004",
            "type": "False Positive", 
            "description": "Function signature mismatch: safe_compute",
            "cause": "Test avec arguments incorrects",
            "solution": "Analyser la signature réelle de la fonction"
        }
    ]
    
    for problem in problems:
        print(f"\n📌 {problem['id']}: {problem['type']}")
        print(f"   Description: {problem['description']}")
        print(f"   Cause: {problem['cause']}")
        print(f"   Solution: {problem['solution']}")
    
    return problems

def generate_fixed_test_template():
    """
    Génère un template de test corrigé pour les fonctions problématiques.
    
    Le template corrigé doit:
    1. Utiliser des chaînes multi-lignes avec proper escaping
    2. Détecter automatiquement les signatures de fonctions
    3. Générer des tests adaptés au type de fonction (context manager, etc.)
    """
    print("\n📝 GÉNÉRATION DU TEMPLATE CORRIGÉ")
    print("=" * 60)
    
    fixed_template = '''
# Template de test corrigé pour CodeSwitch v8.5
# Résout les problèmes de génération de tests

import pytest
from decimal import localcontext
from your_module import get_cobol_context, safe_compute

class TestLocalcontextFixed:
    """Tests corrigés pour localcontext (context manager)."""
    
    def test_is_context_manager(self):
        """Vérifie que localcontext est un context manager valide."""
        from decimal import localcontext
        try:
            with localcontext() as ctx:
                assert ctx is not None
        except Exception as e:
            pytest.fail(f"localcontext failed as context manager: {e}")
    
    def test_does_not_accept_args(self):
        """Vérifie que localcontext() sans argument fonctionne."""
        from decimal import localcontext
        # localcontext ne doit pas accepter d'arguments positionnels
        with pytest.raises(TypeError):
            localcontext(123)

class TestGetCobolContextFixed:
    """Tests corrigés pour get_cobol_context (fonction sans argument)."""
    
    def test_no_arguments_required(self):
        """Vérifie que la fonction ne nécessite aucun argument."""
        from your_module import get_cobol_context
        try:
            # La fonction doit être appelée sans argument
            result = get_cobol_context()
            assert result is not None
        except TypeError as e:
            if "argument" in str(e).lower():
                pytest.fail(f"Fonction appelée avec arguments incorrects: {e}")
            raise

class TestSafeComputeFixed:
    """Tests corrigés pour safe_compute."""
    
    def test_with_decimal_inputs(self):
        """Test avec des entrées Decimal."""
        from decimal import Decimal
        from your_module import safe_compute
        
        result = safe_compute(Decimal('100'), Decimal('0.05'))
        assert result is not None
    
    def test_with_numeric_inputs(self):
        """Test avec des entrées numériques standard."""
        from your_module import safe_compute
        
        result = safe_compute(100, 0.05)
        assert result is not None

# Template de string escaping corrigé
def generate_test_code(function_name: str, body: str) -> str:
    """
    Génère du code de test avec proper string escaping.
    
    CORRECTION: Utilise triple quotes et escape les caractères spéciaux
    """
    # Ancien code (problématique):
    # test_body = f"def test_{function_name}():\\n    {body}"
    
    # Nouveau code (corrigé):
    escaped_body = body.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"')
    test_body = f\'\'\'def test_{function_name}():
    """Auto-généré pour {function_name}."""
    {escaped_body}
\'\'\'
    return test_body
'''
    
    print(fixed_template)
    return fixed_template

def main():
    """Point d'entrée principal du script."""
    print("🔧 CodeShadow Test Fixer - Connexion Supabase")
    print("=" * 60)
    
    # Connexion à Supabase
    client = connect_to_supabase()
    if not client:
        print("❌ Impossible de continuer sans connexion Supabase")
        return
    
    # Liste des tables
    list_tables(client)
    
    # Recherche des templates de tests
    template_table = search_test_templates(client)
    
    # Recherche des fonctions
    func_table = search_for_functions(client)
    
    # Analyse des problèmes
    problems = analyze_test_generation_logic()
    
    # Génération du template corrigé
    generate_fixed_test_template()
    
    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ DES CORRECTIONS NÉCESSAIRES")
    print("=" * 60)
    print("""
Pour corriger les problèmes de shadow testing:

1. ERREUR "unterminated string literal" (ligne 2162):
   - Localiser le template de génération de tests dans Supabase
   - Ajouter un échappement proper pour les caractères spéciaux
   - Utiliser des triples quotes pour les chaînes multi-lignes

2. ERREURS "Function signature mismatch":
   - Modifier le générateur pour détecter automatiquement les signatures
   - Pour localcontext: tester comme context manager, pas comme fonction
   - Pour get_cobol_context: appeler sans argument
   - Pour safe_compute: analyser la signature réelle avant de générer

3. GÉNÉRATION DE TESTS AMÉLIORÉE:
   - Utiliser l'inspection Python (inspect.signature) pour détecter les types
   - Générer des tests adaptés (context manager, fonctions simples, etc.)
   - Valider la syntaxe Python avant la génération finale
""")

if __name__ == '__main__':
    main()
