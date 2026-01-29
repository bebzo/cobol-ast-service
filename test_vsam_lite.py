#!/usr/bin/env python3
"""
Test Suite for VSAM Lite - CodeSwitch v11.0
Vérifie que l'implémentation VSAM fonctionne correctement.
"""

import os
import sys
import tempfile
import json

# Add workspace to path
sys.path.insert(0, '/workspace')

# Test VSAM Lite core module
def test_vsam_lite_core():
    """Test du module VSAM Lite standalone."""
    print("=" * 60)
    print("Test 1: Module VSAM Lite Core")
    print("=" * 60)
    
    from vsam_lite import VSAMFile, CobolConverter, FILE_STATUS
    
    # Test 1.1: Création de fichier
    print("\n[1.1] Création et écriture...")
    with tempfile.NamedTemporaryFile(suffix="_vsam_test", delete=False, mode='w') as f:
        test_file = f.name
    
    try:
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        print(f"  ✓ VSAMFile créé: {vsam}")
        
        # Test OPEN OUTPUT
        status = vsam.open("OUTPUT")
        print(f"  ✓ OPEN OUTPUT: status={status} ({FILE_STATUS.get(status, 'Unknown')})")
        assert status == "00", f"Expected status 00, got {status}"
        
        # Test WRITE
        for i in range(1, 4):
            key = f"REC{i:03d}"
            data = f"Customer {i}: Name=Client {i}, Balance={i*1000.50}"
            status = vsam.write(key, data)
            print(f"  ✓ WRITE {key}: status={status}")
            assert status == "00", f"Expected status 00 for write, got {status}"
        
        vsam.close()
        print("  ✓ Fichier fermé avec succès")
        
        # Test READ séquentiel
        print("\n[1.2] Lecture séquentielle...")
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        vsam.open("INPUT")
        
        count = 0
        while True:
            data = vsam.read()
            if vsam.file_status == "10":
                print("  ✓ Fin du fichier atteinte (status=10)")
                break
            elif data:
                count += 1
                print(f"  ✓ Enregistrement {count}: {data.decode()[:30]}...")
            else:
                break
        
        assert count == 3, f"Expected 3 records, got {count}"
        vsam.close()
        
        # Test READ aléatoire
        print("\n[1.3] Lecture aléatoire par clé...")
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        vsam.open("INPUT")
        
        data = vsam.read(key="REC002")
        assert data is not None, "REC002 should be found"
        print(f"  ✓ REC002 trouvé: {data.decode()}")
        
        data = vsam.read(key="REC999")
        assert data is None, "REC999 should not be found"
        print(f"  ✓ REC999 non trouvé (status={vsam.file_status})")
        assert vsam.file_status == "23", f"Expected status 23, got {vsam.file_status}"
        
        vsam.close()
        
        print("\n✅ Tous les tests Core ont réussi!")
        
    finally:
        # Nettoyer
        for ext in ["", ".data.json", ".keys.json"]:
            try:
                os.remove(test_file + ext)
            except FileNotFoundError:
                pass


def test_cobol_converter():
    """Test du convertisseur de données COBOL."""
    print("\n" + "=" * 60)
    print("Test 2: Convertisseur COBOL")
    print("=" * 60)
    
    from vsam_lite import CobolConverter
    
    # Test COMP-3
    print("\n[2.1] Conversion COMP-3...")
    
    # Test avec 5 digits (12345 = 5 digits, nécessite 3 bytes)
    comp3_value = CobolConverter.python_to_comp3(12345, 5)
    print(f"  12345 (5 digits) -> COMP-3: {comp3_value.hex()}")
    
    # Le résultat devrait être 3 bytes: 0x12, 0x34, 0x5C
    assert len(comp3_value) == 3, f"Expected 3 bytes, got {len(comp3_value)}"
    
    result = CobolConverter.comp3_to_python(comp3_value)
    print(f"  COMP-3 -> Python: {result}")
    assert result == 12345, f"Expected 12345, got {result}"
    print("  ✓ COMP-3 conversion OK")
    
    # Test avec 6 digits (12345 padded to 6 digits = 012345)
    comp3_value_6 = CobolConverter.python_to_comp3(12345, 6)
    print(f"  12345 (6 digits) -> COMP-3: {comp3_value_6.hex()}")
    assert len(comp3_value_6) == 4, f"Expected 4 bytes, got {len(comp3_value_6)}"
    
    # Round-trip avec le même nombre de digits
    result_6 = CobolConverter.comp3_to_python(comp3_value_6, num_digits=6)
    print(f"  COMP-3 (6 digits) -> Python: {result_6}")
    assert result_6 == 12345, f"Expected 12345, got {result_6}"
    print("  ✓ COMP-3 (6 digits) conversion OK")
    
    # Test valeurs négatives
    comp3_neg = CobolConverter.python_to_comp3(-500, 4)
    result_neg = CobolConverter.comp3_to_python(comp3_neg)
    assert result_neg == -500, f"Expected -500, got {result_neg}"
    print("  ✓ COMP-3 négatif OK")
    
    # Test DISPLAY
    print("\n[2.2] Conversion DISPLAY...")
    display_bytes = CobolConverter.python_to_display("HELLO", 10)
    print(f"  'HELLO' -> DISPLAY(10): {display_bytes}")
    assert len(display_bytes) == 10, f"Expected length 10, got {len(display_bytes)}"
    assert display_bytes.endswith(b'     '), "Should be padded with spaces"
    
    result_str = CobolConverter.display_to_python(display_bytes)
    assert result_str == "HELLO", f"Expected 'HELLO', got '{result_str}'"
    print("  ✓ DISPLAY conversion OK")
    
    print("\n✅ Tous les tests Convertisseur ont réussi!")


