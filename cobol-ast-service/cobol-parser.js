/**
 * COBOL AST Parser - Production Grade (v2)
 * Line-based parsing for proper COBOL format handling
 */

// COBOL Keywords
const KEYWORDS = new Set([
  'IDENTIFICATION', 'DIVISION', 'PROGRAM-ID', 'AUTHOR', 'DATE-WRITTEN',
  'ENVIRONMENT', 'CONFIGURATION', 'SECTION', 'SOURCE-COMPUTER', 'OBJECT-COMPUTER',
  'INPUT-OUTPUT', 'FILE-CONTROL', 'SELECT', 'ASSIGN', 'ORGANIZATION',
  'DATA', 'FILE', 'WORKING-STORAGE', 'LINKAGE', 'LOCAL-STORAGE',
  'PROCEDURE', 'PERFORM', 'UNTIL', 'VARYING', 'FROM', 'BY',
  'IF', 'ELSE', 'END-IF', 'THEN',
  'EVALUATE', 'WHEN', 'OTHER', 'END-EVALUATE',
  'MOVE', 'TO', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'COMPUTE',
  'GIVING', 'REMAINDER', 'ROUNDED',
  'DISPLAY', 'ACCEPT', 'STOP', 'RUN', 'GOBACK', 'EXIT',
  'OPEN', 'CLOSE', 'READ', 'WRITE', 'REWRITE', 'DELETE', 'START',
  'INPUT', 'OUTPUT', 'I-O', 'EXTEND',
  'AT', 'END', 'NOT', 'INTO', 'FROM',
  'CALL', 'USING', 'RETURNING',
  'STRING', 'UNSTRING', 'DELIMITED', 'POINTER', 'OVERFLOW',
  'INSPECT', 'TALLYING', 'REPLACING', 'ALL', 'LEADING', 'FIRST',
  'INITIALIZE', 'SET', 'TRUE', 'FALSE',
  'GO', 'THRU', 'THROUGH',
  'PIC', 'PICTURE', 'VALUE', 'VALUES', 'ZEROS', 'ZEROES', 'SPACES', 'SPACE',
  'HIGH-VALUES', 'LOW-VALUES', 'QUOTES', 'QUOTE',
  'REDEFINES', 'OCCURS', 'TIMES', 'INDEXED', 'DEPENDING', 'ON',
  'COPY', 'REPLACE', 'EXEC', 'END-EXEC', 'SQL', 'CICS',
  'GREATER', 'LESS', 'EQUAL', 'THAN', 'OR', 'AND',
  'IS', 'ARE', 'NUMERIC', 'ALPHABETIC', 'ALPHANUMERIC',
  'POSITIVE', 'NEGATIVE', 'ZERO',
  'CORRESPONDING', 'CORR',
  'CONTINUE', 'NEXT', 'SENTENCE',
  'WITH', 'NO', 'ADVANCING', 'AFTER', 'BEFORE',
  'END-PERFORM', 'END-READ', 'END-WRITE', 'END-CALL', 'END-STRING',
  'END-COMPUTE', 'END-ADD', 'END-SUBTRACT', 'END-MULTIPLY', 'END-DIVIDE',
  'FUNCTION', 'LENGTH', 'CURRENT-DATE', 'WHEN-COMPILED', 'FD', 'SD', 'RD'
]);

class CobolParser {
  constructor(source) {
    this.lines = source.split('\n');
    this.programName = 'PROGRAM';
    this.variables = [];
    this.procedures = [];
    this.files = [];
  }

  getCodeArea(line) {
    if (line.length < 7) return '';
    if (line.length >= 7 && (line[6] === '*' || line[6] === '/')) return null;
    return line.substring(7).replace(/\s+$/, '');
  }

