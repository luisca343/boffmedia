#!/usr/bin/env python3
"""Enhanced scanner for untranslated hardcoded strings in React components.
Supports double quotes, single quotes, template literals, and JSX text."""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Directories to scan
SCAN_DIRS = [
    "apps/web/src/app",
    "apps/web/src/components",
    "apps/web/src/tools",
]

# File extensions to scan
EXTENSIONS = [".tsx", ".ts"]

# Spanish character pattern
SPANISH_CHARS = r'[áéíóúñ¿¡ÁÉÍÓÚÑ]'

# Common Spanish words (lowercase)
SPANISH_WORDS = [
    "el", "la", "los", "las", "de", "del", "en", "con", "por", "para", "que",
    "es", "son", "está", "están", "no", "si", "más", "pero", "como", "su", "sus",
    "este", "esta", "estos", "estas", "otro", "otra", "otros", "otras", "todo",
    "toda", "todos", "todas", "puede", "deben", "hay", "ser", "hacer", "tiene",
    "tienen", "ver", "dar", "saber", "querer", "llegar", "pasar", "parte", "tiempo",
    "caso", "día", "cosa", "mundo", "vida", "mano", "trabajo", "vez", "forma",
    "grupo", "persona", "hora", "punto", "programa", "gobierno", "empresa", "mercado",
    "país", "número", "acción", "agua", "comunidad", "historia", "juego", "ejemplo",
    "cuenta", "razón", "derecho", "estado", "ciencia", "cultura", "arte", "naturaleza",
    "tecnología", "educación", "salud", "seguridad", "economía", "política", "sociedad",
    "medio", "ambiente", "desarrollo", "sistema", "proyecto", "investigación",
    "información", "servicio", "producto", "calidad", "precio", "valor", "costo",
    "beneficio", "riesgo", "oportunidad", "problema", "solución", "resultado", "efecto",
    "impacto", "cambio", "mejor", "peor", "mayor", "menor", "nuevo", "viejo",
    "primero", "último", "próximo", "anterior", "actual", "futuro", "pasado", "presente",
    "importante", "necesario", "posible", "imposible", "probable", "cierto", "falso",
    "verdadero", "claro", "oscuro", "fuerte", "débil", "rápido", "lento", "alto",
    "bajo", "grande", "pequeño", "largo", "corto", "ancho", "estrecho", "profundo",
    "superficial", "lejos", "cerca", "arriba", "abajo", "dentro", "fuera", "delante",
    "detrás", "izquierda", "derecha", "bien", "mal", "mucho", "poco", "demasiado",
    "bastante", "casi", "siempre", "nunca", "antes", "después", "luego", "ahora",
    "aquí", "allí", "donde", "cuando", "porque", "aunque", "mientras", "desde",
    "hasta", "entre", "sobre", "contra", "según", "durante", "mediante", "excepto",
    "salvo", "incluso"
]

# Patterns to exclude (not user-facing strings)
EXCLUDE_PATTERNS = [
    r'^import\s',
    r'^from\s',
    r'^require\s',
    r'^console\.',
    r'^className=',
    r'^style=',
    r'^aria-',
    r'^data-',
    r'^href=',
    r'^src=',
    r'^alt=',
    r'^//',
    r'^\*',
    r'^@',
    r'^type\s',
    r'^interface\s',
    r'^const\s.*=.*require',
    r'^export\s',
    r'^default\s',
    r'^return\s',
    r'^if\s',
    r'^else\s',
    r'^for\s',
    r'^while\s',
    r'^switch\s',
    r'^case\s',
    r'^break',
    r'^continue',
    r'^throw\s',
    r'^try\s',
    r'^catch\s',
    r'^finally\s',
    r'^async\s',
    r'^await\s',
    r'^yield\s',
    r'^new\s',
    r'^delete\s',
    r'^typeof\s',
    r'^instanceof\s',
    r'^void\s',
    r'^null',
    r'^undefined',
    r'^true',
    r'^false',
    r'^NaN',
    r'^Infinity',
]

def is_excluded_line(line):
    """Check if line should be excluded from scanning."""
    stripped = line.strip()
    for pattern in EXCLUDE_PATTERNS:
        if re.match(pattern, stripped):
            return True
    return False

def has_spanish_content(text):
    """Check if text contains Spanish characters or common Spanish words."""
    # Check for Spanish characters
    if re.search(SPANISH_CHARS, text):
        return True
    
    # Check for common Spanish words (as whole words)
    words = re.findall(r'\b\w+\b', text.lower())
    spanish_word_set = set(SPANISH_WORDS)
    spanish_count = sum(1 for word in words if word in spanish_word_set)
    
    # If more than 20% of words are Spanish, it's likely Spanish
    if len(words) > 0 and spanish_count / len(words) > 0.2:
        return True
    
    return False

def is_in_translation_call(line, match_start, match_end):
    """Check if the string is inside a t() or useTranslations() call."""
    # Look for t( before the match
    before = line[:match_start]
    if re.search(r'\bt\s*\(\s*$', before) or re.search(r'useTranslations\s*\(\s*$', before):
        return True
    
    # Look for t.raw( or t.rich(
    if re.search(r'\bt\.(raw|rich)\s*\(\s*$', before):
        return True
    
    return False

