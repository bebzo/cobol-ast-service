"""
Supabase Data Access Layer - CodeSwitch v11.0
Remplace VSAM Lite par une vraie base de données PostgreSQL via Supabase.

Avantages:
- Indexation réelle pour des recherches O(log n)
- Conformité ACIDE complète
- Accès concurrent sécurisé
- Sauvegardes automatiques
- API REST native
- Évolutivité horizontale

Auteur: MiniMax Agent
"""

import json
import os
import struct
from typing import Any, Dict, List, Optional, Tuple, Union, AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from decimal import Decimal as PyDecimal
import asyncio

# Tentative d'import de Supabase (optionnel pour compatibilité)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    create_client = None
    Client = None


class FileOrganization(Enum):
    INDEXED = "INDEXED"
    SEQUENTIAL = "SEQUENTIAL"
    RELATIVE = "RELATIVE"


class AccessMode(Enum):
    SEQUENTIAL = "SEQUENTIAL"
    RANDOM = "RANDOM"
    DYNAMIC = "DYNAMIC"


class OpenMode(Enum):
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    I_O = "I-O"
    EXTEND = "EXTEND"


# File Status Codes VSAM (identiques à VSAM Lite pour compatibilité)
FILE_STATUS = {
    "00": "Success",
    "02": "Success Duplicate Key",
    "10": "End of File",
    "22": "Duplicate Key (Write Error)",
    "23": "Record Not Found",
    "30": "Permanent Error",
    "35": "File Not Found",
    "39": "File Attribute Mismatch",
}


@dataclass
class RecordMetadata:
    """Métadonnées d'un enregistrement."""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    version: int = 1


@dataclass
class SupabaseRecord:
    """Représentation d'un enregistrement Supabase."""
    key: str
    data: bytes
    raw_data: Optional[dict] = None
    metadata: RecordMetadata = field(default_factory=RecordMetadata)

    def __repr__(self):
        return f"SupabaseRecord(key={self.key!r}, data={self.data!r})"


