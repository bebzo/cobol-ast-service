"use client";

import { useState, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  content: string;
  title?: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  showIcon?: boolean;
}

export default function Tooltip({ 
  content, 
  title, 
  children, 
  position = "top",
  showIcon = false 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-700 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-700 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-700 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-700 border-y-transparent border-l-transparent",
  };

  return (
    <div 
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {showIcon && (
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
      )}
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-xl px-3 py-2 max-w-xs">
            {title && (
              <p className="text-xs font-semibold text-indigo-300 mb-1">{title}</p>
            )}
            <p className="text-xs text-slate-300 whitespace-normal">{content}</p>
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}

// Metric-specific tooltips for the dashboard
export const METRIC_TOOLTIPS: Record<string, { title: string; content: string }> = {
  cobolLines: {
    title: "Lignes COBOL",
    content: "Nombre total de lignes dans le code source COBOL original, incluant les commentaires et les lignes vides."
  },
  pythonLines: {
    title: "Lignes Python",
    content: "Nombre de lignes générées dans le code Python. Une réduction indique une meilleure concision du code moderne."
  },
  tests: {
    title: "Tests Générés",
    content: "Nombre de tests unitaires automatiquement générés pour valider l'équivalence fonctionnelle entre COBOL et Python."
  },
  issues: {
    title: "Problèmes Détectés",
    content: "Anomalies, patterns obsolètes, ou problèmes potentiels identifiés dans le code COBOL original nécessitant attention."
  },
  improvements: {
    title: "Améliorations",
    content: "Suggestions d'optimisations pour le code Python généré: performance, lisibilité, patterns modernes."
  },
  confidence: {
    title: "Niveau de Confiance",
    content: "Probabilité estimée que la migration soit fonctionnellement équivalente. >85% = prêt pour UAT, <70% = revue experte nécessaire."
  },
  numericalEquivalence: {
    title: "Équivalence Numérique",
    content: "Précision des calculs arithmétiques: comparaison des résultats COBOL vs Python sur les opérations COMPUTE, ADD, SUBTRACT, etc."
  },
  behavioralEquivalence: {
    title: "Équivalence Comportementale",
    content: "Validation que le flux de contrôle (IF, PERFORM, GO TO) produit les mêmes transitions d'état."
  },
  edgeCaseCoverage: {
    title: "Couverture Edge Cases",
    content: "Tests des cas limites: valeurs nulles, négatives, très grandes, chaînes vides, dates invalides."
  },
  semanticCoverage: {
    title: "Couverture Sémantique",
    content: "Pourcentage de la logique métier COBOL correctement traduite en Python."
  },
  performanceDeviation: {
    title: "Déviation Performance",
    content: "Différence de temps d'exécution entre COBOL et Python. Valeur négative = Python plus rapide."
  },
  translationRate: {
    title: "Taux de Traduction",
    content: "Pourcentage de paragraphes COBOL traduits avec succès sans fallback ou stub."
  },
  complexity: {
    title: "Complexité",
    content: "Évaluation de la difficulté de migration: LOW (<50 lignes, simple), MEDIUM (50-200 lignes), HIGH (>200 lignes, SQL, fichiers)."
  },
  riskLevel: {
    title: "Niveau de Risque",
    content: "Impact potentiel sur la production: LOW = cosmétique, MEDIUM = fonctionnel, HIGH = données, CRITICAL = financier/légal."
  },
};
