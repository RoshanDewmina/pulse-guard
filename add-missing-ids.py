#!/usr/bin/env python3
"""
Add missing 'id: crypto.randomUUID(),' to Prisma create operations
"""
import re
import sys
from pathlib import Path

def process_file(filepath):
    """Add id to create operations in a TypeScript file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Pattern: .create({ followed by data: { but NOT already having id:
    # This regex finds create operations where data object doesn't start with id:
    pattern = r'(\.create\(\{\s*data:\s*\{)\s*(?!id:)'
    
    # Check if any matches
    matches = list(re.finditer(pattern, content))
    if not matches:
        return False
    
    # Add id: crypto.randomUUID(), after each match
    replacement = r'\1\n          id: crypto.randomUUID(),'
    content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('/home/roshan/development/personal/pulse-guard/apps/web/src')
    
    modified_files = []
    for ts_file in src_dir.rglob('*.ts'):
        if '/node_modules/' in str(ts_file) or '/.next/' in str(ts_file):
            continue
        if process_file(ts_file):
            modified_files.append(ts_file)
    
    for tsx_file in src_dir.rglob('*.tsx'):
        if '/node_modules/' in str(tsx_file) or '/.next/' in str(tsx_file):
            continue
        if process_file(tsx_file):
            modified_files.append(tsx_file)
    
    if modified_files:
        print(f"Modified {len(modified_files)} files:")
        for f in modified_files[:10]:  # Show first 10
            print(f"  {f}")
        if len(modified_files) > 10:
            print(f"  ... and {len(modified_files) - 10} more")
    else:
        print("No files needed modification")

if __name__ == '__main__':
    main()

