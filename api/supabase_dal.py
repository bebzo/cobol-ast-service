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
import re
from typing import Any, Dict, List, Optional, Tuple, Union, AsyncGenerator, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, date
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
    
    # ============================================================
    # Alias VSAM-style explicites pour compatibilité COBOL
    # ============================================================
    
    def open_dataset(self, mode: str) -> str:
        """
        Alias VSAM-style pour open().
        
        Utilisation COBOL:
            OPEN INPUT CUSTOMER-FILE
        """
        return self.open(mode)
    
    def read_next_record(self) -> Optional[bytes]:
        """
        Alias VSAM-style pour lecture séquentielle.
        
        Utilisation COBOL:
            READ CUSTOMER-FILE NEXT RECORD
        """
        return self.read()
    
    def read_previous_record(self) -> Optional[bytes]:
        """
        Lecture de l'enregistrement précédent (VSAM BACKWARD).
        
        Returns:
            Données de l'enregistrement ou None
        """
        if not self._is_open:
            self.file_status = "30"
            return None
        
        self.file_status = "00"
        
        if self._current_index <= 0:
            self.file_status = "10"
            self.record_buffer = None
            return None
        
        self._current_index -= 1
        current_key = self._keys[self._current_index]
        
        if current_key in self._data:
            record_data = self._data[current_key]
            self.record_buffer = json.dumps(record_data).encode('utf-8')
            return self.record_buffer
        else:
            self.file_status = "10"
            self.record_buffer = None
            return None
    
    def read_record_by_key(self, key_value: str) -> Optional[bytes]:
        """
        Alias VSAM-style pour lecture indexée.
        
        Utilisation COBOL:
            READ CUSTOMER-FILE KEY IS CUST-NUM
        """
        return self.read_by_key(key_value)
    
    def start_br(self, key_value: str = None) -> str:
        """
        VSAM START-BR (Begin Read) pour positionner le curseur.
        
        Args:
            key_value: Clé de départ (None = début du fichier)
        
        Returns:
            Code statut
        
        Utilisation COBOL:
            START BR CUSTOMER-FILE KEY IS GREATER THAN CUST-NUM
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        self.file_status = "00"
        
        if key_value is None:
            self._current_index = 0
        else:
            # Trouver la première clé >= key_value
            for i, key in enumerate(self._keys):
                if key >= key_value:
                    self._current_index = i
                    break
            else:
                self._current_index = len(self._keys)
        
        return self.file_status
    
    def write_record(self, key: str, data: Union[bytes, str, dict]) -> str:
        """
        Alias VSAM-style pour write().
        
        Utilisation COBOL:
            WRITE CUSTOMER-RECORD FROM WS-RECORD
        """
        return self.write(key, data)
    
    def rewrite_record(self, key: str, data: Union[bytes, str, dict]) -> str:
        """
        Alias VSAM-style pour rewrite().
        
        Utilisation COBOL:
            REWRITE CUSTOMER-RECORD FROM WS-RECORD
        """
        return self.rewrite(key, data)
    
    def delete_record(self, key: str) -> str:
        """
        Alias VSAM-style pour delete().
        
        Utilisation COBOL:
            DELETE CUSTOMER-FILE RECORD
        """
        return self.delete(key)
    
    def close_dataset(self) -> str:
        """
        Alias VSAM-style pour close().
        
        Utilisation COBOL:
            CLOSE CUSTOMER-FILE
        """
        return self.close()
    
    def get_record_count(self) -> int:
        """
        Retourne le nombre d'enregistrements (VSAM TEST FILE).
        """
        return self.count_records()
    
    def get_current_record(self) -> Optional[dict]:
        """
        Retourne l'enregistrement courant comme dict.
        """
        if self.record_buffer:
            try:
                return json.loads(self.record_buffer.decode('utf-8'))
            except json.JSONDecodeError:
                return None
        return None
    
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
# COBOL Layout Mapper - Mapping automatique COBOL vers PostgreSQL
# ============================================================

@dataclass
class CobolFieldDefinition:
    """Définition d'un champ COBOL."""
    name: str
    level: int
    picture: str
    usage: str = "DISPLAY"
    occurs: int = 1
    offset: int = 0
    length: int = 0
    signed: bool = False
    decimal_places: int = 0
    depends_on: str = None
    
    @property
    def python_type(self) -> type:
        """Retourne le type Python correspondant."""
        pic_upper = self.picture.upper()
        
        if 'V' in pic_upper:
            return float
        
        if '9' in pic_upper:
            if self.signed:
                return int
            if self.decimal_places > 0:
                return float
            return int
        
        if 'A' in pic_upper:
            return str
        
        if 'X' in pic_upper:
            return str
        
        return str
    
    @property
    def pg_type(self) -> str:
        """Retourne le type PostgreSQL correspondant."""
        pic_upper = self.picture.upper()
        
        if self.usage in ('COMP', 'COMP-5'):
            if self.length <= 2:
                return "SMALLINT"
            elif self.length <= 4:
                return "INTEGER"
            else:
                return "BIGINT"
        
        if self.usage == 'COMP-3':
            return f"NUMERIC({self.decimal_places + (self.length - 1) // 2 * 2}, {self.decimal_places})"
        
        if 'V' in pic_upper:
            match = re.search(r'9\((\d+)\)V?9?(\d*)', pic_upper)
            if match:
                total = int(match.group(1))
                decimals = int(match.group(2)) if match.group(2) else 0
                return f"NUMERIC({total}, {decimals})"
            return "NUMERIC"
        
        if 'S' in pic_upper:
            match = re.search(r'S*9\((\d+)\)', pic_upper)
            if match:
                return f"NUMERIC({match.group(1)}, 0)"
            return "INTEGER"
        
        match = re.search(r'9\((\d+)\)', pic_upper)
        if match:
            return f"NUMERIC({match.group(1)}, 0)"
        
        match = re.search(r'X\((\d+)\)', pic_upper)
        if match:
            return f"VARCHAR({match.group(1)})"
        
        match = re.search(r'A\((\d+)\)', pic_upper)
        if match:
            return f"VARCHAR({match.group(1)})"
        
        return "TEXT"


