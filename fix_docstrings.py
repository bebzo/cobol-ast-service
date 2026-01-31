#!/usr/bin/env python3
"""
Correcteur de Docstrings - Corrige les docstrings non fermées dans le code généré
"""

import re
import ast

def find_unclosed_docstrings(code: str):
    """Trouver les docstrings qui ne sont pas fermées"""
    lines = code.split('\n')
    in_docstring = False
    docstring_start_line = None
    docstring_char = None
    
    issues = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Si on n'est pas dans une docstring, chercher le début
        if not in_docstring:
            # Chercher le début d'une triple-quoted string
            # Soit au début d'une ligne, soit après = dans une assignation
            if stripped.startswith('"""') or stripped.startswith("'''"):
                in_docstring = True
                docstring_start_line = i
                docstring_char = stripped[:3]
            elif '"""' in stripped and stripped.count('"""') == 1:
                in_docstring = True
                docstring_start_line = i
                docstring_char = '"""'
            elif "'''" in stripped and stripped.count("'''") == 1:
                in_docstring = True
                docstring_start_line = i
                docstring_char = "'''"
        
        # Si on est dans une docstring, chercher la fin
        if in_docstring:
            # Vérifier si la docstring se termine sur cette ligne
            if docstring_char in line and line.find(docstring_char) != line.rfind(docstring_char):
                # La docstring est fermée sur cette ligne
                in_docstring = False
                docstring_start_line = None
            elif stripped.endswith(docstring_char) or stripped.rstrip().endswith(docstring_char):
                # Fin potentielle
                in_docstring = False
                docstring_start_line = None
            elif i > docstring_start_line + 100:
                # Docstring très longue, probablement non fermée
                issues.append({
                    'start_line': docstring_start_line + 1,
                    'start_content': lines[docstring_start_line][:60] if docstring_start_line < len(lines) else '',
                    'end_line': i + 1,
                    'end_content': lines[i][:60] if i < len(lines) else ''
                })
                in_docstring = False
                docstring_start_line = None
    
    # Si on est toujours dans une docstring à la fin
    if in_docstring:
        issues.append({
            'start_line': docstring_start_line + 1,
            'start_content': lines[docstring_start_line][:60],
            'end_line': len(lines),
            'end_content': lines[-1][:60]
        })
    
    return issues


def fix_unclosed_docstrings(code: str) -> str:
    """Corriger les docstrings non fermées"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Chercher le début d'une fonction/class avec une docstring sur la ligne suivante
        if re.match(r'^(def |class |async def |async class )\w+.*:\s*$', stripped):
            # C'est une définition, chercher la docstring après
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                next_stripped = next_line.strip()
                
                # Si la ligne suivante est une docstring non fermée
                if (next_stripped.startswith('"""') or next_stripped.startswith("'''")) and \
                   next_stripped.count('"""') == 1:
                    # C'est une docstring potentiellement non fermée
                    # Vérifier si elle se ferme plus tard
                    doc_char = '"""' if '"""' in next_stripped else "'''"
                    
                    # Chercher la fermeture
                    found_closing = False
                    closing_line = None
                    for j in range(i + 2, min(i + 100, len(lines))):
                        if doc_char in lines[j] and lines[j].count(doc_char) >= 1:
                            # Vérifier si elle est vraiment fermée
                            content_between = '\n'.join(lines[i+1:j+1])
                            # Compter les occurrences
                            count = content_between.count(doc_char)
                            if count % 2 == 1:
                                # Pas fermée, trouver la vraie fin
                                pass
                            else:
                                found_closing = True
                                closing_line = j
                                break
                    
                    if not found_closing:
                        # La docstring n'est pas fermée, la fermer maintenant
                        # Trouver où commencent les instructions réelles
                        doc_content = next_stripped
                        
                        # La fermer à la fin de la docstring (juste avant les instructions)
                        # On va chercher les 5 prochaines lignes non-vides
                        k = i + 2
                        while k < len(lines) and lines[k].strip() == '':
                            k += 1
                        
                        # Si la ligne suivante a du contenu qui n'est pas une continuation
                        if k < len(lines):
                            content_lines = []
                            while k < len(lines):
                                l = lines[k].strip()
                                # Arrêter si on trouve une nouvelle définition ou un commentaire qui semble être du code
                                if l.startswith('#') and not l.startswith('"""') and not l.startswith("'''"):
                                    # C'est probablement du code, pas une docstring
                                    break
                                if re.match(r'^(def |class |if |for |while |try |with |async )\w+', l):
                                    break
                                if l and not l.startswith('#') and not l.startswith('"""') and not l.startswith("'''"):
                                    # C'est probablement la vraie fin de la docstring
                                    break
                                k += 1
                            
                            # Ajouter la docstring fermée
                            result.append(line)
                            result.append(next_line + '"""')
                            i = i + 2
                            continue
                
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def simple_docstring_fix(code: str) -> str:
    """Approche simple: trouver les docstrings qui ne se ferment pas et les fermer"""
    lines = code.split('\n')
    result = []
    
    in_docstring = False
    docstring_start_idx = 0
    docstring_char = None
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        if not in_docstring:
            # Vérifier si cette ligne commence une docstring
            if stripped.startswith('"""') or stripped.startswith("'''"):
                doc_char = stripped[:3]
                
                # Compter les occurrences dans la ligne
                count = stripped.count(doc_char)
                
                if count == 1:
                    # Docstring potentiellement non fermée
                    # Vérifier si elle est fermée plus tard
                    potential_close = []
                    for j in range(i + 1, min(i + 50, len(lines))):
                        if doc_char in lines[j]:
                            potential_close.append(j)
                    
                    if not potential_close:
                        # Pas de fermeture trouvée, fermer maintenant
                        result.append(line + '"""')
                        in_docstring = False
                    else:
                        # Vérifier si elle est vraiment fermée
                        content = '\n'.join(lines[i:potential_close[-1] + 1])
                        if content.count(doc_char) % 2 == 1:
                            # Pas fermée, fermer à la fin
                            # Sauvegarder jusqu'à maintenant
                            for k in range(i, potential_close[-1]):
                                result.append(lines[k])
                            # Ajouter la fermeture
                            result.append(lines[potential_close[-1]] + doc_char)
                            i = potential_close[-1]
                        else:
                            result.append(line)
                else:
                    result.append(line)
            else:
                result.append(line)
        else:
            # Dans une docstring (ne devrait pas arriver avec cette logique)
            result.append(line)
    
    return '\n'.join(result)


