"""
Generate Mermaid Diagram from Retell AI Conversation Flow JSON

This script converts a Retell AI conversation flow JSON into a Mermaid flowchart diagram.
Includes syntax validation to ensure diagrams render correctly.
"""

import json
import re
import sys
from typing import Dict, List, Set, Tuple


class MermaidSyntaxError(Exception):
    """Raised when mermaid syntax validation fails."""
    pass


class MermaidGenerator:
    """Generates Mermaid diagrams from conversation flow JSON."""
    
    def __init__(self, flow_data: Dict):
        """
        Initialize with flow data.
        
        Args:
            flow_data: Parsed JSON conversation flow
        """
        self.flow = flow_data
        self.nodes = {}
        self.edges = []
        self.global_nodes = []
        
        # Extract conversation flow if nested
        if 'conversationFlow' in flow_data:
            self.conversation_flow = flow_data['conversationFlow']
        else:
            self.conversation_flow = flow_data
    
    def generate(self) -> str:
        """
        Generate Mermaid diagram.
        
        Returns:
            Mermaid flowchart syntax as string
        """
        self._parse_nodes()
        self._parse_edges()
        return self._build_mermaid()
    
    def _parse_nodes(self):
        """Parse all nodes from the flow."""
        if 'nodes' not in self.conversation_flow:
            return
        
        for node in self.conversation_flow['nodes']:
            node_id = node.get('id', '')
            node_type = node.get('type', 'conversation')
            node_name = node.get('name', node_id)
            
            # Check if global node
            if 'global_node_setting' in node:
                self.global_nodes.append(node_id)
            
            # Store node info
            self.nodes[node_id] = {
                'name': node_name,
                'type': node_type,
                'is_start': node_id == self.conversation_flow.get('start_node_id'),
                'is_global': node_id in self.global_nodes
            }
    
    def _parse_edges(self):
        """Parse all edges from nodes."""
        if 'nodes' not in self.conversation_flow:
            return
        
        for node in self.conversation_flow['nodes']:
            node_id = node.get('id', '')
            
            # Regular edges
            if 'edges' in node:
                for edge in node['edges']:
                    dest = edge.get('destination_node_id')
                    condition = edge.get('condition', edge.get('transition_condition', {}).get('prompt', ''))
                    if dest:
                        self.edges.append({
                            'from': node_id,
                            'to': dest,
                            'label': condition
                        })
            
            # Skip response edge
            if 'skip_response_edge' in node:
                skip_edge = node['skip_response_edge']
                dest = skip_edge.get('destination_node_id')
                if dest:
                    self.edges.append({
                        'from': node_id,
                        'to': dest,
                        'label': 'skip response',
                        'style': 'dotted'
                    })
            
            # Transfer edge (failure path)
            if node.get('type') == 'transfer_call' and 'edge' in node:
                dest = node['edge'].get('destination_node_id')
                if dest:
                    self.edges.append({
                        'from': node_id,
                        'to': dest,
                        'label': 'transfer failed'
                    })
    
    def _build_mermaid(self) -> str:
        """Build the Mermaid diagram syntax."""
        lines = ['flowchart TD']
        lines.append('')
        
        # Add nodes
        for node_id, info in self.nodes.items():
            shape = self._get_node_shape(info['type'])
            name = self._sanitize_text(info['name'])
            
            # Add styling for special nodes
            style_class = ''
            if info['is_start']:
                style_class = ':::startNode'
            elif info['is_global']:
                style_class = ':::globalNode'
            elif info['type'] == 'end':
                style_class = ':::endNode'
            elif info['type'] == 'transfer_call':
                style_class = ':::transferNode'
            
            lines.append(f'    {self._sanitize_id(node_id)}{shape[0]}{name}{shape[1]}{style_class}')
        
        lines.append('')
        
        # Add edges
        for edge in self.edges:
            from_id = self._sanitize_id(edge['from'])
            to_id = self._sanitize_id(edge['to'])
            label = self._sanitize_text(edge.get('label', ''))
            
            # Choose arrow style
            if edge.get('style') == 'dotted':
                arrow = '-.->|'
            else:
                arrow = '-->|'
            
            if label:
                lines.append(f'    {from_id} {arrow}{label}| {to_id}')
            else:
                lines.append(f'    {from_id} --> {to_id}')
        
        lines.append('')
        
        # Add styling
        lines.extend([
            '    classDef startNode fill:#90EE90,stroke:#2E8B57,stroke-width:3px',
            '    classDef endNode fill:#FFB6C1,stroke:#DC143C,stroke-width:2px',
            '    classDef globalNode fill:#FFD700,stroke:#FF8C00,stroke-width:2px',
            '    classDef transferNode fill:#87CEEB,stroke:#4682B4,stroke-width:2px'
        ])
        
        return '\n'.join(lines)
    
    def _get_node_shape(self, node_type: str) -> tuple:
        """Get Mermaid shape syntax for node type."""
        shapes = {
            'conversation': ('[', ']'),
            'function': ('[[', ']]'),
            'logic_split': ('{', '}'),
            'end': ('([', '])'),
            'transfer_call': ('[/', '\\]'),
            'default': ('[', ']')
        }
        return shapes.get(node_type, shapes['default'])
    
    def _sanitize_id(self, node_id: str) -> str:
        """Sanitize node ID for Mermaid."""
        # Remove special characters, replace with underscore
        sanitized = node_id.replace('-', '_').replace(' ', '_')
        # Ensure starts with letter
        if sanitized and not sanitized[0].isalpha():
            sanitized = 'node_' + sanitized
        return sanitized
    
    def _sanitize_text(self, text: str) -> str:
        """Sanitize text for Mermaid labels."""
        # Truncate long text
        if len(text) > 50:
            text = text[:47] + '...'
        # Escape special characters that break mermaid syntax
        text = text.replace('"', "'")
        text = text.replace('[', '(').replace(']', ')')
        text = text.replace('{', '(').replace('}', ')')
        text = text.replace('<', '(').replace('>', ')')
        text = text.replace('|', '/')
        text = text.replace('#', '')
        text = text.replace('&', 'and')
        return text

    def validate_mermaid_syntax(self, mermaid_code: str) -> Tuple[bool, List[str]]:
        """
        Validate mermaid syntax before rendering.

        Args:
            mermaid_code: The mermaid diagram code to validate

        Returns:
            Tuple of (is_valid, list of errors)
        """
        errors = []
        lines = mermaid_code.strip().split('\n')

        # Check first line is flowchart declaration
        if not lines or not lines[0].strip().startswith('flowchart'):
            errors.append("Missing flowchart declaration (e.g., 'flowchart TD')")

        # Track defined nodes
        defined_nodes = set()
        referenced_nodes = set()

        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue

            # Skip flowchart declaration and classDef lines
            if line.startswith('flowchart') or line.startswith('classDef'):
                continue

            # Check for node definitions (node_id[label] or similar)
            node_def_match = re.match(r'^(\w+)[\[\(\{\/]', line)
            if node_def_match:
                defined_nodes.add(node_def_match.group(1))

            # Check for edge definitions (nodeA --> nodeB)
            edge_match = re.match(r'^(\w+)\s*[-.]+-?>?\|?[^|]*\|?\s*(\w+)$', line)
            if edge_match:
                referenced_nodes.add(edge_match.group(1))
                referenced_nodes.add(edge_match.group(2))

            # Check for unbalanced brackets in node definitions
            if '[' in line or '(' in line or '{' in line:
                open_brackets = line.count('[') + line.count('(') + line.count('{') + line.count('[/')
                close_brackets = line.count(']') + line.count(')') + line.count('}') + line.count('\\]')
                # Account for trapezoid shape [/ \]
                if '[/' in line:
                    open_brackets -= 1  # [/ counts as one opener
                if '\\]' in line:
                    close_brackets -= 1  # \] counts as one closer
                if open_brackets != close_brackets:
                    errors.append(f"Line {i}: Unbalanced brackets - '{line[:50]}...'")

            # Check for invalid characters in labels
            if '|' in line and line.count('|') % 2 != 0:
                errors.append(f"Line {i}: Unbalanced pipe characters in edge label")

        # Check for undefined nodes referenced in edges
        undefined = referenced_nodes - defined_nodes
        if undefined:
            errors.append(f"Nodes referenced but not defined: {', '.join(sorted(undefined))}")

        return len(errors) == 0, errors

    def generate_html(self, mermaid_code: str) -> str:
        """
        Generate HTML file with Mermaid diagram.
        
        Args:
            mermaid_code: Mermaid diagram syntax
            
        Returns:
            HTML content as string
        """
        agent_name = self.flow.get('agent_name', 'Conversation Flow')
        
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{agent_name} - Flow Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            margin-bottom: 10px;
        }}
        .meta {{
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }}
        .diagram {{
            background: white;
            padding: 20px;
            border-radius: 4px;
            overflow-x: auto;
        }}
        .legend {{
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 4px;
        }}
        .legend h3 {{
            margin-top: 0;
            color: #333;
        }}
        .legend-item {{
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 10px;
        }}
        .legend-box {{
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 5px;
            vertical-align: middle;
            border-radius: 3px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{agent_name}</h1>
        <div class="meta">
            <strong>Type:</strong> Conversational Flow Agent<br>
            <strong>Nodes:</strong> {len(self.nodes)}<br>
            <strong>Edges:</strong> {len(self.edges)}
        </div>
        
        <div class="diagram">
            <div class="mermaid">
{mermaid_code}
            </div>
        </div>
        
        <div class="legend">
            <h3>Legend</h3>
            <div class="legend-item">
                <span class="legend-box" style="background:#90EE90;border:2px solid #2E8B57;"></span>
                Start Node
            </div>
            <div class="legend-item">
                <span class="legend-box" style="background:#FFB6C1;border:2px solid #DC143C;"></span>
                End Node
            </div>
            <div class="legend-item">
                <span class="legend-box" style="background:#FFD700;border:2px solid #FF8C00;"></span>
                Global Node
            </div>
            <div class="legend-item">
                <span class="legend-box" style="background:#87CEEB;border:2px solid #4682B4;"></span>
                Transfer Node
            </div>
            <div style="margin-top:15px;">
                <strong>Node Shapes:</strong><br>
                Rectangle = Conversation | Double Rectangle = Function | Diamond = Logic Split | Stadium = End | Trapezoid = Transfer
            </div>
        </div>
    </div>
    
    <script>
        mermaid.initialize({{ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {{
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }}
        }});
    </script>
</body>
</html>'''
        return html


def generate_from_file(filepath: str, output_format: str = 'both') -> None:
    """
    Generate Mermaid diagram from JSON file.

    Args:
        filepath: Path to JSON file
        output_format: 'mermaid', 'html', or 'both'
    """
    try:
        with open(filepath, 'r') as f:
            flow_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON: {e}")
        sys.exit(1)

    generator = MermaidGenerator(flow_data)
    mermaid_code = generator.generate()

    # Validate mermaid syntax before saving
    print("\n🔍 Validating Mermaid syntax...")
    is_valid, validation_errors = generator.validate_mermaid_syntax(mermaid_code)

    if not is_valid:
        print(f"❌ Mermaid syntax validation failed!")
        for error in validation_errors:
            print(f"   • {error}")
        print("\n⚠️  Attempting to fix common issues...")
        # The generator already sanitizes, so if validation fails, show the code for debugging
        print("\nGenerated Mermaid code (first 500 chars):")
        print(mermaid_code[:500])
        sys.exit(1)

    print("✅ Mermaid syntax validation passed!")

    # Output Mermaid code
    if output_format in ['mermaid', 'both']:
        output_file = filepath.replace('.json', '_diagram.md')
        with open(output_file, 'w') as f:
            f.write(f'# Conversation Flow Diagram\n\n```mermaid\n{mermaid_code}\n```\n')
        print(f"✅ Mermaid diagram saved to: {output_file}")

    # Output HTML
    if output_format in ['html', 'both']:
        html_content = generator.generate_html(mermaid_code)
        html_file = filepath.replace('.json', '_diagram.html')
        with open(html_file, 'w') as f:
            f.write(html_content)
        print(f"✅ HTML diagram saved to: {html_file}")
        print(f"   Open in browser: file://{html_file}")

    print("\n✅ Diagram generation complete with validation passed!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_mermaid_diagram.py <flow.json> [format]")
        print("  format: 'mermaid', 'html', or 'both' (default: 'both')")
        sys.exit(1)
    
    filepath = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'both'
    
    generate_from_file(filepath, output_format)