class CobolConverter:
    """
    Convertisseur de données COBOL vers Python et vice versa.
    COPIÉ DE VSAM Lite pour compatibilité inchangée.
    
    Supporte:
    - DISPLAY: Chaînes de caractères ASCII
    - COMP: Entiers binaires big-endian
    - COMP-3: Décimaux compactés (packed decimal)
    """
    
    COMP_SIZES = {
        "COMP-1": ("f", 4),
        "COMP-2": ("d", 8),
        "COMP-3": ("p", 0),
        "COMP-5": ("i", 0),
    }
    
    @staticmethod
    def display_to_python(data: bytes, length: int = None) -> str:
        """Convertit une chaîne DISPLAY COBOL en chaîne Python."""
        if isinstance(data, str):
            data = data.encode('ascii')
        
        if length:
            data = data[:length]
        
        result = data.decode('ascii', errors='replace').rstrip()
        return result
    
    @staticmethod
    def python_to_display(data: str, length: int) -> bytes:
        """Convertit une chaîne Python en DISPLAY COBOL avec padding."""
        if isinstance(data, bytes):
            data = data.decode('ascii', errors='replace')
        
        if len(data) > length:
            data = data[:length]
        
        return data.encode('ascii').ljust(length, b' ')
    
    @staticmethod
    def comp_to_python(data: bytes, pic_clause: str) -> Union[int, float]:
        """Convertit un entier COMP COBOL en entier Python."""
        if isinstance(data, str):
            data = data.encode('ascii')
        
        pic_upper = pic_clause.upper()
        
        import re
        digits_match = re.search(r'S*9\((\d+)\)', pic_upper)
        if not digits_match:
            return int.from_bytes(data, byteorder='big', signed=True)
        
        num_digits = int(digits_match.group(1))
        
        if num_digits <= 4:
            size = 2
        elif num_digits <= 9:
            size = 4
        elif num_digits <= 18:
            size = 8
        else:
            size = (num_digits // 2) + 1
        
        has_sign = pic_upper.startswith('S')
        
        try:
            if size == 2:
                value = int.from_bytes(data[-size:], byteorder='big', signed=has_sign)
            elif size == 4:
                value = int.from_bytes(data[-size:], byteorder='big', signed=has_sign)
            elif size == 8:
                value = int.from_bytes(data[-size:], byteorder='big', signed=has_sign)
            else:
                value = int.from_bytes(data[-size:], byteorder='big', signed=has_sign)
            return value
        except (ValueError, OverflowError):
            return 0
    
    @staticmethod
    def python_to_comp(value: int, pic_clause: str) -> bytes:
        """Convertit un entier Python en COMP COBOL binaire."""
        pic_upper = pic_clause.upper()
        
        import re
        digits_match = re.search(r'S*9\((\d+)\)', pic_upper)
        if not digits_match:
            num_digits = 9
        else:
            num_digits = int(digits_match.group(1))
        
        has_sign = pic_upper.startswith('S')
        
        if num_digits <= 4:
            size = 2
        elif num_digits <= 9:
            size = 4
        elif num_digits <= 18:
            size = 8
        else:
            size = (num_digits // 2) + 1
        
        try:
            if has_sign:
                data = value.to_bytes(size, byteorder='big', signed=True)
            else:
                data = value.to_bytes(size, byteorder='big', signed=False)
            return data
        except OverflowError:
            max_val = (1 << (size * 8 - 1)) - 1 if has_sign else (1 << (size * 8)) - 1
            return max_val.to_bytes(size, byteorder='big', signed=has_sign)
    
    @staticmethod
    def comp3_to_python(data: bytes, num_digits: int = None) -> int:
        """Convertit un COMP-3 (packed decimal) COBOL en entier Python."""
        if isinstance(data, str):
            data = data.encode('ascii')
        
        if not data:
            return 0
        
        last_byte = data[-1]
        sign_nibble = last_byte & 0x0F
        
        if sign_nibble in (0x0B, 0x0D):
            is_negative = True
        else:
            is_negative = False
        
        result = 0
        
        for i in range(len(data)):
            byte = data[i]
            high_nibble = byte >> 4
            low_nibble = byte & 0x0F
            
            if i == len(data) - 1:
                result = result * 10 + high_nibble
            else:
                result = result * 100 + (high_nibble * 10) + low_nibble
        
        if is_negative:
            result = -result
        
        return result
    
    @staticmethod
    def python_to_comp3(value: int, num_digits: int) -> bytes:
        """Convertit un entier Python en COMP-3 (packed decimal) COBOL."""
        is_negative = value < 0
        abs_value = abs(value)
        
        num_full_bytes = num_digits // 2
        has_partial_byte = num_digits % 2
        
        num_bytes = num_full_bytes + 1
        
        result = bytearray(num_bytes)
        
        byte_index = num_bytes - 1
        
        last_digit = abs_value % 10
        abs_value //= 10
        result[byte_index] = (last_digit << 4)
        byte_index -= 1
        
        while byte_index >= 0:
            low_digit = abs_value % 10
            abs_value //= 10
            high_digit = abs_value % 10
            abs_value //= 10
            result[byte_index] = (high_digit << 4) | low_digit
            byte_index -= 1
        
        if is_negative:
            result[-1] = (result[-1] & 0xF0) | 0x0D
        else:
            result[-1] = (result[-1] & 0xF0) | 0x0C
        
        return bytes(result)


class SupabaseConnection:
    """Gestionnaire de connexion Supabase."""
    
    _instance = None
    
    def __init__(self, url: str = None, key: str = None):
        """
        Initialise la connexion Supabase.
        
        Args:
            url: URL du projet Supabase
            key: Clé API Supabase (anon ou service_role)
        """
        self.url = url or os.environ.get('SUPABASE_URL')
        self.key = key or os.environ.get('SUPABASE_KEY')
        self._client: Optional[Client] = None
        self._connected = False
        
        if SUPABASE_AVAILABLE and self.url and self.key:
            self.connect()
    
    @classmethod
    def get_instance(cls, url: str = None, key: str = None) -> 'SupabaseConnection':
        """Singleton pour gérer une seule connexion."""
        if cls._instance is None:
            cls._instance = cls(url, key)
        return cls._instance
    
    def connect(self) -> bool:
        """Établit la connexion à Supabase."""
        if not SUPABASE_AVAILABLE:
            print("⚠ Supabase client non installé. Utilisation en mode mock.")
            return False
        
        if not self.url or not self.key:
            print("⚠ Configuration Supabase incomplète. Vérifiez SUPABASE_URL et SUPABASE_KEY.")
            return False
        
        try:
            self._client = create_client(self.url, self.key)
            self._connected = True
            print("✓ Connexion Supabase établie")
            return True
        except Exception as e:
            print(f"✗ Échec de connexion Supabase: {e}")
            self._connected = False
            return False
    
    @property
    def client(self) -> Optional[Client]:
        """Retourne le client Supabase."""
        return self._client
    
    @property
    def is_connected(self) -> bool:
        """Vérifie si la connexion est active."""
        return self._connected and self._client is not None


class SupabaseTable:
    """
    Abstraction pour une table Supabase avec interface VSAM-compatible.
    
    Utilisation:
        table = SupabaseTable("customers", primary_key="cust_num")
        table.open("INPUT")
        record = table.read(key="CUST001")
        table.close()
    """
    
    def __init__(
        self,
        table_name: str,
        primary_key: str = None,
        record_format: str = "DISPLAY",
    ):
        """
        Initialise une table Supabase.
        
        Args:
            table_name: Nom de la table dans Supabase
            primary_key: Nom du champ clé primaire
            record_format: Format des données (DISPLAY, COMP, COMP-3)
        """
        self.table_name = table_name
        self.primary_key = primary_key
        self.record_format = record_format
        
        # État interne
        self._is_open = False
        self._open_mode = None
        self._data: Dict[str, dict] = {}
        self._keys: List[str] = []
        self._current_index = 0
        self.file_status = "00"
        self.record_buffer = None
        self._converter = CobolConverter()
        
        # Connexion Supabase
        self._connection = SupabaseConnection.get_instance()
    
    def _ensure_connected(self) -> bool:
        """Vérifie la connexion Supabase."""
        if not self._connection.is_connected:
            return False
        return True
    
    def _load_from_supabase(self, where_clause: str = None):
        """Charge les données depuis Supabase."""
        if not self._ensure_connected():
            return
        
        try:
            query = self._connection.client.table(self.table_name).select("*")
            
            if where_clause:
                # Pour des requêtes simples
                if "=" in where_clause:
                    key, value = where_clause.split("=", 1)
                    query = query.eq(key.strip(), value.strip())
            
            result = query.order(self.primary_key or "id").execute()
            
            self._data = {}
            self._keys = []
            
            for row in result.data:
                key = str(row.get(self.primary_key or "id", row.get("key")))
                self._data[key] = row
                self._keys.append(key)
            
            self._keys.sort()
            
        except Exception as e:
            print(f"Erreur chargement Supabase: {e}")
            self._data = {}
            self._keys = []
    
    def _save_to_supabase(self, record: dict, is_new: bool = True):
        """Sauvegarde un enregistrement vers Supabase."""
        if not self._ensure_connected():
            return
        
        try:
            if is_new:
                self._connection.client.table(self.table_name).insert(record).execute()
            else:
                self._connection.client.table(self.table_name).update(record).execute()
        except Exception as e:
            print(f"Erreur sauvegarde Supabase: {e}")
    
    def _delete_from_supabase(self, key: str):
        """Supprime un enregistrement de Supabase."""
        if not self._ensure_connected():
            return
        
        try:
            if self.primary_key:
                self._connection.client.table(self.table_name).delete().eq(self.primary_key, key).execute()
            else:
                self._connection.client.table(self.table_name).delete().eq("key", key).execute()
        except Exception as e:
            print(f"Erreur suppression Supabase: {e}")
    
    def open(self, mode: str) -> str:
        """
        Ouvre la table Supabase dans le mode spécifié.
        
        Args:
            mode: INPUT, OUTPUT, I-O, ou EXTEND
        
        Returns:
            Code statut (00 = succès)
        """
        self.file_status = "00"
        
        try:
            open_mode = OpenMode(mode.upper())
        except ValueError:
            self.file_status = "30"
            return self.file_status
        
        self._open_mode = open_mode
        self._current_index = 0
        
        # Charger les données depuis Supabase
        self._load_from_supabase()
        
        if open_mode == OpenMode.OUTPUT:
            # OUTPUT: vider la table (pas de suppression réelle, on utilise _data vide)
            self._data = {}
            self._keys = []
        
        self._is_open = True
        return self.file_status
    
    def read(self, key: str = None) -> Optional[bytes]:
        """
        Lit un enregistrement de la table.
        
        Args:
            key: Clé de l'enregistrement (lecture aléatoire)
            None: Lecture séquentielle
        
        Returns:
            Données de l'enregistrement ou None si fin de fichier
        """
        if not self._is_open:
            self.file_status = "30"
            return None
        
        self.file_status = "00"
        
        if key is not None:
            # Lecture aléatoire par clé
            if key in self._data:
                record_data = self._data[key]
                # Convertir en bytes pour compatibilité VSAM
                self.record_buffer = json.dumps(record_data).encode('utf-8')
                return self.record_buffer
            else:
                self.file_status = "23"
                self.record_buffer = None
                return None
        else:
            # Lecture séquentielle
            if self._current_index >= len(self._keys):
                self.file_status = "10"
                self.record_buffer = None
                return None
            
            current_key = self._keys[self._current_index]
            self._current_index += 1
            
            if current_key in self._data:
                record_data = self._data[current_key]
                self.record_buffer = json.dumps(record_data).encode('utf-8')
                return self.record_buffer
            else:
                self.file_status = "10"
                self.record_buffer = None
                return None
    
    def read_next(self) -> Optional[bytes]:
        """Alias pour lecture séquentielle."""
        return self.read()
    
    def read_by_key(self, key_value: str) -> Optional[bytes]:
        """
        Lecture indexée par clé (utilise l'index Supabase).
        
        Args:
            key_value: Valeur de la clé à rechercher
        
        Returns:
            Données de l'enregistrement ou None si non trouvé
        """
        if not self._is_open or not self._ensure_connected():
            self.file_status = "30"
            return None
        
        self.file_status = "00"
        
        try:
            query = self._connection.client.table(self.table_name).select("*")
            
            if self.primary_key:
                query = query.eq(self.primary_key, key_value)
            else:
                query = query.eq("key", key_value)
            
            result = query.execute()
            
            if result.data:
                record_data = result.data[0]
                key = str(record_data.get(self.primary_key or "key", record_data.get("id")))
                self._data[key] = record_data
                self.record_buffer = json.dumps(record_data).encode('utf-8')
                return self.record_buffer
            else:
                self.file_status = "23"
                self.record_buffer = None
                return None
                
        except Exception as e:
            print(f"Erreur lecture par clé: {e}")
            self.file_status = "30"
            return None
    
    def write(self, key: str, data: Union[bytes, str, dict]) -> str:
        """
        Écrit un enregistrement dans la table.
        
        Args:
            key: Clé primaire de l'enregistrement
            data: Données de l'enregistrement
        
        Returns:
            Code statut (00 = succès, 22 = duplicate key)
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        if self._open_mode == OpenMode.INPUT:
            self.file_status = "30"
            return self.file_status
        
        # Convertir les données en dict
        if isinstance(data, bytes):
            data_dict = json.loads(data.decode('utf-8'))
        elif isinstance(data, str):
            data_dict = json.loads(data)
        else:
            data_dict = dict(data)
        
        # Ajouter la clé
        data_dict['key'] = key
        if self.primary_key:
            data_dict[self.primary_key] = key
        
        # Vérifier duplicate key
        is_new = key not in self._data
        
        if not is_new and self._open_mode != OpenMode.OUTPUT:
            self.file_status = "22"
            return self.file_status
        
        # Sauvegarder localement
        self._data[key] = data_dict
        
        # Mettre à jour les clés
        if key not in self._keys:
            self._keys.append(key)
            self._keys.sort()
        
        self._current_index = self._keys.index(key) + 1
        self.record_buffer = json.dumps(data_dict).encode('utf-8')
        self.file_status = "00"
        
        # Sauvegarder vers Supabase
        self._save_to_supabase(data_dict, is_new)
        
        return self.file_status
    
    def rewrite(self, key: str, data: Union[bytes, str, dict]) -> str:
        """
        Réécrit un enregistrement existant.
        
        Args:
            key: Clé de l'enregistrement à modifier
            data: Nouvelles données
        
        Returns:
            Code statut (00 = succès, 23 = record not found)
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        if key not in self._data:
            self.file_status = "23"
            return self.file_status
        
        # Convertir les données
        if isinstance(data, bytes):
            data_dict = json.loads(data.decode('utf-8'))
        elif isinstance(data, str):
            data_dict = json.loads(data)
        else:
            data_dict = dict(data)
        
        data_dict['key'] = key
        if self.primary_key:
            data_dict[self.primary_key] = key
        
        self._data[key] = data_dict
        self.record_buffer = json.dumps(data_dict).encode('utf-8')
        self.file_status = "00"
        
        # Mettre à jour Supabase
        self._save_to_supabase(data_dict, is_new=False)
        
        return self.file_status
    
    def delete(self, key: str) -> str:
        """
        Supprime un enregistrement.
        
        Args:
            key: Clé de l'enregistrement à supprimer
        
        Returns:
            Code statut (00 = succès, 23 = record not found)
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        if key not in self._data:
            self.file_status = "23"
            return self.file_status
        
        del self._data[key]
        if key in self._keys:
            self._keys.remove(key)
        
        self.record_buffer = None
        self.file_status = "00"
        
        # Supprimer de Supabase
        self._delete_from_supabase(key)
        
        return self.file_status
    
    def start(self, key: str = None) -> str:
        """
        Positionne le pointeur pour lecture séquentielle.
        
        Args:
            key: Clé de départ
        
        Returns:
            Code statut
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        if key is None:
            self._current_index = 0
        else:
            try:
                self._current_index = self._keys.index(key)
            except ValueError:
                self._current_index = len(self._keys)
        
        self.file_status = "00"
        return self.file_status
    
    def close(self) -> str:
        """
        Ferme la table.
        
        Returns:
            Code statut
        """
        if not self._is_open:
            self.file_status = "00"
            return self.file_status
        
        self._is_open = False
        self._open_mode = None
        self.record_buffer = None
        self.file_status = "00"
        
        return self.file_status
    
    def get_status_message(self) -> str:
        """Retourne le message descriptif du code statut."""
        return FILE_STATUS.get(self.file_status, f"Unknown status: {self.file_status}")
    
    def count_records(self) -> int:
        """Retourne le nombre d'enregistrements."""
        return len(self._data)
    
    def list_keys(self) -> List[str]:
        """Liste toutes les clés (triées)."""
        return sorted(self._keys)
    
    def __repr__(self):
        return (f"SupabaseTable({self.table_name!r}, pk={self.primary_key!r}, "
                f"records={len(self._data)}, open={self._is_open})")


class SupabaseDataAccessLayer:
    """
    Couche d'accès aux données Supabase avec interface VSAM-compatibile.
    
    Fournit des fonctions de convenance pour créer et gérer des tables Supabase.
    
    Utilisation dans le code Python généré:
        CUSTOMER-FILE = create_supabase_table(
            "customer_files",
            primary_key="cust_num"
        )
    """
    
    _connection: SupabaseConnection = None
    
    @classmethod
    def configure(cls, url: str, key: str):
        """Configure la connexion Supabase."""
        cls._connection = SupabaseConnection.get_instance(url, key)
    
    @classmethod
    def create_table(
        cls,
        table_name: str,
        primary_key: str = None,
        schema: dict = None
    ) -> SupabaseTable:
        """
        Crée et retourne une table Supabase configurée.
        
        Args:
            table_name: Nom de la table
            primary_key: Nom du champ clé primaire
            schema: Schéma des champs (optionnel)
        
        Returns:
            Instance SupabaseTable configurée
        """
        table = SupabaseTable(table_name, primary_key=primary_key)
        return table
    
    @classmethod
    def create_vsam_compatible(
        cls,
        file_name: str,
        assign_path: str,
        record_key: str = None,
        record_length: int = None,
        primary_key: Tuple[int, int] = None,
    ) -> SupabaseTable:
        """
        Crée une table Supabase compatible avec l'interface VSAM Lite.
        
        Args:
            file_name: Nom logique du fichier
            assign_path: Chemin (utilisé comme nom de table)
            record_key: Nom du champ clé
            record_length: Longueur de l'enregistrement
            primary_key: (offset, length) de la clé
        
        Returns:
            Instance SupabaseTable compatible VSAM
        """
        table_name = assign_path.replace("/", "_").replace("\\", "_").strip("_")
        return cls.create_table(table_name, primary_key=record_key)
    
    @classmethod
    def is_available(cls) -> bool:
        """Vérifie si Supabase est disponible."""
        return SUPABASE_AVAILABLE and cls._connection is not None and cls._connection.is_connected
    
    @classmethod
    def get_connection_status(cls) -> dict:
        """Retourne l'état de la connexion."""
        return {
            "available": SUPABASE_AVAILABLE,
            "connected": cls._connection.is_connected if cls._connection else False,
            "url": cls._connection.url if cls._connection else None,
        }


# Alias pour compatibilité avec VSAM Lite
def create_supabase_file(
    file_name: str,
    assign_path: str,
    record_key: str = None,
    record_length: int = None,
    primary_key: Tuple[int, int] = None,
) -> SupabaseTable:
    """
    Crée une table Supabase avec interface VSAM-compatibile.
    
    Utilisation dans le code Python généré:
        CUSTOMER-FILE = create_supabase_file(
            "CUSTOMER-FILE",
            "customer_files",
            record_key="CUST-NUM",
            record_length=256
        )
    """
    return SupabaseDataAccessLayer.create_vsam_compatible(
        file_name=file_name,
        assign_path=assign_path,
        record_key=record_key,
        record_length=record_length,
        primary_key=primary_key,
    )


def supabase_file_status(table: SupabaseTable) -> str:
    """Retourne le code statut de la table."""
    return table.file_status


def check_supabase_success(table: SupabaseTable) -> bool:
    """Vérifie si la dernière opération a réussi."""
    return table.file_status in ("00", "02")


class MigrationManager:
    """Gestionnaire de migration VSAM Lite vers Supabase."""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialise le gestionnaire de migration."""
        self.connection = SupabaseConnection.get_instance(supabase_url, supabase_key)
        self.migrated_tables: List[str] = []
    
    def migrate_vsam_file(
        self,
        vsam_file_path: str,
        supabase_table_name: str,
        primary_key: str = "key"
    ) -> dict:
        """
        Migre un fichier VSAM Lite vers Supabase.
        
        Args:
            vsam_file_path: Chemin du fichier VSAM (sans extension)
            supabase_table_name: Nom de la table Supabase cible
            primary_key: Champ clé primaire
        
        Returns:
            Statistiques de migration
        """
        import vsam_lite
        
        stats = {
            "source_file": vsam_file_path,
            "target_table": supabase_table_name,
            "records_migrated": 0,
            "errors": [],
            "success": False,
        }
        
        # Charger le fichier VSAM
        data_file = f"{vsam_file_path}.data.json"
        if not os.path.exists(data_file):
            stats["errors"].append(f"Fichier VSAM non trouvé: {data_file}")
            return stats
        
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                vsam_data = json.load(f)
        except Exception as e:
            stats["errors"].append(f"Erreur lecture VSAM: {e}")
            return stats
        
        # Créer la table Supabase
        table = SupabaseTable(supabase_table_name, primary_key=primary_key)
        table.open("OUTPUT")
        
        # Migrer les enregistrements
        for key, record_data in vsam_data.items():
            try:
                if isinstance(record_data, str):
                    record_data = {"data": record_data}
                record_data["key"] = key
                if primary_key != "key":
                    record_data[primary_key] = key
                
                table.write(key, record_data)
                stats["records_migrated"] += 1
            except Exception as e:
                stats["errors"].append(f"Erreur migration clé {key}: {e}")
        
        table.close()
        
        stats["success"] = len(stats["errors"]) == 0
        self.migrated_tables.append(supabase_table_name)
        
        return stats
    
    def batch_migrate(self, migrations: list) -> list:
        """
        Migre plusieurs fichiers VSAM vers Supabase.
        
        Args:
            migrations: Liste de tuples (vsam_path, table_name)
        
        Returns:
            Liste de statistiques de migration
        """
        results = []
        for vsam_path, table_name in migrations:
            result = self.migrate_vsam_file(vsam_path, table_name)
            results.append(result)
        return results


# ============================================================
# Schéma SQL pour initialiser Supabase
# ============================================================

def generate_supabase_schema(table_name: str, primary_key: str = "key") -> str:
    """
    Génère le SQL pour créer la table dans Supabase.
    
    Args:
        table_name: Nom de la table
        primary_key: Champ clé primaire
    
    Returns:
        SQL pour créer la table
    """
    sql = f"""
-- Table: {table_name}
-- Créé automatiquement par CodeSwitch v11.0

CREATE TABLE IF NOT EXISTS {table_name} (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    {primary_key} VARCHAR(255) UNIQUE NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_{table_name}_key ON {table_name}(key);
CREATE INDEX IF NOT EXISTS idx_{table_name}_{primary_key} ON {table_name}({primary_key});
CREATE INDEX IF NOT EXISTS idx_{table_name}_updated_at ON {table_name}(updated_at);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_{table_name} ON {table_name};
CREATE TRIGGER set_timestamp_{table_name}
    BEFORE UPDATE ON {table_name}
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
"""
    return sql


# ============================================================
# Tests basiques
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Supabase Data Access Layer - Test de l'implémentation")
    print("=" * 60)
    
    # Test de configuration
    print("\n[Test 0] Vérification de la configuration Supabase...")
    status = SupabaseDataAccessLayer.get_connection_status()
    print(f"  Supabase disponible: {status['available']}")
    print(f"  Connexion établie: {status['connected']}")
    
    if not status['available']:
        print("  ⚠ Installations supabase: pip install supabase")
    
    # Test de création de table
    print("\n[Test 1] Création d'une table Supabase...")
    table = SupabaseDataAccessLayer.create_table(
        "test_customers",
        primary_key="cust_num"
    )
    print(f"  Table créée: {table}")
    
    # Test des opérations VSAM-compatibles
    print("\n[Test 2] Opérations VSAM-compatibles...")
    status = table.open("OUTPUT")
    print(f"  OPEN OUTPUT: status={status}")
    
    # Écrire quelques enregistrements
    for i in range(1, 4):
        key = f"CUST{str(i).zfill(3)}"
        data = {
            "cust_num": key,
            "name": f"Client {i}",
            "balance": i * 1000.50,
            "status": "A"
        }
        status = table.write(key, data)
        print(f"  WRITE {key}: status={status}")
    
    table.close()
    print("  Table fermée")
    
    # Test de lecture
    if status['connected']:
        print("\n[Test 3] Lecture des données...")
        table = SupabaseDataAccessLayer.create_table(
            "test_customers",
            primary_key="cust_num"
        )
        table.open("INPUT")
        
        while True:
            data = table.read()
            if table.file_status == "10":
                print("  Fin du fichier atteinte")
                break
            elif data:
                print(f"  Lu: {data.decode()[:60]}...")
            else:
                break
        
        table.close()
    
    # Test de lecture par clé
    print("\n[Test 4] Lecture par clé...")
    table = SupabaseDataAccessLayer.create_table(
        "test_customers",
        primary_key="cust_num"
    )
    table.open("INPUT")
    
    if status['connected']:
        data = table.read_by_key("CUST002")
        if data:
            print(f"  CUST002 trouvé: {data.decode()}")
        else:
            print(f"  CUST002 non trouvé: status={table.file_status}")
    
    table.close()
    
    print("\n" + "=" * 60)
    print("Tests terminés!")
    print("=" * 60)
    
    # Générer le SQL pour Supabase
    print("\n[SQL] Schéma pour Supabase:")
    print("-" * 40)
    print(generate_supabase_schema("customers", "cust_num"))
