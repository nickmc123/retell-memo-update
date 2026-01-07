"""
Analyze Flow JSON to Extract Patterns

This script analyzes Retell AI conversation flow JSON files to extract patterns,
statistics, and learnings that can be added to directives.
"""

import json
import sys
from collections import Counter
from typing import Dict, List


class FlowAnalyzer:
    """Analyzes conversation flow JSON to extract patterns."""
    
    def __init__(self, flow_data: Dict):
        """Initialize with flow data."""
        self.flow = flow_data
        
        # Extract conversation flow if nested
        if 'conversationFlow' in flow_data:
            self.conversation_flow = flow_data['conversationFlow']
        else:
            self.conversation_flow = flow_data
        
        self.stats = {}
        self.patterns = []
        self.learnings = []
    
    def analyze(self) -> Dict:
        """
        Run full analysis.
        
        Returns:
            Dictionary with statistics, patterns, and learnings
        """
        self._analyze_structure()
        self._analyze_node_types()
        self._analyze_patterns()
        self._extract_learnings()
        
        return {
            'statistics': self.stats,
            'patterns': self.patterns,
            'learnings': self.learnings
        }
    
    def _analyze_structure(self):
        """Analyze basic flow structure."""
        nodes = self.conversation_flow.get('nodes', [])
        
        self.stats['total_nodes'] = len(nodes)
        self.stats['start_node'] = self.conversation_flow.get('start_node_id')
        self.stats['model'] = self.conversation_flow.get('model_choice', {}).get('model', 'unknown')
        
        # Count edges
        total_edges = 0
        for node in nodes:
            total_edges += len(node.get('edges', []))
            if 'skip_response_edge' in node:
                total_edges += 1
        self.stats['total_edges'] = total_edges
        
        # Count tools
        tools = self.conversation_flow.get('tools', [])
        self.stats['total_tools'] = len(tools)
    
    def _analyze_node_types(self):
        """Analyze node type distribution."""
        nodes = self.conversation_flow.get('nodes', [])
        
        type_counts = Counter(node.get('type', 'unknown') for node in nodes)
        self.stats['node_types'] = dict(type_counts)
        
        # Count special features
        skip_response_count = sum(1 for node in nodes if 'skip_response_edge' in node)
        global_node_count = sum(1 for node in nodes if 'global_node_setting' in node)
        finetune_count = sum(1 for node in nodes if 'finetune_transition_examples' in node)
        
        self.stats['special_features'] = {
            'skip_response_edge': skip_response_count,
            'global_node_setting': global_node_count,
            'finetune_transition_examples': finetune_count
        }
    
    def _analyze_patterns(self):
        """Extract common patterns."""
        nodes = self.conversation_flow.get('nodes', [])
        
        # Pattern 1: Skip response before end
        for node in nodes:
            if 'skip_response_edge' in node:
                dest_id = node['skip_response_edge'].get('destination_node_id')
                dest_node = next((n for n in nodes if n.get('id') == dest_id), None)
                if dest_node and dest_node.get('type') == 'end':
                    self.patterns.append({
                        'name': 'Skip Response Before End',
                        'description': 'Node uses skip_response_edge to transition to end node',
                        'node_id': node.get('id'),
                        'node_name': node.get('name')
                    })
        
        # Pattern 2: Global escalation
        for node in nodes:
            if 'global_node_setting' in node:
                self.patterns.append({
                    'name': 'Global Escalation Node',
                    'description': f"Global trigger: {node['global_node_setting'].get('condition')}",
                    'node_id': node.get('id'),
                    'node_name': node.get('name'),
                    'node_type': node.get('type')
                })
        
        # Pattern 3: Transfer with fallback
        for node in nodes:
            if node.get('type') == 'transfer_call' and 'edge' in node:
                self.patterns.append({
                    'name': 'Transfer with Fallback',
                    'description': 'Transfer node has failure edge to fallback',
                    'node_id': node.get('id'),
                    'fallback_node': node['edge'].get('destination_node_id')
                })
        
        # Pattern 4: Static text usage
        static_text_count = 0
        prompt_count = 0
        for node in nodes:
            if node.get('type') == 'conversation':
                instruction = node.get('instruction', {})
                if instruction.get('type') == 'static_text':
                    static_text_count += 1
                elif instruction.get('type') == 'prompt':
                    prompt_count += 1
        
        if static_text_count > 0 or prompt_count > 0:
            self.patterns.append({
                'name': 'Instruction Type Distribution',
                'description': f'Static text: {static_text_count}, Prompt: {prompt_count}',
                'static_text_count': static_text_count,
                'prompt_count': prompt_count
            })
    
    def _extract_learnings(self):
        """Extract learnings for directive updates."""
        
        # Learning 1: If skip_response_edge is used
        if self.stats['special_features']['skip_response_edge'] > 0:
            self.learnings.append({
                'type': 'pattern',
                'title': 'Skip Response Edge Usage',
                'description': f"Flow uses skip_response_edge {self.stats['special_features']['skip_response_edge']} times",
                'recommendation': "Consider using skip_response_edge for announcements that don't need user response"
            })
        
        # Learning 2: If global nodes are used
        if self.stats['special_features']['global_node_setting'] > 0:
            self.learnings.append({
                'type': 'pattern',
                'title': 'Global Node Setting Usage',
                'description': f"Flow uses global_node_setting {self.stats['special_features']['global_node_setting']} times",
                'recommendation': 'Use global_node_setting for universal triggers like human escalation'
            })
        
        # Learning 3: If finetune examples are used
        if self.stats['special_features']['finetune_transition_examples'] > 0:
            self.learnings.append({
                'type': 'best_practice',
                'title': 'Finetune Transition Examples',
                'description': f"Flow uses finetune examples {self.stats['special_features']['finetune_transition_examples']} times",
                'recommendation': 'Use finetune examples for tricky transitions or edge cases'
            })
        
        # Learning 4: Node complexity
        avg_edges_per_node = self.stats['total_edges'] / max(self.stats['total_nodes'], 1)
        if avg_edges_per_node > 3:
            self.learnings.append({
                'type': 'architecture',
                'title': 'High Branching Factor',
                'description': f"Average {avg_edges_per_node:.1f} edges per node",
                'recommendation': 'Consider splitting complex nodes with many branches'
            })


