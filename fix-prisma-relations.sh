#!/bin/bash

# Fix Prisma relation issues in worker app
echo "Fixing Prisma relation issues..."

# Fix monitor -> Monitor relations
find apps/worker/src -name "*.ts" -exec sed -i 's/include: {[[:space:]]*monitor: {/include: {\n      Monitor: {/g' {} \;
find apps/worker/src -name "*.ts" -exec sed -i 's/include: {[[:space:]]*org: true/include: {\n        Org: true/g' {} \;

# Fix property access from monitor to Monitor
find apps/worker/src -name "*.ts" -exec sed -i 's/incident\.monitor\./incident.Monitor./g' {} \;
find apps/worker/src -name "*.ts" -exec sed -i 's/\.monitor\./\.Monitor\./g' {} \;

# Fix org -> Org relations
find apps/worker/src -name "*.ts" -exec sed -i 's/include: {[[:space:]]*org: true/include: {\n        Org: true/g' {} \;

echo "Fixed Prisma relation issues"