  tokenizeLine(code) {
    const tokens = [];
    let i = 0;
    
    while (i < code.length) {
      while (i < code.length && /\s/.test(code[i])) i++;
      if (i >= code.length) break;

      if (code[i] === "'" || code[i] === '"') {
        const quote = code[i++];
        let value = '';
        while (i < code.length && code[i] !== quote) value += code[i++];
        if (i < code.length) i++;
        tokens.push({ type: 'STRING', value });
        continue;
      }

      if (code[i] === '.') {
        tokens.push({ type: 'PERIOD', value: '.' });
        i++;
        continue;
      }

      if ('()=<>+-*/'.includes(code[i])) {
        tokens.push({ type: 'OPERATOR', value: code[i++] });
        continue;
      }

      if (/[A-Za-z0-9\-]/.test(code[i])) {
        let value = '';
        while (i < code.length && /[A-Za-z0-9\-_()]/.test(code[i]) && code[i] !== '.') {
          value += code[i++];
        }
        const upper = value.toUpperCase();
        
        if (/^[0-9]{1,2}$/.test(value) && parseInt(value) <= 88) {
          tokens.push({ type: 'LEVEL', value: parseInt(value) });
        } else if (/^-?[0-9.]+$/.test(value)) {
          tokens.push({ type: 'NUMBER', value });
        } else if (KEYWORDS.has(upper)) {
          tokens.push({ type: 'KEYWORD', value: upper });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: upper });
        }
        continue;
      }
      i++;
    }
    return tokens;
  }

  parse() {
    const allTokens = [];
    for (const line of this.lines) {
      const code = this.getCodeArea(line);
      if (code === null || code.trim() === '') continue;
      allTokens.push(...this.tokenizeLine(code));
    }

    let i = 0;
    let currentParagraph = null;
    let paragraphStatements = [];
    let inProcedure = false;
    let currentDivision = null;

    while (i < allTokens.length) {
      const token = allTokens[i];

      if (token.type === 'KEYWORD') {
        if (token.value === 'IDENTIFICATION' && allTokens[i+1]?.value === 'DIVISION') {
          currentDivision = 'IDENTIFICATION'; i += 3; continue;
        }
        if (token.value === 'ENVIRONMENT' && allTokens[i+1]?.value === 'DIVISION') {
          currentDivision = 'ENVIRONMENT'; i += 3; continue;
        }
        if (token.value === 'DATA' && allTokens[i+1]?.value === 'DIVISION') {
          currentDivision = 'DATA'; i += 3; continue;
        }
        if (token.value === 'PROCEDURE' && allTokens[i+1]?.value === 'DIVISION') {
          currentDivision = 'PROCEDURE'; inProcedure = true;
          while (i < allTokens.length && allTokens[i].type !== 'PERIOD') i++;
          i++; continue;
        }
        if (['WORKING-STORAGE', 'LINKAGE', 'FILE', 'LOCAL-STORAGE'].includes(token.value) &&
            allTokens[i+1]?.value === 'SECTION') { i += 3; continue; }
        if (token.value === 'PROGRAM-ID') {
          i++; if (allTokens[i]?.type === 'PERIOD') i++;
          if (allTokens[i]?.type === 'IDENTIFIER') { this.programName = allTokens[i].value; i++; }
          if (allTokens[i]?.type === 'PERIOD') i++; continue;
        }
      }

      if (currentDivision === 'DATA' && token.type === 'LEVEL') {
        const variable = this.parseVariable(allTokens, i);
        if (variable) { this.variables.push(variable); i = variable._endIndex; continue; }
      }

      if (token.type === 'KEYWORD' && (token.value === 'FD' || token.value === 'SD')) {
        i++; if (allTokens[i]?.type === 'IDENTIFIER') { this.files.push({ name: allTokens[i].value, type: token.value }); i++; }
        while (i < allTokens.length && allTokens[i].type !== 'PERIOD') i++; i++; continue;
      }

      if (inProcedure && token.type === 'IDENTIFIER' && allTokens[i+1]?.type === 'PERIOD') {
        if (currentParagraph) this.procedures.push({ name: currentParagraph, statements: paragraphStatements });
        currentParagraph = token.value; paragraphStatements = []; i += 2; continue;
      }

      if (inProcedure && token.type === 'KEYWORD') {
        const statement = this.parseStatement(allTokens, i);
        if (statement) { paragraphStatements.push(statement); i = statement._endIndex; continue; }
      }
      i++;
    }

    if (currentParagraph) this.procedures.push({ name: currentParagraph, statements: paragraphStatements });
    return { name: this.programName, variables: this.variables, procedures: this.procedures, files: this.files };
  }

  parseVariable(tokens, startIndex) {
    let i = startIndex;
    const level = tokens[i].value; i++;
    if (tokens[i]?.type !== 'IDENTIFIER') return null;
    const name = tokens[i].value; i++;
    let picture = null, value = null, occurs = null;

    while (i < tokens.length && tokens[i].type !== 'PERIOD') {
      const t = tokens[i];
      if (t.type === 'KEYWORD') {
        if (t.value === 'PIC' || t.value === 'PICTURE') {
          i++; if (tokens[i]?.value === 'IS') i++;
          let pic = '';
          while (i < tokens.length && tokens[i].type !== 'PERIOD' && 
                 !['VALUE', 'OCCURS', 'REDEFINES', 'INDEXED', 'COMP', 'COMP-3'].includes(tokens[i].value)) {
            if (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'NUMBER') pic += tokens[i].value;
            i++;
          }
          picture = pic || null; continue;
        }
        if (t.value === 'VALUE') {
          i++; if (tokens[i]?.value === 'IS' || tokens[i]?.value === 'ARE') i++;
          if (tokens[i]) { value = tokens[i].value; i++; } continue;
        }
        if (t.value === 'OCCURS') {
          i++; if (tokens[i]?.type === 'NUMBER') { occurs = parseInt(tokens[i].value); i++; }
          if (tokens[i]?.value === 'TIMES') i++; continue;
        }
      }
      i++;
    }
    if (tokens[i]?.type === 'PERIOD') i++;
    return { level, name, picture, value, occurs, pythonType: this.inferType(picture), _endIndex: i };
  }

  inferType(pic) {
    if (!pic) return 'object';
    const p = pic.toUpperCase();
    if (p.includes('V') || p.includes('.')) return 'Decimal';
    if (p.match(/^S?9/)) return 'int';
    return 'str';
  }

  parseStatement(tokens, startIndex) {
    const token = tokens[startIndex];
    let i = startIndex + 1, endIndex = i;
    const breakKeywords = ['MOVE','ADD','SUBTRACT','MULTIPLY','DIVIDE','COMPUTE','IF','ELSE','END-IF',
      'EVALUATE','END-EVALUATE','PERFORM','END-PERFORM','DISPLAY','ACCEPT','CALL','END-CALL',
      'OPEN','CLOSE','READ','END-READ','WRITE','END-WRITE','STRING','END-STRING','INITIALIZE','SET','GO','STOP','GOBACK','EXIT'];

    while (endIndex < tokens.length) {
      if (tokens[endIndex].type === 'PERIOD') { endIndex++; break; }
      if (tokens[endIndex].type === 'KEYWORD' && breakKeywords.includes(tokens[endIndex].value) && endIndex > startIndex + 1) break;
      endIndex++;
    }
    const st = tokens.slice(i, endIndex);

    switch (token.value) {
      case 'MOVE': {
        let source = null; const targets = []; let seenTo = false;
        for (const t of st) { if (t.value === 'TO') { seenTo = true; continue; } if (t.type === 'PERIOD') continue;
          if (!seenTo) source = t.value; else if (t.type === 'IDENTIFIER') targets.push(t.value); }
        return { type: 'MOVE', source, targets, _endIndex: endIndex }; }
      case 'ADD': {
        const sources = []; let target = null, seenTo = false;
        for (const t of st) { if (t.value === 'TO' || t.value === 'GIVING') { seenTo = true; continue; }
          if (t.type === 'PERIOD') continue;
          if (!seenTo && (t.type === 'IDENTIFIER' || t.type === 'NUMBER')) sources.push(t.value);
          else if (seenTo && t.type === 'IDENTIFIER') target = t.value; }
        return { type: 'ADD', sources, target, _endIndex: endIndex }; }
      case 'SUBTRACT': {
        let source = null, target = null, seenFrom = false;
        for (const t of st) { if (t.value === 'FROM') { seenFrom = true; continue; } if (t.type === 'PERIOD') continue;
          if (!seenFrom) source = t.value; else if (t.type === 'IDENTIFIER') target = t.value; }
        return { type: 'SUBTRACT', source, target, _endIndex: endIndex }; }
      case 'MULTIPLY': {
        let source = null, target = null, seenBy = false;
        for (const t of st) { if (t.value === 'BY') { seenBy = true; continue; } if (t.type === 'PERIOD') continue;
          if (!seenBy) source = t.value; else if (t.type === 'IDENTIFIER') target = t.value; }
        return { type: 'MULTIPLY', source, target, _endIndex: endIndex }; }
      case 'DIVIDE': {
        let dividend = null, divisor = null, target = null, mode = null;
        for (const t of st) { if (t.value === 'BY' || t.value === 'INTO') { mode = t.value; continue; }
          if (t.value === 'GIVING') continue; if (t.type === 'PERIOD') continue;
          if (!mode) dividend = t.value; else if (!divisor) divisor = t.value; else if (t.type === 'IDENTIFIER') target = t.value; }
        return { type: 'DIVIDE', dividend, divisor, target, _endIndex: endIndex }; }
      case 'COMPUTE': {
        let target = null; const expression = []; let seenEq = false;
        for (const t of st) { if (t.value === '=') { seenEq = true; continue; } if (t.type === 'PERIOD') continue;
          if (!seenEq && t.type === 'IDENTIFIER') target = t.value; else if (seenEq) expression.push(t); }
        return { type: 'COMPUTE', target, expression, _endIndex: endIndex }; }
      case 'IF': return { type: 'IF', condition: st.filter(t => t.type !== 'PERIOD' && t.value !== 'THEN'), _endIndex: endIndex };
      case 'PERFORM': {
        let target = null, times = null, until = null;
        let varying = null, from = null, by = null;
        for (let j = 0; j < st.length; j++) { const t = st[j];
          if (t.type === 'IDENTIFIER' && !target && t.value !== 'VARYING') target = t.value;
          if (t.type === 'NUMBER' && st[j+1]?.value === 'TIMES') times = parseInt(t.value);
          if (t.value === 'VARYING' && st[j+1]?.type === 'IDENTIFIER') varying = st[j+1].value;
          if (t.value === 'FROM' && st[j+1]) from = st[j+1].type === 'NUMBER' ? parseInt(st[j+1].value) : st[j+1].value;
          if (t.value === 'BY' && st[j+1]) by = st[j+1].type === 'NUMBER' ? parseInt(st[j+1].value) : 1;
          if (t.value === 'UNTIL') until = st.slice(j + 1).filter(x => x.type !== 'PERIOD'); }
        return { type: 'PERFORM', target, times, until, varying, from, by, _endIndex: endIndex }; }
      case 'DISPLAY': return { type: 'DISPLAY', items: st.filter(t => t.type !== 'PERIOD' && t.value !== 'UPON'), _endIndex: endIndex };
      case 'ACCEPT': return { type: 'ACCEPT', target: st.find(t => t.type === 'IDENTIFIER')?.value, _endIndex: endIndex };
      case 'CALL': {
        let program = null; const params = []; let seenUsing = false;
        for (const t of st) { if (t.value === 'USING') { seenUsing = true; continue; } if (t.type === 'PERIOD') continue;
          if (!program && (t.type === 'STRING' || t.type === 'IDENTIFIER')) program = t.value;
          else if (seenUsing && t.type === 'IDENTIFIER') params.push(t.value); }
        return { type: 'CALL', program, params, _endIndex: endIndex }; }
      case 'OPEN': {
        let mode = null; const files = [];
        for (const t of st) { if (['INPUT', 'OUTPUT', 'I-O', 'EXTEND'].includes(t.value)) mode = t.value;
          else if (t.type === 'IDENTIFIER') files.push(t.value); }
        return { type: 'OPEN', mode, files, _endIndex: endIndex }; }
      case 'CLOSE': return { type: 'CLOSE', files: st.filter(t => t.type === 'IDENTIFIER').map(t => t.value), _endIndex: endIndex };
      case 'READ': {
        let file = null, into = null;
        for (let j = 0; j < st.length; j++) { const t = st[j];
          if (!file && t.type === 'IDENTIFIER') file = t.value;
          if (t.value === 'INTO' && st[j+1]?.type === 'IDENTIFIER') into = st[j+1].value; }
        return { type: 'READ', file, into, _endIndex: endIndex }; }
      case 'WRITE': {
        let record = null, from = null;
        for (let j = 0; j < st.length; j++) { const t = st[j];
          if (!record && t.type === 'IDENTIFIER') record = t.value;
          if (t.value === 'FROM' && st[j+1]?.type === 'IDENTIFIER') from = st[j+1].value; }
        return { type: 'WRITE', record, from, _endIndex: endIndex }; }
      case 'INITIALIZE': return { type: 'INITIALIZE', targets: st.filter(t => t.type === 'IDENTIFIER').map(t => t.value), _endIndex: endIndex };
      case 'SET': {
        let target = null, value = null, seenTo = false;
        for (const t of st) { if (t.value === 'TO') { seenTo = true; continue; }
          if (!target && t.type === 'IDENTIFIER') target = t.value; else if (seenTo && !value) value = t.value; }
        return { type: 'SET', target, value, _endIndex: endIndex }; }
      case 'STOP': return { type: 'STOP', _endIndex: endIndex };
      case 'GOBACK': return { type: 'GOBACK', _endIndex: endIndex };
      case 'EXIT': return { type: 'EXIT', _endIndex: endIndex };
      case 'CONTINUE': return { type: 'CONTINUE', _endIndex: endIndex };
      case 'GO': return { type: 'GOTO', target: st.find(t => t.type === 'IDENTIFIER')?.value, _endIndex: endIndex };
      default: return { type: 'UNKNOWN', value: token.value, _endIndex: endIndex };
    }
  }
}

