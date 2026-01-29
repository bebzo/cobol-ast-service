"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  X, Users, UserPlus, Trash2, Shield, Activity, Database,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Search,
  Mail, Calendar, BarChart3, Settings, AlertTriangle, Download
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    full_name?: string;
    role?: string;
  };
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create Supabase client for getting session
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to get access token for admin API
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    emailUsers: 0,
    googleUsers: 0,
    githubUsers: 0,
    confirmedUsers: 0
  });

  // Settings toggles
  const [settings, setSettings] = useState({
    openRegistration: true,
    emailConfirmation: true,
    oauthGoogle: true,
    oauthGithub: true
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage({ type: 'success', text: `Setting updated: ${key}` });
    setTimeout(() => setMessage(null), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/admin/users', { headers });
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        setStats({
          totalUsers: data.users.length,
          activeToday: data.users.filter((u: User) => 
            u.last_sign_in_at && new Date(u.last_sign_in_at) >= today
          ).length,
          emailUsers: data.users.filter((u: User) => 
            u.app_metadata?.provider === 'email' || !u.app_metadata?.providers?.length
          ).length,
          googleUsers: data.users.filter((u: User) => 
            u.app_metadata?.providers?.includes('google')
          ).length,
          githubUsers: data.users.filter((u: User) => 
            u.app_metadata?.providers?.includes('github')
          ).length,
          confirmedUsers: data.users.filter((u: User) => u.email_confirmed_at).length
        });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  const addUser = async () => {
    if (!newUserEmail || !newUserPassword) return;
    
    setLoading(true);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'User created successfully!' });
        setNewUserEmail('');
        setNewUserPassword('');
        setShowAddUser(false);
        loadUsers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error creating user' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    
    setLoading(true);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'User deleted!' });
        loadUsers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting user' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const exportUsersCSV = () => {
    if (users.length === 0) {
      setMessage({ type: 'error', text: 'No users to export' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    const headers = ['ID', 'Email', 'Provider', 'Created At', 'Last Sign In', 'Role', 'Confirmed'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.app_metadata?.providers?.join(';') || u.app_metadata?.provider || 'email',
      u.created_at,
      u.last_sign_in_at || '',
      u.user_metadata?.role || 'user',
      u.email_confirmed_at ? 'Yes' : 'No'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Users exported successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const exportAnalysesJSON = async () => {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/admin/analyses', { headers });
      const data = await response.json();
      
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        const blob = new Blob([JSON.stringify(data.analyses || [], null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analyses_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Analyses exported successfully!' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to export analyses' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderBadge = (user: User) => {
    const providers = user.app_metadata?.providers || [user.app_metadata?.provider || 'email'];
    return providers.map(p => {
      switch (p) {
        case 'google': return { label: 'Google', color: 'bg-red-500/20 text-red-400' };
        case 'github': return { label: 'GitHub', color: 'bg-slate-500/20 text-slate-300' };
        default: return { label: 'Email', color: 'bg-blue-500/20 text-blue-400' };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Administration</h2>
              <p className="text-sm text-slate-400">User management and statistics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search for a user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <div className="p-4 bg-slate-800 rounded-xl border border-purple-500/30">
                  <h3 className="text-white font-semibold mb-4">Nouvel utilisateur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="password"
                      placeholder="Mot de passe"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={addUser}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowAddUser(false)}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="text-left text-xs text-slate-400 font-medium p-3">Utilisateur</th>
                      <th className="text-left text-xs text-slate-400 font-medium p-3">Provider</th>
                      <th className="text-left text-xs text-slate-400 font-medium p-3">Inscrit le</th>
                      <th className="text-left text-xs text-slate-400 font-medium p-3">Last login</th>
                      <th className="text-center text-xs text-slate-400 font-medium p-3">Statut</th>
                      <th className="text-center text-xs text-slate-400 font-medium p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Chargement...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-white font-medium">{user.email}</div>
                                {user.user_metadata?.role && (
                                  <div className="text-xs text-purple-400">{user.user_metadata.role}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {getProviderBadge(user).map((badge, idx) => (
                                <span key={idx} className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-slate-400">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="p-3 text-sm text-slate-400">
                            {formatDate(user.last_sign_in_at)}
                          </td>
                          <td className="p-3 text-center">
                            {user.email_confirmed_at ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                <CheckCircle className="w-3 h-3" /> Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                                <Clock className="w-3 h-3" /> En attente
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {user.email !== 'embebangon@gmail.com' ? (
                              <button
                                onClick={() => deleteUser(user.id, user.email)}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-purple-400">Super Admin</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
                  <Users className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-slate-400">Total utilisateurs</div>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-4 border border-green-500/30">
                  <Activity className="w-6 h-6 text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.activeToday}</div>
                  <div className="text-xs text-slate-400">Actifs aujourd'hui</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
                  <CheckCircle className="w-6 h-6 text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.confirmedUsers}</div>
                  <div className="text-xs text-slate-400">Confirmeds</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 rounded-xl p-4 border border-cyan-500/30">
                  <Mail className="w-6 h-6 text-cyan-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.emailUsers}</div>
                  <div className="text-xs text-slate-400">Via Email</div>
                </div>
                <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-xl p-4 border border-red-500/30">
                  <div className="w-6 h-6 text-red-400 mb-2 font-bold">G</div>
                  <div className="text-2xl font-bold text-white">{stats.googleUsers}</div>
                  <div className="text-xs text-slate-400">Via Google</div>
                </div>
                <div className="bg-gradient-to-br from-slate-600/20 to-slate-800/20 rounded-xl p-4 border border-slate-500/30">
                  <div className="w-6 h-6 text-slate-300 mb-2 font-bold">GH</div>
                  <div className="text-2xl font-bold text-white">{stats.githubUsers}</div>
                  <div className="text-xs text-slate-400">Via GitHub</div>
                </div>
              </div>

              {/* Charts placeholder */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4">Recent signups</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.email[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-white truncate max-w-[200px]">{user.email}</span>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(user.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4">Provider distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Email</span>
                        <span className="text-white">{stats.emailUsers}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.emailUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Google</span>
                        <span className="text-white">{stats.googleUsers}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.googleUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">GitHub</span>
                        <span className="text-white">{stats.githubUsers}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-500 rounded-full"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.githubUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Application settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Open registration</div>
                      <div className="text-sm text-slate-400">Permettre aux nouveaux utilisateurs de s'inscrire</div>
                    </div>
                    <button
                      onClick={() => toggleSetting('openRegistration')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settings.openRegistration ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.openRegistration ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Email confirmation required</div>
                      <div className="text-sm text-slate-400">Les utilisateurs doivent confirmer leur email</div>
                    </div>
                    <button
                      onClick={() => toggleSetting('emailConfirmation')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settings.emailConfirmation ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailConfirmation ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">OAuth Google</div>
                      <div className="text-sm text-slate-400">Google login enabled</div>
                    </div>
                    <button
                      onClick={() => toggleSetting('oauthGoogle')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settings.oauthGoogle ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.oauthGoogle ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">OAuth GitHub</div>
                      <div className="text-sm text-slate-400">GitHub login enabled</div>
                    </div>
                    <button
                      onClick={() => toggleSetting('oauthGithub')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settings.oauthGithub ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.oauthGithub ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Data export</h3>
                <div className="flex gap-4">
                  <button onClick={exportUsersCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">
                    <Download className="w-4 h-4" />
                    Export utilisateurs (CSV)
                  </button>
                  <button onClick={exportAnalysesJSON} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">
                    <Download className="w-4 h-4" />
                    Export analyses (JSON)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
