#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check credentials
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Please provide username and password${NC}"
    echo "Usage: ./run-tests.sh USERNAME PASSWORD"
    exit 1
fi

# Export credentials
export DEXCOM_USERNAME=$1
export DEXCOM_PASSWORD=$2

echo -e "${YELLOW}JSdexcom Test Suite${NC}"
echo -e "${YELLOW}=================${NC}"

# Run ES Module test
echo -e "\n${GREEN}Running ES Module tests...${NC}"
npm run test:esm
export ESM_TEST_RESULT=$?

# Run CommonJS test
echo -e "\n${GREEN}Running CommonJS tests...${NC}"
npm run test:cjs
export CJS_TEST_RESULT=$?

# Print summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}===========${NC}"

if [ $ESM_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ ES Module tests passed${NC}"
else
    echo -e "${RED}✗ ES Module tests failed${NC}"
fi

if [ $CJS_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ CommonJS tests passed${NC}"
else
    echo -e "${RED}✗ CommonJS tests failed${NC}"
fi

# Generate report
echo -e "\n${YELLOW}Generating test report...${NC}"
node tests/utils/generate-report.js

echo -e "\n${GREEN}Test completed! Check tests/logs for detailed results.${NC}"