def analyze_file(filepath: str) -> None:
    """
    Analyze a flow JSON file.
    
    Args:
        filepath: Path to JSON file
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
    
    analyzer = FlowAnalyzer(flow_data)
    results = analyzer.analyze()
    
    # Print results
    print(f"\\n{'='*60}")
    print(f"Analysis Results: {filepath}")
    print(f"{'='*60}\\n")
    
    # Statistics
    print("📊 STATISTICS")
    print(f"  Total Nodes: {results['statistics']['total_nodes']}")
    print(f"  Total Edges: {results['statistics']['total_edges']}")
    print(f"  Total Tools: {results['statistics']['total_tools']}")
    print(f"  Model: {results['statistics']['model']}")
    print(f"\\n  Node Types:")
    for node_type, count in results['statistics']['node_types'].items():
        print(f"    - {node_type}: {count}")
    print(f"\\n  Special Features:")
    for feature, count in results['statistics']['special_features'].items():
        print(f"    - {feature}: {count}")
    
    # Patterns
    if results['patterns']:
        print(f"\\n🔍 PATTERNS FOUND ({len(results['patterns'])})")
        for i, pattern in enumerate(results['patterns'], 1):
            print(f"\\n  {i}. {pattern['name']}")
            print(f"     {pattern['description']}")
            if 'node_id' in pattern:
                print(f"     Node: {pattern.get('node_name', pattern['node_id'])}")
    
    # Learnings
    if results['learnings']:
        print(f"\\n💡 LEARNINGS ({len(results['learnings'])})")
        for i, learning in enumerate(results['learnings'], 1):
            print(f"\\n  {i}. [{learning['type'].upper()}] {learning['title']}")
            print(f"     {learning['description']}")
            print(f"     → {learning['recommendation']}")
    
    print(f"\\n{'='*60}\\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_flow_json.py <flow.json>")
        print("       python analyze_flow_json.py conversational-flow-builder/examples/*.json")
        sys.exit(1)
    
    for filepath in sys.argv[1:]:
        analyze_file(filepath)
