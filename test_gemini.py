import google.generativeai as genai
import os

# Get API key from env
api_key = os.environ.get('GEMINI_API_KEY', '')
if not api_key:
    # Try reading from .env
    try:
        with open('/workspace/codeswitch-hackathon/.env.local', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
    except:
        pass

if not api_key:
    print("No API key found")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

# Sample COBOL chunk
cobol = """
       2400-CALCULATE-INTEREST.
           PERFORM 2410-DETERMINE-RATE
           READ ACCOUNT-FILE INTO ACCOUNT-RECORD
               AT END SET EOF-ACCOUNTS TO TRUE
               NOT AT END
                   IF ACCT-STATUS = 'A'
                       PERFORM 2420-COMPUTE-INTEREST
                       PERFORM 2430-POST-INTEREST
                   END-IF
           END-READ.
           
       2410-DETERMINE-RATE.
           EVALUATE TRUE
               WHEN ACCT-CHECKING
                   MOVE WS-CHECKING-RATE TO WS-CALC-RATE
               WHEN ACCT-SAVINGS
                   MOVE WS-SAVINGS-RATE TO WS-CALC-RATE
               WHEN OTHER
                   MOVE 0.001 TO WS-CALC-RATE
           END-EVALUATE.
       
       2420-COMPUTE-INTEREST.
           COMPUTE WS-CALC-INTEREST = 
               ACCT-BALANCE * WS-CALC-RATE / 12.
               
       2430-POST-INTEREST.
           ADD WS-CALC-INTEREST TO ACCT-BALANCE
           MOVE CURRENT-DATE TO ACCT-LAST-TRANS-DATE.
"""

prompt = """You are an expert COBOL-to-Python translator. FULLY TRANSLATE the business logic.

For each COBOL paragraph:
1. PERFORM X → call function x()
2. MOVE A TO B → b = a
3. COMPUTE X = A + B → x = a + b
4. IF condition → if condition:
5. EVALUATE → if/elif chain
6. ADD X TO Y → y += x

Use 'global' for working storage variables.
Use Decimal for monetary values.
Return ONLY Python code (no markdown).

COBOL:
""" + cobol

result = model.generate_content(prompt)
print(result.text)
