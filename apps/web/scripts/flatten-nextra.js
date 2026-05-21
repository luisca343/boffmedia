const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'app', '(blog)', 'blog', 'nextra-theme-blog.css');
const dest = path.join(__dirname, '..', 'src', 'app', '(blog)', 'blog', 'nextra-theme-blog.flat.css');

let s = fs.readFileSync(src, 'utf8');
let out = '';
let i = 0;
const n = s.length;

while (i < n) {
  if (s.startsWith('@layer', i)) {
    // skip '@layer' token and until the next '{'
    let at = i;
    // find the brace that opens the layer
    let braceIdx = s.indexOf('{', i);
    if (braceIdx === -1) {
      // no brace found, just copy rest
      out += s.slice(i);
      break;
    }
    // copy any whitespace/newlines before @layer (likely none)
    // we won't copy the '@layer ... {' itself; instead we'll enter the block and copy its contents without the outer braces
    // determine the position after the opening brace
    i = braceIdx + 1;
    // now we need to find the matching closing brace for this layer block
    let depth = 1;
    let start = i;
    while (i < n && depth > 0) {
      const ch = s[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    // i now points to position after the matching closing brace
    // content between start and i-1 is the inner content; append it
    out += s.slice(start, i-1);
    // continue loop
  } else {
    out += s[i];
    i++;
  }
}

// Post-process: remove any remaining '@layer properties;' single-line declarations (without brace)
out = out.replace(/@layer\s+properties\s*;?/g, '');

fs.writeFileSync(dest, out, 'utf8');
console.log('Flattened CSS written to', dest);
