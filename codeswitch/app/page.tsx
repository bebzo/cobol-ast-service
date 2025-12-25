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
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Dynamic import Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Sample COBOL code
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

// Gemini prompt template
const GEMINI_PROMPT = `Tu es CodeSwitch, un expert en migration de code legacy avec 25 ans d'experience.

Analyse ce programme COBOL et genere une reponse JSON stricte avec cette structure exacte:
{
  "summary": "Description en une phrase de ce que fait le programme",
  "python_code": "Le code Python complet equivalent, propre et bien documente",
  "issues": ["Liste des problemes detectes dans le code original"],
  "improvements": ["Liste des ameliorations suggerees pour le code moderne"],
  "security_warnings": ["Avertissements de securite ou conformite"]
}

IMPORTANT: 
- Le code Python doit etre moderne (Python 3.10+), avec typage, docstrings et noms explicites
- Ne fais PAS de traduction ligne a ligne, fais une REFACTORISATION intelligente
- Retourne UNIQUEMENT le JSON, sans texte avant ou apres

Code COBOL a analyser:
`;

interface AnalysisResult {
  summary: string;
  python_code: string;
  issues: string[];
  improvements: string[];
  security_warnings: string[];
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
  const [activeTab, setActiveTab] = useState<"issues" | "improvements" | "security">("issues");

  // Load API key and history from localStorage
  useEffect(() => {
    const savedKey = sessionStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySet(true);
    }
    const savedHistory = localStorage.getItem("codeswitch_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save API key
  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem("gemini_api_key", apiKey);
      setIsApiKeySet(true);
      setError("");
    }
  };

  // File upload handler
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

  // Convert with Gemini
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
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(GEMINI_PROMPT + cobolCode);
      const responseText = result.response.text();

      // Parse JSON from response
      let jsonStr = responseText;
      if (responseText.includes("```json")) {
        jsonStr = responseText.split("```json")[1].split("```")[0].trim();
      } else if (responseText.includes("```")) {
        jsonStr = responseText.split("```")[1].split("```")[0].trim();
      }

      const parsed: AnalysisResult = JSON.parse(jsonStr);
      
      setPythonCode(parsed.python_code);
      setAnalysis(parsed);

      // Save to history
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
      localStorage.setItem("codeswitch_history", JSON.stringify(newHistory));

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("API_KEY")) {
          setError("Cle API invalide. Verifiez votre cle Gemini.");
        } else if (err.message.includes("JSON")) {
          setError("Erreur de parsing. La reponse IA n'etait pas au format attendu.");
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

  // Load from history
  const loadFromHistory = (item: HistoryItem) => {
    setCobolCode(item.cobolCode);
    setPythonCode(item.pythonCode);
    setAnalysis(item.analysis);
    setFilename(item.filename);
    setShowHistory(false);
  };

  // Delete from history
  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("codeswitch_history", JSON.stringify(newHistory));
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
              <p className="text-xs text-slate-400">COBOL to Python Migration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
              {history.length > 0 && (
                <span className="bg-indigo-500 text-xs px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>

            {/* API Key input */}
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
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition"
                >
                  Sauver
                </button>
              )}
              {isApiKeySet && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-200">{error}</span>
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Upload .cbl</span>
                <input
                  type="file"
                  accept=".cbl,.cob,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="flex items-center gap-2 text-slate-400">
                <FileCode className="w-4 h-4" />
                <span className="text-sm">{filename}</span>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={isLoading || !isApiKeySet}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
                isLoading
                  ? "bg-indigo-500/50 cursor-wait animate-pulse-glow"
                  : isApiKeySet
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-slate-600 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Convertir avec Gemini
                </>
              )}
            </button>
          </div>

          {/* Editors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COBOL Editor */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 border-b border-slate-700">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="font-medium text-amber-400">COBOL (Source)</span>
              </div>
              <Editor
                height="450px"
                defaultLanguage="cobol"
                value={cobolCode}
                onChange={(value) => setCobolCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              />
            </div>

            {/* Python Editor */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 border-b border-slate-700">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-400">Python (Target)</span>
                {pythonCode && <ArrowRight className="w-4 h-4 text-green-400 ml-auto" />}
              </div>
              <Editor
                height="450px"
                defaultLanguage="python"
                value={pythonCode || "# Le code Python genere apparaitra ici..."}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  fontFamily: "JetBrains Mono, monospace",
                  readOnly: !pythonCode,
                }}
              />
            </div>
          </div>

          {/* Analysis Panel */}
          {analysis && (
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold">Rapport d&apos;analyse</h2>
                <p className="text-slate-400 text-sm mt-1">{analysis.summary}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700">
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
                    activeTab === "issues"
                      ? "text-red-400 border-b-2 border-red-400 bg-red-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Problemes ({analysis.issues.length})
                </button>
                <button
                  onClick={() => setActiveTab("improvements")}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
                    activeTab === "improvements"
                      ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Ameliorations ({analysis.improvements.length})
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
                    activeTab === "security"
                      ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Securite ({analysis.security_warnings.length})
                </button>
              </div>

              {/* Tab content */}
              <div className="p-6">
                <ul className="space-y-3">
                  {activeTab === "issues" &&
                    analysis.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-400 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-slate-300">{issue}</span>
                      </li>
                    ))}
                  {activeTab === "improvements" &&
                    analysis.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-slate-300">{imp}</span>
                      </li>
                    ))}
                  {activeTab === "security" &&
                    analysis.security_warnings.map((warn, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-400 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-slate-300">{warn}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHistory(false)}
          ></div>
          <div className="relative w-full max-w-md bg-slate-800 h-full overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historique</h2>
              <button onClick={() => setShowHistory(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Aucune conversion</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.filename}</span>
                      <button
                        onClick={() => deleteFromHistory(item.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                      {item.analysis.summary}
                    </p>
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded text-sm font-medium transition"
                    >
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
          <span>CodeSwitch - Powered by Gemini AI</span>
          <span>Prototype de demonstration</span>
        </div>
      </footer>
    </div>
  );
}