class PythonGenerator {
  constructor(ast) { this.ast = ast; this.output = []; this.indent = 0; }
  emit(line) { this.output.push('    '.repeat(this.indent) + line); }
  raw(line) { this.output.push(line); }
  pyName(n) { return n ? n.toLowerCase().replace(/-/g, '_') : 'unknown'; }
  pyVal(v) {
    if (!v) return 'None';
    if (v === 'ZEROS' || v === 'ZEROES' || v === 'ZERO') return '0';
    if (v === 'SPACES' || v === 'SPACE') return '""';
    if (/^-?[0-9.]+$/.test(v)) return v;
    if (v.startsWith("'") || v.startsWith('"')) return v;
    return `self.${this.pyName(v)}`;
  }

  generate() {
    const cn = this.ast.name.replace(/-/g, '');
    this.raw('"""'); this.raw(`Python translation of COBOL: ${this.ast.name}`); this.raw('Generated by CodeSwitch AST Parser'); this.raw('"""');
    this.raw(''); this.raw('from decimal import Decimal, ROUND_HALF_UP'); this.raw('from dataclasses import dataclass, field');
    this.raw('from typing import List, Optional, Dict, Any'); this.raw('from datetime import datetime'); this.raw('import logging');
    this.raw(''); this.raw('logging.basicConfig(level=logging.INFO)'); this.raw('logger = logging.getLogger(__name__)'); this.raw('');

    this.raw(`class ${cn}:`); this.raw(`    """${this.ast.name} - COBOL to Python"""`); this.raw(''); this.indent = 1;

    this.emit('def __init__(self):'); this.indent++;
    this.emit('"""Initialize variables"""');
    const vars = this.ast.variables.filter(v => v.picture);
    if (vars.length === 0) { this.emit('pass'); }
    else { for (const v of vars) {
      const def = this.getDefault(v);
      if (v.occurs) this.emit(`self.${this.pyName(v.name)}: List = [${def}] * ${v.occurs}`);
      else this.emit(`self.${this.pyName(v.name)}: ${v.pythonType} = ${def}`);
    }}
    this.indent--; this.raw('');

    for (const proc of this.ast.procedures) this.genProc(proc);

    this.emit('def run(self):'); this.indent++; this.emit('"""Main entry point"""');
    if (this.ast.procedures.length > 0) {
      const main = this.ast.procedures.find(p => p.name.includes('MAIN') || p.name.includes('START')) || this.ast.procedures[0];
      this.emit(`self.${this.pyName(main.name)}()`);
    } else this.emit('pass');
    this.indent--; this.raw(''); this.indent = 0;
    this.raw(''); this.raw('if __name__ == "__main__":'); this.raw(`    program = ${cn}()`); this.raw('    program.run()');
    return this.output.join('\n');
  }

