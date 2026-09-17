const fs = require('node:fs');

/*
 * Keep the maintained design CSS readable in styles.css while shipping a
 * compact bundle. This small scanner deliberately leaves whitespace in
 * values such as `calc(100% - 2rem)` and inside quoted strings untouched;
 * broad regex replacement can change the meaning of those values.
 */
function minifyCss(source) {
  let output = '';
  let quote = null;
  let escaped = false;
  let comment = false;
  let whitespace = false;

  const needsSpace = (previous, next) => {
    if (!previous || !next) return false;
    if (/[{};,>)]/.test(next) || /[{}:;,>(]/.test(previous)) return false;
    return true;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const following = source[index + 1];

    if (comment) {
      if (character === '*' && following === '/') {
        comment = false;
        index += 1;
      }
      continue;
    }

    if (!quote && character === '/' && following === '*') {
      comment = true;
      whitespace = true;
      index += 1;
      continue;
    }

    if (quote) {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      if (whitespace && needsSpace(output.at(-1), character)) output += ' ';
      whitespace = false;
      quote = character;
      output += character;
      continue;
    }

    if (/\s/.test(character)) {
      whitespace = true;
      continue;
    }

    if (whitespace && needsSpace(output.at(-1), character)) output += ' ';
    whitespace = false;
    output += character;
  }

  return output.trim();
}

const vendor = fs.readFileSync('assets/vendor/bootstrap.min.css', 'utf8').trim();
const design = minifyCss(fs.readFileSync('assets/styles.css', 'utf8'));
fs.writeFileSync('assets/site.min.css', `${vendor}\n${design}\n`);
console.log(`Built assets/site.min.css (${Buffer.byteLength(vendor + design, 'utf8')} bytes).`);

module.exports = { minifyCss };
