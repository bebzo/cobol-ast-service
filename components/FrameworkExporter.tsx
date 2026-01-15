"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Download,
  FileCode,
  Folder,
  FolderOpen,
  Check,
  Copy,
  Terminal,
  ChevronDown,
  ChevronRight,
  Zap,
  Server,
  Database,
  Shield,
  GitBranch,
  Container,
  Settings,
} from 'lucide-react';
import {
  exportToFramework,
  ExportOptions,
  ExportResult,
  ExportedFile,
  FrameworkTarget,
} from '@/lib/framework-exporter';

interface FrameworkExporterProps {
  pythonCode: string;
  className: string;
  onExport?: (result: ExportResult) => void;
}

const FRAMEWORK_INFO = {
  django: {
    name: 'Django',
    icon: '🎸',
    description: 'Full-featured web framework avec ORM, admin, auth',
    color: 'emerald'
  },
  fastapi: {
    name: 'FastAPI',
    icon: '⚡',
    description: 'API moderne, haute performance, async native',
    color: 'cyan'
  },
  flask: {
    name: 'Flask',
    icon: '🧪',
    description: 'Lightweight and flexible micro-framework',
    color: 'amber'
  },
  plain: {
    name: 'Python',
    icon: '🐍',
    description: 'Script Python standalone',
    color: 'blue'
  }
};

export default function FrameworkExporter({ 
  pythonCode, 
  className,
  onExport 
}: FrameworkExporterProps) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkTarget>('fastapi');
  const [projectName, setProjectName] = useState(className || 'my_project');
  const [includeTests, setIncludeTests] = useState(true);
  const [includeDocker, setIncludeDocker] = useState(true);
  const [includeCI, setIncludeCI] = useState(false);
  const [databaseType, setDatabaseType] = useState<'postgresql' | 'mysql' | 'sqlite' | 'none'>('sqlite');
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<ExportedFile | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate export
  const handleExport = useCallback(() => {
    const options: ExportOptions = {
      framework: selectedFramework,
      projectName,
      includeTests,
      includeDocker,
      includeCI,
      databaseType
    };
    
    const result = exportToFramework(pythonCode, className, options);
    setExportResult(result);
    
    // Auto-select first Python file
    const firstPy = result.files.find(f => f.type === 'python');
    if (firstPy) setSelectedFile(firstPy);
    
    onExport?.(result);
  }, [pythonCode, className, selectedFramework, projectName, includeTests, includeDocker, includeCI, databaseType, onExport]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Download all as ZIP (simulated)
  const handleDownloadZip = useCallback(() => {
    if (!exportResult) return;
    
    // Create a simple text representation (in production, use JSZip)
    const content = exportResult.files.map(f => 
      `=== ${f.path} ===\n${f.content}\n`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportResult, projectName]);

  // File tree toggle
  const toggleFolder = useCallback((path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Build file tree structure
  const fileTree = useMemo(() => {
    if (!exportResult) return null;
    
    const tree: { [key: string]: any } = {};
    
    exportResult.files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { _file: file };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    
    return tree;
  }, [exportResult]);

  // Render file tree
  const renderTree = (node: any, path = '', depth = 0) => {
    const entries = Object.entries(node).filter(([k]) => k !== '_file');
    
    return entries.map(([name, value]: [string, any]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFile = value._file !== undefined;
      const isExpanded = expandedFiles.has(fullPath);
      
      if (isFile) {
        const file = value._file as ExportedFile;
        const isSelected = selectedFile?.path === file.path;
        
        return (
          <div
            key={fullPath}
            className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded transition ${
              isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-slate-700/50 text-slate-300'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => setSelectedFile(file)}
          >
            <FileCode className="w-4 h-4 text-slate-400" />
            <span className="text-sm">{name}</span>
          </div>
        );
      }
      
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-slate-700/50 rounded text-slate-300"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <FolderOpen className="w-4 h-4 text-amber-400" />
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 text-slate-500" />
                <Folder className="w-4 h-4 text-amber-400" />
              </>
            )}
            <span className="text-sm font-medium">{name}</span>
          </div>
          {isExpanded && renderTree(value, fullPath, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900/30 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Export Framework</h3>
          </div>
          {exportResult && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
          )}
        </div>
      </div>

      {/* Framework Selection */}
      <div className="p-4 border-b border-slate-700">
        <label className="block text-sm text-slate-400 mb-2">Framework cible</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(FRAMEWORK_INFO) as FrameworkTarget[]).map(fw => {
            const info = FRAMEWORK_INFO[fw];
            const isSelected = selectedFramework === fw;
            
            return (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  isSelected 
                    ? `border-${info.color}-500 bg-${info.color}-500/10` 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{info.icon}</span>
                  <span className={`font-medium ${isSelected ? `text-${info.color}-400` : 'text-white'}`}>
                    {info.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{info.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nom du projet</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="my_project"
            />
          </div>

          {/* Database */}
          {selectedFramework !== 'plain' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Database</label>
              <select
                value={databaseType}
                onChange={(e) => setDatabaseType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="sqlite">SQLite</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="none">Aucune</option>
              </select>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-300">Tests</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDocker}
              onChange={(e) => setIncludeDocker(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-300">Docker</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCI}
              onChange={(e) => setIncludeCI(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-300">GitHub Actions</span>
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!pythonCode}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5" />
          Generate Project {FRAMEWORK_INFO[selectedFramework].name}
        </button>
      </div>

      {/* Export Result */}
      {exportResult && (
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* File Tree */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-700 overflow-auto bg-slate-800/30">
            <div className="p-2 border-b border-slate-700 text-xs text-slate-400 font-medium uppercase tracking-wide">
              Fichiers ({exportResult.files.length})
            </div>
            <div className="p-2">
              {fileTree && renderTree(fileTree)}
            </div>
          </div>

          {/* File Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white font-medium">{selectedFile.path}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedFile.content, selectedFile.path)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition"
                  >
                    {copied === selectedFile.path ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-950 p-4">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a file
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setup Commands */}
      {exportResult && (
        <div className="border-t border-slate-700 p-4 bg-slate-800/30">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Terminal className="w-4 h-4" />
            <span>Commandes d'installation</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-green-400">
            {exportResult.setupCommands.map((cmd, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-600">$</span>
                <span>{cmd}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-slate-800 text-cyan-400">
              <span className="text-slate-600">$</span> {exportResult.runCommand}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
