import re

with open('app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Find and replace the authentication check
old_pattern = '''  // Authentication check - requires login
  useEffect(() => {
    const checkAuth = async () => {'''

new_pattern = '''  // Authentication check - requires login (bypass in demo mode)
  useEffect(() => {
    // Demo mode: bypass auth check if URL has ?demo=true
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true') {
      setUser({ email: 'demo@codeswitch.dev', id: 'demo-user', user_metadata: { full_name: 'Demo User' } });
      setAuthLoading(false);
      return;
    }

    const checkAuth = async () => {'''

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    with open('app/dashboard/page.tsx', 'w') as f:
        f.write(content)
    print("Modification successful!")
else:
    print("Pattern not found")
    # Debug: show what we're looking for
    if 'Authentication check' in content:
        print("Found 'Authentication check' but pattern doesn't match exactly")
        # Find the context
        idx = content.find('Authentication check')
        print(f"Context: {content[max(0,idx-50):idx+200]}")
