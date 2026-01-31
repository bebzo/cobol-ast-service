#!/usr/bin/env python3
"""
Correcteur Specifique - Corrige le problème de docstring non fermée
"""

import re

def fix_get_secure_credential_docstring(code: str) -> str:
    """Corriger spécifiquement la fonction get_secure_credential"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Détecter la fonction problematique
        if stripped.startswith('def get_secure_credential'):
            # Ajouter la ligne de fonction
            result.append(line)
            i += 1
            
            # Ajouter les lignes suivantes jusqu'à trouver une vraie instruction
            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.strip()
                
                # Si c'est la docstring (ligne qui commence par """ ou ''')
                if next_stripped.startswith('"""') or next_stripped.startswith("'''"):
                    # C'est une docstring, la garder et chercher la fin
                    doc_content = next_stripped
                    doc_start_idx = i
                    
                    # Chercher où finit la docstring
                    doc_lines = [next_line]
                    j = i + 1
                    
                    while j < len(lines):
                        l = lines[j]
                        l_stripped = l.strip()
                        
                        # Si on trouve la fermeture
                        if l_stripped.endswith('"""') or l_stripped.endswith("'''"):
                            doc_lines.append(l)
                            # Ajouter la docstring complète
                            for dl in doc_lines:
                                result.append(dl)
                            i = j + 1
                            break
                        
                        # Si on trouve une vraie instruction de code (pas un commentaire de docstring)
                        if l_stripped.startswith('if ') or l_stripped.startswith('return ') or \
                           l_stripped.startswith('# ') or l_stripped.startswith('v8.') or \
                           l_stripped.startswith('value = ') or l_stripped.startswith('    # '):
                            # La docstring n'est pas fermée! La fermer maintenant
                            # Ajouter la docstring ouverte
                            result.append(doc_lines[0])
                            # Ajouter les lignes intermédiaires
                            for k in range(1, len(doc_lines)):
                                result.append(doc_lines[k])
                            # Fermer la docstring
                            result.append('    """')
                            
                            # Maintenant ajouter cette ligne comme code
                            # Si c'est un v8.x, en faire un commentaire
                            if l_stripped.startswith('v8.'):
                                result.append('    # ' + l_stripped)
                            else:
                                result.append(l)
                            
                            i = j + 1
                            break
                        
                        doc_lines.append(l)
                        j += 1
                    else:
                        # Pas trouvé de fermeture, quitter
                        i = j
                else:
                    result.append(next_line)
                    i += 1
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


def fix_version_comments(code: str) -> str:
    """Convertir les lignes de version (v8.x, v9.x) en commentaires si elles ne le sont pas"""
    lines = code.split('\n')
    result = []
    
    for line in lines:
        stripped = line.strip()
        
        # Si la ligne commence par v8. ou v9. sans être un commentaire
        if re.match(r'^v[89]\.\d+:', stripped) and not line.strip().startswith('#'):
            # C'est une ligne de version, la convertir en commentaire
            indent = len(line) - len(line.lstrip())
            result.append(' ' * indent + '# ' + stripped)
        else:
            result.append(line)
    
    return '\n'.join(result)


