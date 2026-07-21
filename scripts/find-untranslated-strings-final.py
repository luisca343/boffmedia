#!/usr/bin/env python3
"""Final scanner - focuses on user-facing strings only.
Excludes: code, imports, comments, variable names, CSS, etc."""

import os
import re
from collections import defaultdict

SCAN_DIRS = ["apps/web/src/app", "apps/web/src/components", "apps/web/src/tools"]
EXTENSIONS = [".tsx", ".ts"]

# Strong Spanish indicators
STRONG_SPANISH = [
    "á", "é", "í", "ó", "ú", "ñ", "¿", "¡",
    "Á", "É", "Í", "Ó", "Ú", "Ñ",
]

# Common UI Spanish words
UI_SPANISH = [
    "Guardar", "Cancelar", "Eliminar", "Editar", "Crear", "Añadir", "Quitar",
    "Buscar", "Filtrar", "Ordenar", "Seleccionar", "Enviar", "Aceptar", "Rechazar",
    "Cerrar", "Abrir", "Volver", "Atrás", "Siguiente", "Anterior", "Inicio",
    "Configuración", "Ajustes", "Perfil", "Cuenta", "Sesión", "Iniciar", "Cerrar sesión",
    "Cargando", "Error", "Éxito", "Correcto", "Incorrecto", "Advertencia", "Información",
    "No hay", "Sin resultados", "No encontrado", "Página no encontrada",
    "Título", "Descripción", "Nombre", "Email", "Contraseña", "Usuario",
    "Guardar cambios", "Descartar", "Confirmar", "Aplicar", "Restablecer",
    "Mostrar", "Ocultar", "Expandir", "Colapsar",
]

def is_user_facing_string(line, string_content):
    """Determine if a string is likely user-facing UI text."""
    # Skip if line is a comment
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
        return False
    
    # Skip if it's an import
    if 'import' in stripped and ('from' in stripped or 'require' in stripped):
        return False
    
    # Skip if it's a type definition
    if stripped.startswith('type ') or stripped.startswith('interface '):
        return False
    
    # Skip if it's a variable declaration with non-UI content
    if re.match(r'^(const|let|var)\s+\w+\s*=', stripped):
        # Check if it's a simple assignment
        if '=' in stripped and not any(word in string_content for word in UI_SPANISH):
            return False
    
    # Skip if it's a path or URL
    if '/' in string_content and not any(c in STRONG_SPANISH for c in string_content):
        return False
    
    # Skip if it's a CSS class or style
    if re.match(r'^[a-zA-Z0-9\s\-_./\[\]()#%]+$', string_content):
        return False
    
    # Skip if it's a variable name pattern
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', string_content):
        return False
    
    # Skip very short strings
    if len(string_content) < 4:
        return False
    
    return True

def has_spanish(text):
    """Check for Spanish content."""
    # Strong indicators
    for char in STRONG_SPANISH:
        if char in text:
            return True
    
    # UI words
    for word in UI_SPANISH:
        if word.lower() in text.lower():
            return True
    
    return False

def scan_file(filepath):
    """Scan file for untranslated UI strings."""
    findings = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except:
        return findings
    
    for line_num, line in enumerate(lines, 1):
        # Skip comments
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('*'):
            continue
        
        # Find all strings
        for match in re.finditer(r'"([^"\\]|\\.)*"', line):
            string_content = match.group()[1:-1]
            if is_user_facing_string(line, string_content) and has_spanish(string_content):
                findings.append({
                    'file': filepath,
                    'line': line_num,
                    'string': string_content[:60],
                    'context': stripped[:80]
                })
        
        for match in re.finditer(r"'([^'\\]|\\.)*'", line):
            string_content = match.group()[1:-1]
            if is_user_facing_string(line, string_content) and has_spanish(string_content):
                findings.append({
                    'file': filepath,
                    'line': line_num,
                    'string': string_content[:60],
                    'context': stripped[:80]
                })
    
    return findings

def main():
    print("=" * 80)
    print("FINAL UNTRANSLATED STRING CHECK")
    print("=" * 80)
    print("\nScanning for user-facing Spanish strings...\n")
    
    all_findings = []
    for directory in SCAN_DIRS:
        if not os.path.exists(directory):
            continue
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
            for file in files:
                if any(file.endswith(ext) for ext in EXTENSIONS):
                    filepath = os.path.join(root, file)
                    findings = scan_file(filepath)
                    all_findings.extend(findings)
    
    # Group by file
    by_file = defaultdict(list)
    for f in all_findings:
        by_file[f['file']].append(f)
    
    print(f"Found {len(all_findings)} user-facing Spanish strings in {len(by_file)} files\n")
    
    # Group by area
    areas = defaultdict(int)
    for filepath in by_file:
        if 'smartrotom' in filepath:
            areas['SmartRotom'] += len(by_file[filepath])
        elif 'boffmedia' in filepath or '(boffmedia)' in filepath:
            areas['Boffmedia'] += len(by_file[filepath])
        elif 'components' in filepath:
            areas['Components'] += len(by_file[filepath])
        elif 'tools' in filepath:
            areas['Tools'] += len(by_file[filepath])
        else:
            areas['Other'] += len(by_file[filepath])
    
    print("By area:")
    for area, count in sorted(areas.items(), key=lambda x: x[1], reverse=True):
        print(f"  {area}: {count}")
    
    # Print top findings
    print(f"\n{'=' * 80}")
    print("TOP FINDINGS:")
    print("=" * 80)
    
    count = 0
    for filepath, findings in sorted(by_file.items(), key=lambda x: len(x[1]), reverse=True):
        if count >= 30:
            break
        print(f"\n{filepath} ({len(findings)} strings):")
        for f in findings[:2]:
            print(f"  L{f['line']}: \"{f['string']}\"")
        if len(findings) > 2:
            print(f"  ... +{len(findings)-2} more")
        count += 1

if __name__ == "__main__":
    main()