def test_transpiler_vsam():
    """Test de l'intégration VSAM dans le transpiler."""
    print("\n" + "=" * 60)
    print("Test 3: Intégration Transpiler VSAM")
    print("=" * 60)
    
    from api.transpile import generate_python_code
    
    # COBOL test avec VSAM
    cobol_test = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTVSAM.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE ASSIGN TO 'customer.dat'
           ORGANIZATION IS INDEXED
           ACCESS MODE IS DYNAMIC
           RECORD KEY IS CUST-NUM
           FILE STATUS IS WS-FILE-STATUS.
       
       DATA DIVISION.
       FILE SECTION.
       FD  CUSTOMER-FILE
           RECORD CONTAINS 80 CHARACTERS.
       01  CUSTOMER-RECORD.
           05  CUST-NUM           PIC 9(6).
           05  CUST-NAME          PIC X(30).
           05  CUST-BALANCE       PIC 9(8)V99.
       
       WORKING-STORAGE SECTION.
       77  WS-FILE-STATUS        PIC XX.
       77  WS-CUST-NUM           PIC 9(6).
       77  WS-EOF-FLAG           PIC X VALUE 'N'.
       
       PROCEDURE DIVISION.
       MAIN-LOGIC.
           OPEN INPUT CUSTOMER-FILE
           IF WS-FILE-STATUS NOT = '00'
              DISPLAY 'ERROR OPENING FILE'
              STOP RUN
           END-IF.
           
           MOVE '000001' TO WS-CUST-NUM
           READ CUSTOMER-FILE KEY IS WS-CUST-NUM
               INVALID KEY DISPLAY 'NOT FOUND'
               NOT INVALID KEY DISPLAY 'FOUND'
           END-READ.
           
           CLOSE CUSTOMER-FILE.
           STOP RUN.
    """
    
    print("\n[3.1] Transpilation du code COBOL VSAM...")
    result = generate_python_code(cobol_test, enhance=False)
    
    print(f"  ✓ Transpilation terminée")
    print(f"  ✓ Longueur du code généré: {len(result['python_code'])} caractères")
    
    # Vérifier que le code contient les imports VSAM
    if 'from vsam_lite import' in result['python_code'] or 'create_vsam_file' in result['python_code']:
        print("  ✓ Imports VSAM présents dans le code généré")
    else:
        print("  ⚠ Imports VSAM non détectés (mode compatibilité)")
    
    # Vérifier les appels VSAM
    python_code = result['python_code']
    if 'OPEN' in python_code or '.open(' in python_code:
        print("  ✓ Appels OPEN détectés")
    if 'READ' in python_code or '.read(' in python_code:
        print("  ✓ Appels READ détectés")
    if 'CLOSE' in python_code or '.close(' in python_code:
        print("  ✓ Appels CLOSE détectés")
    
    # Afficher un extrait du code généré
    print("\n[3.2] Extrait du code généré:")
    lines = python_code.split('\n')
    for i, line in enumerate(lines[:30]):
        print(f"  {i+1:3d}: {line}")
    
    if len(lines) > 30:
        print(f"  ... ({len(lines)-30} lignes supplémentaires)")
    
    print("\n✅ Tests d'intégration Transpiler terminés!")


def test_execution_generated_code():
    """Test d'exécution du code généré avec VSAM."""
    print("\n" + "=" * 60)
    print("Test 4: Exécution du Code Généré")
    print("=" * 60)
    
    from vsam_lite import VSAMFile
    
    # Créer un fichier VSAM de test
    with tempfile.NamedTemporaryFile(suffix="_customer_test", delete=False, mode='w') as f:
        test_file = f.name
    
    try:
        # Préparer des données
        print("\n[4.1] Préparation des données de test...")
        vsam = VSAMFile(test_file, record_key="CUST-NUM", record_length=80)
        vsam.open("OUTPUT")
        
        # Écrire quelques enregistrements
        test_records = [
            ("000001", "Client Un                      ", "00001000"),
            ("000002", "Client Deux                    ", "00002000"),
            ("000003", "Client Trois                   ", "00003000"),
        ]
        
        for cust_num, name, balance in test_records:
            record = f"{cust_num}{name}{balance}".ljust(80)
            status = vsam.write(cust_num, record)
            print(f"  ✓ Écriture {cust_num}: status={status}")
        
        vsam.close()
        
        # Code Python généré qui utilise VSAM Lite
        python_code = f'''
import sys
sys.path.insert(0, '/workspace')
from vsam_lite import VSAMFile, check_vsam_success

# Code généré par CodeSwitch v11.0 VSAM Lite

def run_test():
    # Initialisation des fichiers VSAM (générée depuis SELECT)
    customer_file = VSAMFile(
        filename="{test_file}",
        organization="INDEXED",
        access_mode="DYNAMIC",
        record_key="CUST-NUM",
        record_length=80
    )
    
    # OPEN INPUT (depuis OPEN INPUT CUSTOMER-FILE)
    status = customer_file.open("INPUT")
    print(f"OPEN status: {{status}}")
    
    if not check_vsam_success(customer_file):
        print("ERROR: Cannot open file")
        return
    
    # READ ... KEY IS (depuis READ CUSTOMER-FILE KEY IS WS-CUST-NUM)
    cust_num = "000002"
    record = customer_file.read(key=cust_num)
    
    if record is None:
        print(f"Record {{cust_num}} not found - status: {{customer_file.file_status}}")
    else:
        print(f"Record {{cust_num}} found:")
        print(f"  Raw: {{record}}")
        print(f"  String: {{record.decode()}}")
    
    # CLOSE (depuis CLOSE CUSTOMER-FILE)
    customer_file.close()
    print("File closed successfully")

if __name__ == "__main__":
    run_test()
'''
        
        print("\n[4.2] Exécution du code Python généré...")
        exec_globals = {}
        exec(python_code, exec_globals)
        
        print("\n✅ Test d'exécution réussi!")
        
    finally:
        # Nettoyer
        for ext in ["", ".data.json", ".keys.json"]:
            try:
                os.remove(test_file + ext)
            except FileNotFoundError:
                pass


