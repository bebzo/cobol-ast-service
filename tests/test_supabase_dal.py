"""
Tests pour la couche d'accès aux données Supabase - CodeSwitch v11.0

Ces tests valident:
- Interface VSAM-compatibile
- Opérations CRUD
- Migration depuis VSAM Lite
- Gestion des erreurs

Auteur: MiniMax Agent
"""

import os
import sys
import json
import tempfile
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.supabase_dal import (
    SupabaseDataAccessLayer,
    SupabaseTable,
    SupabaseConnection,
    SupabaseRecord,
    CobolConverter,
    MigrationManager,
    generate_supabase_schema,
    FILE_STATUS,
    FileOrganization,
    AccessMode,
    OpenMode,
)


class TestCobolConverter:
    """Tests pour le convertisseur COBOL."""
    
    def test_display_to_python(self):
        """Test conversion DISPLAY -> Python."""
        converter = CobolConverter()
        
        # ASCII string avec padding
        result = converter.display_to_python(b"HELLO   ", 8)
        assert result == "HELLO"
        
        # Sans longueur spécifiée
        result = converter.display_to_python(b"HELLO   ")
        assert result == "HELLO"
    
    def test_python_to_display(self):
        """Test conversion Python -> DISPLAY."""
        converter = CobolConverter()
        
        result = converter.python_to_display("HELLO", 10)
        assert result == b"HELLO     "  # Padding avec espaces
    
    def test_comp_to_python(self):
        """Test conversion COMP -> Python."""
        converter = CobolConverter()
        
        # Entier positif sur 2 bytes
        data = b"\x00\xC7"  # 199 en big-endian
        result = converter.comp_to_python(data, "9(4)")
        assert result == 199
    
    def test_python_to_comp(self):
        """Test conversion Python -> COMP."""
        converter = CobolConverter()
        
        # Entier vers COMP-4 (4 bytes)
        result = converter.python_to_comp(1000, "9(4)")
        assert len(result) == 4
        assert int.from_bytes(result, byteorder='big') == 1000
    
    def test_comp3_to_python(self):
        """Test conversion COMP-3 -> Python."""
        converter = CobolConverter()
        
        # 12345 en COMP-3
        comp3_data = b"\x12\x34\x5C"  # 12345 avec signe +
        result = converter.comp3_to_python(comp3_data)
        assert result == 12345
        
        # Nombre négatif
        comp3_neg = b"\x12\x34\x5D"  # -12345 avec signe -
        result = converter.comp3_to_python(comp3_neg)
        assert result == -12345
    
    def test_python_to_comp3(self):
        """Test conversion Python -> COMP-3."""
        converter = CobolConverter()
        
        result = converter.python_to_comp3(12345, 6)
        assert len(result) == 3  # 6 digits = 3 bytes


class TestSupabaseConnection:
    """Tests pour la gestion de connexion."""
    
    def test_connection_not_connected_initially(self):
        """Test état initial sans configuration."""
        with patch.dict(os.environ, {}, clear=True):
            # Créer une nouvelle instance
            conn = SupabaseConnection(url=None, key=None)
            assert conn.is_connected == False
    
    def test_connection_with_credentials(self):
        """Test connexion avec identifiants."""
        # Mock du client Supabase
        with patch('api.supabase_dal.create_client') as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            
            conn = SupabaseConnection(url="https://test.supabase.co", key="test-key")
            conn.connect()
            
            assert conn.is_connected == True
            mock_create.assert_called_once_with(
                "https://test.supabase.co",
                "test-key"
            )
    
    def test_singleton_pattern(self):
        """Test que le singleton fonctionne."""
        conn1 = SupabaseConnection.get_instance("url1", "key1")
        conn2 = SupabaseConnection.get_instance()
        
        assert conn1 is conn2


