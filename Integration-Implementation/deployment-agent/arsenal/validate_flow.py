"""
Conversation Flow Validator

Validates Retell AI conversation flow configurations before deployment.
Checks for common errors, missing fields, and structural issues.
"""

import json
import sys
from typing import Dict, List, Set, Tuple


class FlowValidator:
    """Validates Retell AI conversation flow configurations."""
    
    def __init__(self, flow_config: Dict):
        """
        Initialize validator with flow configuration.
        
        Args:
            flow_config: Flow configuration dictionary
        """
        self.flow = flow_config
        self.errors = []
        self.warnings = []
        self.node_ids = set()
        self.tool_ids = set()
    
    def validate(self) -> Tuple[bool, List[str], List[str]]:
        """
        Run all validation checks.
        
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        self._validate_required_fields()
        self._validate_nodes()
        self._validate_edges()
        self._validate_tools()
        self._validate_components()
        self._check_orphaned_nodes()
        self._check_circular_dependencies()
        
        is_valid = len(self.errors) == 0
        return is_valid, self.errors, self.warnings
    
    def _validate_required_fields(self):
        """Check for required top-level fields."""
        required = ['nodes', 'start_node_id']
        for field in required:
            if field not in self.flow:
                self.errors.append(f"Missing required field: {field}")
        
        # Check start_node_id exists
        if 'start_node_id' in self.flow and 'nodes' in self.flow:
            start_id = self.flow['start_node_id']
            node_ids = [n['id'] for n in self.flow['nodes'] if 'id' in n]
            if start_id not in node_ids:
                self.errors.append(f"start_node_id '{start_id}' not found in nodes")
    
    def _validate_nodes(self):
        """Validate all nodes."""
        if 'nodes' not in self.flow:
            return
        
        for i, node in enumerate(self.flow['nodes']):
            # Check required node fields
            if 'id' not in node:
                self.errors.append(f"Node at index {i} missing 'id' field")
                continue
            
            node_id = node['id']
            
            # Check for duplicate IDs
            if node_id in self.node_ids:
                self.errors.append(f"Duplicate node ID: {node_id}")
            self.node_ids.add(node_id)
            
            # Check node type
            if 'type' not in node:
                self.errors.append(f"Node '{node_id}' missing 'type' field")
            else:
                valid_types = ['conversation', 'function', 'logic_split', 'end', 
                              'wait_for_response', 'webhook', 'knowledge_base', 
                              'agent', 'intent_classify', 'entity', 'message']
                if node['type'] not in valid_types:
                    self.errors.append(f"Node '{node_id}' has invalid type: {node['type']}")
            
            # Type-specific validation
            if node.get('type') == 'conversation':
                if 'instruction' not in node:
                    self.errors.append(f"Conversation node '{node_id}' missing 'instruction'")
            
            elif node.get('type') == 'function':
                if 'tool_id' not in node:
                    self.errors.append(f"Function node '{node_id}' missing 'tool_id'")
                else:
                    self.tool_ids.add(node['tool_id'])
    
    def _validate_edges(self):
        """Validate all edges and transitions."""
        if 'nodes' not in self.flow:
            return
        
        for node in self.flow['nodes']:
            if 'edges' not in node:
                # End nodes don't need edges
                if node.get('type') != 'end':
                    self.warnings.append(f"Node '{node['id']}' has no edges (may be intentional)")
                continue
            
            for edge in node['edges']:
                # Check edge has destination
                if 'destination_node_id' not in edge:
                    self.errors.append(f"Edge in node '{node['id']}' missing destination_node_id")
                    continue
                
                # Check destination exists
                dest_id = edge['destination_node_id']
                if dest_id not in self.node_ids:
                    self.errors.append(f"Edge destination '{dest_id}' not found in nodes")
    
    def _validate_tools(self):
        """Validate tool definitions."""
        if 'tools' not in self.flow:
            if self.tool_ids:
                self.errors.append(f"Nodes reference tools but no tools defined")
            return
        
        defined_tools = set()
        for tool in self.flow['tools']:
            if 'tool_id' not in tool:
                self.warnings.append("Tool missing 'tool_id' field")
                continue
            
            tool_id = tool['tool_id']
            defined_tools.add(tool_id)
            
            # Check required tool fields
            if 'type' not in tool:
                self.errors.append(f"Tool '{tool_id}' missing 'type' field")
            
            if tool.get('type') == 'custom':
                if 'url' not in tool:
                    self.errors.append(f"Custom tool '{tool_id}' missing 'url'")
                if 'method' not in tool:
                    self.errors.append(f"Custom tool '{tool_id}' missing 'method'")
        
        # Check for undefined tools
        undefined = self.tool_ids - defined_tools
        for tool_id in undefined:
            self.errors.append(f"Tool '{tool_id}' referenced but not defined")
    
    def _validate_components(self):
        """Validate component definitions."""
        if 'components' not in self.flow:
            return
        
        for component in self.flow['components']:
            if 'name' not in component:
                self.warnings.append("Component missing 'name' field")
            
            if 'nodes' not in component:
                self.errors.append(f"Component '{component.get('name', 'unnamed')}' missing 'nodes'")
            
            if 'start_node_id' not in component:
                self.errors.append(f"Component '{component.get('name', 'unnamed')}' missing 'start_node_id'")
    
    def _check_orphaned_nodes(self):
        """Check for nodes that can't be reached."""
        if 'nodes' not in self.flow or 'start_node_id' not in self.flow:
            return
        
        reachable = set()
        to_visit = [self.flow['start_node_id']]
        
        # Build adjacency map
        adjacency = {}
        for node in self.flow['nodes']:
            node_id = node['id']
            adjacency[node_id] = []
            if 'edges' in node:
                for edge in node['edges']:
                    if 'destination_node_id' in edge:
                        adjacency[node_id].append(edge['destination_node_id'])
        
        # BFS to find reachable nodes
        while to_visit:
            current = to_visit.pop(0)
            if current in reachable:
                continue
            reachable.add(current)
            if current in adjacency:
                to_visit.extend(adjacency[current])
        
        # Check for orphaned nodes
        orphaned = self.node_ids - reachable
        for node_id in orphaned:
            self.warnings.append(f"Node '{node_id}' is unreachable from start node")
    
    def _check_circular_dependencies(self):
        """Check for circular dependencies that could cause infinite loops."""
        # This is a simplified check - a full check would need more sophisticated cycle detection
        if 'nodes' not in self.flow:
            return
        
        # Check for self-referencing edges
        for node in self.flow['nodes']:
            if 'edges' not in node:
                continue
            for edge in node['edges']:
                if edge.get('destination_node_id') == node['id']:
                    self.warnings.append(f"Node '{node['id']}' has self-referencing edge (potential infinite loop)")


def validate_flow_file(filepath: str) -> bool:
    """
    Validate a flow configuration file.
    
    Args:
        filepath: Path to JSON flow configuration file
        
    Returns:
        True if valid, False otherwise
    """
    try:
        with open(filepath, 'r') as f:
            flow_config = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON: {e}")
        return False
    
    validator = FlowValidator(flow_config)
    is_valid, errors, warnings = validator.validate()
    
    print(f"\n{'='*60}")
    print(f"Validation Results for: {filepath}")
    print(f"{'='*60}\n")
    
    if errors:
        print(f"❌ ERRORS ({len(errors)}):")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        print()
    
    if warnings:
        print(f"⚠️  WARNINGS ({len(warnings)}):")
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. {warning}")
        print()
    
    if is_valid and not warnings:
        print("✅ Validation passed! No errors or warnings.")
    elif is_valid:
        print("✅ Validation passed with warnings.")
    else:
        print("❌ Validation failed. Please fix errors before deploying.")
    
    print(f"\n{'='*60}\n")
    
    return is_valid


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_flow.py <flow_config.json>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    is_valid = validate_flow_file(filepath)
    sys.exit(0 if is_valid else 1)
