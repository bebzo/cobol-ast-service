Async Operations
================

The async module provides high-performance asynchronous operations
for file I/O, batch processing, and database operations.

File Operations
---------------

Async file reading and writing using aiofiles:

.. code-block:: python

   from core.async_io import read_file_async, write_file_async, read_json_async

   # Read file
   content = await read_file_async("data/accounts.txt")

   # Write file
   await write_file_async("output/report.txt", report_content)

   # Read JSON
   data = await read_json_async("config/settings.json")

   # Read line by line (streaming)
   async for line in read_lines_async("data/large_file.txt"):
       process(line)

Batch Processing
----------------

Process large batches with controlled concurrency:

.. code-block:: python

   from core.async_io import process_batch_async, BatchResult

   async def process_item(item):
       await some_async_operation(item)

   items = list(range(1000))
   
   result: BatchResult = await process_batch_async(
       items,
       processor=process_item,
       max_concurrent=50,
       on_progress=lambda current, total: print(f"{current}/{total}")
   )

   print(f"Success: {result.success}/{result.total}")
   print(f"Duration: {result.duration_ms}ms")

Transaction Processing
----------------------

High-throughput transaction processing:

.. code-block:: python

   from core.async_io import AsyncTransactionProcessor, Transaction
   from decimal import Decimal

   # Create processor
   processor = AsyncTransactionProcessor(max_concurrent=100)

   # Create transactions
   transactions = [
       Transaction(
           id="TXN-001",
           account_id="ACC-123",
           type="DEPOSIT",
           amount=Decimal("1000.00")
       ),
       Transaction(
           id="TXN-002",
           account_id="ACC-456",
           type="WITHDRAWAL",
           amount=Decimal("500.00")
       ),
   ]

   # Process batch
   result = await processor.process_batch(transactions)

   # Get statistics
   stats = processor.get_stats()
   print(f"Processed: {stats['processed_count']}")
   print(f"Total amount: ${stats['total_amount']}")

Database Gateway
----------------

Abstract interface for async database operations:

.. code-block:: python

   from core.async_io import AsyncDatabaseGateway, InMemoryAsyncDatabase

   # Use in-memory database for testing
   db = InMemoryAsyncDatabase()
   await db.connect()

   # Insert records
   await db.insert("accounts", {"id": "ACC-001", "balance": 1000})

   # Query records
   accounts = await db.find("accounts", lambda r: r["balance"] > 500)

   await db.disconnect()

Implement your own gateway for production databases:

.. code-block:: python

   class PostgresAsyncGateway(AsyncDatabaseGateway):
       async def connect(self):
           self.pool = await asyncpg.create_pool(dsn)
       
       async def fetch_all(self, query, params=None):
           async with self.pool.acquire() as conn:
               return await conn.fetch(query, *params)

Utilities
---------

Retry with Backoff
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from core.async_io import retry_async

   async def flaky_operation():
       # May fail sometimes
       ...

   result = await retry_async(
       flaky_operation,
       max_retries=3,
       delay=1.0,
       backoff=2.0  # Exponential backoff
   )

Timeout
~~~~~~~

.. code-block:: python

   from core.async_io import timeout_async

   result = await timeout_async(
       slow_operation,
       timeout_seconds=30.0
   )

Parallel Map
~~~~~~~~~~~~

.. code-block:: python

   from core.async_io import parallel_map

   async def process(item):
       return await transform(item)

   results = await parallel_map(
       process,
       items,
       max_concurrent=20
   )

Performance Tips
----------------

1. **Tune concurrency** - Start with 10-50 concurrent tasks and adjust based on I/O latency
2. **Use connection pools** - For database operations, use asyncpg pools
3. **Batch database operations** - Use ``executemany`` or bulk inserts
4. **Monitor backpressure** - If memory grows, reduce concurrency
5. **Use streaming** - For large files, use ``read_lines_async`` instead of loading all at once
