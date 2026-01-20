'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Code2, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [supabase, setSupabase] = useState<any>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [apiKeyType, setApiKeyType] = useState<'legacy' | 'new'>('legacy');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    // Initialize Supabase client
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Check for dev mode
        const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        setDevMode(isDev);

        // Detect API key format
        if (anonKey?.startsWith('sb_')) {
          setApiKeyType('new');
          console.log('🆕 Nouveau format de clé API détecté (sb_xxx)');
        } else if (anonKey?.startsWith('eyJh')) {
          setApiKeyType('legacy');
          console.log('🔄 Ancien format de clé API détecté (JWT)');
        }

        if (!url || !anonKey) {
          console.error('❌ Variables Supabase non configurées');
          setSupabaseReady(true);
          return;
        }

        const client = createClient(url, anonKey);
        setSupabase(client);
        setSupabaseReady(true);

        console.log('✅ Client Supabase initialisé');

        // Check if already logged in
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          console.error('❌ Erreur de session:', sessionError.message);
          // Try to get user anyway
          const { data: { user } } = await client.auth.getUser();
          if (user) {
            window.location.href = redirectTo;
          }
        } else if (session) {
          window.location.href = redirectTo;
        }

      } catch (err: any) {
        console.error('❌ Échec initialisation Supabase:', err.message);
        setSupabaseReady(true);
      }
    };

    initSupabase();
  }, [redirectTo, router]);

  const handleDemoAccess = () => {
    setMessage('🔄 Accès au mode démo...');

    // Vérifier si on peut accéder au dashboard directement
    // En mode développement, on peut contourner l'auth
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 800);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Check if Supabase is configured
    if (!supabase) {
      setError('Service d\'authentification non configuré. Veuillez contacter le support.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`
          }
        });
        if (error) throw error;
        setMessage('✅ Vérifiez votre email pour le lien de confirmation!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          // Gestion des erreurs spécifiques
          if (error.message.includes('Invalid login credentials') ||
              error.message.includes('email not confirmed') ||
              error.message.includes('Email not confirmed')) {

            console.log('⚠️ Erreur d\'auth:', error.message);

            // En mode dev, proposer une solution alternative
            if (devMode) {
              setMessage('🔧 Mode développement: Tentative de contournement...');

              // Essayer de récupérer ou créer une session
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                window.location.href = redirectTo;
                return;
              }
            }

            setError('Email non confirmé ou identifiants invalides.');
            setMessage('💡 Utilisez le bouton "Demo Access" pour accéder au dashboard en mode développement.');
          } else {
            throw error;
          }
        } else if (data.session) {
          window.location.href = redirectTo;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Échec de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Service d\'authentification non configuré. Utilisez email/password.');
      return;
    }

    try {
      setMessage(`Connexion à ${provider}...`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Échec connexion ${provider}.`);
      setMessage('');
    }
  };

  if (!supabaseReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-white">CodeSwitch</span>
              <span className="text-xs text-blue-400 block">Pro v8.5</span>
            </div>
          </Link>
          <p className="text-slate-400 mt-4">Connectez-vous pour transformer votre code COBOL</p>

          {/* Indicateur de mode */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {devMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                🧪 Mode Développement
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${apiKeyType === 'new' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'} text-xs rounded-full`}>
              <span className={`w-2 h-2 ${apiKeyType === 'new' ? 'bg-green-400' : 'bg-blue-400'} rounded-full`}></span>
              {apiKeyType === 'new' ? '🔑 API v2' : '🔐 API Legacy'}
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignUp ? 'Créer un compte' : 'Bon retour'}
          </h2>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 py-3 rounded-xl font-medium transition shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continuer avec GitHub
            </button>

            {/* Demo Access Button - PRINCIPE DE CONTournement AUTH */}
            <button
              onClick={handleDemoAccess}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-emerald-600/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accès Demo
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-800/50 text-slate-400">ou avec email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="vous@entreprise.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  {error.includes('non confirmé') && (
                    <p className="mt-1 text-xs text-slate-400">
                      💡 Conseil: Utilisez le bouton "Accès Demo" pour accéder au dashboard sans auth.
                    </p>
                  )}
                </div>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/50 rounded-lg px-4 py-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement...
                </>
              ) : (
                <>
                  {isSignUp ? 'Créer un compte' : 'Se connecter'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            {isSignUp ? 'Déjà un compte?' : "Pas de compte?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              {isSignUp ? 'Se connecter' : 'S\'inscrire'}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          En continuant, vous acceptez nos{' '}
          <Link href="/legal/terms" className="text-blue-400 hover:underline">Conditions</Link> et{' '}
          <Link href="/legal/privacy" className="text-blue-400 hover:underline">Politique de confidentialité</Link>
        </p>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