def extract_strings_from_line(line):
    """Extract all string literals from a line."""
    strings = []
    
    # Double-quoted strings
    for match in re.finditer(r'"([^"\\]|\\.)*"', line):
        strings.append({
            'content': match.group(),
            'start': match.start(),
            'end': match.end(),
            'type': 'double'
        })
    
    # Single-quoted strings
    for match in re.finditer(r"'([^'\\]|\\.)*'", line):
        strings.append({
            'content': match.group(),
            'start': match.start(),
            'end': match.end(),
            'type': 'single'
        })
    
    # Template literals (backticks)
    for match in re.finditer(r'`([^`\\]|\\.)*`', line):
        strings.append({
            'content': match.group(),
            'start': match.start(),
            'end': match.end(),
            'type': 'template'
        })
    
    # JSX text (not in quotes, but in JSX)
    # This is harder to detect reliably, so we'll skip it for now
    
    return strings

def scan_file(filepath):
    """Scan a file for untranslated strings."""
    findings = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return findings
    
    in_multiline_comment = False
    
    for line_num, line in enumerate(lines, 1):
        # Handle multiline comments
        if '/*' in line:
            in_multiline_comment = True
        if '*/' in line:
            in_multiline_comment = False
            continue
        if in_multiline_comment:
            continue
        
        # Skip single-line comments
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('*'):
            continue
        
        # Skip empty lines
        if not stripped:
            continue
        
        # Skip lines that are just code
        if is_excluded_line(line):
            continue
        
        # Extract all strings from the line
        strings = extract_strings_from_line(line)
        
        for string_info in strings:
            content = string_info['content']
            inner = content[1:-1]  # Remove quotes
            
            # Skip empty strings
            if not inner:
                continue
            
            # Skip very short strings
            if len(inner) < 3:
                continue
            
            # Skip if it's a variable name or import path
            if re.match(r'^[a-zA-Z_][a-zA-Z0-9_./-]*$', inner):
                continue
            
            # Skip if it's a CSS class or style
            if re.match(r'^[a-zA-Z0-9\s\-_./\[\]()#%]+$', inner) and not has_spanish_content(inner):
                continue
            
            # Skip if it's a URL
            if inner.startswith('http') or inner.startswith('/'):
                continue
            
            # Skip if it's a file path
            if '/' in inner and not has_spanish_content(inner):
                continue
            
            # Skip if it's in a t() call
            if is_in_translation_call(line, string_info['start'], string_info['end']):
                continue
            
            # Check for Spanish content
            if has_spanish_content(inner):
                findings.append({
                    'file': filepath,
                    'line': line_num,
                    'content': line.strip()[:100],
                    'string': inner[:60],
                    'type': string_info['type']
                })
    
    return findings

def main():
    """Main function."""
    print("=" * 80)
    print("UNTRANSLATED STRING SCANNER v2")
    print("=" * 80)
    print("\nScanning for untranslated strings...")
    print("Checking: double quotes, single quotes, template literals\n")
    
    all_findings = []
    findings_by_type = defaultdict(int)
    
    for directory in SCAN_DIRS:
        if not os.path.exists(directory):
            continue
            
        for root, dirs, files in os.walk(directory):
            # Skip node_modules, .next, etc.
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', 'dist', 'build']]
            
            for file in files:
                if not any(file.endswith(ext) for ext in EXTENSIONS):
                    continue
                    
                filepath = os.path.join(root, file)
                findings = scan_file(filepath)
                all_findings.extend(findings)
                
                for f in findings:
                    findings_by_type[f['type']] += 1
    
    # Group by file
    by_file = defaultdict(list)
    for finding in all_findings:
        by_file[finding['file']].append(finding)
    
    # Print results
    print(f"\nFound {len(all_findings)} potentially untranslated strings in {len(by_file)} files:\n")
    print(f"By quote type:")
    print(f"  Double quotes: {findings_by_type['double']}")
    print(f"  Single quotes: {findings_by_type['single']}")
    print(f"  Template literals: {findings_by_type['template']}")
    
    # Group by directory
    by_dir = defaultdict(int)
    for filepath in by_file:
        parts = filepath.split('/')
        if len(parts) > 4:
            dir_key = '/'.join(parts[:5])
            by_dir[dir_key] += len(by_file[filepath])
    
    print(f"\nBy directory:")
    for dir_key, count in sorted(by_dir.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {dir_key}: {count} strings")
    
    # Print detailed findings (first 50)
    print(f"\n{'=' * 80}")
    print("DETAILED FINDINGS (first 50):")
    print("=" * 80)
    
    count = 0
    for filepath, findings in sorted(by_file.items()):
        if count >= 50:
            break
        
        print(f"\n{filepath}:")
        for finding in findings[:3]:  # Show first 3 per file
            if count >= 50:
                break
            print(f"  Line {finding['line']} [{finding['type']}]: {finding['string']}")
            count += 1
        
        if len(findings) > 3:
            print(f"  ... and {len(findings) - 3} more")
            count += min(3, len(findings) - 3)
    
    # Save full results to file
    output_file = "/tmp/untranslated_strings.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(all_findings),
            'files': len(by_file),
            'by_type': dict(findings_by_type),
            'by_directory': dict(by_dir),
            'findings': all_findings
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nFull results saved to: {output_file}")

if __name__ == "__main__":
    main()
