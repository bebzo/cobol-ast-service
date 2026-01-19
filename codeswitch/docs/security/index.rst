Security Module
===============

The security module provides production-grade encryption, hashing, and validation.

Encryption
----------

AES-256 encryption using the cryptography.Fernet library.

.. code-block:: python

   from security.crypto_utils import encrypt_data, decrypt_data

   # Encrypt sensitive data
   encrypted = encrypt_data("SSN: 123-45-6789")
   
   # Decrypt
   decrypted = decrypt_data(encrypted)

Key Derivation
~~~~~~~~~~~~~~

Derive encryption keys from passwords using PBKDF2:

.. code-block:: python

   from security.crypto_utils import derive_key

   key = derive_key("user_password", salt=b"random_salt")

Password Hashing
----------------

Secure password hashing with PBKDF2-SHA256 (100,000 iterations).

.. code-block:: python

   from security.crypto_utils import hash_password, verify_password

   # Hash a password
   hashed = hash_password("SecurePassword123!")
   
   # Verify
   is_valid = verify_password("SecurePassword123!", hashed)  # True
   is_valid = verify_password("wrong_password", hashed)       # False

PII Masking
-----------

Mask personally identifiable information for logs and displays.

.. code-block:: python

   from security.crypto_utils import mask_ssn, mask_card_number, mask_email, mask_pii

   mask_ssn("123-45-6789")           # "XXX-XX-6789"
   mask_card_number("4111111111111111")  # "****-****-****-1111"
   mask_email("john@example.com")    # "j***@example.com"
   
   # Auto-detect type
   mask_pii("123-45-6789")           # Detected as SSN
   mask_pii("4111111111111111")      # Detected as card

Input Validation
----------------

SSN Validation
~~~~~~~~~~~~~~

.. code-block:: python

   from security.crypto_utils import validate_ssn

   validate_ssn("123-45-6789")  # True
   validate_ssn("000-00-0000")  # False (invalid zone)
   validate_ssn("666-00-0000")  # False (invalid zone)

Card Number Validation (Luhn)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from security.crypto_utils import validate_card_luhn

   validate_card_luhn("4111111111111111")  # True (Visa test card)
   validate_card_luhn("1234567890123456")  # False

Email Validation
~~~~~~~~~~~~~~~~

.. code-block:: python

   from security.crypto_utils import validate_email

   validate_email("user@example.com")  # True
   validate_email("invalid-email")     # False

Input Sanitization
------------------

.. code-block:: python

   from security.crypto_utils import sanitize_input, prevent_sql_injection

   # Limit length and remove control characters
   sanitize_input(user_input, max_length=100)
   
   # Remove SQL injection patterns
   prevent_sql_injection("'; DROP TABLE users; --")  # Cleaned

Security Decorators
-------------------

.. code-block:: python

   from security.crypto_utils import encrypt_result, mask_pii_in_logs, validate_inputs

   @encrypt_result
   def get_ssn(user_id):
       return "123-45-6789"  # Will be encrypted automatically

   @mask_pii_in_logs
   def process_customer(ssn, email):
       ...  # Logs will show masked values

   @validate_inputs(ssn=validate_ssn, email=validate_email)
   def create_account(ssn, email):
       ...  # Raises ValidationError if invalid

Secure Logging
--------------

Automatically mask PII in log messages:

.. code-block:: python

   from security.crypto_utils import setup_secure_logging

   setup_secure_logging()
   
   # SSN, card numbers, emails will be masked in logs
   logger.info("Processing SSN 123-45-6789")  # Logged as "XXX-XX-XXXX"

Environment Variables
---------------------

* ``ENCRYPTION_KEY`` - Base64-encoded Fernet key (32 bytes)
* ``HASH_SALT`` - Salt for password hashing

.. warning::
   Never commit encryption keys to version control. Use environment
   variables or a secrets manager in production.
