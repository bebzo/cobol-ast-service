"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Upload,
  Play,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Shield,
  History,
  Trash2,
  FileCode,
  Loader2,
  X,
  Code2,
  ArrowRight,
  Download,
  FileText,
  Clock,
  TrendingUp,
  TestTube,
  BookOpen,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const SAMPLE_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  CALCULIMPOT.
       AUTHOR.      SYSTEME-FISCAL-1990.
      * Programme de calcul d'impot sur le revenu
      * Taux de 1990 - A mettre a jour pour 2025
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-REVENU-ANNUEL    PIC 9(7)V99.
       01  WS-TRANCHE1-LIMITE  PIC 9(7) VALUE 30000.
       01  WS-TRANCHE2-LIMITE  PIC 9(7) VALUE 100000.
       01  WS-TAUX-TRANCHE1    PIC V999 VALUE .150.
       01  WS-TAUX-TRANCHE2    PIC V999 VALUE .280.
       01  WS-TAUX-TRANCHE3    PIC V999 VALUE .400.
       01  WS-IMPOT-CALCULE    PIC 9(7)V99.
       
       PROCEDURE DIVISION.
       DEBUT.
           MOVE 75000 TO WS-REVENU-ANNUEL.
           
           IF WS-REVENU-ANNUEL <= WS-TRANCHE1-LIMITE
               COMPUTE WS-IMPOT-CALCULE = 
                 WS-REVENU-ANNUEL * WS-TAUX-TRANCHE1
           ELSE
               IF WS-REVENU-ANNUEL <= WS-TRANCHE2-LIMITE
                   COMPUTE WS-IMPOT-CALCULE = 
                     WS-TRANCHE1-LIMITE * WS-TAUX-TRANCHE1 +
                     (WS-REVENU-ANNUEL - WS-TRANCHE1-LIMITE) 
                     * WS-TAUX-TRANCHE2
               ELSE
                   COMPUTE WS-IMPOT-CALCULE = 
                     WS-TRANCHE1-LIMITE * WS-TAUX-TRANCHE1 +
                     (WS-TRANCHE2-LIMITE - WS-TRANCHE1-LIMITE) 
                     * WS-TAUX-TRANCHE2 +
                     (WS-REVENU-ANNUEL - WS-TRANCHE2-LIMITE) 
                     * WS-TAUX-TRANCHE3
               END-IF
           END-IF.
           
           DISPLAY "REVENU: " WS-REVENU-ANNUEL.
           DISPLAY "IMPOT CALCULE: " WS-IMPOT-CALCULE.
           
           STOP RUN.`;

// Enhanced CodeSwitch Pro prompt - Architecture avancee
const GEMINI_PROMPT = `Tu es CodeSwitch Pro, un architecte senior en migration legacy avec 25 ans d'experience.

MISSION: Genere du code Python de QUALITE PRODUCTION avec une architecture moderne et extensible.

ARCHITECTURE REQUISE dans python_code:
1. @dataclass pour les structures de donnees (ex: TrancheImposition avec limite_inferieure, limite_superieure, taux en Decimal)
2. Configuration externalisable via JSON (classe ConfigFiscale avec methode charger())
3. Gestionnaire multi-annees (classe GestionnaireFiscal avec cache des configurations)
4. Systeme d'audit/logging (classe AuditFiscal avec enregistrement CSV)
5. Utiliser Decimal pour TOUS les calculs financiers
6. Typage complet (typing: List, Optional, Dict)
7. Docstrings detailles pour chaque classe/methode
8. Warnings integres si donnees obsoletes

Analyse ce programme COBOL et genere une reponse JSON stricte:
{
  "summary": "Description en une phrase",
  
  "business_context": {
    "domain": "Domaine metier (fiscalite, bancaire, assurance, RH)",
    "detected_year": "Annee detectee ou estimee",
    "regulatory_context": "Contexte reglementaire",
    "is_obsolete": true/false,
    "obsolescence_reason": "Explication si obsolete"
  },
  
  "python_code": "Code Python COMPLET avec: dataclasses TrancheImposition, ConfigFiscale, GestionnaireFiscal, AuditFiscal, Decimal, typage, docstrings, warnings obsolescence, exemple config JSON en commentaire",
  
  "unit_tests": "Tests pytest COMPLETS: test_configuration, test_calcul_nominal, test_cas_limites, test_tranches, test_audit",
  
  "config_json": "Exemple de fichier config_fiscale.json avec les tranches actuelles 2025",
  
  "issues": ["Problemes detectes"],
  "improvements": ["Ameliorations architecturales"],
  "security_warnings": ["Avertissements securite/conformite"],
  
  "migration_score": {
    "complexity": "LOW/MEDIUM/HIGH",
    "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
    "estimated_effort": "Jours-homme",
    "confidence": "Pourcentage"
  },
  
  "next_steps": ["Actions pour production"]
}

