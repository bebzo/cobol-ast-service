#!/bin/bash
# Automated Test and Deploy Script
# Tests the API, validates Python output, and only deploys if all tests pass

set -e

API_URL="${API_URL:-https://cobol-ast-service.vercel.app/api/analyse}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
REPO_ID="1124582998"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  CodeSwitch Validation & Deploy System  "
echo "=========================================="
echo ""

# Test COBOL samples
SAMPLES=(
    "SIMPLE|       IDENTIFICATION DIVISION.\n       PROGRAM-ID. SIMPLE.\n       PROCEDURE DIVISION.\n           DISPLAY 'HELLO'.\n           STOP RUN."
    "CALCULATE|       IDENTIFICATION DIVISION.\n       PROGRAM-ID. CALC.\n       DATA DIVISION.\n       WORKING-STORAGE SECTION.\n       01 WS-NUM PIC 9(5) VALUE 100.\n       PROCEDURE DIVISION.\n           COMPUTE WS-NUM = WS-NUM * 2.\n           STOP RUN."
)

# Function to test API
test_api() {
    local name="$1"
    local cobol="$2"
    
    echo -n "Testing $name... "
    
    # Call API
    local response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"cobolCode\": \"$cobol\"}" 2>/dev/null)
    
    if [ -z "$response" ]; then
        echo -e "${RED}FAILED${NC} - No response from API"
        return 1
    fi
    
    # Extract Python code
    local python_code=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('python_code', ''))
except:
    pass
" 2>/dev/null)
    
    if [ -z "$python_code" ]; then
        echo -e "${RED}FAILED${NC} - No Python code in response"
        return 1
    fi
    
    # Validate syntax
    local validation=$(echo "$python_code" | python3 -c "
import sys, ast
code = sys.stdin.read()
try:
    ast.parse(code)
    print('VALID')
except SyntaxError as e:
    print(f'ERROR:{e.lineno}:{e.msg}')
" 2>/dev/null)
    
    if [[ "$validation" == "VALID" ]]; then
        echo -e "${GREEN}PASSED${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC} - $validation"
        return 1
    fi
}

# Function to check for known bad patterns
check_patterns() {
    local code="$1"
    local issues=0
    
    # Check for self. if hasattr
    if echo "$code" | grep -q "self\. if hasattr"; then
        echo -e "  ${YELLOW}WARNING${NC}: Found 'self. if hasattr' pattern"
        ((issues++))
    fi
    
    # Check for Generated from (not in comment)
    if echo "$code" | grep -v "^#" | grep -q "Generated from"; then
        echo -e "  ${YELLOW}WARNING${NC}: Found 'Generated from' artifact"
        ((issues++))
    fi
    
    # Check for concatenated docstrings (more than 2 triple quotes on a line)
    if echo "$code" | grep -E '""".*""".*"""' > /dev/null; then
        echo -e "  ${YELLOW}WARNING${NC}: Found concatenated docstrings"
        ((issues++))
    fi
    
    return $issues
}

# Run tests
echo "Phase 1: API Syntax Validation"
echo "------------------------------"

all_passed=true
for sample in "${SAMPLES[@]}"; do
    name="${sample%%|*}"
    cobol="${sample#*|}"
    cobol=$(echo -e "$cobol")
    
    if ! test_api "$name" "$cobol"; then
        all_passed=false
    fi
done

echo ""

# Test with larger file if available
if [ -f "$PROJECT_DIR/../ENTERPRISE-BANKING.cbl" ]; then
    echo "Phase 2: Large File Test (ENTERPRISE-BANKING.cbl)"
    echo "-------------------------------------------------"
    
    # Read first 500 lines
    cobol_large=$(head -500 "$PROJECT_DIR/../ENTERPRISE-BANKING.cbl" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')
    
    echo -n "Testing ENTERPRISE-BANKING... "
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"cobolCode\": \"$cobol_large\"}" 2>/dev/null)
    
    python_code=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('python_code', ''))
except:
    pass
" 2>/dev/null)
    
    validation=$(echo "$python_code" | python3 -c "
import sys, ast
code = sys.stdin.read()
try:
    ast.parse(code)
    print('VALID')
except SyntaxError as e:
    print(f'ERROR:{e.lineno}:{e.msg}')
    # Show the problematic line
    lines = code.split('\n')
    if e.lineno and e.lineno <= len(lines):
        print(f'LINE:{lines[e.lineno-1][:100]}')
" 2>/dev/null)
    
    if [[ "$validation" == "VALID" ]]; then
        echo -e "${GREEN}PASSED${NC}"
        
        # Check for patterns
        echo "  Pattern check:"
        if check_patterns "$python_code"; then
            echo -e "  ${GREEN}No bad patterns found${NC}"
        fi
    else
        echo -e "${RED}FAILED${NC}"
        echo "$validation" | while read line; do
            echo "  $line"
        done
        all_passed=false
    fi
    
    echo ""
fi

# Summary
echo "=========================================="
if $all_passed; then
    echo -e "${GREEN}ALL TESTS PASSED${NC}"
    
    # Deploy if token provided
    if [ -n "$VERCEL_TOKEN" ]; then
        echo ""
        echo "Triggering Vercel deployment..."
        
        deploy_response=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"cobol-ast-service\",
                \"project\": \"cobol-ast-service\",
                \"gitSource\": {
                    \"type\": \"github\",
                    \"repoId\": $REPO_ID,
                    \"ref\": \"main\"
                },
                \"target\": \"production\"
            }")
        
        deploy_id=$(echo "$deploy_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
        
        if [ -n "$deploy_id" ]; then
            echo -e "${GREEN}Deployment triggered: $deploy_id${NC}"
        else
            echo -e "${RED}Deployment failed${NC}"
            echo "$deploy_response"
        fi
    else
        echo "No VERCEL_TOKEN provided - skipping deployment"
    fi
else
    echo -e "${RED}TESTS FAILED - NOT DEPLOYING${NC}"
    exit 1
fi

echo "=========================================="
