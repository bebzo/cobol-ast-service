API Reference
=============

This section provides API documentation for all public interfaces.

Core Classes
------------

MegaEnterpriseSystem
~~~~~~~~~~~~~~~~~~~~

Main processing system class.

**Attributes:**

* ``config`` - Configuration settings (MegaEnterpriseSystemConfig)
* ``logger`` - Logging instance
* ``total_deposits`` - Running total of deposits
* ``total_withdrawals`` - Running total of withdrawals
* ``total_loans`` - Running total of loans

**Methods:**

.. code-block:: python

   def run(self) -> None:
       """Execute the main processing workflow."""

   def p_0000_main_control(self) -> None:
       """Main control procedure - orchestrates all modules."""

   def p_1000_initialization(self) -> None:
       """Initialize system, open files, load parameters."""

   def p_9000_termination(self) -> None:
       """Finalize processing, close files, display statistics."""

MegaEnterpriseSystemConfig
~~~~~~~~~~~~~~~~~~~~~~~~~~

Configuration dataclass for system settings.

**Interest Rates:**

* ``savings_rate`` - Savings account interest rate (default: 0.0225)
* ``checking_rate`` - Checking account interest rate (default: 0.0050)
* ``mm_rate`` - Money market rate (default: 0.0350)
* ``cd_rate_1yr`` - 1-year CD rate (default: 0.0425)
* ``mortgage_rate_30`` - 30-year mortgage rate (default: 0.0699)

**Fees:**

* ``overdraft_fee`` - Overdraft fee (default: $35.00)
* ``nsf_fee`` - NSF fee (default: $35.00)
* ``wire_fee_domestic`` - Domestic wire fee (default: $25.00)
* ``wire_fee_intl`` - International wire fee (default: $45.00)
* ``late_payment_fee`` - Late payment fee (default: $39.00)

**Tax Brackets:**

* ``bracket_1_rate`` through ``bracket_5_rate`` - Progressive tax rates

Telemetry API
-------------

.. automodule:: core.telemetry
   :members: init_telemetry, get_tracer, get_meter, traced, timed, span_context, timer_context
   :undoc-members:

BankingMetrics
~~~~~~~~~~~~~~

Predefined metrics for banking operations.

.. code-block:: python

   from core.telemetry import BankingMetrics

   metrics = BankingMetrics()
   metrics.record_transaction("deposit", 1000.0, 5.5, success=True)
   metrics.set_active_accounts(1500)

HealthChecker
~~~~~~~~~~~~~

Health check management.

.. code-block:: python

   from core.telemetry import HealthChecker

   checker = HealthChecker()
   checker.register_check("database", lambda: db.is_connected())
   status = checker.run_checks()
   print(status.is_healthy())
