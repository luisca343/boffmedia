#!/usr/bin/env python3
"""Scan for untranslated hardcoded strings in React components."""

import os
import re
import json
from pathlib import Path

# Patterns to detect hardcoded strings
STRING_PATTERNS = [
    # Double-quoted strings with Spanish characters
    r'"[^"]*[áéíóúñ¿¡][^"]*"',
    # Single-quoted strings with Spanish characters
    r"'[^']*[áéíóúñ¿¡][^']*'",
    # Common Spanish words in strings
    r'"[^"]*\b(el|la|los|las|de|del|en|con|por|para|que|es|son|está|están|no|si|más|pero|como|su|sus|este|esta|estos|estas|otro|otra|otros|otras|todo|toda|todos|todas|puede|deben|hay|ser|hacer|tiene|tienen|ver|dar|saber|querer|llegar|pasar|parte|tiempo|caso|día|cosa|mundo|vida|mano|trabajo|vez|forma|grupo|persona|hora|punto|programa|gobierno|empresa|mercado|país|número|acción|agua|comunidad|historia|juego|ejemplo|cuenta|razón|derecho|estado|ciencia|cultura|arte|naturaleza|tecnología|educación|salud|seguridad|economía|política|sociedad|medio|ambiente|desarrollo|sistema|proyecto|investigación|información|servicio|producto|calidad|precio|valor|costo|beneficio|riesgo|oportunidad|problema|solución|resultado|efecto|impacto|cambio|mejor|peor|mayor|menor|nuevo|viejo|primero|último|próximo|anterior|actual|futuro|pasado|presente|importante|necesario|posible|imposible|probable|cierto|falso|verdadero|claro|oscuro|fuerte|débil|rápido|lento|alto|bajo|grande|pequeño|largo|corto|ancho|estrecho|profundo|superficial|lejos|cerca|arriba|abajo|dentro|fuera|delante|detrás|izquierda|derecha|bien|mal|mucho|poco|demasiado|bastante|casi|siempre|nunca|a veces|antes|después|luego|ahora|aquí|allí|donde|cuando|porque|aunque|mientras|desde|hasta|entre|sobre|bajo|contra|según|durante|mediante|excepto|salvo|incluso)\b[^"]*"',
    # Strings that look like UI text (start with uppercase, multiple words)
    r'"[A-Z][a-z]+ [a-z]+ [a-z]+"',
]

# Directories to scan
SCAN_DIRS = [
    "apps/web/src/app",
    "apps/web/src/components",
    "apps/web/src/tools",
]

# File extensions to scan
EXTENSIONS = [".tsx", ".ts"]

# Exclude patterns (not UI strings)
EXCLUDE_PATTERNS = [
    r"import\s",
    r"from\s",
    r"require\s",
    r"console\.",
    r"className=",
    r"style=",
    r"aria-",
    r"data-",
    r"href=",
    r"src=",
    r"alt=",
    r"title=",
    r"placeholder=",  # These should be translated but are often missed
    r"//",  # Comments
    r"\*",  # Comments
    r"@",  # Decorators
    r"\.",  # Single char
    r"^$",  # Empty
]

def should_exclude(line):
    """Check if line should be excluded from scanning."""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, line):
            return True
    return False

def find_untranslated_strings(directory):
    """Find potentially untranslated strings in TypeScript/React files."""
    findings = []
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules, .next, etc.
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', 'dist', 'build']]
        
        for file in files:
            if not any(file.endswith(ext) for ext in EXTENSIONS):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for line_num, line in enumerate(lines, 1):
                    line = line.strip()
                    
                    # Skip empty lines and comments
                    if not line or line.startswith('//') or line.startswith('*'):
                        continue
                    
                    # Check for Spanish strings
                    for pattern in STRING_PATTERNS:
                        matches = re.findall(pattern, line)
                        for match in matches:
                            # Clean up the match
                            string_content = match.strip('"\'')
                            
                            # Skip if it's likely not a UI string
                            if should_exclude(line):
                                continue
                                
                            # Skip if it's already using t()
                            if 't(' in line and string_content in line:
                                continue
                            
                            # Skip very short strings
                            if len(string_content) < 3:
                                continue
                            
                            # Skip if it's a variable name or import
                            if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', string_content):
                                continue
                            
                            findings.append({
                                'file': filepath,
                                'line': line_num,
                                'content': line[:100],
                                'string': string_content[:50]
                            })
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    return findings

def main():
    """Main function."""
    print("Scanning for untranslated strings...")
    print("=" * 80)
    
    all_findings = []
    
    for directory in SCAN_DIRS:
        if os.path.exists(directory):
            findings = find_untranslated_strings(directory)
            all_findings.extend(findings)
    
    # Group by file
    by_file = {}
    for finding in all_findings:
        filepath = finding['file']
        if filepath not in by_file:
            by_file[filepath] = []
        by_file[filepath].append(finding)
    
    # Print results
    print(f"\nFound {len(all_findings)} potentially untranslated strings in {len(by_file)} files:\n")
    
    for filepath, findings in sorted(by_file.items()):
        print(f"\n{filepath}:")
        for finding in findings[:5]:  # Show first5 per file
            print(f"  Line {finding['line']}: {finding['string']}")
        if len(findings) > 5:
            print(f"  ... and {len(findings) - 5} more")
    
    # Summary by directory
    print("\n" + "=" * 80)
    print("\nSummary by directory:")
    dir_counts = {}
    for finding in all_findings:
        parts = finding['file'].split('/')
        if len(parts) > 3:
            dir_key = '/'.join(parts[:4])
            dir_counts[dir_key] = dir_counts.get(dir_key, 0) + 1
    
    for dir_key, count in sorted(dir_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {dir_key}: {count} strings")

if __name__ == "__main__":
    main()
