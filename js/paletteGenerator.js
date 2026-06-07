(function(global) {
  'use strict';

  var CU = global.ColorUtils;

  var styleConstraints = {
    morandi: { sMin: 15, sMax: 35, lMin: 40, lMax: 70 },
    macaron: { sMin: 40, sMax: 60, lMin: 75, lMax: 90 },
    vintage: { sMin: 30, sMax: 50, lMin: 30, lMax: 60, hBias: [0, 60] },
    cool:    { hMin: 180, hMax: 300 },
    warm:    { hRanges: [[0, 60], [300, 360]] }
  };

  function applyStyleConstraints(h, s, l, style) {
    var c = styleConstraints[style];
    if (!c) return { h: h, s: s, l: l };

    if (c.sMin !== undefined) s = Math.max(c.sMin, Math.min(c.sMax, s));
    if (c.lMin !== undefined) l = Math.max(c.lMin, Math.min(c.lMax, l));

    if (c.hMin !== undefined) {
      h = Math.max(c.hMin, Math.min(c.hMax, h));
    }
    if (c.hRanges) {
      var inRange = false;
      for (var i = 0; i < c.hRanges.length; i++) {
        if (h >= c.hRanges[i][0] && h <= c.hRanges[i][1]) {
          inRange = true;
          break;
        }
      }
      if (!inRange) {
        var range = c.hRanges[CU.randomInt(0, c.hRanges.length - 1)];
        h = CU.randomInt(range[0], range[1]);
      }
    }
    if (c.hBias) {
      h = (h + CU.randomInt(c.hBias[0], c.hBias[1])) % 360;
    }

    return { h: h, s: s, l: l };
  }

  function generateMono(style) {
    var baseH = CU.randomInt(0, 359);
    var baseS = CU.randomInt(40, 80);
    var baseL = CU.randomInt(30, 70);
    var colors = [];
    var lValues = [20, 35, 50, 65, 80];

    for (var i = 0; i < 5; i++) {
      var adjusted = applyStyleConstraints(baseH, baseS, lValues[i], style);
      var hex = CU.hslToHex(adjusted.h, adjusted.s, adjusted.l);
      colors.push(CU.createColorObj(hex));
    }
    return colors;
  }

  function generateDual(style) {
    var h1 = CU.randomInt(0, 359);
    var h2 = (h1 + 180) % 360;
    var colors = [];
    var variants = [
      { h: h1, l: 40 }, { h: h1, l: 60 },
      { h: h2, l: 40 }, { h: h2, l: 60 },
      { h: h1, l: 80 }
    ];

    for (var i = 0; i < 5; i++) {
      var s = CU.randomInt(50, 80);
      var adjusted = applyStyleConstraints(variants[i].h, s, variants[i].l, style);
      var hex = CU.hslToHex(adjusted.h, adjusted.s, adjusted.l);
      colors.push(CU.createColorObj(hex));
    }
    return colors;
  }

  function generateTriple(style) {
    var h1 = CU.randomInt(0, 359);
    var h2 = CU.randomInt(0, 359);
    var s = CU.randomInt(50, 80);
    var colors = [];

    for (var i = 0; i < 3; i++) {
      var t = i / 2;
      var h = Math.round(h1 + (h2 - h1) * t);
      var l = CU.randomInt(40, 60);
      var adjusted = applyStyleConstraints(h, s, l, style);
      var hex = CU.hslToHex(adjusted.h, adjusted.s, adjusted.l);
      colors.push(CU.createColorObj(hex));
    }
    return colors;
  }

  function generateQuad(style) {
    var baseH = CU.randomInt(0, 359);
    var offsets = [0, 90, 180, 270];
    var colors = [];

    for (var i = 0; i < 4; i++) {
      var h = (baseH + offsets[i]) % 360;
      var s = CU.randomInt(50, 80);
      var l = CU.randomInt(45, 55);
      var adjusted = applyStyleConstraints(h, s, l, style);
      var hex = CU.hslToHex(adjusted.h, adjusted.s, adjusted.l);
      colors.push(CU.createColorObj(hex));
    }
    return colors;
  }

  function generatePalette(mode, style) {
    switch (mode) {
      case 'mono': return generateMono(style);
      case 'dual': return generateDual(style);
      case 'triple': return generateTriple(style);
      case 'quad': return generateQuad(style);
      default: return generateMono(style);
    }
  }

  function detectStyles(colors) {
    var styles = [];
    var avgS = 0, avgL = 0, avgH = 0;

    for (var i = 0; i < colors.length; i++) {
      var hsl = colors[i].hslRaw;
      avgS += hsl.s;
      avgL += hsl.l;
      avgH += hsl.h;
    }
    avgS /= colors.length;
    avgL /= colors.length;
    avgH /= colors.length;

    var m = styleConstraints.morandi;
    if (avgS >= m.sMin && avgS <= m.sMax && avgL >= m.lMin && avgL <= m.lMax) {
      styles.push('morandi');
    }

    var ma = styleConstraints.macaron;
    if (avgS >= ma.sMin && avgS <= ma.sMax && avgL >= ma.lMin && avgL <= ma.lMax) {
      styles.push('macaron');
    }

    var v = styleConstraints.vintage;
    if (avgS >= v.sMin && avgS <= v.sMax && avgL >= v.lMin && avgL <= v.lMax) {
      styles.push('vintage');
    }

    var c = styleConstraints.cool;
    if (avgH >= c.hMin && avgH <= c.hMax) {
      styles.push('cool');
    }

    var w = styleConstraints.warm;
    for (var j = 0; j < w.hRanges.length; j++) {
      if (avgH >= w.hRanges[j][0] && avgH <= w.hRanges[j][1]) {
        styles.push('warm');
        break;
      }
    }

    return styles;
  }

  function createPaletteId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  function createPalette(mode, style) {
    var colors = generatePalette(mode, style);
    var palette = {
      id: createPaletteId(),
      mode: mode,
      colors: colors,
      style: detectStyles(colors),
      gradient: {
        angle: CU.randomInt(0, 360),
        type: 'linear'
      },
      createdAt: Date.now()
    };
    return palette;
  }

  global.PaletteGenerator = {
    createPalette: createPalette,
    generatePalette: generatePalette,
    generateMono: generateMono,
    generateDual: generateDual,
    generateTriple: generateTriple,
    generateQuad: generateQuad,
    detectStyles: detectStyles,
    applyStyleConstraints: applyStyleConstraints
  };
})(window);
