"""
Update Directive with New Learnings

This script updates directive files with new patterns, learnings, and best practices
as part of the self-annealing process.
"""

import sys
import os
from datetime import datetime
from typing import Optional


def update_directive(
    directive_path: str,
    section: str,
    learning: str,
    learning_type: str,
    source: str
) -> bool:
    """
    Update a directive file with a new learning.
    
    Args:
        directive_path: Path to directive file
        section: Section to update (e.g., "Common Patterns")
        learning: The learning content to add
        learning_type: Type of learning (pattern, best_practice, edge_case, etc.)
        source: Where the learning came from
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Read current directive
        with open(directive_path, 'r') as f:
            content = f.read()
        
        # Create learning entry
        timestamp = datetime.now().strftime('%Y-%m-%d')
        learning_entry = f"""
### {learning}

**Type**: {learning_type}  
**Source**: {source}  
**Added**: {timestamp}

"""
        
        # Find section to update
        section_marker = f"## {section}"
        if section_marker not in content:
            print(f"❌ Section '{section}' not found in {directive_path}")
            print(f"   Available sections:")
            for line in content.split('\\n'):
                if line.startswith('## '):
                    print(f"   - {line[3:]}")
            return False
        
        # Insert learning at end of section
        # Find next section or end of file
        lines = content.split('\\n')
        section_start = None
        next_section = None
        
        for i, line in enumerate(lines):
            if line.startswith(section_marker):
                section_start = i
            elif section_start is not None and line.startswith('## '):
                next_section = i
                break
        
        if section_start is None:
            print(f"❌ Could not locate section '{section}'")
            return False
        
        # Insert learning
        if next_section:
            insert_pos = next_section
        else:
            insert_pos = len(lines)
        
        lines.insert(insert_pos, learning_entry)
        
        # Write updated content
        updated_content = '\\n'.join(lines)
        with open(directive_path, 'w') as f:
            f.write(updated_content)
        
        # Log the update
        log_update(directive_path, section, learning, source)
        
        print(f"✅ Updated {directive_path}")
        print(f"   Section: {section}")
        print(f"   Learning: {learning}")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ File not found: {directive_path}")
        return False
    except Exception as e:
        print(f"❌ Error updating directive: {e}")
        return False


def log_update(directive_path: str, section: str, learning: str, source: str):
    """Log the directive update to learning log."""
    log_path = "directives/learning_log.md"
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    log_entry = f"""
## [{timestamp}] - {learning}

**Directive**: {os.path.basename(directive_path)}  
**Section**: {section}  
**Source**: {source}  
**Action**: Added new learning to directive

---
"""
    
    # Create log if doesn't exist
    if not os.path.exists(log_path):
        with open(log_path, 'w') as f:
            f.write("# Learning Log\\n\\n")
            f.write("This log tracks all updates to directives as part of the self-annealing process.\\n\\n")
    
    # Append log entry
    with open(log_path, 'a') as f:
        f.write(log_entry)


def list_sections(directive_path: str):
    """List all sections in a directive."""
    try:
        with open(directive_path, 'r') as f:
            content = f.read()
        
        print(f"\\nSections in {os.path.basename(directive_path)}:")
        for line in content.split('\\n'):
            if line.startswith('## '):
                print(f"  - {line[3:]}")
        print()
        
    except FileNotFoundError:
        print(f"❌ File not found: {directive_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  List sections:")
        print("    python update_directive.py --list <directive_path>")
        print("\\n  Add learning:")
        print("    python update_directive.py \\\\")
        print("      --directive <path> \\\\")
        print("      --section <section_name> \\\\")
        print("      --learning <learning_title> \\\\")
        print("      --type <learning_type> \\\\")
        print("      --source <source>")
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        if len(sys.argv) < 3:
            print("❌ Please provide directive path")
            sys.exit(1)
        list_sections(sys.argv[2])
        sys.exit(0)
    
    # Parse arguments
    args = {}
    i = 1
    while i < len(sys.argv):
        if sys.argv[i].startswith('--'):
            key = sys.argv[i][2:]
            if i + 1 < len(sys.argv):
                args[key] = sys.argv[i + 1]
                i += 2
            else:
                i += 1
        else:
            i += 1
    
    # Validate required arguments
    required = ['directive', 'section', 'learning', 'type', 'source']
    missing = [r for r in required if r not in args]
    if missing:
        print(f"❌ Missing required arguments: {', '.join(missing)}")
        sys.exit(1)
    
    # Update directive
    success = update_directive(
        args['directive'],
        args['section'],
        args['learning'],
        args['type'],
        args['source']
    )
    
    sys.exit(0 if success else 1)