REGLES:
1. Le python_code doit etre EXECUTABLE et inclure TOUTES les classes mentionnees
2. Inclure un exemple de config JSON 2025 en commentaire dans le code
3. Les tests doivent couvrir les cas limites (0, negatif, tres grand)
4. Retourne UNIQUEMENT le JSON valide

Code COBOL:
`;

interface BusinessContext {
  domain: string;
  detected_year: string;
  regulatory_context: string;
  is_obsolete: boolean;
  obsolescence_reason: string;
}

interface MigrationScore {
  complexity: string;
  risk_level: string;
  estimated_effort: string;
  confidence: string;
}

interface AnalysisResult {
  summary: string;
  business_context: BusinessContext;
  python_code: string;
  unit_tests: string;
  config_json: string;
  issues: string[];
  improvements: string[];
  security_warnings: string[];
  migration_score: MigrationScore;
  next_steps: string[];
}

interface HistoryItem {
  id: string;
  filename: string;
  timestamp: number;
  cobolCode: string;
  pythonCode: string;
  analysis: AnalysisResult;
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [cobolCode, setCobolCode] = useState(SAMPLE_COBOL);
  const [pythonCode, setPythonCode] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("sample.cbl");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "tests" | "config" | "report">("code");
  const [activeReportTab, setActiveReportTab] = useState<"issues" | "improvements" | "security" | "next">("issues");

  useEffect(() => {
    const savedKey = sessionStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySet(true);
    }
    const savedHistory = localStorage.getItem("codeswitch_history_v2");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem("gemini_api_key", apiKey);
      setIsApiKeySet(true);
      setError("");
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCobolCode(content);
        setFilename(file.name);
        setPythonCode("");
        setAnalysis(null);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleConvert = async () => {
    if (!apiKey) {
      setError("Veuillez entrer votre cle API Gemini");
      return;
    }
    if (!cobolCode.trim()) {
      setError("Veuillez entrer du code COBOL");
      return;
    }

    setIsLoading(true);
    setError("");
    setPythonCode("");
    setAnalysis(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent(GEMINI_PROMPT + cobolCode);
      const responseText = result.response.text();

      let jsonStr = responseText;
      if (responseText.includes("```json")) {
        jsonStr = responseText.split("```json")[1].split("```")[0].trim();
      } else if (responseText.includes("```")) {
        jsonStr = responseText.split("```")[1].split("```")[0].trim();
      }

      const parsed: AnalysisResult = JSON.parse(jsonStr);
      
      setPythonCode(parsed.python_code);
      setAnalysis(parsed);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        filename,
        timestamp: Date.now(),
        cobolCode,
        pythonCode: parsed.python_code,
        analysis: parsed,
      };
      const newHistory = [newItem, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("codeswitch_history_v2", JSON.stringify(newHistory));

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("API_KEY") || err.message.includes("403")) {
          setError("Cle API invalide. Verifiez votre cle Gemini.");
        } else if (err.message.includes("429")) {
          setError("Quota API epuise. Attendez ou utilisez une nouvelle cle.");
        } else if (err.message.includes("JSON")) {
          setError("Erreur de parsing. Reessayez.");
        } else {
          setError(`Erreur: ${err.message}`);
        }
      } else {
        setError("Une erreur inconnue s'est produite");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCobolCode(item.cobolCode);
    setPythonCode(item.pythonCode);
    setAnalysis(item.analysis);
    setFilename(item.filename);
    setShowHistory(false);
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("codeswitch_history_v2", JSON.stringify(newHistory));
  };

  const exportMigrationPackage = () => {
    if (!analysis) return;
    
    const packageContent = `# CodeSwitch Migration Package
# Generated: ${new Date().toISOString()}
# Source: ${filename}

## Summary
${analysis.summary}

## Business Context
- Domain: ${analysis.business_context?.domain || 'N/A'}
- Detected Year: ${analysis.business_context?.detected_year || 'N/A'}
- Regulatory Context: ${analysis.business_context?.regulatory_context || 'N/A'}
- Obsolete: ${analysis.business_context?.is_obsolete ? 'YES - ' + analysis.business_context.obsolescence_reason : 'No'}

## Migration Score
- Complexity: ${analysis.migration_score?.complexity || 'N/A'}
- Risk Level: ${analysis.migration_score?.risk_level || 'N/A'}
- Estimated Effort: ${analysis.migration_score?.estimated_effort || 'N/A'}
- Confidence: ${analysis.migration_score?.confidence || 'N/A'}

## Issues Detected
${analysis.issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

## Improvements
${analysis.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

## Security Warnings
${analysis.security_warnings.map((w, idx) => `${idx + 1}. ${w}`).join('\n')}

## Next Steps
${analysis.next_steps?.map((s, idx) => `${idx + 1}. ${s}`).join('\n') || 'N/A'}

---

# main.py
\`\`\`python
${analysis.python_code}
\`\`\`

---

# test_migration.py
\`\`\`python
${analysis.unit_tests || '# No tests generated'}
\`\`\`
`;

    const blob = new Blob([packageContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeswitch_migration_${filename.replace('.cbl', '')}.md`;
    a.click();
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'text-green-400 bg-green-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20';
      case 'CRITICAL': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CodeSwitch</h1>
              <p className="text-xs text-slate-400">Refactorisation Intelligente COBOL</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
              {history.length > 0 && (
                <span className="bg-indigo-500 text-xs px-2 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Gemini API Key"
                  className="pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm w-48 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isApiKeySet && (
                <button onClick={handleSaveApiKey} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition">
                  Sauver
                </button>
              )}
              {isApiKeySet && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-200">{error}</span>
              <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Upload .cbl</span>
                <input type="file" accept=".cbl,.cob,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <div className="flex items-center gap-2 text-slate-400">
                <FileCode className="w-4 h-4" />
                <span className="text-sm">{filename}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {analysis && (
                <button
                  onClick={exportMigrationPackage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Exporter Package
                </button>
              )}
              <button
                onClick={handleConvert}
                disabled={isLoading || !isApiKeySet}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
                  isLoading ? "bg-indigo-500/50 cursor-wait" : isApiKeySet ? "bg-indigo-500 hover:bg-indigo-600" : "bg-slate-600 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Analyse intelligente...</>
                ) : (
                  <><Play className="w-5 h-5" />Refactoriser avec Gemini</>
                )}
              </button>
            </div>
          </div>

          {/* Business Context Banner */}
          {analysis?.business_context && (
            <div className={`rounded-lg p-4 border ${analysis.business_context.is_obsolete ? 'bg-amber-500/10 border-amber-500' : 'bg-green-500/10 border-green-500'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${analysis.business_context.is_obsolete ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                  <Clock className={`w-6 h-6 ${analysis.business_context.is_obsolete ? 'text-amber-400' : 'text-green-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-white">{analysis.business_context.domain}</span>
                    <span className="text-sm px-2 py-0.5 rounded bg-slate-700">{analysis.business_context.detected_year}</span>
                    {analysis.business_context.is_obsolete && (
                      <span className="text-sm px-2 py-0.5 rounded bg-amber-500/30 text-amber-300">OBSOLETE</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{analysis.business_context.regulatory_context}</p>
                  {analysis.business_context.is_obsolete && (
                    <p className="text-sm text-amber-300 mt-1">{analysis.business_context.obsolescence_reason}</p>
                  )}
                </div>
                {analysis.migration_score && (
                  <div className="flex gap-2">
                    <div className={`px-3 py-1 rounded text-xs font-medium ${getRiskColor(analysis.migration_score.risk_level)}`}>
                      Risque: {analysis.migration_score.risk_level}
                    </div>
                    <div className="px-3 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300">
                      {analysis.migration_score.confidence} confiance
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editors with Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COBOL Editor */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 border-b border-slate-700">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="font-medium text-amber-400">COBOL (Source)</span>
              </div>
              <Editor
                height="400px"
                defaultLanguage="cobol"
                value={cobolCode}
                onChange={(value) => setCobolCode(value || "")}
                theme="vs-dark"
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", wordWrap: "on" }}
              />
            </div>

            {/* Output Editor with Tabs */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="flex items-center border-b border-slate-700">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "code" ? "bg-green-500/20 text-green-400 border-b-2 border-green-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code2 className="w-4 h-4" />Python
                </button>
                <button
                  onClick={() => setActiveTab("tests")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "tests" ? "bg-blue-500/20 text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TestTube className="w-4 h-4" />Tests
                </button>
                <button
                  onClick={() => setActiveTab("config")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "config" ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileCode className="w-4 h-4" />Config
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "report" ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />Rapport
                </button>
              </div>
              
              {activeTab === "code" && (
                <Editor
                  height="400px"
                  defaultLanguage="python"
                  value={pythonCode || "# Le code Python refactorise apparaitra ici..."}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", wordWrap: "on", readOnly: !pythonCode }}
                />
              )}
              
              {activeTab === "tests" && (
                <Editor
                  height="400px"
                  defaultLanguage="python"
                  value={analysis?.unit_tests || "# Les tests de non-regression apparaitront ici..."}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", wordWrap: "on", readOnly: true }}
                />
              )}
              
              {activeTab === "config" && (
                <Editor
                  height="400px"
                  defaultLanguage="json"
                  value={analysis?.config_json || '{\n  "annee": 2025,\n  "tranches": []\n}'}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", wordWrap: "on", readOnly: true }}
                />
              )}
              
              {activeTab === "report" && analysis && (
                <div className="h-[400px] overflow-y-auto p-4">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {[
                      { key: "issues", label: "Problemes", icon: AlertTriangle, count: analysis.issues.length },
                      { key: "improvements", label: "Ameliorations", icon: Lightbulb, count: analysis.improvements.length },
                      { key: "security", label: "Securite", icon: Shield, count: analysis.security_warnings.length },
                      { key: "next", label: "Prochaines etapes", icon: TrendingUp, count: analysis.next_steps?.length || 0 },
                    ].map(({ key, label, icon: Icon, count }) => (
                      <button
                        key={key}
                        onClick={() => setActiveReportTab(key as typeof activeReportTab)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                          activeReportTab === key ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />{label} ({count})
                      </button>
                    ))}
                  </div>
                  <ul className="space-y-2">
                    {activeReportTab === "issues" && analysis.issues.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
                        <span className="text-red-400 font-bold">{i + 1}.</span>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                    {activeReportTab === "improvements" && analysis.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                        <span className="text-amber-400 font-bold">{i + 1}.</span>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                    {activeReportTab === "security" && analysis.security_warnings.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
                        <span className="text-purple-400 font-bold">{i + 1}.</span>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                    {activeReportTab === "next" && analysis.next_steps?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                        <span className="text-green-400 font-bold">{i + 1}.</span>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {activeTab === "report" && !analysis && (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Le rapport de migration apparaitra ici</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Migration Summary Card */}
          {analysis && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Resume de la Migration
              </h3>
              <p className="text-slate-300 mb-4">{analysis.summary}</p>
              {analysis.migration_score && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Complexite</p>
                    <p className={`font-semibold ${getRiskColor(analysis.migration_score.complexity)}`}>{analysis.migration_score.complexity}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Niveau de Risque</p>
                    <p className={`font-semibold ${getRiskColor(analysis.migration_score.risk_level)}`}>{analysis.migration_score.risk_level}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Effort Estime</p>
                    <p className="font-semibold text-white">{analysis.migration_score.estimated_effort}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Confiance</p>
                    <p className="font-semibold text-indigo-400">{analysis.migration_score.confidence}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-md bg-slate-800 h-full overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historique</h2>
              <button onClick={() => setShowHistory(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Aucune conversion</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.filename}</span>
                      <button onClick={() => deleteFromHistory(item.id)} className="text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{new Date(item.timestamp).toLocaleString()}</p>
                    {item.analysis.business_context?.is_obsolete && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/30 text-amber-300">OBSOLETE</span>
                    )}
                    <p className="text-sm text-slate-300 line-clamp-2 mt-2">{item.analysis.summary}</p>
                    <button onClick={() => loadFromHistory(item)} className="w-full mt-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded text-sm font-medium transition">
                      Charger
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between text-sm text-slate-400">
          <span>CodeSwitch - Refactorisation Intelligente par Gemini AI</span>
          <span>Hackathon Gemini 3</span>
        </div>
      </footer>
    </div>
  );
}