  getDefault(v) {
    if (v.value) {
      if (v.value === 'ZEROS' || v.value === 'ZEROES') return '0';
      if (v.value === 'SPACES' || v.value === 'SPACE') return '""';
      if (/^-?[0-9.]+$/.test(v.value)) return v.value;
      return `"${v.value}"`;
    }
    return v.pythonType === 'int' ? '0' : v.pythonType === 'Decimal' ? 'Decimal("0")' : '""';
  }

  genProc(proc) {
    this.emit(`def ${this.pyName(proc.name)}(self):`); this.indent++;
    this.emit(`"""${proc.name}"""`);
    if (proc.statements.length === 0) this.emit('pass');
    else for (const s of proc.statements) this.genStmt(s);
    this.indent--; this.raw('');
  }

  genStmt(s) {
    switch (s.type) {
      case 'MOVE': for (const t of s.targets || []) this.emit(`self.${this.pyName(t)} = ${this.pyVal(s.source)}`); break;
      case 'ADD': if (s.target) this.emit(`self.${this.pyName(s.target)} += ${(s.sources || []).map(x => this.pyVal(x)).join(' + ') || '0'}`); break;
      case 'SUBTRACT': if (s.target) this.emit(`self.${this.pyName(s.target)} -= ${this.pyVal(s.source)}`); break;
      case 'MULTIPLY': if (s.target) this.emit(`self.${this.pyName(s.target)} *= ${this.pyVal(s.source)}`); break;
      case 'DIVIDE': if (s.target) this.emit(`self.${this.pyName(s.target)} = ${this.pyVal(s.dividend)} / ${this.pyVal(s.divisor)}`); break;
      case 'COMPUTE': if (s.target && s.expression) {
        const expr = s.expression.map(t => t.type === 'IDENTIFIER' ? `self.${this.pyName(t.value)}` : t.value).join(' ');
        this.emit(`self.${this.pyName(s.target)} = ${expr || '0'}`);
      } break;
      case 'IF': this.emit(`if ${this.condPy(s.condition)}:`); this.indent++; this.emit('pass  # IF body'); this.indent--; break;
      case 'PERFORM':
        if (s.varying) {
          // PERFORM VARYING X FROM A BY B UNTIL X > C
          const varName = this.pyName(s.varying);
          const fromVal = typeof s.from === 'number' ? s.from : `self.${this.pyName(s.from)}`;
          const byVal = s.by || 1;
          // Extract limit from UNTIL condition (e.g., "X > 10" -> 11)
          let limit = 100; // default
          if (s.until && s.until.length > 0) {
            const limitToken = s.until.find(t => t.type === 'NUMBER');
            if (limitToken) limit = parseInt(limitToken.value) + 1;
          }
          this.emit(`for self.${varName} in range(${fromVal}, ${limit}, ${byVal}):`);
          this.indent++;
          if (s.target) this.emit(`self.${this.pyName(s.target)}()`);
          else this.emit('pass  # VARYING loop body');
          this.indent--;
        }
        else if (s.times) { this.emit(`for _ in range(${s.times}):`); this.indent++; this.emit(`self.${this.pyName(s.target)}()`); this.indent--; }
        else if (s.until) { this.emit(`while not (${this.condPy(s.until)}):`); this.indent++; this.emit(`self.${this.pyName(s.target)}()`); this.indent--; }
        else if (s.target) this.emit(`self.${this.pyName(s.target)}()`);
        break;
      case 'DISPLAY': {
        const items = (s.items || []).map(i => i.type === 'STRING' ? `"${i.value}"` : `self.${this.pyName(i.value)}`).join(', ');
        this.emit(`print(${items || '""'})`);
      } break;
      case 'ACCEPT': if (s.target) this.emit(`self.${this.pyName(s.target)} = input()`); break;
      case 'CALL': this.emit(`# CALL ${s.program}`); this.emit(`${this.pyName(s.program?.replace(/['"]/g, '') || 'prog')}(${(s.params || []).map(p => `self.${this.pyName(p)}`).join(', ')})`); break;
      case 'OPEN': for (const f of s.files || []) this.emit(`self.${this.pyName(f)}_file = open("${f}.dat", "${s.mode === 'OUTPUT' ? 'w' : 'r'}")`); break;
      case 'CLOSE': for (const f of s.files || []) this.emit(`self.${this.pyName(f)}_file.close()`); break;
      case 'READ': if (s.file) { this.emit(`line = self.${this.pyName(s.file)}_file.readline()`); if (s.into) this.emit(`self.${this.pyName(s.into)} = line`); } break;
      case 'WRITE': if (s.record) this.emit(`self.${this.pyName(s.record.split('-')[0])}_file.write(str(self.${this.pyName(s.from || s.record)}) + "\\n")`); break;
      case 'INITIALIZE': for (const t of s.targets || []) this.emit(`self.${this.pyName(t)} = None`); break;
      case 'SET': if (s.target) this.emit(`self.${this.pyName(s.target)} = ${this.pyVal(s.value)}`); break;
      case 'GOTO': this.emit(`# GO TO ${s.target}`); break;
      case 'STOP': case 'GOBACK': case 'EXIT': this.emit('return'); break;
      case 'CONTINUE': this.emit('pass'); break;
      default: this.emit(`# ${s.type}`);
    }
  }