class TestSupabaseTable:
    """Tests pour la table Supabase avec interface VSAM."""
    
    @pytest.fixture
    def mock_table(self):
        """Crée une table avec mock Supabase."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn.is_connected = True
            mock_conn.client = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            table = SupabaseTable("test_table", primary_key="test_key")
            return table, mock_conn
    
    def test_open_input_mode(self, mock_table):
        """Test OPEN en mode INPUT."""
        table, mock_conn = mock_table
        
        # Mock la réponse Supabase
        mock_conn.client.table.return_value.select.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {"test_key": "KEY1", "data": "value1"},
                {"test_key": "KEY2", "data": "value2"},
            ]
        )
        
        status = table.open("INPUT")
        
        assert status == "00"
        assert table._is_open == True
        assert table._open_mode == OpenMode.INPUT
    
    def test_open_output_mode(self, mock_table):
        """Test OPEN en mode OUTPUT."""
        table, mock_conn = mock_table
        
        status = table.open("OUTPUT")
        
        assert status == "00"
        assert table._is_open == True
        assert table._open_mode == OpenMode.OUTPUT
        assert table._data == {}  # Vide en OUTPUT
    
    def test_write_record(self, mock_table):
        """Test écriture d'un enregistrement."""
        table, mock_conn = mock_table
        
        table.open("OUTPUT")
        status = table.write("KEY1", {"data": "value1"})
        
        assert status == "00"
        assert "KEY1" in table._data
        assert table._data["KEY1"]["data"] == "value1"
    
    def test_read_by_key(self, mock_table):
        """Test lecture par clé."""
        table, mock_conn = mock_table
        
        table._data = {
            "KEY1": {"test_key": "KEY1", "data": "value1"},
            "KEY2": {"test_key": "KEY2", "data": "value2"},
        }
        table._keys = ["KEY1", "KEY2"]
        
        data = table.read(key="KEY1")
        
        assert data is not None
        record = json.loads(data.decode())
        assert record["test_key"] == "KEY1"
    
    def test_read_sequential(self, mock_table):
        """Test lecture séquentielle."""
        table, mock_conn = mock_table
        
        table._data = {
            "KEY1": {"test_key": "KEY1", "data": "value1"},
            "KEY2": {"test_key": "KEY2", "data": "value2"},
        }
        table._keys = ["KEY1", "KEY2"]
        table.open("INPUT")
        
        # Lecture séquentielle
        data1 = table.read()  # KEY1
        assert data1 is not None
        
        data2 = table.read()  # KEY2
        assert data2 is not None
        
        data3 = table.read()  # EOF
        assert data3 is None
        assert table.file_status == "10"  # End of File
    
    def test_read_key_not_found(self, mock_table):
        """Test lecture clé inexistante."""
        table, mock_conn = mock_table
        
        table.open("INPUT")
        data = table.read(key="NOTEXISTS")
        
        assert data is None
        assert table.file_status == "23"  # Record Not Found
    
    def test_rewrite_record(self, mock_table):
        """Test réécriture d'un enregistrement."""
        table, mock_conn = mock_table
        
        table._data = {"KEY1": {"test_key": "KEY1", "data": "old"}}
        table._keys = ["KEY1"]
        table.open("I-O")
        
        status = table.rewrite("KEY1", {"data": "new"})
        
        assert status == "00"
        assert table._data["KEY1"]["data"] == "new"
    
    def test_delete_record(self, mock_table):
        """Test suppression d'un enregistrement."""
        table, mock_conn = mock_table
        
        table._data = {"KEY1": {"test_key": "KEY1", "data": "value1"}}
        table._keys = ["KEY1"]
        table.open("I-O")
        
        status = table.delete("KEY1")
        
        assert status == "00"
        assert "KEY1" not in table._data
        assert "KEY1" not in table._keys
    
    def test_close_table(self, mock_table):
        """Test fermeture de la table."""
        table, mock_conn = mock_table
        
        table.open("INPUT")
        status = table.close()
        
        assert status == "00"
        assert table._is_open == False
    
    def test_file_status_codes(self):
        """Test des codes statut VSAM."""
        assert FILE_STATUS["00"] == "Success"
        assert FILE_STATUS["10"] == "End of File"
        assert FILE_STATUS["23"] == "Record Not Found"
        assert FILE_STATUS["35"] == "File Not Found"
    
    def test_count_records(self, mock_table):
        """Test du comptage des enregistrements."""
        table, mock_conn = mock_table
        
        table._data = {
            "KEY1": {},
            "KEY2": {},
            "KEY3": {},
        }
        
        assert table.count_records() == 3
    
    def test_list_keys(self, mock_table):
        """Test de la liste des clés."""
        table, mock_conn = mock_table
        
        table._keys = ["CCC", "AAA", "BBB"]
        
        keys = table.list_keys()
        
        assert keys == ["AAA", "BBB", "CCC"]  # Triées