def fix_specific_issue(code: str) -> str:
    """Corriger l'issue spécifique du fichier"""
    lines = code.split('\n')
    result = []
    
    # Le problème est à la fonction get_secure_credential
    # La docstring commence mais n'est pas fermée
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Détecter la fonction avec le problème
        if stripped.startswith('def get_secure_credential'):
            # Trouver où finit cette fonction
            result.append(line)
            i += 1
            
            # Ajouter les lignes suivantes
            while i < len(lines):
                next_stripped = lines[i].strip()
                
                # Si on trouve une nouvelle fonction ou class, s'arrêter
                if re.match(r'^@(def|class|async)', next_stripped):
                    break
                if re.match(r'^(def |class )', next_stripped) and not lines[i].strip().startswith('#'):
                    break
                
                result.append(lines[i])
                i += 1
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


def fix_get_secure_credential_issue(code: str) -> str:
    """Corriger spécifiquement le problème de la fonction get_secure_credential"""
    lines = code.split('\n')
    result = []
    
    i = 0
    in_get_secure_credential = False
    func_depth = 0
    docstring_open = False
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Détecter le début de la fonction
        if stripped.startswith('def get_secure_credential'):
            in_get_secure_credential = True
            func_depth = 1
            result.append(line)
            i += 1
            continue
        
        if in_get_secure_credential:
            # Compter l'indentation pour déterminer le début/fin de fonction
            indent = len(line) - len(line.lstrip())
            
            if stripped.startswith('"""') and not docstring_open:
                docstring_open = True
                result.append(line)
                i += 1
                continue
            
            if docstring_open:
                if stripped.endswith('"""') or stripped == '"""':
                    docstring_open = False
                    result.append(line)
                    i += 1
                    continue
                elif stripped.startswith('# v8.7:'):
                    # C'est la fin de la docstring, fermer la docstring avant
                    result.append('    """')
                    docstring_open = False
                    # Ajouter le commentaire comme code normal
                    result.append(line)
                    i += 1
                    continue
            
            # Vérifier si on sort de la fonction
            if indent == 0 and stripped and not stripped.startswith('#'):
                in_get_secure_credential = False
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def fix_docstrings_aggressive(code: str) -> str:
    """Approche agressive: fermer toutes les docstrings non fermées"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Si c'est une ligne qui commence par """ ou '''
        if (stripped.startswith('"""') or stripped.startswith("'''")) and \
           stripped.count('"""') == 1 and not stripped.endswith('"""'):
            # Docstring potentiellement non fermée
            doc_char = '"""' if '"""' in stripped else "'''"
            
            # Chercher la fermeture
            found_closing = False
            closing_idx = None
            
            for j in range(i + 1, min(i + 200, len(lines))):
                if doc_char in lines[j]:
                    # Vérifier si elle est fermée correctement
                    content = '\n'.join(lines[i:j+1])
                    if content.count(doc_char) % 2 == 1:
                        # Trouvée, mais pas fermée, continuer à chercher
                        pass
                    else:
                        found_closing = True
                        closing_idx = j
                        break
            
            if not found_closing:
                # Fermer la docstring maintenant
                result.append(line + doc_char)
                i += 1
            else:
                result.append(line)
                i += 1
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


def main():
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_corrected_v3.py'
    
    print("=" * 60)
    print("CORRECTEUR DE DOCSTRINGS - v2")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères")
    
    # Essayer différentes approches
    print("\n🔧 Application de la correction agressive...")
    
    # Approche 1: Correction agressive
    fixed1 = fix_docstrings_aggressive(code)
    
    print(f"   Après correction agressive: {len(fixed1):,} caractères")
    
    # Vérifier si c'est maintenant valide
    try:
        ast.parse(fixed1)
        valid = True
        error = None
    except SyntaxError as e:
        valid = False
        error = str(e)
        print(f"   ❌ Erreur: {e}")
    
    if not valid:
        print("\n🔧 Essai de l'approche spécifique...")
        # Approche 2: Correction spécifique
        fixed2 = fix_get_secure_credential_issue(code)
        
        try:
            ast.parse(fixed2)
            valid = True
            fixed1 = fixed2
        except SyntaxError as e:
            print(f"   ❌ Erreur: {e}")
            valid = False
    
    if valid:
        print("\n✅ Syntaxe valide!")
        print(f"   Lignes: {len(fixed1.split(chr(10))):,}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed1)
        print(f"\n💾 Code corrigé sauvegardé: {output_file}")
    else:
        print("\n⚠️ Impossible de corriger automatiquement")
        print("Le fichier contient des erreurs de structure complexes")
    
    return valid


if __name__ == '__main__':
    main()
