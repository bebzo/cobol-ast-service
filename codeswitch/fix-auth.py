#!/usr/bin/env python3
"""Script pour modifier la section d'authentification du dashboard"""

import re

# Lire le fichier
with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# La section à remplacer (lignes 673-709 environ)
old_section = '''export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Authentication check - requires login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session - redirect to login
          router.push('/login?redirect=/dashboard');
          return;
        }
        setUser(session.user);
        setAuthLoading(false);
      } catch (error) {
        // On error, redirect to login
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/dashboard');
      }
    };
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);'''

# La nouvelle section avec bypass dev mode
new_section = '''export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);

  // Authentication check - with dev mode bypass
  useEffect(() => {
    const checkAuth = async () => {
      // Check for dev mode
      const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
      setDevMode(isDev);

      if (isDev) {
        console.log('🧪 Mode développement: Authentification ignorée');
        // En mode dev, créer un utilisateur mock et autoriser l'accès
        setUser({
          id: 'dev-user-001',
          email: 'dev@codeswitch.app',
          user_metadata: {
            full_name: 'Developer Mode'
          }
        });
        setAuthLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session - redirect to login
          router.push('/login?redirect=/dashboard');
          return;
        }
        setUser(session.user);
        setAuthLoading(false);
      } catch (error) {
        // On error, redirect to login
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/dashboard');
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);'''

# Effectuer le remplacement
if old_section in content:
    new_content = content.replace(old_section, new_section)
    with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ Section d'authentification mise à jour avec succès!")
    print("   - Le mode développement ignore maintenant l'authentification")
else:
    print("⚠️ Section d'authentification non trouvée")
    print("   La structure du fichier a peut-être changé")