class TestMigrationManager:
    """Tests pour le gestionnaire de migration."""
    
    @pytest.fixture
    def temp_vsam_files(self):
        """Crée des fichiers VSAM temporaires pour les tests."""
        temp_dir = tempfile.mkdtemp()
        
        # Créer un fichier VSAM de test
        test_data = {
            "REC001": {"name": "Client 1", "balance": 1000},
            "REC002": {"name": "Client 2", "balance": 2000},
        }
        
        data_file = os.path.join(temp_dir, "test_customers.data.json")
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(test_data, f)
        
        yield temp_dir
        
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)
    
    def test_migrate_vsam_file(self, temp_vsam_files):
        """Test migration d'un fichier VSAM."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn.is_connected = True
            mock_conn.client = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            manager = MigrationManager()
            
            vsam_path = os.path.join(temp_vsam_files, "test_customers")
            result = manager.migrate_vsam_file(vsam_path, "customers")
            
            assert result["success"] == True
            assert result["records_migrated"] == 2
            assert "customers" in manager.migrated_tables
    
    def test_migrate_nonexistent_file(self):
        """Test migration fichier inexistant."""
        manager = MigrationManager()
        
        result = manager.migrate_vsam_file("/nonexistent/path", "test_table")
        
        assert result["success"] == False
        assert len(result["errors"]) > 0


class TestSchemaGeneration:
    """Tests pour la génération de schéma SQL."""
    
    def test_generate_schema(self):
        """Test génération du SQL de schéma."""
        sql = generate_supabase_schema("customers", "cust_num")
        
        assert "CREATE TABLE IF NOT EXISTS customers" in sql
        assert "cust_num" in sql
        assert "BIGSERIAL PRIMARY KEY" in sql
        assert "INDEX" in sql
    
    def test_schema_with_indexes(self):
        """Test que les index sont générés."""
        sql = generate_supabase_schema("orders", "order_id")
        
        assert "idx_orders_key" in sql
        assert "idx_orders_order_id" in sql
        assert "trigger_set_timestamp" in sql


class TestSupabaseDataAccessLayer:
    """Tests pour la couche d'accès aux données."""
    
    def test_create_table(self):
        """Test création d'une table."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            table = SupabaseDataAccessLayer.create_table(
                "test_table",
                primary_key="id"
            )
            
            assert table.table_name == "test_table"
            assert table.primary_key == "id"
    
    def test_create_vsam_compatible(self):
        """Test création compatible VSAM."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            table = SupabaseDataAccessLayer.create_vsam_compatible(
                file_name="CUSTOMER-FILE",
                assign_path="/data/customer.dat",
                record_key="CUST-NUM",
            )
            
            # Le nom de table doit être dérivé du chemin
            assert table is not None
    
    def test_connection_status(self):
        """Test statut de connexion."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn.is_connected = True
            mock_conn.url = "https://test.supabase.co"
            mock_conn_class.get_instance.return_value = mock_conn
            
            status = SupabaseDataAccessLayer.get_connection_status()
            
            assert status["available"] == True
            assert status["connected"] == True


class TestIntegration:
    """Tests d'intégration avec données réalistes."""
    
    def test_customer_file_operations(self):
        """Test opérations sur un fichier client."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn.is_connected = True
            mock_conn.client = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            # Simuler un fichier client
            table = SupabaseTable("customers", primary_key="cust_num")
            table.open("OUTPUT")
            
            # Créer des clients
            clients = [
                ("CUST001", {"cust_num": "CUST001", "name": "Dupont", "balance": 1500}),
                ("CUST002", {"cust_num": "CUST002", "name": "Martin", "balance": 2500}),
                ("CUST003", {"cust_num": "CUST003", "name": " Durand", "balance": 3500}),
            ]
            
            for key, data in clients:
                table.write(key, data)
            
            assert table.count_records() == 3
            
            # Lire un client spécifique
            record = table.read(key="CUST002")
            assert record is not None
            
            # Lecture séquentielle de tous
            records = []
            while True:
                data = table.read()
                if table.file_status == "10":
                    break
                if data:
                    records.append(json.loads(data.decode()))
            
            assert len(records) == 3
            
            table.close()
    
    def test_file_status_transitions(self):
        """Test des transitions de statut."""
        with patch('api.supabase_dal.SupabaseConnection') as mock_conn_class:
            mock_conn = MagicMock()
            mock_conn.is_connected = True
            mock_conn.client = MagicMock()
            mock_conn_class.get_instance.return_value = mock_conn
            
            table = SupabaseTable("test", primary_key="id")
            
            # État initial
            assert table.file_status == "00"
            
            # Opération sur fichier fermé
            table.read(key="TEST")
            assert table.file_status == "30"  # Permanent error


# Exécution des tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
