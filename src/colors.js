/* eslint-disable no-unused-vars */

function percentValue(value) {
  // TODO parse int !!!
  const count = value.length;
  if (value[count-1] === '%') {
    return parseInt(value.substring(0, count - 1)) / 100;
  }
  return value;
}


function colorToInt(color) {
  color = color.substring(1);
  if (color.length === 3) {
    color = color.replace(/(.)/g, "$1$1");
  }
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4), 16);
  return [r, g, b, 1.0];
}

function intToColor(rgb) {
  let s = "#";
  for (const i of rgb) {
    let value = Math.floor(i).toString(16);
    if (value.length == 1) {
      value = '0' + value;
    }
    s += value;
  }
  return s;
}

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, l ];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}

function colorYiq(color) {
  color = colorToInt(color);
  const r = color[0];
  const g = color[1];
  const b = color[2];

  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  const yiqContrastedThreshold = 150;

  // TODO 
  const dark = "#000000";
  const light = "#ffffff";

  if (yiq >= yiqContrastedThreshold) {
    return dark;
  } else {
    return light;
  }
}

function mix(color1, color2, weight) {
  weight = percentValue(weight);
  color1 = colorToInt(color1);
  color2 = colorToInt(color2);
  const p = weight;
  let w = p * 2 - 1
  const colorAlpha1 = color1[3];
  const colorAlpha2 = color2[3];
  const a = colorAlpha1 - colorAlpha2;
  const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
  const w2 = 1 - w1;
  let rgb = [];
  for (let i=0; i < 3; i++) {
    let v1 = color1[i];
    let v2 = color2[i];
    rgb.push(v1 * w1 + v2 * w2);
  }
  const alpha = colorAlpha1 * p + colorAlpha2 * (1 - p);
  return intToColor(rgb);
}

function rgba(color, transparency) {
  color = colorToInt(color);
  // TODO check old browser
  const [r, g, b] = color;
  return `rgba(${r}, ${g}, ${b}, ${transparency})`;
}

function darken(color, value) {
  value = percentValue(value);
  color = colorToInt(color);
  let hsl = rgbToHsl(color[0], color[1], color[2]);
  const lightness = Math.max(
    hsl[2] - value,
    0
  );
  const rgb = hslToRgb(hsl[0], hsl[1], lightness);
  // TODO add alpha
  return intToColor(rgb);
}

function lighten(color, value) {
  value = percentValue(value);
  color = colorToInt(color);
  let hsl = rgbToHsl(color[0], color[1], color[2]);
  const lightness = Math.min(
    hsl[2] + value,
    1.0
  );
  const rgb = hslToRgb(hsl[0], hsl[1], lightness);
  // TODO add alpha
  return intToColor(rgb);
}

function evaluateFunc(func, vars) {
  function dynamicVar(name) {
    return vars[name];
  }
  return eval(func);
}

function replaceAll(str, search, replacement) {
  return str.split(search).join(replacement);
}

export default function renderCss(
  template, rules, vars, selector
) {
  let values = {};
  for(const varName in rules) {
    const func = rules[varName]
    values[varName] = evaluateFunc(func, vars);
  }
  let result = template;
  result = replaceAll(result, '{{selector}}', selector);
  for (const key in values) {
    const value = values[key];
    result = replaceAll(result, `{{${key}}}`, value);
  }
  return result;
}
