"""
Script de Migration VSAM Lite vers Supabase - CodeSwitch v11.0

Ce script migre les fichiers VSAM Lite (JSON) vers Supabase pour bénéficier de:
- Indexation réelle
- Conformité ACIDE
- Accès concurrent
- Sauvegardes automatiques

Utilisation:
    python migrate_to_supabase.py --all
    python migrate_to_supabase.py --file customer.dat --table customers
    python migrate_to_supabase.py --dry-run

Auteur: MiniMax Agent
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.supabase_dal import (
    SupabaseDataAccessLayer,
    SupabaseTable,
    MigrationManager,
    generate_supabase_schema,
    SupabaseConnection,
)
from api.vsam_lite import VSAMFile


class VSAMToSupabaseMigrator:
    """Migrateur de fichiers VSAM Lite vers Supabase."""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialise le migrateur."""
        self.connection = SupabaseConnection.get_instance(supabase_url, supabase_key)
        self.stats = {
            "total_files": 0,
            "total_records": 0,
            "successful": 0,
            "failed": 0,
            "errors": [],
        }
        self.migration_log: List[dict] = []
    
    def discover_vsam_files(self, directory: str = "data") -> List[str]:
        """
        Découvre les fichiers VSAM Lite dans un répertoire.
        
        Args:
            directory: Répertoire à scanner
        
        Returns:
            Liste des fichiers VSAM (sans extension)
        """
        vsam_files = []
        
        if not os.path.exists(directory):
            print(f"⚠ Répertoire non trouvé: {directory}")
            return vsam_files
        
        for filename in os.listdir(directory):
            if filename.endswith(".data.json"):
                base_name = filename[:-10]  # Enlever ".data.json"
                vsam_files.append(base_name)
        
        return vsam_files
    
    def analyze_vsam_file(self, file_path: str) -> dict:
        """
        Analyse un fichier VSAM Lite pour obtenir des statistiques.
        
        Args:
            file_path: Chemin du fichier VSAM (sans extension)
        
        Returns:
            Analyse du fichier
        """
        analysis = {
            "path": file_path,
            "record_count": 0,
            "keys_sample": [],
            "data_size": 0,
            "format": "unknown",
        }
        
        data_file = f"{file_path}.data.json"
        keys_file = f"{file_path}.keys.json"
        
        if os.path.exists(data_file):
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                analysis["record_count"] = len(data)
                analysis["keys_sample"] = list(data.keys())[:5]
                analysis["data_size"] = os.path.getsize(data_file)
                
                # Analyser le format des données
                if data:
                    sample = data[list(data.keys())[0]]
                    if isinstance(sample, str):
                        analysis["format"] = "DISPLAY"
                    elif isinstance(sample, dict):
                        analysis["format"] = "JSON"
                
            except Exception as e:
                analysis["error"] = str(e)
        
        return analysis
    
    def migrate_single_file(
        self,
        vsam_path: str,
        table_name: str,
        primary_key: str = "key",
        dry_run: bool = False,
    ) -> dict:
        """
        Migre un fichier VSAM Lite vers Supabase.
        
        Args:
            vsam_path: Chemin du fichier VSAM (sans extension)
            table_name: Nom de la table Supabase cible
            primary_key: Champ clé primaire
            dry_run: Si True, simule sans écrire
        
        Returns:
            Résultat de la migration
        """
        result = {
            "source": vsam_path,
            "target_table": table_name,
            "primary_key": primary_key,
            "dry_run": dry_run,
            "records_migrated": 0,
            "errors": [],
            "success": False,
            "timestamp": datetime.now().isoformat(),
        }
        
        data_file = f"{vsam_path}.data.json"
        
        # Vérifier que le fichier existe
        if not os.path.exists(data_file):
            result["errors"].append(f"Fichier VSAM non trouvé: {data_file}")
            return result
        
        # Charger les données VSAM
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                vsam_data = json.load(f)
        except Exception as e:
            result["errors"].append(f"Erreur lecture: {e}")
            return result
        
        result["total_records"] = len(vsam_data)
        
        if dry_run:
            print(f"  [DRY RUN] Migration de {len(vsam_data)} enregistrements vers {table_name}")
            result["records_migrated"] = len(vsam_data)
            result["success"] = len(vsam_data) > 0
            return result
        
        # Créer la table et migrer
        if not self.connection.is_connected:
            result["errors"].append("Connexion Supabase non établie")
            return result
        
        table = SupabaseTable(table_name, primary_key=primary_key)
        table.open("OUTPUT")
        
        for key, record_data in vsam_data.items():
            try:
                # Préparer l'enregistrement
                if isinstance(record_data, str):
                    record_data = {"data": record_data}
                
                record_data["key"] = key
                if primary_key != "key" and primary_key not in record_data:
                    record_data[primary_key] = key
                
                # Écrire vers Supabase
                status = table.write(key, record_data)
                
                if status in ("00", "02"):
                    result["records_migrated"] += 1
                else:
                    result["errors"].append(f"Erreur écriture {key}: status={status}")
                    
            except Exception as e:
                result["errors"].append(f"Erreur migration {key}: {e}")
        
        table.close()
        
        result["success"] = len(result["errors"]) == 0 and result["records_migrated"] > 0
        
        return result
    
    def migrate_directory(
        self,
        directory: str = "data",
        table_prefix: str = "",
        dry_run: bool = False,
    ) -> dict:
        """
        Migre tous les fichiers VSAM d'un répertoire vers Supabase.
        
        Args:
            directory: Répertoire contenant les fichiers VSAM
            table_prefix: Préfixe pour les noms de tables
            dry_run: Simulation sans écriture
        
        Returns:
            Résumé de la migration
        """
        summary = {
            "directory": directory,
            "table_prefix": table_prefix,
            "dry_run": dry_run,
            "files": [],
            "total_records": 0,
            "successful": 0,
            "failed": 0,
            "errors": [],
        }
        
        vsam_files = self.discover_vsam_files(directory)
        
        print(f"📁 Découverte de {len(vsam_files)} fichiers VSAM dans '{directory}'")
        
        for vsam_path in vsam_files:
            # Déterminer le nom de la table
            filename = os.path.basename(vsam_path)
            table_name = f"{table_prefix}{filename}" if table_prefix else filename
            
            # Analyser le fichier
            analysis = self.analyze_vsam_file(vsam_path)
            print(f"\n📄 Fichier: {vsam_path}")
            print(f"   Enregistrements: {analysis.get('record_count', 0)}")
            print(f"   Format: {analysis.get('format', 'unknown')}")
            print(f"   Table cible: {table_name}")
            
            # Migrer
            result = self.migrate_single_file(
                vsam_path=vsam_path,
                table_name=table_name,
                dry_run=dry_run,
            )
            
            summary["files"].append(result)
            summary["total_records"] += result.get("total_records", 0)
            
            if result["success"]:
                summary["successful"] += 1
                print(f"   ✅ Migré: {result['records_migrated']} enregistrements")
            else:
                summary["failed"] += 1
                print(f"   ❌ Échec: {result['errors']}")
            
            for error in result.get("errors", []):
                summary["errors"].append(f"{vsam_path}: {error}")
        
        return summary
    
    def generate_migration_report(self, summary: dict) -> str:
        """Génère un rapport de migration."""
        report = []
        report.append("=" * 70)
        report.append("RAPPORT DE MIGRATION VSAM Lite -> Supabase")
        report.append(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 70)
        report.append("")
        report.append(f"Répertoire source: {summary['directory']}")
        report.append(f"Préfixe tables: {summary['table_prefix'] or '(aucun)'}")
        report.append(f"Mode dry-run: {'Oui' if summary['dry_run'] else 'Non'}")
        report.append("")
        report.append("-" * 70)
        report.append("RÉSUMÉ")
        report.append("-" * 70)
        report.append(f"Fichiers traités: {len(summary['files'])}")
        report.append(f"Migrations réussies: {summary['successful']}")
        report.append(f"Migrations échouées: {summary['failed']}")
        report.append(f"Total enregistrements: {summary['total_records']}")
        report.append("")
        
        if summary['errors']:
            report.append("-" * 70)
            report.append("ERREURS")
            report.append("-" * 70)
            for error in summary['errors'][:20]:  # Limiter à 20 erreurs
                report.append(f"  • {error}")
            if len(summary['errors']) > 20:
                report.append(f"  ... et {len(summary['errors']) - 20} erreurs supplémentaires")
            report.append("")
        
        report.append("-" * 70)
        report.append("DÉTAILS PAR FICHIER")
        report.append("-" * 70)
        
        for file_result in summary['files']:
            status = "✅" if file_result['success'] else "❌"
            report.append(f"{status} {file_result['source']}")
            report.append(f"   Table: {file_result['target_table']}")
            report.append(f"   Enregistrements: {file_result['records_migrated']}")
            if file_result['errors']:
                for error in file_result['errors'][:3]:
                    report.append(f"   ⚠ {error}")
        
        report.append("")
        report.append("=" * 70)
        
        return "\n".join(report)


