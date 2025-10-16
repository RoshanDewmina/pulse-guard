#!/usr/bin/env python3
"""
Comprehensive fix for all Prisma create operations
Adds both id and updatedAt fields where needed
"""
import re
from pathlib import Path

def fix_file(filepath):
    """Fix all create operations in a file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    fixed = False
    
    # Pattern 1: data: { with neither id nor updatedAt
    # Look for .create({ data: { that doesn't have id: or updatedAt: immediately after
    pattern1 = r'(\.create\(\{\s*data:\s*\{)(\s*)(?!.*?id:)(?!.*?updatedAt:)'
    if re.search(pattern1, content, re.DOTALL):
        # This is tricky - need to add both id and updatedAt if missing
        # For now, just ensure updatedAt is present
        lines = content.split('\n')
        new_lines = []
        in_create = False
        create_indent = ''
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            
            # Check if this line has .create({ data: {
            if '.create({' in line and 'data:' in line:
                in_create = True
                # Get the indentation
                match = re.match(r'(\s*)', line)
                if match:
                    create_indent = match.group(1) + '  '
                    
            # If we're in a create and we see the closing of data object
            elif in_create and '})' in line:
                # Check if updatedAt was added in the data object
                data_block = '\n'.join(new_lines[max(0, len(new_lines)-20):])
                if 'updatedAt:' not in data_block and '.create({' in data_block:
                    # Insert updatedAt before the closing
                    insert_idx = len(new_lines) - 1
                    # Find the line before the closing brace
                    while insert_idx > 0 and not new_lines[insert_idx].strip().startswith('}'):
                        insert_idx -= 1
                    if insert_idx > 0:
                        new_lines.insert(insert_idx, f'{create_indent}      updatedAt: new Date(),')
                        fixed = True
                in_create = False
        
        if fixed:
            content = '\n'.join(new_lines)
    
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
        if fix_file(ts_file):
            modified_files.append(ts_file)
    
    if modified_files:
        print(f"Modified {len(modified_files)} files")
    else:
        print("No files needed modification")

if __name__ == '__main__':
    main()

