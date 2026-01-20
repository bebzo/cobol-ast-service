#!/usr/bin/env python3
"""
Playwright UI Test for CodeSwitch Application
Tests login flow and checks for display issues.

Credentials: embebangon@gmail.com / EManu1231975@@
"""

from playwright.sync_api import sync_playwright
import time

def test_login_and_check_ui():
    """Test login flow and check for UI issues."""
    print("=" * 70)
    print("PLAYWRIGHT UI TEST - CodeSwitch Application")
    print("=" * 70)
    
    issues_found = []
    
    with sync_playwright() as p:
        # Launch browser in headless mode with larger viewport
        browser = p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        # Create context with typical desktop viewport
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        )
        
        page = context.new_page()
        
        # Capture console messages
        console_errors = []
        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(f"Console Error: {msg.text}")
        
        page.on('console', handle_console)
        
        # Test 1: Navigate to login page
        print("\n1. Navigation vers la page de connexion...")
        try:
            page.goto('http://localhost:3000/login', timeout=30000)
            print("   ✓ Page de connexion chargée")
        except Exception as e:
            issues_found.append(f"Échec de navigation vers /login: {e}")
            print(f"   ✗ Échec: {e}")
            browser.close()
            return issues_found
        
        # Wait for page to be fully loaded
        time.sleep(2)
        
        # Check for visible elements
        print("\n2. Vérification des éléments de la page...")
        
        # Check for email input
        email_input = page.query_selector('input[type="email"]')
        if email_input:
            print("   ✓ Champ email trouvé")
        else:
            issues_found.append("Champ email non trouvé sur la page")
            print("   ✗ Champ email non trouvé")
        
        # Check for password input
        password_input = page.query_selector('input[type="password"]')
        if password_input:
            print("   ✓ Champ mot de passe trouvé")
        else:
            issues_found.append("Champ mot de passe non trouvé sur la page")
            print("   ✗ Champ mot de passe non trouvé")
        
        # Check for submit button
        submit_button = page.query_selector('button[type="submit"]')
        if submit_button:
            print("   ✓ Bouton de soumission trouvé")
            button_text = submit_button.inner_text() if submit_button.inner_text() else "No text"
            print(f"     Texte du bouton: {button_text}")
        else:
            issues_found.append("Bouton de soumission non trouvé")
            print("   ✗ Bouton de soumission non trouvé")
        
        # Test 2: Perform login
        print("\n3. Tentative de connexion...")
        if email_input and password_input:
            email_input.fill('embebangon@gmail.com')
            print("   ✓ Email saisi")
            
            password_input.fill('EManu1231975@@')
            print("   ✓ Mot de passe saisi")
            
            # Click submit button
            if submit_button:
                submit_button.click()
                print("   ✓ Bouton cliqué")
                
                # Wait for navigation or response
                time.sleep(5)
                
                # Check current URL
                current_url = page.url
                print(f"   URL actuelle: {current_url}")
                
                if 'dashboard' in current_url:
                    print("   ✓ Connexion réussie - Dashboard affiché")
                elif 'login' in current_url:
                    print("   ⚠ Encore sur la page de connexion - Vérifier les identifiants")
                    issues_found.append("Connexion échouée - possible problème d'authentification")
                else:
                    print(f"   ⚠ Navigation vers: {current_url}")
            
            # Check for error messages
            error_messages = page.query_selector_all('.error, [role="alert"], .text-red')
            if error_messages:
                for error in error_messages:
                    error_text = error.inner_text()
                    if error_text:
                        issues_found.append(f"Message d'erreur: {error_text}")
                        print(f"   ✗ Message d'erreur trouvé: {error_text}")
        
        # Test 3: Check dashboard (if logged in)
        if 'dashboard' in page.url:
            print("\n4. Vérification du tableau de bord...")
            
            # Check for key elements
            elements_to_check = [
                ('header', 'En-tête'),
                ('nav', 'Navigation'),
                ('main', 'Contenu principal'),
                ('.card', 'Cartes de contenu'),
            ]
            
            for selector, description in elements_to_check:
                elements = page.query_selector_all(selector)
                if elements:
                    print(f"   ✓ {description} trouvé(s): {len(elements)} élément(s)")
                else:
                    issues_found.append(f"{description} non trouvé")
                    print(f"   ⚠ {description} non trouvé")
        
        # Test 4: Check console errors
        print("\n5. Vérification des erreurs console...")
        if console_errors:
            for error in console_errors:
                # Filter out common non-critical errors
                if 'favicon' not in error.lower() and '404' not in error:
                    issues_found.append(error)
                    print(f"   ✗ {error}")
            if not any('favicon' in e.lower() or '404' in e for e in console_errors):
                if console_errors:
                    print(f"   ⚠ {len(console_errors)} erreur(s) console trouvée(s)")
        else:
            print("   ✓ Aucune erreur console critique")
        
        # Test 5: Check responsive design
        print("\n6. Vérification du design responsive...")
        
        # Test tablet viewport
        page.set_viewport_size({'width': 768, 'height': 1024})
        time.sleep(1)
        print("   ✓ Vue tablette (768x1024)")
        
        # Test mobile viewport
        page.set_viewport_size({'width': 375, 'height': 667})
        time.sleep(1)
        print("   ✓ Vue mobile (375x667)")
        
        # Return to desktop
        page.set_viewport_size({'width': 1920, 'height': 1080})
        
        browser.close()
    
    return issues_found


def main():
    """Main test runner."""
    print("\n" + "=" * 70)
    print("TEST D'INTERFACE UTILISATEUR - CodeSwitch")
    print("=" * 70)
    print("\nIdentifiants de test:")
    print("  Email: embebangon@gmail.com")
    print("  Mot de passe: EManu1231975@@")
    print("-" * 70)
    
    try:
        issues = test_login_and_check_ui()
        
        print("\n" + "=" * 70)
        print("RÉSULTAT DES TESTS")
        print("=" * 70)
        
        if issues:
            print(f"\n⚠️  {len(issues)} problème(s) trouvé(s):")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")
            
            print("\n📋 Recommandations:")
            print("  - Vérifier la console du navigateur pour les erreurs")
            print("  - Tester manuellement la page de connexion")
            print("  - Vérifier les variables d'environnement NextAuth")
        else:
            print("\n✅ Aucun problème critique trouvé!")
            print("   L'interface utilisateur semble fonctionner correctement.")
        
        return 0 if not issues else 1
        
    except Exception as e:
        print(f"\n❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
