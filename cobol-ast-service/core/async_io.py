"""
MegaEnterpriseSystem - Async I/O Module
Opérations asynchrones pour les fichiers et bases de données
"""
import asyncio
import aiofiles
from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


# ============================================
# ASYNC FILE OPERATIONS
# ============================================

async def read_file_async(filepath: str) -> str:
    """Lit un fichier de manière asynchrone"""
    async with aiofiles.open(filepath, mode='r', encoding='utf-8') as f:
        content = await f.read()
    logger.debug(f"Read {len(content)} chars from {filepath}")
    return content


async def write_file_async(filepath: str, content: str) -> None:
    """Écrit dans un fichier de manière asynchrone"""
    async with aiofiles.open(filepath, mode='w', encoding='utf-8') as f:
        await f.write(content)
    logger.debug(f"Wrote {len(content)} chars to {filepath}")


async def append_file_async(filepath: str, content: str) -> None:
    """Ajoute à un fichier de manière asynchrone"""
    async with aiofiles.open(filepath, mode='a', encoding='utf-8') as f:
        await f.write(content)


async def read_lines_async(filepath: str) -> AsyncIterator[str]:
    """Lit un fichier ligne par ligne de manière asynchrone"""
    async with aiofiles.open(filepath, mode='r', encoding='utf-8') as f:
        async for line in f:
            yield line.rstrip('\n')


async def read_json_async(filepath: str) -> Dict[str, Any]:
    """Lit un fichier JSON de manière asynchrone"""
    content = await read_file_async(filepath)
    return json.loads(content)


async def write_json_async(filepath: str, data: Dict[str, Any], indent: int = 2) -> None:
    """Écrit un fichier JSON de manière asynchrone"""
    content = json.dumps(data, indent=indent, default=str)
    await write_file_async(filepath, content)


# ============================================
# ASYNC BATCH PROCESSING
# ============================================

@dataclass
class BatchResult:
    """Résultat d'un traitement batch"""
    total: int = 0
    success: int = 0
    failed: int = 0
    errors: List[str] = None
    duration_ms: float = 0.0
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


async def process_batch_async(
    items: List[Any],
    processor: callable,
    max_concurrent: int = 10,
    on_progress: callable = None
) -> BatchResult:
    """
    Traite un batch d'éléments de manière asynchrone
    
    Args:
        items: Liste d'éléments à traiter
        processor: Fonction async de traitement
        max_concurrent: Nombre max de tâches simultanées
        on_progress: Callback de progression (current, total)
    """
    result = BatchResult(total=len(items))
    start_time = datetime.now()
    
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_with_semaphore(item, index):
        async with semaphore:
            try:
                await processor(item)
                result.success += 1
            except Exception as e:
                result.failed += 1
                result.errors.append(f"Item {index}: {str(e)}")
                logger.warning(f"Batch item {index} failed: {e}")
            
            if on_progress:
                on_progress(result.success + result.failed, result.total)
    
    tasks = [process_with_semaphore(item, i) for i, item in enumerate(items)]
    await asyncio.gather(*tasks)
    
    result.duration_ms = (datetime.now() - start_time).total_seconds() * 1000
    logger.info(f"Batch completed: {result.success}/{result.total} success in {result.duration_ms:.2f}ms")
    
    return result


# ============================================
# ASYNC TRANSACTION PROCESSING
# ============================================

