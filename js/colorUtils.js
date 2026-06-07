(function(global) {
  'use strict';

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(x) {
      var hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    var r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function hexToHsl(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return null;
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  function hslToHex(h, s, l) {
    var rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function isLightColor(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return true;
    var brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }

  function getContrastColor(hex) {
    return isLightColor(hex) ? '#000000' : '#FFFFFF';
  }

  function formatRgbString(r, g, b) {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }

  function formatHslString(h, s, l) {
    return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
  }

  function createColorObj(hex) {
    var rgb = hexToRgb(hex);
    var hsl = hexToHsl(hex);
    return {
      hex: hex.toUpperCase(),
      rgb: formatRgbString(rgb.r, rgb.g, rgb.b),
      hsl: formatHslString(hsl.h, hsl.s, hsl.l),
      hslRaw: hsl
    };
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomHex() {
    return rgbToHex(randomInt(0, 255), randomInt(0, 255), randomInt(0, 255));
  }

  global.ColorUtils = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    hexToHsl: hexToHsl,
    hslToHex: hslToHex,
    isLightColor: isLightColor,
    getContrastColor: getContrastColor,
    createColorObj: createColorObj,
    randomInt: randomInt,
    randomHex: randomHex,
    formatRgbString: formatRgbString,
    formatHslString: formatHslString
  };
})(window);