def create_supabase_schema_files(tables: List[str], output_dir: str = "sql"):
    """
    Génère les fichiers SQL de schéma pour chaque table.
    
    Args:
        tables: Liste des noms de tables
        output_dir: Répertoire de sortie
    """
    os.makedirs(output_dir, exist_ok=True)
    
    for table_name in tables:
        schema_sql = generate_supabase_schema(table_name)
        output_file = os.path.join(output_dir, f"{table_name}.sql")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Schéma pour table: {table_name}\n")
            f.write(f"-- Généré par CodeSwitch v11.0\n")
            f.write(f"-- Date: {datetime.now().isoformat()}\n\n")
            f.write(schema_sql)
        
        print(f"  📄 Schéma généré: {output_file}")


def main():
    """Point d'entrée principal."""
    parser = argparse.ArgumentParser(
        description="Migration VSAM Lite vers Supabase"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Migrer tous les fichiers VSAM du répertoire 'data'"
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Fichier VSAM spécifique à migrer (sans extension)"
    )
    parser.add_argument(
        "--table",
        type=str,
        help="Nom de la table Supabase cible"
    )
    parser.add_argument(
        "--directory",
        type=str,
        default="data",
        help="Répertoire contenant les fichiers VSAM (défaut: data)"
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default="",
        help="Préfixe pour les noms de tables"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulation sans écriture"
    )
    parser.add_argument(
        "--url",
        type=str,
        help="URL Supabase (ou variable d'environnement SUPABASE_URL)"
    )
    parser.add_argument(
        "--key",
        type=str,
        help="Clé API Supabase (ou variable d'environnement SUPABASE_KEY)"
    )
    parser.add_argument(
        "--generate-schema",
        action="store_true",
        help="Générer uniquement les fichiers SQL"
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("MIGRATION VSAM Lite -> Supabase")
    print("CodeSwitch v11.0")
    print("=" * 70)
    
    # Configurer Supabase
    supabase_url = args.url or os.environ.get('SUPABASE_URL')
    supabase_key = args.key or os.environ.get('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        print("\n⚠ Configuration Supabase requise:")
        print("   Définissez SUPABASE_URL et SUPABASE_KEY")
        print("   Ou utilisez les options --url et --key\n")
        
        if not args.generate_schema:
            return
    
    # Initialiser le migrateur
    migrator = VSAMToSupabaseMigrator(supabase_url, supabase_key)
    
    # Vérifier la connexion
    if args.all or args.file:
        status = SupabaseDataAccessLayer.get_connection_status()
        print(f"\n📡 Statut Supabase:")
        print(f"   Client disponible: {status['available']}")
        print(f"   Connexion établie: {status['connected']}")
        
        if not status['connected']:
            print("\n⚠ La migration nécessite une connexion Supabase active")
            return
    
    # Mode dry-run
    if args.dry_run:
        print("\n🔍 Mode DRY RUN - Aucune donnée ne sera écrite\n")
    
    # Migration
    if args.all:
        summary = migrator.migrate_directory(
            directory=args.directory,
            table_prefix=args.prefix,
            dry_run=args.dry_run,
        )
        
        # Générer les schémas
        tables = [f['target_table'] for f in summary['files']]
        create_supabase_schema_files(tables)
        
        # Afficher le rapport
        report = migrator.generate_migration_report(summary)
        print(report)
        
        # Sauvegarder le rapport
        with open("migration_report.txt", 'w', encoding='utf-8') as f:
            f.write(report)
        print("\n📄 Rapport sauvegardé: migration_report.txt")
    
    elif args.file:
        table_name = args.table or os.path.basename(args.file)
        
        print(f"\n📄 Migration de: {args.file}")
        print(f"   Vers table: {table_name}")
        
        result = migrator.migrate_single_file(
            vsam_path=args.file,
            table_name=table_name,
            dry_run=args.dry_run,
        )
        
        if result['success']:
            print(f"   ✅ Succès: {result['records_migrated']} enregistrements migrés")
        else:
            print(f"   ❌ Échec: {result['errors']}")
    
    elif args.generate_schema:
        # Générer les schémas pour les fichiers VSAM existants
        vsam_files = migrator.discover_vsam_files(args.directory)
        tables = [os.path.basename(f) for f in vsam_files]
        
        if args.prefix:
            tables = [f"{args.prefix}{t}" for t in tables]
        
        print(f"\n📄 Génération de {len(tables)} fichiers SQL...")
        create_supabase_schema_files(tables)
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
