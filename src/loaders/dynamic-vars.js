var assert = require('assert');

const DYNAMIC_VAR = "dynamic-var";

function findClosingBracket(s, index) {
    let stack = -1;
    let endIndex = 0;
    let strLen = s.length;
    while(strLen != index) {
        const char = s[index];
        if(char == "("){
            stack += 1
        } else if (char == ")"){
          if(stack == 0){
            endIndex = index;
            break;
          }
          stack -= 1
        }
        index += 1
    }
    return endIndex;
}

function getDynamicVarsFromRule(rule) {
  const data = [];
  while(true) {
    const dynamicVarIndex = rule.search(DYNAMIC_VAR);
    if (dynamicVarIndex == -1){
      break;
    }
    const startBracketIndex = dynamicVarIndex + DYNAMIC_VAR.length;
    const endBracketIndex = findClosingBracket(rule, startBracketIndex);
    const dynamicVar = rule.substring(dynamicVarIndex, endBracketIndex + 1)
    data.push(dynamicVar)
    rule = rule.replace(dynamicVar, "")
  }
  return data;
}

function getAllDynamicVars(rules) {
  let dynamicVars = [];
  for(const rule of rules) {
    for(const item of rule[1]) {
      dynamicVars = dynamicVars.concat(getDynamicVarsFromRule(item));
    }
  }
  return [...new Set(dynamicVars)]
}

function replaceFuncName(all, funcName) {
  funcName = funcName.split(/-/g);
  funcName = funcName.map((s, i) => {
    if (i == 0) {
      return s;
    }
    return s[0].toUpperCase() + s.substring(1);
  });
  funcName = funcName.join('');
  return funcName + '(';
}

function formatDynamicVar(value) {
    // \" -> "
    value = value.replace(/\\"/g, '"');
    // ...) -> )
    value = value.replace(/\.\.\.\)/g, ")");
    // #fff -> "#fff"
    value = value.replace(/(#[a-fA-F0-9]+)([,)])/g, '"$1"$2');
    // %... -> %, 1... -> 1
    value = value.replace(/([0-9]*(\.[0-9]*)?%)/g, '"$1"');
    // dynamic-var("xxx") -> dynamicVar("xxx")
    value = value.replace(/dynamic-var\("([-_a-z0-9]+)"\)/g, 'dynamicVar("$1")');
    // dynamic-var("func", ...) -> func(...)
    value = value.replace(/dynamic-var\("([-_a-z0-9]+)",\s/g, replaceFuncName);
    return value;
}

function createCss(rules) {
  let s = "";
  for(const rule of rules) {
    const selector = rule[0];
    s += "{{selector}} " + selector + '{\n';
    for (const str of rule[1]) {
      s += '  ' + str + ';\n';
    }
    s += "}\n"
  }
  return s;
}

function replaceAll(str, search, replacement) {
  return str.replace(new RegExp(search, 'g'), replacement);
}

module.exports = function(source) {
  // one line
  source = source.replace(/\\n/g, ' ');
  // remove comments TODO fix
  source = source.replace(/\/\*[^*]*\*\//g, '');
  // Removing media prints
  // TODO keep
  source = source.split(/@media[^{]+/g);
  source = source.map((s, i) => {
    if (i==0) {
      return s;
    }
    assert(s[0] == '{');
    let stack = 1;
    let j=1;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c == '{') {
        stack++;
      } else if (c == '}') {
        stack--;
        if (stack == 0) {
          break;
        }
      }
    }
    return s.substring(j+1);
  });
  source = source.join('');

  // Split
  source = source.split(/[{}]/);
  source = source.map((value, index) => {
    if (index % 2) {
      return value.split(';').map(s => s.trim()).filter(x => x);
    }
    return value.replace(/\s{2,}/, ' ').trim();
  });
  let arr = [];
  for (let i=0; i<source.length; i++) {
    const item = source[i];
    if (i % 2 == 1) {
      arr[arr.length - 1].push(item);
    } else {
      arr.push([item]);
    }
  }
  source = arr;
  source = source.filter(x => x.length == 2);

  // Only dynamic-var values
  source = source.map(item => {
    return [
      item[0],
      item[1].filter(x => x.includes('dynamic-var'))
    ];
  });
  source = source.filter(x => x[1].length > 0);


  let dynamicVars = getAllDynamicVars(source);
  let varMap = [];
  for (var i=0; i < dynamicVars.length; i++) {
    const d = dynamicVars[i];
    varMap.push([d, formatDynamicVar(d), 'var' + (i + 1)]);
  }
  varMap = varMap.sort((a, b) => b[0].length - a[0].length);
  let varRules = {};

  // TODO fix. not work
  let css = createCss(source);
  for (const arr of varMap) {
    const rep = '{{' + arr[2] + '}}';
    let search = arr[0];
    search = search.replace(/([()])/g, '\\$1');
    css = replaceAll(css, search, rep);
    varRules[arr[2]] = arr[1];
  }

  source = JSON.stringify({
    template: css,
    rules: varRules,
  });
  return "module.exports = " + source + ";";
};