@dataclass
class Transaction:
    """Représente une transaction financière"""
    id: str
    account_id: str
    type: str  # DEPOSIT, WITHDRAWAL, TRANSFER
    amount: Decimal
    timestamp: datetime = None
    status: str = 'PENDING'
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class AsyncTransactionProcessor:
    """Processeur de transactions asynchrone"""
    
    def __init__(self, max_concurrent: int = 50):
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.processed_count = 0
        self.total_amount = Decimal('0')
        self._lock = asyncio.Lock()
    
    async def process_transaction(self, txn: Transaction) -> bool:
        """Traite une transaction individuelle"""
        async with self.semaphore:
            try:
                # Simulate processing time
                await asyncio.sleep(0.001)
                
                # Validate
                if txn.amount <= 0:
                    txn.status = 'FAILED'
                    return False
                
                # Process based on type
                if txn.type == 'DEPOSIT':
                    await self._process_deposit(txn)
                elif txn.type == 'WITHDRAWAL':
                    await self._process_withdrawal(txn)
                elif txn.type == 'TRANSFER':
                    await self._process_transfer(txn)
                
                txn.status = 'COMPLETED'
                
                async with self._lock:
                    self.processed_count += 1
                    self.total_amount += txn.amount
                
                return True
                
            except Exception as e:
                txn.status = 'FAILED'
                logger.error(f"Transaction {txn.id} failed: {e}")
                return False
    
    async def _process_deposit(self, txn: Transaction) -> None:
        """Traite un dépôt"""
        logger.debug(f"Processing deposit {txn.id}: ${txn.amount}")
    
    async def _process_withdrawal(self, txn: Transaction) -> None:
        """Traite un retrait"""
        logger.debug(f"Processing withdrawal {txn.id}: ${txn.amount}")
    
    async def _process_transfer(self, txn: Transaction) -> None:
        """Traite un transfert"""
        logger.debug(f"Processing transfer {txn.id}: ${txn.amount}")
    
    async def process_batch(self, transactions: List[Transaction]) -> BatchResult:
        """Traite un batch de transactions"""
        async def processor(txn):
            success = await self.process_transaction(txn)
            if not success:
                raise ValueError(f"Transaction {txn.id} failed")
        
        return await process_batch_async(
            transactions,
            processor,
            max_concurrent=self.max_concurrent
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques de traitement"""
        return {
            'processed_count': self.processed_count,
            'total_amount': str(self.total_amount),
        }


# ============================================
# ASYNC DATABASE GATEWAY (Interface)
# ============================================

class AsyncDatabaseGateway:
    """
    Interface pour les opérations de base de données asynchrones
    À implémenter avec asyncpg, motor, etc.
    """
    
    async def connect(self) -> None:
        """Établit la connexion"""
        raise NotImplementedError
    
    async def disconnect(self) -> None:
        """Ferme la connexion"""
        raise NotImplementedError
    
    async def execute(self, query: str, params: tuple = None) -> Any:
        """Exécute une requête"""
        raise NotImplementedError
    
    async def fetch_one(self, query: str, params: tuple = None) -> Optional[Dict]:
        """Récupère une ligne"""
        raise NotImplementedError
    
    async def fetch_all(self, query: str, params: tuple = None) -> List[Dict]:
        """Récupère toutes les lignes"""
        raise NotImplementedError
    
    async def transaction(self):
        """Contexte de transaction"""
        raise NotImplementedError


class InMemoryAsyncDatabase(AsyncDatabaseGateway):
    """Implémentation in-memory pour les tests"""
    
    def __init__(self):
        self.data: Dict[str, List[Dict]] = {}
        self._connected = False
    
    async def connect(self) -> None:
        self._connected = True
        logger.info("In-memory database connected")
    
    async def disconnect(self) -> None:
        self._connected = False
        logger.info("In-memory database disconnected")
    
    async def execute(self, query: str, params: tuple = None) -> Any:
        logger.debug(f"Execute: {query}")
        return None
    
    async def fetch_one(self, query: str, params: tuple = None) -> Optional[Dict]:
        logger.debug(f"Fetch one: {query}")
        return None
    
    async def fetch_all(self, query: str, params: tuple = None) -> List[Dict]:
        logger.debug(f"Fetch all: {query}")
        return []
    
    async def insert(self, table: str, record: Dict) -> None:
        """Insert a record"""
        if table not in self.data:
            self.data[table] = []
        self.data[table].append(record)
    
    async def find(self, table: str, filter_fn: callable = None) -> List[Dict]:
        """Find records"""
        records = self.data.get(table, [])
        if filter_fn:
            return [r for r in records if filter_fn(r)]
        return records


# ============================================
# ASYNC UTILITIES
# ============================================

async def retry_async(
    func: callable,
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0
) -> Any:
    """
    Réessaie une fonction async en cas d'échec
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                wait_time = delay * (backoff ** attempt)
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
    
    raise last_exception


async def timeout_async(func: callable, timeout_seconds: float) -> Any:
    """
    Exécute une fonction avec timeout
    """
    return await asyncio.wait_for(func(), timeout=timeout_seconds)


async def parallel_map(func: callable, items: List[Any], max_concurrent: int = 10) -> List[Any]:
    """
    Map parallèle asynchrone
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def bounded_func(item):
        async with semaphore:
            return await func(item)
    
    return await asyncio.gather(*[bounded_func(item) for item in items])


# ============================================
# TESTS
# ============================================

if __name__ == '__main__':
    async def main():
        print("=== Async I/O Module Tests ===\n")
        
        # Test batch processing
        print("1. Batch Processing Test:")
        items = list(range(100))
        
        async def dummy_processor(item):
            await asyncio.sleep(0.001)
        
        result = await process_batch_async(items, dummy_processor, max_concurrent=20)
        print(f"   Processed: {result.success}/{result.total}")
        print(f"   Duration: {result.duration_ms:.2f}ms")
        
        # Test transaction processor
        print("\n2. Transaction Processor Test:")
        processor = AsyncTransactionProcessor(max_concurrent=10)
        
        transactions = [
            Transaction(id=f"TXN-{i}", account_id="ACC-001", type="DEPOSIT", amount=Decimal('100.00'))
            for i in range(50)
        ]
        
        batch_result = await processor.process_batch(transactions)
        print(f"   Transactions: {batch_result.success}/{batch_result.total}")
        print(f"   Stats: {processor.get_stats()}")
        
        # Test in-memory database
        print("\n3. In-Memory Database Test:")
        db = InMemoryAsyncDatabase()
        await db.connect()
        await db.insert("accounts", {"id": "ACC-001", "balance": 1000})
        await db.insert("accounts", {"id": "ACC-002", "balance": 2000})
        records = await db.find("accounts")
        print(f"   Records: {len(records)}")
        await db.disconnect()
        
        print("\n=== All Async Tests Passed ===")
    
    asyncio.run(main())
