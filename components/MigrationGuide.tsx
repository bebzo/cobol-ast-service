"use client";

import { useState } from "react";
import { 
  X, 
  BookOpen, 
  Upload, 
  Cpu, 
  TestTube, 
  FileCheck, 
  ChevronRight,
  HelpCircle,
  Zap,
  Shield,
  MessageSquare
} from "lucide-react";

interface MigrationGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrationGuide({ isOpen, onClose }: MigrationGuideProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: Upload,
      title: "1. Upload du Code COBOL",
      description: "Importez votre fichier COBOL (.cbl, .cob) ou collez directement le code.",
      details: [
        "Formats supportés: COBOL-85, COBOL-2002, IBM Enterprise COBOL",
        "Taille max recommandée: 5000 lignes par fichier",
        "Les COPYBOOKS peuvent être uploadés séparément",
        "Le code est analysé localement avant l'envoi à l'API"
      ],
      tip: "💡 Utilisez 'Load Demo' pour tester avec un exemple de code payroll."
    },
    {
      icon: Cpu,
      title: "2. Analyse & Transpilation",
      description: "L'IA analyse la structure et génère le code Python équivalent.",
      details: [
        "Parsing AST du code COBOL (paragraphes, variables, divisions)",
        "Détection des patterns obsolètes et vulnérabilités",
        "Génération de code Python avec dataclasses et typing",
        "Création de tests unitaires automatiques"
      ],
      tip: "💡 L'analyse SSE montre la progression en temps réel."
    },
    {
      icon: TestTube,
      title: "3. Validation des Tests",
      description: "Les tests sont exécutés pour valider l'équivalence fonctionnelle.",
      details: [
        "Tests unitaires avec assertions numériques",
        "Tests de cas limites (zéro, négatif, overflow)",
        "Tests de propriétés (monotonie, identité)",
        "Exécution via Pyodide dans le navigateur"
      ],
      tip: "💡 Un taux de passage >95% indique une migration fiable."
    },
    {
      icon: FileCheck,
      title: "4. Certification & Export",
      description: "Générez un certificat d'équivalence et exportez le code.",
      details: [
        "Certificat PDF avec métriques détaillées",
        "Export vers Django, FastAPI, ou module Python standard",
        "Diagramme d'architecture Mermaid",
        "Rapport de sécurité avec score CVSS"
      ],
      tip: "💡 Le certificat peut servir de preuve d'audit pour la conformité."
    }
  ];

  const faqs = [
    {
      q: "Le code Python est-il vraiment équivalent au COBOL?",
      a: "Oui, dans la limite des différences de langage. Les calculs décimaux utilisent Decimal pour préserver la précision COMP-3. Les tests valident l'équivalence numérique."
    },
    {
      q: "Puis-je utiliser le code généré en production?",
      a: "Le code est conçu pour être production-ready, mais nous recommandons une revue par un expert COBOL et des tests UAT avant déploiement."
    },
    {
      q: "Comment sont gérées les données sensibles?",
      a: "Le code COBOL est envoyé à l'API Gemini pour analyse. Les données ne sont pas stockées. Pour les environnements réglementés, utilisez une instance privée."
    },
    {
      q: "Que faire si des tests échouent?",
      a: "Les échecs peuvent indiquer des différences de comportement attendues (initialisation de variables). Utilisez le chat Gemini pour comprendre chaque échec."
    },
    {
      q: "Les COPYBOOKS sont-ils supportés?",
      a: "Oui! Uploadez vos fichiers COPYBOOK (.cpy) séparément. Ils seront automatiquement inclus dans l'analyse."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-800 border border-indigo-500/30 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Guide de Migration COBOL → Python</h2>
              <p className="text-xs text-indigo-200">CodeSwitch Pro - Documentation Interactive</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Workflow Steps */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Workflow de Migration
            </h3>
            
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      activeStep === idx 
                        ? "bg-indigo-500 text-white" 
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-slate-600 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Active Step Details */}
            <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-2">
                {steps[activeStep].title}
              </h4>
              <p className="text-slate-300 mb-4">{steps[activeStep].description}</p>
              
              <ul className="space-y-2 mb-4">
                {steps[activeStep].details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-2">
                <p className="text-sm text-indigo-300">{steps[activeStep].tip}</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Fonctionnalités Clés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/30">
                <Zap className="w-8 h-8 text-emerald-400 mb-2" />
                <h4 className="font-semibold text-emerald-300 mb-1">Transpilation IA</h4>
                <p className="text-xs text-slate-400">
                  Gemini 2.0 analyse le contexte métier et génère du code Python idiomatique.
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
                <TestTube className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="font-semibold text-purple-300 mb-1">Tests Automatiques</h4>
                <p className="text-xs text-slate-400">
                  Tests unitaires et property-based générés et exécutés dans le navigateur.
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/30">
                <Shield className="w-8 h-8 text-red-400 mb-2" />
                <h4 className="font-semibold text-red-300 mb-1">Analyse Sécurité</h4>
                <p className="text-xs text-slate-400">
                  Détection des vulnérabilités avec scoring CVSS et recommandations.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Questions Fréquentes
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details key={idx} className="bg-slate-900/50 rounded-lg border border-slate-700 group">
                  <summary className="px-4 py-3 cursor-pointer text-slate-200 font-medium hover:text-indigo-300 transition">
                    {faq.q}
                  </summary>
                  <div className="px-4 pb-3 text-sm text-slate-400">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-900/50 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MessageSquare className="w-4 h-4" />
                Des questions? Utilisez le chat Gemini pour de l'aide contextuelle.
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition"
              >
                Commencer la Migration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
