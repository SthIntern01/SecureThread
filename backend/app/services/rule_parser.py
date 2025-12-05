"""
Rule Parser Service - Convert YARA-style rules to executable Python regex patterns
"""
import re
import logging
from typing import Dict, List, Any, Optional, Union
from enum import Enum

logger = logging.getLogger(__name__)


class PatternType(Enum):
    """Types of patterns we support"""
    REGEX = "regex"
    STRING = "string"
    KEYWORD = "keyword"


class RuleParser:
    """
    Parse and validate security scanning rules
    Converts YARA-style syntax to Python-compatible regex patterns
    """
    
    def __init__(self):
        self.valid_patterns_cache = {}
    
    def parse_yara_rule(self, rule_content: str) -> List[Dict[str, Any]]:
        """
        Parse YARA-style rule content and extract usable patterns
        
        Returns: List of {pattern, type, modifiers}
        """
        patterns = []
        
        try:
            # Extract strings section from YARA rule
            strings_match = re.search(r'strings:\s*\n(.*?)(?:condition:|$)', rule_content, re.DOTALL)
            
            if not strings_match:
                logger.warning("No strings section found in rule")
                return patterns
            
            strings_section = strings_match.group(1)
            
            # Parse each string line
            # Format: $variable = /pattern/modifiers OR $variable = "literal string"
            string_lines = strings_section.strip().split('\n')
            
            for line in string_lines:
                line = line.strip()
                if not line or line.startswith('//') or line.startswith('#'):
                    continue
                
                pattern_dict = self._parse_string_line(line)
                if pattern_dict:
                    patterns.append(pattern_dict)
            
            logger.info(f"Extracted {len(patterns)} patterns from rule")
            return patterns
            
        except Exception as e:
            logger.error(f"Error parsing YARA rule: {e}")
            return patterns
    
    def _parse_string_line(self, line: str) -> Optional[Dict[str, Any]]:
        """
        Parse a single string definition line
        
        Examples:
            $sql1 = /SELECT\s+.*\s+FROM/i
            $concat1 = /\+\s*['"]/
            $input1 = "literal_string" nocase
        """
        try:
            # Skip if no assignment
            if '=' not in line:
                return None
            
            # Split variable and pattern
            parts = line.split('=', 1)
            if len(parts) != 2:
                return None
            
            variable_name = parts[0].strip()
            pattern_part = parts[1].strip()
            
            # Check if it's a regex pattern (starts with /)
            if pattern_part.startswith('/'):
                return self._parse_regex_pattern(variable_name, pattern_part)
            
            # Check if it's a literal string (starts with " or ')
            elif pattern_part.startswith('"') or pattern_part.startswith("'"):
                return self._parse_literal_pattern(variable_name, pattern_part)
            
            else:
                logger.warning(f"Unknown pattern format: {pattern_part[:50]}")
                return None
                
        except Exception as e:
            logger.error(f"Error parsing string line '{line[:100]}': {e}")
            return None
    
    def _parse_regex_pattern(self, var_name: str, pattern_part: str) -> Optional[Dict[str, Any]]:
        """
        Parse regex pattern: /pattern/modifiers
        """
        try:
            # Extract pattern between slashes
            regex_match = re.match(r'/(.*?)/([a-z]*)', pattern_part)
            
            if not regex_match:
                logger.warning(f"Invalid regex format for {var_name}")
                return None
            
            pattern = regex_match.group(1)
            modifiers = regex_match.group(2) if len(regex_match.groups()) > 1 else ""
            
            # Convert to Python regex flags
            flags = 0
            if 'i' in modifiers:
                flags |= re.IGNORECASE
            if 'm' in modifiers:
                flags |= re.MULTILINE
            if 's' in modifiers:
                flags |= re.DOTALL
            
            # Validate the pattern compiles
            try:
                re.compile(pattern, flags)
            except re.error as e:
                logger.warning(f"Invalid regex pattern for {var_name}: {e}")
                return None
            
            return {
                'variable': var_name,
                'pattern': pattern,
                'type': PatternType.REGEX.value,
                'flags': flags,
                'modifiers': modifiers,
                'compiled': None  # Will compile when needed
            }
            
        except Exception as e:
            logger.error(f"Error parsing regex pattern for {var_name}: {e}")
            return None
    
    def _parse_literal_pattern(self, var_name: str, pattern_part: str) -> Optional[Dict[str, Any]]:
        """
        Parse literal string pattern: "string" modifiers
        """
        try:
            # Extract string content
            if pattern_part.startswith('"'):
                string_match = re.match(r'"([^"]*)"', pattern_part)
            else:
                string_match = re.match(r"'([^']*)'", pattern_part)
            
            if not string_match:
                return None
            
            literal_string = string_match.group(1)
            
            # Check for modifiers after the string
            remainder = pattern_part[string_match.end():].strip()
            case_insensitive = 'nocase' in remainder.lower() or 'i' in remainder
            
            # Escape regex special characters for literal matching
            escaped_pattern = re.escape(literal_string)
            
            flags = re.IGNORECASE if case_insensitive else 0
            
            return {
                'variable': var_name,
                'pattern': escaped_pattern,
                'type': PatternType.STRING.value,
                'flags': flags,
                'modifiers': 'nocase' if case_insensitive else '',
                'compiled': None
            }
            
        except Exception as e:
            logger.error(f"Error parsing literal pattern for {var_name}: {e}")
            return None
    
    def compile_pattern(self, pattern_dict: Dict[str, Any]) -> Optional[re.Pattern]:
        """
        Compile a pattern dictionary into a regex pattern object
        """
        try:
            pattern = pattern_dict['pattern']
            flags = pattern_dict.get('flags', 0)
            
            compiled = re.compile(pattern, flags)
            pattern_dict['compiled'] = compiled  # Cache the compiled pattern
            return compiled
            
        except re.error as e:
            logger.error(f"Failed to compile pattern '{pattern_dict.get('pattern', '')}': {e}")
            return None
    
    def validate_custom_rule(self, rule_content: str) -> Dict[str, Any]:
        """
        Validate a user-submitted custom rule
        
        Returns: {valid: bool, errors: List[str], patterns_count: int}
        """
        errors = []
        
        try:
            # Check basic YARA structure
            if 'rule ' not in rule_content:
                errors.append("Rule must start with 'rule RuleName'")
            
            if 'strings:' not in rule_content:
                errors.append("Rule must have a 'strings:' section")
            
            if 'condition:' not in rule_content:
                errors.append("Rule must have a 'condition:' section")
            
            # Try to parse patterns
            patterns = self.parse_yara_rule(rule_content)
            
            if not patterns:
                errors.append("No valid patterns found in rule")
            
            # Try to compile each pattern
            compilation_errors = []
            for pattern_dict in patterns:
                compiled = self.compile_pattern(pattern_dict)
                if not compiled:
                    compilation_errors.append(f"Pattern {pattern_dict['variable']} failed to compile")
            
            errors.extend(compilation_errors)
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'patterns_count': len(patterns),
                'patterns': patterns if len(errors) == 0 else []
            }
            
        except Exception as e:
            logger.error(f"Rule validation error: {e}")
            return {
                'valid': False,
                'errors': [f"Validation error: {str(e)}"],
                'patterns_count': 0,
                'patterns': []
            }
    
    def extract_metadata(self, rule_content: str) -> Dict[str, Any]:
        """
        Extract metadata from YARA rule
        """
        metadata = {
            'description': '',
            'severity': 'medium',
            'category': 'general',
            'cwe_id': None,
            'owasp_category': None
        }
        
        try:
            # Extract meta section
            meta_match = re.search(r'meta:\s*\n(.*?)(?:strings:|condition:|$)', rule_content, re.DOTALL)
            
            if meta_match:
                meta_section = meta_match.group(1)
                
                # Parse key-value pairs
                for line in meta_section.split('\n'):
                    line = line.strip()
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')
                        
                        if key in metadata:
                            metadata[key] = value
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
        
        return metadata
    
    def get_cached_pattern(self, pattern_key: str) -> Optional[re.Pattern]:
        """
        Get a compiled pattern from cache
        """
        return self.valid_patterns_cache.get(pattern_key)
    
    def cache_pattern(self, pattern_key: str, pattern: re.Pattern) -> None:
        """
        Cache a compiled pattern
        """
        self.valid_patterns_cache[pattern_key] = pattern
    
    def match_content(self, content: str, pattern_dicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Match content against a list of pattern dictionaries
        Returns list of matches with details
        """
        matches = []
        
        for pattern_dict in pattern_dicts:
            compiled = self.compile_pattern(pattern_dict)
            if not compiled:
                continue
            
            pattern_matches = compiled.finditer(content)
            for match in pattern_matches:
                matches.append({
                    'variable': pattern_dict['variable'],
                    'type': pattern_dict['type'],
                    'match': match.group(),
                    'start': match.start(),
                    'end': match.end(),
                    'line': content[:match.start()].count('\n') + 1
                })
        
        return matches
    
    def test_rule_on_content(self, rule_content: str, test_content: str) -> Dict[str, Any]:
        """
        Test a rule against specific content
        """
        validation = self.validate_custom_rule(rule_content)
        
        if not validation['valid']:
            return {
                'valid': False,
                'errors': validation['errors'],
                'matches': []
            }
        
        matches = self.match_content(test_content, validation['patterns'])
        
        # Also check condition logic if needed
        # For now, just return all matches
        return {
            'valid': True,
            'errors': [],
            'matches': matches,
            'matches_count': len(matches),
            'patterns_count': validation['patterns_count']
        }


# Singleton instance
rule_parser = RuleParser()