  condPy(tokens) {
    if (!tokens || !tokens.length) return 'True';
    return tokens.map(t => {
      if (t.type === 'IDENTIFIER') return `self.${this.pyName(t.value)}`;
      if (t.type === 'KEYWORD') {
        if (t.value === 'EQUAL' || t.value === 'EQUALS') return '==';
        if (t.value === 'GREATER') return '>';
        if (t.value === 'LESS') return '<';
        if (t.value === 'NOT') return 'not';
        if (t.value === 'AND') return 'and';
        if (t.value === 'OR') return 'or';
        if (t.value === 'ZERO' || t.value === 'ZEROS') return '0';
        if (t.value === 'THAN' || t.value === 'TO' || t.value === 'IS') return '';
        return t.value.toLowerCase();
      }
      if (t.type === 'OPERATOR') return t.value === '=' ? '==' : t.value;
      return t.value;
    }).filter(x => x).join(' ') || 'True';
  }
}

export function parseCobol(source) {
  const parser = new CobolParser(source);
  const ast = parser.parse();
  return { ast, stats: { variables: ast.variables.length, procedures: ast.procedures.length, files: ast.files.length } };
}

export function generatePython(ast) { return new PythonGenerator(ast).generate(); }

export function cobolToPython(source) {
  const { ast, stats } = parseCobol(source);
  const pythonCode = generatePython(ast);
  
  // Build dependency graph from PERFORM statements
  const dependencies = buildDependencyGraph(ast);
  ast.dependencies = dependencies;
  
  return { pythonCode, ast, stats: { ...stats, pythonLines: pythonCode.split('\n').length, cobolLines: source.split('\n').length } };
}

// Build a dependency graph showing which procedures call which other procedures
export function buildDependencyGraph(ast) {
  const graph = {};  // procedureName -> [called procedures]
  const reverseGraph = {};  // procedureName -> [procedures that call it]
  const procedureNames = new Set(ast.procedures.map(p => p.name));
  
  // Initialize graphs
  for (const proc of ast.procedures) {
    graph[proc.name] = [];
    reverseGraph[proc.name] = [];
  }
  
  // Analyze each procedure for PERFORM calls
  for (const proc of ast.procedures) {
    for (const stmt of proc.statements) {
      if (stmt.type === 'PERFORM' && stmt.target) {
        // Check if target exists as a procedure
        const target = stmt.target.toUpperCase();
        if (procedureNames.has(target)) {
          if (!graph[proc.name].includes(target)) {
            graph[proc.name].push(target);
          }
          if (!reverseGraph[target].includes(proc.name)) {
            reverseGraph[target].push(proc.name);
          }
        }
      }
    }
  }
  
  return { calls: graph, calledBy: reverseGraph };
}
