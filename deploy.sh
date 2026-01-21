#!/bin/bash

# Script de déploiement Vercel pour CodeSwitch
# Usage: ./deploy.sh

echo "🚀 Début du déploiement Vercel..."

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm i -g vercel
fi

# Se connecter (si nécessaire)
echo "🔐 Vérification de l'authentification..."
if ! vercel whoami &> /dev/null; then
    echo "❗ Veuillez vous connecter:"
    vercel login
fi

# Déployer avec cache forcé
echo "🚀 Déploiement en production..."
vercel --prod --force

echo "✅ Déploiement terminé!"