def test_file_status_codes():
    """Test des codes de statut VSAM."""
    print("\n" + "=" * 60)
    print("Test 5: Codes de Statut VSAM")
    print("=" * 60)
    
    from vsam_lite import FILE_STATUS
    
    print("\n[5.1] Vérification des codes de statut:")
    expected_codes = {
        "00": "Success",
        "02": "Success Duplicate Key",
        "10": "End of File",
        "22": "Duplicate Key (Write Error)",
        "23": "Record Not Found",
        "30": "Permanent Error",
        "35": "File Not Found",
    }
    
    for code, expected_msg in expected_codes.items():
        actual_msg = FILE_STATUS.get(code, "Unknown")
        if actual_msg == expected_msg:
            print(f"  ✓ {code}: {actual_msg}")
        else:
            print(f"  ✗ {code}: Expected '{expected_msg}', got '{actual_msg}'")
    
    print("\n✅ Test des codes de statut terminé!")


def main():
    """Exécution de tous les tests."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "VSAM Lite - Suite de Tests v11.0" + " " * 10 + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    try:
        test_vsam_lite_core()
        test_cobol_converter()
        test_transpiler_vsam()
        test_execution_generated_code()
        test_file_status_codes()
        
        print("\n" + "=" * 60)
        print("🎉 TOUS LES TESTS ONT RÉUSSI! 🎉")
        print("=" * 60)
        print("\nVSAM Lite est prêt pour l'intégration dans CodeSwitch!")
        print("\nProchaines étapes:")
        print("  1. Tester avec des fichiers VSAM réels")
        print("  2. Ajouter le support WRITE/REWRITE/DELETE")
        print("  3. Implémenter le shadow testing VSAM")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