def fix_docstring_pattern(code: str) -> str:
    """Corriger le pattern: docstring sans fermeture suivie de code"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Chercher le pattern: def + docstring qui ne se ferme pas
        if stripped.startswith('def ') and ':' in stripped:
            # C'est une définition de fonction
            result.append(line)
            i += 1
            
            # Regarder les lignes suivantes
            docstring_lines = []
            in_docstring = False
            doc_char = None
            
            while i < len(lines):
                current = lines[i]
                current_stripped = current.strip()
                
                # Si c'est une docstring
                if (current_stripped.startswith('"""') or current_stripped.startswith("'''")):
                    doc_char = '"""' if '"""' in current_stripped else "'''"
                    
                    if current_stripped.count(doc_char) == 1:
                        # Début de docstring potentiellement non fermée
                        in_docstring = True
                        docstring_lines = [current]
                        i += 1
                        
                        # Chercher la fin
                        while i < len(lines):
                            next_line = lines[i]
                            next_stripped = next_line.strip()
                            
                            if doc_char in next_line and next_line.count(doc_char) >= 1:
                                # Vérifier si elle est fermée
                                full_doc = '\n'.join(docstring_lines + [next_line])
                                if full_doc.count(doc_char) % 2 == 1:
                                    # Pas fermée! Chercher plus
                                    docstring_lines.append(next_line)
                                    i += 1
                                else:
                                    # Fermée correctement
                                    docstring_lines.append(next_line)
                                    break
                            elif in_docstring:
                                # Ligne dans la docstring
                                # Vérifier si c'est du code (pas un commentaire)
                                if re.match(r'^(if |return |value = |# |def |class |for |while |try |with |raise |import |from )', next_stripped) and \
                                   not next_stripped.startswith('#'):
                                    # C'est du code! La docstring n'est pas fermée
                                    # Fermer la docstring avant ce code
                                    
                                    # Ajouter les lignes de docstring trouvées
                                    for dl in docstring_lines:
                                        result.append(dl)
                                    
                                    # Fermer la docstring avec la même indentation que la première ligne
                                    first_line = docstring_lines[0] if docstring_lines else ''
                                    indent = len(first_line) - len(first_line.lstrip())
                                    result.append(' ' * indent + doc_char)
                                    
                                    # Convertir les lignes "v8.x" en commentaires
                                    for dl in docstring_lines[1:]:
                                        dl_stripped = dl.strip()
                                        if re.match(r'^v[89]\.\d+:', dl_stripped):
                                            dl_indent = len(dl) - len(dl.lstrip())
                                            result.append(' ' * dl_indent + '# ' + dl_stripped)
                                        elif dl.strip():
                                            result.append(dl)
                                    
                                    # Ajouter cette ligne comme code
                                    if re.match(r'^v[89]\.\d+:', next_stripped):
                                        result.append('    # ' + next_stripped)
                                    else:
                                        result.append(next_line)
                                    
                                    i += 1
                                    in_docstring = False
                                    break
                                else:
                                    docstring_lines.append(next_line)
                                    i += 1
                            else:
                                break
                        else:
                            # Fin du fichier atteinte
                            for dl in docstring_lines:
                                result.append(dl)
                            i = len(lines)
                    else:
                        # Docstring fermée sur la même ligne
                        result.append(current)
                        i += 1
                else:
                    result.append(current)
                    i += 1
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


def main():
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_corrected_v5.py'
    
    print("=" * 60)
    print("CORRECTEUR SPECIFIQUE - v5")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères")
    
    # Appliquer les corrections
    print("\n🔧 Correction du pattern de docstring...")
    fixed = fix_docstring_pattern(code)
    
    # Vérifier
    print("\n🔍 Vérification...")
    try:
        import ast
        ast.parse(fixed)
        print("✅ Syntaxe valide!")
        valid = True
    except SyntaxError as e:
        print(f"❌ Erreur: {e}")
        print(f"   Ligne: {e.lineno if hasattr(e, 'lineno') else 'N/A'}")
        valid = False
    
    if valid:
        print(f"\n📊 Lignes: {len(fixed.split(chr(10))):,}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"💾 Code corrigé sauvegardé: {output_file}")
    else:
        # Essayer autre chose
        print("\n🔧 Essai d'une approche plus agressive...")
        fixed2 = fix_docstring_pattern(fixed)
        try:
            import ast
            ast.parse(fixed2)
            print("✅ Syntaxe valide après seconde passe!")
            valid = True
            fixed = fixed2
        except SyntaxError as e:
            print(f"❌ Erreur: {e}")
            valid = False
        
        if valid:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"💾 Code corrigé sauvegardé: {output_file}")


if __name__ == '__main__':
    main()
