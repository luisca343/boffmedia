#!/usr/bin/env python3
"""
Replace console.* calls with nestjs-pino Logger injection.

For Injectable classes: injects Logger via constructor, uses this.logger.*
For non-injectable files: adds a module-level pino logger, uses logger.*
main.ts is skipped — bootstrap logging stays as-is.
"""

import re
import sys
from pathlib import Path

INJECTABLE_MARKERS = [
    '@Injectable()',
    '@Controller(',
    '@Controller()',
    '@WebSocketGateway',
    '@Resolver(',
    '@Resolver()',
]

SKIP_FILES = ['main.ts']

PINO_IMPORT = "import { Logger } from 'nestjs-pino';\n"
PINO_MODULE_IMPORT = "import pino from 'pino';\n"


def has_console_calls(content: str) -> bool:
    return bool(re.search(r'\bconsole\.(log|error|warn|debug|info)\(', content))


def is_injectable(content: str) -> bool:
    return any(marker in content for marker in INJECTABLE_MARKERS)


def has_logger_injected(content: str) -> bool:
    return 'private readonly logger: Logger' in content or 'private logger: Logger' in content


def has_pino_import(content: str) -> bool:
    return "from 'nestjs-pino'" in content


def add_pino_import(content: str) -> str:
    if has_pino_import(content):
        return content
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import = i
    lines.insert(last_import + 1, "import { Logger } from 'nestjs-pino';")
    return '\n'.join(lines)


def add_module_pino_import(content: str) -> str:
    if "from 'pino'" in content or "require('pino')" in content:
        return content
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import = i
    lines.insert(last_import + 1, "import pino from 'pino';")
    # Add module-level logger after imports
    lines.insert(last_import + 2, f"\nconst logger = pino({{ name: 'util' }});\n")
    return '\n'.join(lines)


def inject_logger_into_constructor(content: str) -> str:
    if has_logger_injected(content):
        return content

    # Case 1: constructor exists with params
    # Matches: constructor(\n  optional decorators + params
    match = re.search(r'(\s+constructor\s*\()', content)
    if match:
        indent = '    '
        # Check if constructor is empty: constructor() {}
        empty_ctor = re.search(r'constructor\s*\(\s*\)', content)
        if empty_ctor:
            content = re.sub(
                r'constructor\s*\(\s*\)',
                'constructor(private readonly logger: Logger)',
                content,
                count=1
            )
        else:
            # Has params — insert logger as first param
            content = re.sub(
                r'(\s+constructor\s*\()',
                r'\1\n' + indent + 'private readonly logger: Logger,\n' + indent,
                content,
                count=1
            )
        return content

    # Case 2: no constructor — find class body opening and add one
    # Look for class body: class Foo ... {
    class_body = re.search(r'((?:export\s+)?(?:abstract\s+)?class\s+\w+[^{]*\{)', content)
    if class_body:
        pos = class_body.end()
        ctor = '\n  constructor(private readonly logger: Logger) {}\n'
        content = content[:pos] + ctor + content[pos:]

    return content


def replace_console_calls_injectable(content: str) -> str:
    content = re.sub(r'\bconsole\.log\(', 'this.logger.log(', content)
    content = re.sub(r'\bconsole\.error\(', 'this.logger.error(', content)
    content = re.sub(r'\bconsole\.warn\(', 'this.logger.warn(', content)
    content = re.sub(r'\bconsole\.debug\(', 'this.logger.debug(', content)
    content = re.sub(r'\bconsole\.info\(', 'this.logger.log(', content)
    return content


def replace_console_calls_module(content: str) -> str:
    content = re.sub(r'\bconsole\.log\(', 'logger.info(', content)
    content = re.sub(r'\bconsole\.error\(', 'logger.error(', content)
    content = re.sub(r'\bconsole\.warn\(', 'logger.warn(', content)
    content = re.sub(r'\bconsole\.debug\(', 'logger.debug(', content)
    content = re.sub(r'\bconsole\.info\(', 'logger.info(', content)
    return content


def process_file(path: Path) -> tuple[bool, str]:
    """Returns (was_modified, reason)"""
    if path.name in SKIP_FILES:
        return False, 'skipped (main.ts)'

    content = path.read_text(encoding='utf-8')

    if not has_console_calls(content):
        return False, 'no console calls'

    original = content

    if is_injectable(content):
        content = add_pino_import(content)
        content = inject_logger_into_constructor(content)
        content = replace_console_calls_injectable(content)
        mode = 'injectable'
    else:
        content = add_module_pino_import(content)
        content = replace_console_calls_module(content)
        mode = 'module-level'

    if content != original:
        path.write_text(content, encoding='utf-8')
        return True, mode

    return False, 'no changes'


def main():
    root = Path(__file__).parent.parent / 'apps' / 'api' / 'src'
    files = list(root.rglob('*.ts'))
    files = [f for f in files if '.spec.ts' not in str(f)]

    modified = []
    skipped = []
    errors = []

    for f in sorted(files):
        try:
            changed, reason = process_file(f)
            rel = f.relative_to(root.parent.parent.parent)
            if changed:
                modified.append(f'  ✓ {rel} [{reason}]')
            else:
                skipped.append(f'  - {rel} [{reason}]')
        except Exception as e:
            errors.append(f'  ✗ {f}: {e}')

    print(f'\nModified ({len(modified)}):')
    print('\n'.join(modified))
    if errors:
        print(f'\nErrors ({len(errors)}):')
        print('\n'.join(errors))
    print(f'\nTotal: {len(modified)} modified, {len(skipped)} skipped, {len(errors)} errors')


if __name__ == '__main__':
    main()