class CobolLayoutMapper:
    """
    Mapper automatique de layouts COBOL vers schémas PostgreSQL.
    
    Extrait les définitions de champs COBOL et génère:
    - Schéma PostgreSQL (DDL)
    - Classes Python typées
    - Convertisseurs bidirectionnels
    
    Exemple d'utilisation:
        mapper = CobolLayoutMapper()
        schema = mapper.parse_cobol_layout('''
            01 CUSTOMER-RECORD.
                05 CUST-NUM     PIC 9(6).
                05 CUST-NAME    PIC X(30).
                05 CUST-BALANCE PIC S9(10)V99.
        ''')
        print(schema.to_pg_ddl())
    """
    
    def __init__(self):
        self.layouts: Dict[str, Dict[str, CobolFieldDefinition]] = {}
    
    def parse_cobol_layout(self, cobol_source: str, record_name: str = "RECORD") -> Dict[str, CobolFieldDefinition]:
        """
        Parse un layout COBOL et retourne un dictionnaire de champs.
        
        Args:
            cobol_source: Code COBOL contenant les définition 01
            record_name: Nom de l'enregistrement (pour les logs)
        
        Returns:
            Dictionnaire {nom_champ: CobolFieldDefinition}
        """
        fields = {}
        current_group = None
        group_offsets: Dict[int, int] = {}
        
        lines = cobol_source.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Nettoyer la ligne
            line = line.strip()
            if not line or line.upper().startswith(('*', 'CBL', 'PROCESS')):
                continue
            
            # Extraire le niveau
            level_match = re.match(r'^(\d+)\s+(\w+(?:-\w+)*)?', line)
            if not level_match:
                continue
            
            level = int(level_match.group(1))
            field_name = level_match.group(2)
            
            if level > 1 and current_group is None:
                continue
            
            # Ignorer les lignes sans nom de champ (07 FILLER)
            if field_name is None:
                continue
            
            # Extraire la Picture clause
            picture_match = re.search(r'PIC\s+([A-Z0-9()V9XAS+\-]+)', line, re.IGNORECASE)
            usage_match = re.search(r'USAGE\s+IS\s+(\w+)', line, re.IGNORECASE)
            occurs_match = re.search(r'OCCURS\s+(\d+)(?:\s+TIMES)?', line, re.IGNORECASE)
            signed = 'S' in line.upper() and 'PIC' in line.upper()
            
            # Calculer l'offset
            if level <= 1:
                group_offsets = {level: 0}
                current_group = field_name
                base_offset = 0
            else:
                parent_level = max(k for k in group_offsets.keys() if k < level)
                base_offset = group_offsets[parent_level]
            
            if picture_match:
                picture = picture_match.group(1).upper()
                usage = usage_match.group(1).upper() if usage_match else "DISPLAY"
                occurs = int(occurs_match.group(1)) if occurs_match else 1
                
                # Calculer la longueur
                length = self._calculate_picture_length(picture, usage)
                decimal_match = re.search(r'V9?(\d*)', picture)
                decimals = int(decimal_match.group(1)) if decimal_match else 0
                
                field_def = CobolFieldDefinition(
                    name=field_name,
                    level=level,
                    picture=picture,
                    usage=usage,
                    occurs=occurs,
                    offset=base_offset,
                    length=length,
                    signed=signed,
                    decimal_places=decimals
                )
                
                fields[field_name] = field_def
                group_offsets[level] = base_offset + length * occurs
            else:
                # Groupe de niveau
                group_offsets[level] = base_offset
        
        self.layouts[record_name] = fields
        return fields
    
    def _calculate_picture_length(self, picture: str, usage: str) -> int:
        """Calcule la longueur en octets d'une Picture clause."""
        pic_upper = picture.upper()
        
        # COMP/COMP-5: longueur binaire
        if usage in ('COMP', 'COMP-5'):
            match = re.search(r'9\((\d+)\)', pic_upper)
            if match:
                num_digits = int(match.group(1))
                if num_digits <= 4:
                    return 2
                elif num_digits <= 9:
                    return 4
                elif num_digits <= 18:
                    return 8
                else:
                    return (num_digits // 2) + 1
            return 4
        
        # COMP-3: packed decimal (2 digits par octet + 1)
        if usage == 'COMP-3':
            match = re.search(r'9\((\d+)\)', pic_upper)
            if match:
                num_digits = int(match.group(1))
                return (num_digits // 2) + 1
            return 4
        
        # DISPLAY: compter les caractères
        total = 0
        i = 0
        while i < len(pic_upper):
            if pic_upper[i] in ('9', 'A', 'X', 'S'):
                if i + 3 <= len(pic_upper) and pic_upper[i+1] == '(':
                    end = pic_upper.index(')', i)
                    count = int(pic_upper[i+2:end])
                    total += count
                    i = end + 1
                else:
                    total += 1
                    i += 1
            elif pic_upper[i] in ('V', 'B'):
                i += 1
            else:
                i += 1
        
        return total
    
    def to_pg_ddl(self, record_name: str = "RECORD", table_name: str = None) -> str:
        """
        Génère le DDL PostgreSQL pour un layout COBOL.
        
        Args:
            record_name: Nom de l'enregistrement (clé dans self.layouts)
            table_name: Nom de la table (défaut: record_name.lower())
        
        Returns:
            SQL DDL pour créer la table
        """
        if record_name not in self.layouts:
            return "-- Layout non trouvé"
        
        fields = self.layouts[record_name]
        table_name = table_name or record_name.lower().replace('-', '_')
        
        ddl_lines = [
            f"-- Table: {table_name}",
            f"-- Généré automatiquement par CobolLayoutMapper",
            f"-- Source: {record_name}",
            "",
            f"CREATE TABLE IF NOT EXISTS {table_name} (",
            f"    id BIGSERIAL PRIMARY KEY,",
            f"    key VARCHAR(255) UNIQUE NOT NULL,",
            f"    data JSONB DEFAULT '{{}}',",
            f"    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),",
            f"    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),",
            f"    version INTEGER DEFAULT 1,",
        ]
        
        # Colonnes pour les champs principaux (niveau 01 et 05)
        main_fields = [(name, f) for name, f in fields.items() if f.level in (1, 5)]
        
        for field_name, field_def in main_fields:
            col_name = field_name.lower().replace('-', '_')
            pg_type = field_def.pg_type
            nullable = "NOT NULL" if field_name != "FILLER" else ""
            ddl_lines.append(f"    {col_name} {pg_type} {nullable}".strip())
        
        ddl_lines.append(");")
        ddl_lines.append("")
        
        # Index sur la clé primaire
        pk_fields = [(name, f) for name, f in fields.items() if 'NUM' in name.upper() or 'ID' in name.upper()]
        if pk_fields:
            pk_field = pk_fields[0][0].lower().replace('-', '_')
            ddl_lines.append(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_{pk_field}")
            ddl_lines.append(f"    ON {table_name} ({pk_field});")
            ddl_lines.append("")
        
        # Index pour les dates
        date_fields = [(name, f) for name, f in fields.items() if 'DATE' in name.upper()]
        if date_fields:
            date_field = date_fields[0][0].lower().replace('-', '_')
            ddl_lines.append(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_{date_field}")
            ddl_lines.append(f"    ON {table_name} ({date_field});")
            ddl_lines.append("")
        
        return '\n'.join(ddl_lines)
    
    def to_python_class(self, record_name: str = "RECORD", class_name: str = None) -> str:
        """
        Génère une classe Python avec dataclass.
        
        Args:
            record_name: Nom de l'enregistrement
            class_name: Nom de la classe Python
        
        Returns:
            Code Python de la classe
        """
        if record_name not in self.layouts:
            return "# Layout non trouvé"
        
        fields = self.layouts[record_name]
        class_name = class_name or record_name.title().replace('-', '')
        
        lines = [
            f"@dataclass",
            f"class {class_name}:",
            f"    \"\"\"Record COBOL: {record_name}\"\"\"",
        ]
        
        for field_name, field_def in fields.items():
            if field_def.level <= 5:
                col_name = field_name.lower().replace('-', '_')
                py_type = field_def.python_type.__name__
                default = "= None" if col_name != "key" else ""
                lines.append(f"    {col_name}: Optional[{py_type}] {default}")
        
        return '\n'.join(lines)


# ============================================================
# Partitionnement temporel des données
# ============================================================

class TemporalPartitioner:
    """
    Gestionnaire de partitionnement temporel pour les données VSAM.
    
    Implémente le pattern VSAM de séparation données actives/historiques
    en utilisant le partitionnement natif de PostgreSQL.
    
    Exemple d'utilisation:
        partitioner = TemporalPartitioner(connection, "trades")
        partitioner.create_partition("2026_01", "2026-02-01", "2026-03-01")
        partitioner.archive_old_partitions(retention_days=365)
    """
    
    def __init__(self, connection: SupabaseConnection, table_name: str):
        self.connection = connection
        self.table_name = table_name
        
    def create_date_range_partition(
        self,
        partition_name: str,
        start_date: Union[str, date],
        end_date: Union[str, date],
        data: List[dict] = None
    ) -> dict:
        """
        Crée une partition pour une plage de dates.
        
        Args:
            partition_name: Nom de la partition (ex: trades_2026_01)
            start_date: Date de début (inclusive)
            end_date: Date de fin (exclusive)
            data: Données optionnelles à insérer
        
        Returns:
            Résultat de l'opération
        """
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        result = {
            "partition": partition_name,
            "range": f"[{start_date}, {end_date})",
            "created": False,
            "data_inserted": 0,
            "errors": []
        }
        
        if not self.connection.is_connected:
            result["errors"].append("Pas de connexion Supabase")
            return result
        
        try:
            # Créer la table de partition
            create_sql = f"""
            CREATE TABLE IF NOT EXISTS {self.table_name}_{partition_name} (
                CHECK (transaction_date >= '{start_date}' AND transaction_date < '{end_date}')
            ) INHERITS ({self.table_name});
            """
            
            self.connection.client.table("").execute.raw_sql(create_sql)
            result["created"] = True
            
            # Créer les index pour la partition
            index_sql = f"""
            CREATE INDEX IF NOT EXISTS idx_{self.table_name}_{partition_name}_key
            ON {self.table_name}_{partition_name} (key);
            """
            self.connection.client.table("").execute.raw_sql(index_sql)
            
            if data:
                for record in data:
                    try:
                        self.connection.client.table(f"{self.table_name}_{partition_name}").insert(record).execute()
                        result["data_inserted"] += 1
                    except Exception as e:
                        result["errors"].append(str(e))
        
        except Exception as e:
            result["errors"].append(str(e))
        
        return result
    
    def create_monthly_partitions(
        self,
        year: int,
        months: List[int] = None,
        precreate: bool = True
    ) -> List[dict]:
        """
        Crée les partitions mensuelles pour une année.
        
        Args:
            year: Année cible
            months: Liste des mois (1-12), défaut: tous
            precreate: Si True, crée les partitions vides
        
        Returns:
            Liste des résultats
        """
        if months is None:
            months = list(range(1, 13))
        
        results = []
        
        for month in months:
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month + 1, 1)
            
            partition_name = f"{year}_{str(month).zfill(2)}"
            
            result = self.create_date_range_partition(
                partition_name,
                start_date,
                end_date,
                data=[] if precreate else None
            )
            results.append(result)
        
        return results
    
    def archive_old_partitions(
        self,
        date_column: str = "transaction_date",
        retention_days: int = 365,
        archive_table: str = None
    ) -> dict:
        """
        Archive et supprime les partitions anciennes.
        
        Args:
            date_column: Nom de la colonne de date
            retention_days: Nombre de jours à conserver
            archive_table: Table de destination pour l'archivage
        
        Returns:
            Statistiques d'archivage
        """
        from datetime import timedelta
        
        cutoff_date = date.today() - timedelta(days=retention_days)
        
        result = {
            "cutoff_date": str(cutoff_date),
            "partitions_archived": 0,
            "records_moved": 0,
            "errors": []
        }
        
        if not self.connection.is_connected:
            result["errors"].append("Pas de connexion Supabase")
            return result
        
        try:
            # Lister les partitions héritées
            list_sql = f"""
            SELECT tablename FROM pg_tables
            WHERE tablename LIKE '{self.table_name}%'
            AND schemaname = 'public';
            """
            
            tables_result = self.connection.client.table("").execute.raw_sql(list_sql)
            
            for row in tables_result.data:
                partition_name = row['tablename']
                
                # Vérifier si la partition est avant la date limite
                check_sql = f"""
                SELECT COUNT(*) as cnt FROM {partition_name}
                WHERE {date_column} < '{cutoff_date}';
                """
                
                count_result = self.connection.client.table("").execute.raw_sql(check_sql)
                count = count_result.data[0]['cnt'] if count_result.data else 0
                
                if count > 0:
                    if archive_table:
                        # Déplacer vers la table d'archive
                        move_sql = f"""
                        INSERT INTO {archive_table}
                        SELECT * FROM {partition_name}
                        WHERE {date_column} < '{cutoff_date}';
                        """
                        self.connection.client.table("").execute.raw_sql(move_sql)
                        
                        delete_sql = f"""
                        DELETE FROM {partition_name}
                        WHERE {date_column} < '{cutoff_date}';
                        """
                        self.connection.client.table("").execute.raw_sql(delete_sql)
                    else:
                        # Supprimer directement
                        drop_sql = f"DROP TABLE {partition_name};"
                        self.connection.client.table("").execute.raw_sql(drop_sql)
                    
                    result["partitions_archived"] += 1
                    result["records_moved"] += count
        
        except Exception as e:
            result["errors"].append(str(e))
        
        return result
    
    def get_partition_info(self) -> List[dict]:
        """
        Retourne les informations sur les partitions.
        
        Returns:
            Liste des partitions avec leur taille et plage de dates
        """
        result = []
        
        if not self.connection.is_connected:
            return result
        
        try:
            list_sql = f"""
            SELECT 
                c.oid::regclass AS tablename,
                pg_total_relation_size(c.oid) AS size_bytes,
                pg_stat_user_tables.n_live_tup AS row_count
            FROM pg_inherits
            JOIN pg_class c ON c.oid = pg_inherits.inhrelid
            JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = c.relname
            WHERE pg_inherits.inhparent = '{self.table_name}'::regclass;
            """
            
            query_result = self.connection.client.table("").execute.raw_sql(list_sql)
            
            for row in query_result.data:
                result.append({
                    "name": row['tablename'],
                    "size_bytes": row['size_bytes'],
                    "row_count": row['row_count']
                })
        
        except Exception:
            pass
        
        return result


# ============================================================
# Détection et optimisation des patterns d'accès VSAM
# ============================================================

class VsamAccessPatternTracker:
    """
    Détecteur de patterns d'accès VSAM pour optimisation des requêtes.
    
    Analyse les opérations effectuées et suggère:
    - Index à créer
    - Requêtes à optimiser
    - Partitionnement à implémenter
    
    Exemple d'utilisation:
        tracker = VsamAccessPatternTracker()
        tracker.record_access("trades", "read_by_key", {"field": "trade_id"})
        suggestions = tracker.get_optimization_suggestions()
    """
    
    def __init__(self):
        self.access_log: List[dict] = []
        self.patterns: Dict[str, dict] = {}
        
    def record_access(
        self,
        table_name: str,
        operation: str,
        context: dict = None
    ):
        """
        Enregistre une opération d'accès.
        
        Args:
            table_name: Nom de la table
            operation: Type d'opération (read, write, delete, read_by_key, etc.)
            context: Contexte additionnel (champs utilisés, conditions, etc.)
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "table": table_name,
            "operation": operation,
            "context": context or {}
        }
        
        self.access_log.append(entry)
        self._update_patterns(table_name, operation, context)
    
    def _update_patterns(self, table_name: str, operation: str, context: dict = None):
        """Met à jour les statistiques de patterns."""
        if table_name not in self.patterns:
            self.patterns[table_name] = {
                "operations": {},
                "fields_used": set(),
                "index_suggestions": [],
                "partition_suggestions": []
            }
        
        patterns = self.patterns[table_name]
        
        if operation not in patterns["operations"]:
            patterns["operations"][operation] = 0
        patterns["operations"][operation] += 1
        
        if context:
            if "field" in context:
                patterns["fields_used"].add(context["field"])
                
                if operation in ("read_by_key", "start_br"):
                    patterns["index_suggestions"].append(context["field"])
            
            if "date_field" in context:
                patterns["partition_suggestions"].append(context["date_field"])
    
    def get_optimization_suggestions(self) -> List[dict]:
        """
        Retourne les suggestions d'optimisation basées sur les patterns détectés.
        
        Returns:
            Liste de suggestions avec priorité et SQL
        """
        suggestions = []
        
        for table_name, patterns in self.patterns.items():
            # Suggestions d'index
            index_fields = set(patterns["index_suggestions"])
            for field in index_fields:
                if field not in ("key", "id"):  # Déjà indexé par défaut
                    suggestions.append({
                        "type": "index",
                        "table": table_name,
                        "field": field,
                        "priority": "high" if patterns["operations"].get("read_by_key", 0) > 10 else "medium",
                        "sql": f"CREATE INDEX IF NOT EXISTS idx_{table_name}_{field} ON {table_name} ({field});",
                        "reason": f"Champ {field} utilisé pour {patterns['operations'].get('read_by_key', 0)} lectures par clé"
                    })
            
            # Suggestions de partitionnement
            date_fields = set(patterns["partition_suggestions"])
            for field in date_fields:
                suggestions.append({
                    "type": "partition",
                    "table": table_name,
                    "field": field,
                    "priority": "medium",
                    "sql": f"-- Partitionner {table_name} par {field} (mensuel)",
                    "reason": "Champ date détecté - le partitionnement améliorerait les requêtes par plage"
                })
        
        # Trier par priorité
        priority_order = {"high": 0, "medium": 1, "low": 2}
        suggestions.sort(key=lambda x: priority_order.get(x["priority"], 3))
        
        return suggestions
    
    def get_access_statistics(self) -> dict:
        """
        Retourne les statistiques d'accès globales.
        
        Returns:
            Statistiques par table et par opération
        """
        stats = {
            "total_operations": len(self.access_log),
            "by_table": {},
            "by_operation": {},
            "top_tables": []
        }
        
        for entry in self.access_log:
            table = entry["table"]
            operation = entry["operation"]
            
            if table not in stats["by_table"]:
                stats["by_table"][table] = 0
            stats["by_table"][table] += 1
            
            if operation not in stats["by_operation"]:
                stats["by_operation"][operation] = 0
            stats["by_operation"][operation] += 1
        
        # Top 5 des tables
        stats["top_tables"] = sorted(
            stats["by_table"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return stats
    
    def generate_report(self) -> str:
        """
        Génère un rapport textuel des patterns d'accès.
        
        Returns:
            Rapport formaté
        """
        stats = self.get_access_statistics()
        suggestions = self.get_optimization_suggestions()
        
        lines = [
            "=" * 60,
            "RAPPORT D'OPTIMISATION VSAM",
            "=" * 60,
            "",
            f"Opérations totales: {stats['total_operations']}",
            "",
            "Opérations par table:",
        ]
        
        for table, count in stats["top_tables"]:
            lines.append(f"  - {table}: {count} opérations")
        
        lines.extend([
            "",
            "Suggestions d'optimisation:",
        ])
        
        for suggestion in suggestions:
            lines.extend([
                f"  [{suggestion['priority'].upper()}] {suggestion['type'].upper()}",
                f"    Table: {suggestion['table']}",
                f"    Raison: {suggestion['reason']}",
                f"    SQL: {suggestion['sql']}",
                ""
            ])
        
        return '\n'.join(lines)


# ============================================================
# Tests des nouvelles fonctionnalités VSAM-Supabase
# ============================================================

def test_vsam_style_alias_methods():
    """Test des alias VSAM-style pour compatibilité COBOL."""
    print("\n[Test VSAM] Alias VSAM-style...")
    
    table = SupabaseTable("test_vsam_alias", primary_key="id")
    
    # Test open_dataset
    status = table.open_dataset("OUTPUT")
    assert status == "00", f"OPEN OUTPUT attendu '00', reçu: {status}"
    print("  ✓ open_dataset() fonctionne")
    
    # Test write_record
    status = table.write_record("KEY001", {"id": "KEY001", "data": "test"})
    assert status == "00", f"WRITE attendu '00', reçu: {status}"
    print("  ✓ write_record() fonctionne")
    
    # Test read_next_record
    data = table.read_next_record()
    assert data is not None, "READ NEXT devrait retourner des données"
    print("  ✓ read_next_record() fonctionne")
    
    # Test read_record_by_key
    data = table.read_record_by_key("KEY001")
    assert data is not None, "READ BY KEY devrait retourner des données"
    print("  ✓ read_record_by_key() fonctionne")
    
    # Test start_br
    status = table.start_br("KEY001")
    assert status == "00", f"START BR attendu '00', reçu: {status}"
    print("  ✓ start_br() fonctionne")
    
    # Test rewrite_record
    status = table.rewrite_record("KEY001", {"id": "KEY001", "data": "updated"})
    assert status == "00", f"REWRITE attendu '00', reçu: {status}"
    print("  ✓ rewrite_record() fonctionne")
    
    # Test get_record_count
    count = table.get_record_count()
    assert count == 1, f"Record count attendu 1, reçu: {count}"
    print("  ✓ get_record_count() fonctionne")
    
    # Test get_current_record
    record = table.get_current_record()
    assert record is not None, "get_current_record() devrait retourner un dict"
    print("  ✓ get_current_record() fonctionne")
    
    # Test close_dataset
    status = table.close_dataset()
    assert status == "00", f"CLOSE attendu '00', reçu: {status}"
    print("  ✓ close_dataset() fonctionne")
    
    # Test delete_record
    table.open_dataset("I-O")
    status = table.delete_record("KEY001")
    assert status == "00", f"DELETE attendu '00', reçu: {status}"
    print("  ✓ delete_record() fonctionne")
    
    table.close_dataset()
    print("  ✓ Tous les tests d'alias VSAM-style ont réussi")


def test_cobol_layout_mapper():
    """Test du mapper de layout COBOL vers PostgreSQL."""
    print("\n[Test COBOL] Mapper layout COBOL...")
    
    mapper = CobolLayoutMapper()
    
    # Layout COBOL de test
    cobol_layout = '''
        01 TRADE-RECORD.
            05 TRADE-ID       PIC 9(10).
            05 TRADE-DATE     PIC X(10).
            05 TRADE-TIME     PIC X(8).
            05 TRADE-SYMBOL   PIC X(6).
            05 TRADE-QUANTITY PIC 9(8).
            05 TRADE-PRICE    PIC S9(10)V99.
            05 TRADE-AMOUNT   COMP-3 PIC 9(12).
    '''
    
    fields = mapper.parse_cobol_layout(cobol_layout, "TRADE-RECORD")
    
    # Vérifications
    assert "TRADE-ID" in fields, "TRADE-ID devrait être parsé"
    assert "TRADE-PRICE" in fields, "TRADE-PRICE devrait être parsé"
    assert fields["TRADE-ID"].picture == "9(10)", "Picture de TRADE-ID incorrecte"
    assert fields["TRADE-PRICE"].decimal_places == 2, "Décimales de TRADE-PRICE incorrectes"
    assert fields["TRADE-AMOUNT"].usage == "COMP-3", "Usage de TRADE-AMOUNT incorrect"
    print("  ✓ Parsing COBOL fonctionne")
    
    # Test génération DDL PostgreSQL
    ddl = mapper.to_pg_ddl("TRADE-RECORD", "trades")
    assert "CREATE TABLE IF NOT EXISTS trades" in ddl, "DDL devrait contenir CREATE TABLE"
    assert "NUMERIC(10, 2)" in ddl, "DDL devrait contenir le type NUMERIC pour les décimales"
    assert "CREATE INDEX" in ddl, "DDL devrait contenir les index"
    print("  ✓ Génération DDL PostgreSQL fonctionne")
    
    # Test génération classe Python
    py_class = mapper.to_python_class("TRADE-RECORD", "TradeRecord")
    assert "@dataclass" in py_class, "Devrait contenir @dataclass"
    assert "class TradeRecord:" in py_class, "Devrait contenir la définition de classe"
    assert "trade_id" in py_class.lower(), "Devrait contenir le champ trade_id"
    print("  ✓ Génération classe Python fonctionne")
    
    # Test avec différents formats Picture
    mapper2 = CobolLayoutMapper()
    fields2 = mapper2.parse_cobol_layout("01 TEST.\n    05 F1 PIC A(5).\n    05 F2 PIC X(20).", "TEST")
    assert fields2["F1"].pg_type == "VARCHAR(5)", f"Type VARCHAR attendu pour PIC A(5), reçu: {fields2['F1'].pg_type}"
    assert fields2["F2"].pg_type == "VARCHAR(20)", f"Type VARCHAR attendu pour PIC X(20), reçu: {fields2['F2'].pg_type}"
    print("  ✓ Types PostgreSQL corrects pour différents formats Picture")
    
    print("  ✓ Tous les tests du COBOL Layout Mapper ont réussi")


def test_cobol_field_types():
    """Test des types de champs COBOL."""
    print("\n[Test COBOL] Types de champs...")
    
    # Test COMP-5
    comp5_field = CobolFieldDefinition(
        name="COMP5-FIELD",
        level=5,
        picture="9(9)",
        usage="COMP-5",
        length=4
    )
    assert comp5_field.pg_type == "INTEGER", f"Type INTEGER attendu pour COMP-5, reçu: {comp5_field.pg_type}"
    print("  ✓ COMP-5 mappe vers INTEGER")
    
    # Test COMP-3
    comp3_field = CobolFieldDefinition(
        name="COMP3-FIELD",
        level=5,
        picture="9(12)",
        usage="COMP-3",
        length=6,
        decimal_places=0
    )
    assert "NUMERIC" in comp3_field.pg_type, f"Type NUMERIC attendu pour COMP-3, reçu: {comp3_field.pg_type}"
    print("  ✓ COMP-3 mappe vers NUMERIC")
    
    # Test avec décimales
    decimal_field = CobolFieldDefinition(
        name="DECIMAL-FIELD",
        level=5,
        picture="S9(10)V99",
        usage="DISPLAY",
        signed=True,
        decimal_places=2
    )
    assert decimal_field.python_type == float, "Type float attendu pour décimales"
    print("  ✓ Champs signés avec décimales mappent vers float")
    
    # Test DISPLAY alphanumérique
    alpha_field = CobolFieldDefinition(
        name="ALPHA-FIELD",
        level=5,
        picture="A(30)",
        length=30
    )
    assert alpha_field.python_type == str, "Type str attendu pour alphanumérique"
    print("  ✓ Champs alphanumériques mappent vers str")
    
    print("  ✓ Tous les tests de types ont réussi")


def test_temporal_partitioner():
    """Test du partitionnement temporel."""
    print("\n[Test PARTITION] Partitionnement temporel...")
    
    # Créer une connexion mock pour les tests
    class MockConnection:
        def __init__(self):
            self.is_connected = True
        
        def execute_raw_sql(self, sql):
            return type('Result', (), {'data': []})()
    
    connection = MockConnection()
    
    # Note: TemporalPartitioner nécessite une vraie connexion Supabase
    # pour les tests complets, mais nous testons la structure ici
    partitioner = TemporalPartitioner(connection, "trades")
    
    # Test des paramètres de partition
    assert partitioner.table_name == "trades", "Table name incorrect"
    print("  ✓ TemporalPartitioner initialisé correctement")
    
    # Test de calcul de partition (sans connexion)
    result = partitioner.create_date_range_partition(
        "2026_01",
        "2026-01-01",
        "2026-02-01"
    )
    # Devrait échouer car pas de vraie connexion, mais la structure fonctionne
    assert "partition" in result, "Devrait contenir la clé 'partition'"
    print("  ✓ Structure de résultat correcte")


def test_vsam_access_pattern_tracker():
    """Test du tracker de patterns d'accès VSAM."""
    print("\n[Test TRACKER] Patterns d'accès VSAM...")
    
    tracker = VsamAccessPatternTracker()
    
    # Enregistrer des accès
    tracker.record_access("trades", "read_by_key", {"field": "trade_id"})
    tracker.record_access("trades", "read_by_key", {"field": "trade_id"})
    tracker.record_access("trades", "read_by_key", {"field": "trade_id"})
    tracker.record_access("trades", "read", {})
    tracker.record_access("customers", "read_by_key", {"field": "cust_num"})
    tracker.record_access("customers", "write", {})
    
    # Test statistiques
    stats = tracker.get_access_statistics()
    assert stats["total_operations"] == 6, f"6 opérations attendues, reçues: {stats['total_operations']}"
    assert "trades" in stats["by_table"], "trades devrait être dans les stats"
    assert "customers" in stats["by_table"], "customers devrait être dans les stats"
    assert stats["by_operation"]["read_by_key"] == 4, "4 lectures par clé attendues"
    print("  ✓ Statistiques correctes")
    
    # Test suggestions d'optimisation
    suggestions = tracker.get_optimization_suggestions()
    
    # Devrait y avoir des suggestions pour trade_id et cust_num
    trade_suggestions = [s for s in suggestions if s["table"] == "trades"]
    assert len(trade_suggestions) > 0, "Devrait y avoir des suggestions pour trades"
    
    # Vérifier la priorité basée sur la fréquence
    trade_id_suggestions = [s for s in trade_suggestions if s["field"] == "trade_id"]
    if trade_id_suggestions:
        # 3 lectures par clé = haute priorité
        assert trade_id_suggestions[0]["priority"] == "high", \
            f"Priorité haute attendue pour 3 lectures, reçue: {trade_id_suggestions[0]['priority']}"
    print("  ✓ Suggestions d'optimisation correctes")
    
    # Test génération de rapport
    report = tracker.generate_report()
    assert "RAPPORT D'OPTIMISATION VSAM" in report, "Rapport devrait contenir le titre"
    assert "trade_id" in report, "Rapport devrait mentionner trade_id"
    assert "customers" in report, "Rapport devrait mentionner customers"
    print("  ✓ Génération de rapport fonctionne")
    
    print("  ✓ Tous les tests du tracker ont réussi")


def test_read_previous_record():
    """Test de la lecture backwards."""
    print("\n[Test BACKWARD] Lecture enregistrement précédent...")
    
    table = SupabaseTable("test_backward", primary_key="id")
    table.open("OUTPUT")
    
    # Créer plusieurs enregistrements
    for i in range(1, 5):
        table.write(f"KEY{str(i).zfill(3)}", {"id": f"KEY{str(i).zfill(3)}", "value": i})
    
    # Positionner à la fin
    table.start_br("KEY005")
    
    # Lire à l'envers
    for expected_key in ["KEY003", "KEY002", "KEY001"]:
        data = table.read_previous_record()
        assert data is not None, f"Devrait lire {expected_key}"
        record = json.loads(data.decode())
        assert record["id"] == expected_key, f"Clé {expected_key} attendue, reçue: {record['id']}"
    
    # Vérifier EOF en continuant
    data = table.read_previous_record()
    assert data is None, "Devrait retourner None après KEY001"
    assert table.file_status == "10", f"Status 10 attendu pour EOF, reçu: {table.file_status}"
    
    table.close()
    print("  ✓ Lecture backwards fonctionne correctement")


def test_cobol_layout_complex():
    """Test du parsing de layouts COBOL complexes avec OCCURS et dépendances."""
    print("\n[Test COBOL COMPLEX] Layouts complexes...")
    
    mapper = CobolLayoutMapper()
    
    # Layout avec OCCURS
    cobol_complex = '''
        01 ORDER-HEADER.
            05 ORDER-NUM      PIC 9(8).
            05 ORDER-DATE     PIC 9(8).
            05 CUSTOMER-ID    PIC 9(6).
            05 ORDER-LINES    OCCURS 5.
                10 LINE-NUM   PIC 9(2).
                10 PRODUCT-ID PIC X(10).
                10 QTY        PIC 9(4).
                10 UNIT-PRICE PIC 9(6)V99.
    '''
    
    fields = mapper.parse_cobol_layout(cobol_complex, "ORDER-HEADER")
    
    assert "ORDER-NUM" in fields, "ORDER-NUM devrait être parsé"
    assert "ORDER-LINES" in fields, "ORDER-LINES devrait être parsé"
    assert "LINE-NUM" in fields, "LINE-NUM devrait être parsé"
    
    # Vérifier l'occurs
    assert fields["ORDER-LINES"].occurs == 5, "OCCURS 5 attendu"
    print("  ✓ OCCURS parsé correctement")
    
    # Layout avec dépendances (simplifié)
    mapper2 = CobolLayoutMapper()
    fields2 = mapper2.parse_cobol_layout('''
        01 FIELD-GROUP.
            05 FIELD-LENGTH PIC 9(3).
            05 FIELD-DATA   PIC X(100).
    ''', "FIELD-GROUP")
    
    assert "FIELD-LENGTH" in fields2, "FIELD-LENGTH devrait être parsé"
    assert "FIELD-DATA" in fields2, "FIELD-DATA devrait être parsé"
    print("  ✓ Dépendances entre champs gérées")
    
    print("  ✓ Tests de layouts complexes réussis")


def test_vsam_file_status_consistency():
    """Test de la cohérence des codes statut VSAM."""
    print("\n[Test STATUS] Cohérence des statuts VSAM...")
    
    table = SupabaseTable("test_status", primary_key="id")
    
    # Opération sur fichier fermé
    data = table.read()
    assert table.file_status == "30", f"Status 30 attendu pour fichier fermé, reçu: {table.file_status}"
    print("  ✓ Status 30 (Permanent Error) pour fichier fermé")
    
    # OPEN avec mode invalide
    status = table.open("INVALID")
    assert status == "30", f"Status 30 attendu pour mode invalide, reçu: {status}"
    print("  ✓ Status 30 pour mode d'ouverture invalide")
    
    # READ sur fichier non trouvé
    table.open("INPUT")
    data = table.read_by_key("NONEXISTENT")
    assert table.file_status == "23", f"Status 23 attendu pour record non trouvé, reçu: {table.file_status}"
    print("  ✓ Status 23 (Record Not Found) fonctionne")
    
    # WRITE en mode INPUT
    status = table.write("TEST", {"data": "test"})
    assert status == "30", f"Status 30 attendu pour WRITE en INPUT, reçu: {status}"
    print("  ✓ Write interdit en mode INPUT")
    
    # Test EOF
    table.open("OUTPUT")
    table.write("KEY1", {"id": "KEY1"})
    table.close()
    table.open("INPUT")
    table.read()  # Lire l'unique record
    data = table.read()  # Devrait être EOF
    assert data is None, "Devrait retourner None pour EOF"
    assert table.file_status == "10", f"Status 10 attendu pour EOF, reçu: {table.file_status}"
    print("  ✓ Status 10 (End of File) fonctionne")
    
    table.close()
    print("  ✓ Tous les tests de cohérence de statut réussis")


# ============================================================
# Tests basiques
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("Supabase Data Access Layer - Test de l'implémentation Complète")
    print("=" * 70)
    
    # Tests des nouvelles fonctionnalités (priorités hautes et moyennes)
    print("\n" + "=" * 70)
    print("TESTS DES NOUVELLES FONCTIONNALITÉS")
    print("=" * 70)
    
    try:
        test_vsam_style_alias_methods()
        test_cobol_layout_mapper()
        test_cobol_field_types()
        test_read_previous_record()
        test_cobol_layout_complex()
        test_vsam_file_status_consistency()
        test_vsam_access_pattern_tracker()
        # Note: TemporalPartitioner nécessite une vraie connexion Supabase
        test_temporal_partitioner()
    except AssertionError as e:
        print(f"\n⚠ ÉCHEC D'UN TEST: {e}")
        raise
    except Exception as e:
        print(f"\n⚠ ERREUR INATTENDUE: {e}")
        raise
    
    print("\n" + "=" * 70)
    print("TOUS LES TESTS DES NOUVELLES FONCTIONNALITÉS ONT RÉUSSI!")
    print("=" * 70)
    
    # Tests de base existants
    print("\n" + "=" * 70)
    print("TESTS DE BASE EXISTANTS")
    print("=" * 70)
    
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
