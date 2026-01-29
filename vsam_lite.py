"""
VSAM Lite - CodeSwitch v11.0
Émulateur VSAM minimal pour la migration COBOL vers Python.

Support:
- Fichiers KSDS (Key Sequenced Data Set)
- Opérations: OPEN, READ (séquentiel/aléatoire), WRITE, CLOSE
- Formats COBOL: DISPLAY, COMP, COMP-3
- File Status: 00, 02, 10, 22, 23, 30

Auteur: MiniMax Agent
"""

import json
import os
import struct
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum


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


# File Status Codes VSAM
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
class VSAMRecord:
    """Représentation d'un enregistrement VSAM."""
    key: str
    data: bytes
    raw_data: bytes = field(default=b"")

    def __repr__(self):
        return f"VSAMRecord(key={self.key!r}, data={self.data!r})"


class CobolConverter:
    """
    Convertisseur de données COBOL vers Python et vice versa.
    
    Supporte:
    - DISPLAY: Chaînes de caractères ASCII
    - COMP: Entiers binaires big-endian
    - COMP-3: Décimaux compactés (packed decimal)
    """
    
    # Mapping des formats COBOL vers formats Python
    COMP_SIZES = {
        "COMP-1": ("f", 4),   # Float 32-bit
        "COMP-2": ("d", 8),   # Double 64-bit
        "COMP-3": ("p", 0),   # Packed decimal (special handling)
        "COMP-5": ("i", 0),   # Native integer (special handling)
    }
    
    @staticmethod
    def display_to_python(data: bytes, length: int = None) -> str:
        """
        Convertit une chaîne DISPLAY COBOL en chaîne Python.
        Retire le padding et convertit en string unicode.
        """
        if isinstance(data, str):
            data = data.encode('ascii')
        
        # Retirer les trailing spaces (padding COBOL standard)
        if length:
            data = data[:length]
        
        result = data.decode('ascii', errors='replace').rstrip()
        return result
    
    @staticmethod
    def python_to_display(data: str, length: int) -> bytes:
        """Convertit une chaîne Python en DISPLAY COBOL avec padding."""
        if isinstance(data, bytes):
            data = data.decode('ascii', errors='replace')
        
        # Tronquer si nécessaire
        if len(data) > length:
            data = data[:length]
        
        # Padding avec des espaces à droite (standard COBOL)
        return data.encode('ascii').ljust(length, b' ')
    
    @staticmethod
    def comp_to_python(data: bytes, pic_clause: str) -> Union[int, float]:
        """
        Convertit un entier COMP COBOL en entier Python.
        
        Supporte:
        - 9(n) COMP: Entier binaire big-endian n bytes
        - S9(n) COMP: Entier binaire avec signe
        """
        if isinstance(data, str):
            data = data.encode('ascii')
        
        # Analyser la clause PIC pour déterminer la taille
        pic_upper = pic_clause.upper()
        
        # Compter le nombre de digits
        import re
        digits_match = re.search(r'S*9\((\d+)\)', pic_upper)
        if not digits_match:
            # Fallback: utiliser la taille des données
            return int.from_bytes(data, byteorder='big', signed=True)
        
        num_digits = int(digits_match.group(1))
        
        # Calculer la taille en bytes (2 bytes pour 1-4 digits, 4 bytes pour 5-9 digits, etc.)
        if num_digits <= 4:
            size = 2
        elif num_digits <= 9:
            size = 4
        elif num_digits <= 18:
            size = 8
        else:
            size = (num_digits // 2) + 1
        
        # Vérifier le signe (S au début de PIC)
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
        
        # Analyser la clause PIC
        import re
        digits_match = re.search(r'S*9\((\d+)\)', pic_upper)
        if not digits_match:
            # Fallback
            num_digits = 9
        else:
            num_digits = int(digits_match.group(1))
        
        has_sign = pic_upper.startswith('S')
        
        # Calculer la taille
        if num_digits <= 4:
            size = 2
        elif num_digits <= 9:
            size = 4
        elif num_digits <= 18:
            size = 8
        else:
            size = (num_digits // 2) + 1
        
        # Convertir en bytes
        try:
            if has_sign:
                data = value.to_bytes(size, byteorder='big', signed=True)
            else:
                data = value.to_bytes(size, byteorder='big', signed=False)
            return data
        except OverflowError:
            # Valeur trop grande, saturer
            max_val = (1 << (size * 8 - 1)) - 1 if has_sign else (1 << (size * 8)) - 1
            return max_val.to_bytes(size, byteorder='big', signed=has_sign)
    
    @staticmethod
    def comp3_to_python(data: bytes, num_digits: int = None) -> int:
        """
        Convertit un COMP-3 (packed decimal) COBOL en entier Python.
        
        Format COMP-3: 2 chiffres par octet, signe dans le nibble bas du dernier octet
        """
        if isinstance(data, str):
            data = data.encode('ascii')
        
        if not data:
            return 0
        
        # Le dernier nibble contient le signe
        last_byte = data[-1]
        sign_nibble = last_byte & 0x0F
        
        # Déterminer le signe
        if sign_nibble in (0x0B, 0x0D):  # Negative
            is_negative = True
        else:
            is_negative = False
        
        # Extraire les chiffres (2 par octet)
        result = 0
        
        for i in range(len(data)):
            byte = data[i]
            high_nibble = byte >> 4
            low_nibble = byte & 0x0F
            
            if i == len(data) - 1:
                # Dernier octet: le high nibble est le dernier digit
                # Le low nibble est le signe (déjà extrait)
                result = result * 10 + high_nibble
            else:
                # Octets normaux: 2 digits par octet
                result = result * 100 + (high_nibble * 10) + low_nibble
        
        if is_negative:
            result = -result
        
        return result
    
    @staticmethod
    def python_to_comp3(value: int, num_digits: int) -> bytes:
        """
        Convertit un entier Python en COMP-3 (packed decimal) COBOL.
        
        Format COMP-3: 2 chiffres par octet, signe dans le nibble bas du dernier octet
        Pour N digits + 1 signe, on a (N+1) nibbles = ceil((N+1)/2) octets.
        Le dernier octet contient: (dernier_digit << 4) | signe
        """
        is_negative = value < 0
        abs_value = abs(value)
        
        # Pour num_digits digits + 1 signe = num_digits + 1 nibbles
        # Dernier octet: 1 digit (high nibble) + signe (low nibble)
        # Octets précédents: 2 digits chacun
        num_full_bytes = num_digits // 2  # octets avec 2 digits
        has_partial_byte = num_digits % 2  # 1 si le dernier digit est seul
        
        num_bytes = num_full_bytes + 1  # +1 pour l'octet avec le signe
        
        result = bytearray(num_bytes)
        
        # Remplir de droite à gauche
        byte_index = num_bytes - 1
        
        # Le dernier octet aura le signe
        # Le high nibble sera mis à jour avec le dernier digit
        last_digit = abs_value % 10
        abs_value //= 10
        result[byte_index] = (last_digit << 4)  # low nibble sera écrasé par le signe
        byte_index -= 1
        
        # Remplir les octets précédents avec des paires de digits
        while byte_index >= 0:
            low_digit = abs_value % 10
            abs_value //= 10
            high_digit = abs_value % 10
            abs_value //= 10
            result[byte_index] = (high_digit << 4) | low_digit
            byte_index -= 1
        
        # Ajouter le signe dans le dernier nibble du dernier octet
        if is_negative:
            result[-1] = (result[-1] & 0xF0) | 0x0D  # Negative
        else:
            result[-1] = (result[-1] & 0xF0) | 0x0C  # Positive
        
        return bytes(result)


class VSAMFile:
    """
    Émulateur de fichier VSAM KSDS (Key Sequenced Data Set).
    
    Utilisation:
        file = VSAMFile("customer.dat", organization="INDEXED")
        file.open("INPUT")
        record = file.read(key="CUST001")
        file.close()
    """
    
    def __init__(
        self,
        filename: str,
        organization: str = "INDEXED",
        access_mode: str = "DYNAMIC",
        record_key: str = None,
        record_length: int = None,
        primary_key: str = None,
    ):
        """
        Initialise un fichier VSAM.
        
        Args:
            filename: Chemin vers le fichier de données
            organization: INDEXED, SEQUENTIAL, ou RELATIVE
            access_mode: SEQUENTIAL, RANDOM, ou DYNAMIC
            record_key: Nom du champ clé dans l'enregistrement
            record_length: Longueur fixe de l'enregistrement (optionnel)
            primary_key: Position et longueur de la clé primaire
        """
        self.filename = filename
        self.organization = FileOrganization(organization)
        self.access_mode = AccessMode(access_mode)
        self.record_key = record_key
        self.record_length = record_length
        self.primary_key = primary_key  # (offset, length)
        
        # État interne
        self._is_open = False
        self._open_mode = None
        self._data: Dict[str, bytes] = {}
        self._keys: List[str] = []
        self._current_index = 0
        self.file_status = "00"
        self.record_buffer = None
        
        # Configuration du fichier de métadonnées
        self._meta_file = filename + ".meta.json"
    
    def _get_file_path(self, suffix: str = "") -> str:
        """Génère le chemin du fichier de données."""
        if suffix:
            return f"{self.filename}.{suffix}"
        return self.filename
    
    def _load_data(self):
        """Charge les données depuis le fichier JSON."""
        data_file = self._get_file_path("data.json")
        keys_file = self._get_file_path("keys.json")
        
        # Charger les données
        if os.path.exists(data_file):
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    self._data = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._data = {}
        else:
            self._data = {}
        
        # Charger les clés triées
        if os.path.exists(keys_file):
            try:
                with open(keys_file, 'r', encoding='utf-8') as f:
                    self._keys = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._keys = sorted(self._data.keys())
        else:
            self._keys = sorted(self._data.keys())
    
    def _save_data(self):
        """Sauvegarde les données dans le fichier JSON."""
        data_file = self._get_file_path("data.json")
        keys_file = self._get_file_path("keys.json")
        
        # Sauvegarder les données
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)
        
        # Sauvegarder les clés triées
        with open(keys_file, 'w', encoding='utf-8') as f:
            json.dump(self._keys, f, ensure_ascii=False)
    
    def _save_metadata(self):
        """Sauvegarde les métadonnées du fichier."""
        meta = {
            "organization": self.organization.value,
            "access_mode": self.access_mode.value,
            "record_key": self.record_key,
            "record_length": self.record_length,
            "primary_key": self.primary_key,
            "record_count": len(self._data),
        }
        
        with open(self._meta_file, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    
    def open(self, mode: str) -> str:
        """
        Ouvre le fichier VSAM dans le mode spécifié.
        
        Modes:
            INPUT: Lecture seule, le fichier doit exister
            OUTPUT: Écriture seule, crée ou écrase le fichier
            I-O: Lecture et écriture
            EXTEND: Ajout en fin de fichier
        
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
        
        if open_mode == OpenMode.INPUT:
            # Vérifier que le fichier existe
            if not os.path.exists(self._get_file_path("data.json")):
                # Tenter de charger depuis le fichier raw
                if os.path.exists(self.filename):
                    self._load_data()
                else:
                    self.file_status = "35"  # File Not Found
                    return self.file_status
            else:
                self._load_data()
        
        elif open_mode == OpenMode.OUTPUT:
            # Créer ou écraser le fichier
            self._data = {}
            self._keys = []
            self._current_index = 0
            self._save_data()
        
        elif open_mode == OpenMode.I_O:
            # Lecture et écriture
            if os.path.exists(self._get_file_path("data.json")):
                self._load_data()
            else:
                self._data = {}
                self._keys = []
        
        elif open_mode == OpenMode.EXTEND:
            # Ajouter à la fin
            if os.path.exists(self._get_file_path("data.json")):
                self._load_data()
            else:
                self._data = {}
                self._keys = []
            self._current_index = len(self._keys)
        
        self._is_open = True
        return self.file_status
    
    def read(self, key: str = None) -> Optional[bytes]:
        """
        Lit un enregistrement du fichier VSAM.
        
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
                self.record_buffer = self._data[key]
                self.record_buffer = self.record_buffer.encode('utf-8') if isinstance(self.record_buffer, str) else self.record_buffer
                return self.record_buffer
            else:
                self.file_status = "23"  # Record Not Found
                self.record_buffer = None
                return None
        else:
            # Lecture séquentielle
            if self._current_index >= len(self._keys):
                self.file_status = "10"  # End of File
                self.record_buffer = None
                return None
            
            current_key = self._keys[self._current_index]
            self._current_index += 1
            
            if current_key in self._data:
                self.record_buffer = self._data[current_key]
                self.record_buffer = self.record_buffer.encode('utf-8') if isinstance(self.record_buffer, str) else self.record_buffer
                return self.record_buffer
            else:
                self.file_status = "10"  # End of File (clé supprimée)
                self.record_buffer = None
                return None
    
    def read_next(self) -> Optional[bytes]:
        """Alias pour lecture séquentielle."""
        return self.read()
    
    def write(self, key: str, data: Union[bytes, str]) -> str:
        """
        Écrit un enregistrement dans le fichier VSAM.
        
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
            self.file_status = "30"  # Cannot write in INPUT mode
            return self.file_status
        
        # Convertir les données en string pour JSON
        if isinstance(data, bytes):
            data_str = data.decode('utf-8', errors='replace')
        else:
            data_str = data
        
        # Vérifier duplicate key
        if key in self._data:
            if self._open_mode == OpenMode.OUTPUT:
                # OUTPUT écrase, pas d'erreur
                pass
            else:
                self.file_status = "22"  # Duplicate Key
                return self.file_status
        
        # Écrire l'enregistrement
        self._data[key] = data_str
        
        # Mettre à jour les clés triées
        if key not in self._keys:
            self._keys.append(key)
            self._keys.sort()
        
        self._current_index = self._keys.index(key) + 1
        self.record_buffer = data_str.encode('utf-8') if isinstance(data_str, str) else data_str
        self.file_status = "00"
        
        return self.file_status
    
    def rewrite(self, key: str, data: Union[bytes, str]) -> str:
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
            self.file_status = "23"  # Record Not Found
            return self.file_status
        
        # Convertir les données
        if isinstance(data, bytes):
            data_str = data.decode('utf-8', errors='replace')
        else:
            data_str = data
        
        self._data[key] = data_str
        self.record_buffer = data_str.encode('utf-8')
        self.file_status = "00"
        
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
            self.file_status = "23"  # Record Not Found
            return self.file_status
        
        del self._data[key]
        if key in self._keys:
            self._keys.remove(key)
        
        self.record_buffer = None
        self.file_status = "00"
        
        return self.file_status
    
    def start(self, key: str = None) -> str:
        """
        Positionne le pointeur pour lecture séquentielle.
        
        Args:
            key: Clé de départ (pour START ENGINE)
        
        Returns:
            Code statut
        """
        if not self._is_open:
            self.file_status = "30"
            return self.file_status
        
        if key is None:
            self._current_index = 0
        else:
            # Trouver l'index de la clé
            try:
                self._current_index = self._keys.index(key)
            except ValueError:
                # Clé pas trouvée, position après
                self._current_index = len(self._keys)
        
        self.file_status = "00"
        return self.file_status
    
    def close(self) -> str:
        """
        Ferme le fichier VSAM et sauve les modifications.
        
        Returns:
            Code statut
        """
        if not self._is_open:
            self.file_status = "00"  # Already closed is not an error
            return self.file_status
        
        # Sauvegarder les données
        if self._open_mode in (OpenMode.OUTPUT, OpenMode.I_O, OpenMode.EXTEND):
            self._save_data()
            self._save_metadata()
        
        self._is_open = False
        self._open_mode = None
        self.record_buffer = None
        self.file_status = "00"
        
        return self.file_status
    
    def get_status_message(self) -> str:
        """Retourne le message descriptif du code statut."""
        return FILE_STATUS.get(self.file_status, f"Unknown status: {self.file_status}")
    
    def __repr__(self):
        return (f"VSAMFile({self.filename!r}, org={self.organization.value}, "
                f"records={len(self._data)}, open={self._is_open})")


# ============================================================
# Fonctions utilitaires pour le runtime CodeSwitch
# ============================================================

def create_vsam_file(
    file_name: str,
    assign_path: str,
    record_key: str = None,
    record_length: int = None,
    primary_key: Tuple[int, int] = None,
) -> VSAMFile:
    """
    Crée une instance VSAMFile configurée.
    
    Utilisation dans le code Python généré:
        CUSTOMER-FILE = create_vsam_file(
            "CUSTOMER-FILE",
            "/data/customer.dat",
            record_key="CUST-NUM",
            record_length=256
        )
    """
    return VSAMFile(
        filename=assign_path,
        organization="INDEXED",
        access_mode="DYNAMIC",
        record_key=record_key,
        record_length=record_length,
        primary_key=primary_key,
    )


def vsam_file_status(file: VSAMFile) -> str:
    """Retourne le code statut du fichier."""
    return file.file_status


def check_vsam_success(file: VSAMFile) -> bool:
    """Vérifie si la dernière opération VSAM a réussi."""
    return file.file_status in ("00", "02")


# ============================================================
# Tests basiques (exécutés si le fichier est lancé directement)
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("VSAM Lite - Test de l'implémentation")
    print("=" * 60)
    
    import tempfile
    
    # Test 1: Création et écriture
    print("\n[Test 1] Création et écriture de données...")
    with tempfile.NamedTemporaryFile(suffix="_vsam_test", delete=False, mode='w') as f:
        test_file = f.name
    
    try:
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        print(f"  Fichier créé: {vsam}")
        
        status = vsam.open("OUTPUT")
        print(f"  OPEN OUTPUT: status={status}")
        
        # Écrire quelques enregistrements
        for i in range(1, 4):
            key = f"REC{i:03d}"
            data = f"Customer {i}: Name=Client {i}, Balance={i*1000.50}"
            status = vsam.write(key, data)
            print(f"  WRITE {key}: status={status}")
        
        vsam.close()
        print("  Fichier fermé avec succès")
        
        # Test 2: Lecture séquentielle
        print("\n[Test 2] Lecture séquentielle...")
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        vsam.open("INPUT")
        
        while True:
            data = vsam.read()
            if vsam.file_status == "10":
                print("  Fin du fichier atteinte")
                break
            elif data:
                print(f"  Lu: {data.decode()[:50]}...")
            else:
                break
        
        vsam.close()
        
        # Test 3: Lecture aléatoire
        print("\n[Test 3] Lecture aléatoire par clé...")
        vsam = VSAMFile(test_file, record_key="ID", record_length=100)
        vsam.open("INPUT")
        
        data = vsam.read(key="REC002")
        if data:
            print(f"  REC002 trouvé: {data.decode()}")
        else:
            print(f"  REC002 non trouvé: status={vsam.file_status}")
        
        data = vsam.read(key="REC999")
        if data is None:
            print(f"  REC999 non trouvé (attendu): status={vsam.file_status}")
        
        vsam.close()
        
        # Test 4: Conversion COMP-3
        print("\n[Test 4] Conversion COMP-3...")
        converter = CobolConverter()
        
        # Python -> COMP-3
        comp3_value = converter.python_to_comp3(12345, 6)
        print(f"  12345 -> COMP-3: {comp3_value.hex()}")
        
        # COMP-3 -> Python
        result = converter.comp3_to_python(comp3_value)
        print(f"  COMP-3 -> Python: {result}")
        assert result == 12345, f"Erreur: attendu 12345, obtenu {result}"
        
        print("\n" + "=" * 60)
        print("Tous les tests ont réussi!")
        print("=" * 60)
    
    finally:
        # Nettoyer les fichiers temporaires
        import os
        for ext in ["", ".data.json", ".keys.json", ".meta.json"]:
            try:
                os.remove(test_file + ext)
            except FileNotFoundError:
                pass
