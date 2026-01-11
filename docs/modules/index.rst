Modules Reference
=================

This section provides detailed documentation for all system modules.

Core System
-----------

MegaEnterpriseSystem
~~~~~~~~~~~~~~~~~~~~

The main system class containing all business logic.

.. automodule:: mega_enterprise
   :members:
   :undoc-members:
   :show-inheritance:

Configuration
~~~~~~~~~~~~~

.. autoclass:: mega_enterprise.MegaEnterpriseSystemConfig
   :members:
   :undoc-members:

Processing Status
~~~~~~~~~~~~~~~~~

.. autoclass:: mega_enterprise.ProcessingStatus
   :members:
   :undoc-members:

Module Structure
----------------

Banking Module
~~~~~~~~~~~~~~

Handles core banking operations:

* ``p_2000_process_banking()`` - Main banking workflow
* ``p_2100_process_deposits()`` - Deposit processing
* ``p_2200_process_withdrawals()`` - Withdrawal processing
* ``p_2300_process_transfers()`` - Transfer operations
* ``p_2400_calculate_interest()`` - Interest calculations
* ``p_2500_apply_fees()`` - Fee processing

Loan Module
~~~~~~~~~~~

Handles loan operations:

* ``p_3000_process_loans()`` - Main loan workflow
* ``p_3100_process_applications()`` - Application processing
* ``p_3200_process_payments()`` - Payment processing
* ``p_3300_calculate_amortization()`` - Amortization schedules
* ``p_3400_assess_delinquencies()`` - Delinquency assessment

Insurance Module
~~~~~~~~~~~~~~~~

Handles insurance operations:

* ``p_4000_process_insurance()`` - Main insurance workflow
* ``p_4100_process_policies()`` - Policy management
* ``p_4200_calculate_premiums()`` - Premium calculations
* ``p_4300_process_claims()`` - Claims processing

Investment Module
~~~~~~~~~~~~~~~~~

Handles investment operations:

* ``p_5000_process_investments()`` - Main investment workflow
* ``p_5100_update_market_prices()`` - Price updates
* ``p_5200_calculate_portfolio_value()`` - Portfolio valuation
* ``p_5300_process_trades()`` - Trade execution

Fraud Detection
~~~~~~~~~~~~~~~

Handles fraud detection:

* ``p_7000_fraud_detection()`` - Main fraud workflow
* ``p_7100_analyze_patterns()`` - Pattern analysis
* ``p_7200_check_velocity()`` - Velocity checks
* ``p_7400_behavioral_scoring()`` - Behavioral scoring

Compliance
~~~~~~~~~~

Handles regulatory compliance:

* ``p_7600_compliance_processing()`` - Main compliance workflow
* ``p_7610_aml_screening()`` - AML screening
* ``p_7620_kyc_verification()`` - KYC verification
* ``p_7630_ofac_check()`` - OFAC screening
