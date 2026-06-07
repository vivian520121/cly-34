(function(global) {
  'use strict';

  var CU = global.ColorUtils;
  var SM = global.StorageManager;
  var PG = global.PaletteGenerator;

  var state = {
    currentPalette: null,
    currentMode: 'quad',
    currentStyle: null,
    activeFormat: 'hex',
    selectedStyles: []
  };

  var elements = {};

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function initElements() {
    elements.paletteContainer = $('#palette-container');
    elements.colorValues = $('#color-values');
    elements.modeBtns = $$('.mode-btn');
    elements.styleBtns = $$('.style-btn');
    elements.refreshBtn = $('#refresh-btn');
    elements.favoriteBtn = $('#favorite-btn');
    elements.favoritesList = $('#favorites-list');
    elements.previewText = $('#preview-text');
    elements.previewBtn = $('#preview-btn');
    elements.previewCard = $('#preview-card');
    elements.colorPicker = $('#color-picker');
    elements.pickerBtn = $('#picker-btn');
    elements.toast = $('#toast');
    elements.angleControl = $('#angle-control');
    elements.angleSlider = $('#angle-slider');
    elements.angleValue = $('#angle-value');
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(function() {
      elements.toast.classList.remove('show');
    }, 2000);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function() {
        showToast('已复制: ' + text);
        return true;
      }).catch(function() {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('已复制: ' + text);
      return true;
    } catch (e) {
      showToast('复制失败');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }

  function buildGradientString(colors, angle) {
    var stops = colors.map(function(c, i) {
      return c.hex + ' ' + Math.round((i / (colors.length - 1)) * 100) + '%';
    });
    return 'linear-gradient(' + angle + 'deg, ' + stops.join(', ') + ')';
  }

  function renderPalette() {
    var palette = state.currentPalette;
    if (!palette) return;

    var colors = palette.colors;
    var container = elements.paletteContainer;
    container.innerHTML = '';
    container.classList.remove('palette-mono', 'palette-dual', 'palette-triple', 'palette-quad');
    container.classList.add('palette-' + palette.mode);

    var gradientBg = palette.mode === 'triple'
      ? buildGradientString(colors, palette.gradient.angle)
      : null;

    colors.forEach(function(color, index) {
      var swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color.hex;
      swatch.style.color = CU.getContrastColor(color.hex);
      swatch.style.animationDelay = (index * 0.1) + 's';

      if (palette.mode === 'triple' && colors.length > 1) {
        if (index === 0) {
          swatch.style.background = 'linear-gradient(' + palette.gradient.angle + 'deg, ' +
            colors[0].hex + ' 0%, ' + colors[1].hex + ' 50%)';
        } else if (index === 1) {
          swatch.style.background = 'linear-gradient(' + palette.gradient.angle + 'deg, ' +
            colors[0].hex + ' 0%, ' + colors[1].hex + ' 50%, ' + colors[2].hex + ' 100%)';
        } else if (index === 2) {
          swatch.style.background = 'linear-gradient(' + palette.gradient.angle + 'deg, ' +
            colors[1].hex + ' 50%, ' + colors[2].hex + ' 100%)';
        }
      }

      swatch.innerHTML = '<span class="swatch-label">' + color.hex + '</span>';
      swatch.setAttribute('data-color', color.hex);

      swatch.addEventListener('click', function() {
        copyToClipboard(color[state.activeFormat]);
      });

      container.appendChild(swatch);
    });

    if (palette.mode === 'triple') {
      var overlay = document.createElement('div');
      overlay.className = 'gradient-overlay';
      overlay.style.background = gradientBg;
      container.appendChild(overlay);
    }

    renderColorValues();
    updateFavoriteButton();
    updatePreview();
  }

  function renderColorValues() {
    var palette = state.currentPalette;
    if (!palette) return;

    var container = elements.colorValues;
    container.innerHTML = '';

    palette.colors.forEach(function(color, index) {
      var card = document.createElement('div');
      card.className = 'color-value-card';
      card.style.animationDelay = (index * 0.08 + 0.3) + 's';

      var formats = ['hex', 'rgb', 'hsl'];
      var formatHtml = formats.map(function(fmt) {
        var isActive = fmt === state.activeFormat;
        return '<div class="format-row ' + (isActive ? 'active' : '') + '" data-format="' + fmt + '">' +
                 '<span class="format-label">' + fmt.toUpperCase() + '</span>' +
                 '<span class="format-value" data-value="' + color[fmt] + '">' + color[fmt] + '</span>' +
                 '<span class="copy-icon">📋</span>' +
               '</div>';
      }).join('');

      card.innerHTML = '<div class="color-preview" style="background-color: ' + color.hex + '"></div>' +
                       '<div class="color-info">' + formatHtml + '</div>';

      card.querySelectorAll('.format-row').forEach(function(row) {
        row.addEventListener('click', function(e) {
          e.stopPropagation();
          var value = row.querySelector('.format-value').getAttribute('data-value');
          copyToClipboard(value);
        });
      });

      container.appendChild(card);
    });
  }

  function updateFavoriteButton() {
    var palette = state.currentPalette;
    if (!palette) return;

    var isFav = SM.isFavorite(palette.id);
    var btn = elements.favoriteBtn;
    btn.classList.toggle('favorited', isFav);
    btn.innerHTML = isFav ? '❤️ 已收藏' : '🤍 收藏';
  }

  function updatePreview() {
    var palette = state.currentPalette;
    if (!palette) return;

    var colors = palette.colors;
    var primary = colors[0].hex;
    var secondary = colors[1] ? colors[1].hex : colors[0].hex;
    var accent = colors[2] ? colors[2].hex : colors[0].hex;

    elements.previewText.style.color = primary;
    elements.previewBtn.style.backgroundColor = primary;
    elements.previewBtn.style.color = CU.getContrastColor(primary);

    elements.previewCard.style.background = 'linear-gradient(135deg, ' + primary + ', ' + secondary + ')';
    elements.previewCard.style.color = CU.getContrastColor(primary);

    var cardBtn = elements.previewCard.querySelector('.card-btn');
    if (cardBtn) {
      cardBtn.style.backgroundColor = accent;
      cardBtn.style.color = CU.getContrastColor(accent);
    }
  }

  function renderFavorites() {
    var favorites = SM.getFavorites();
    var container = elements.favoritesList;
    container.innerHTML = '';

    if (favorites.length === 0) {
      container.innerHTML = '<div class="empty-favorites">暂无收藏的配色方案</div>';
      return;
    }

    favorites.forEach(function(palette, index) {
      var item = document.createElement('div');
      item.className = 'favorite-item';
      item.setAttribute('data-id', palette.id);

      var colorsHtml = palette.colors.map(function(c) {
        return '<div class="fav-color" style="background-color: ' + c.hex + '"></div>';
      }).join('');

      item.innerHTML = '<div class="fav-colors">' + colorsHtml + '</div>' +
                       '<button class="apply-fav" title="应用此配色">✨</button>' +
                       '<button class="delete-fav" title="删除收藏">🗑️</button>';

      item.querySelector('.apply-fav').addEventListener('click', function(e) {
        e.stopPropagation();
        state.currentPalette = palette;
        state.currentMode = palette.mode;
        updateModeButtons();
        updateAngleControl();
        updateAngleSlider();
        renderPalette();
        showToast('已应用收藏的配色');
      });

      item.querySelector('.delete-fav').addEventListener('click', function(e) {
        e.stopPropagation();
        SM.removeFavorite(palette.id);
        renderFavorites();
        updateFavoriteButton();
        showToast('已删除收藏');
      });

      container.appendChild(item);
    });
  }

  function updateModeButtons() {
    elements.modeBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.currentMode);
    });
  }

  function updateStyleButtons() {
    elements.styleBtns.forEach(function(btn) {
      var style = btn.getAttribute('data-style');
      btn.classList.toggle('active', state.selectedStyles.indexOf(style) !== -1);
    });
  }

  function updateAngleControl() {
    if (state.currentMode === 'triple') {
      elements.angleControl.classList.remove('hidden');
    } else {
      elements.angleControl.classList.add('hidden');
    }
  }

  function updateAngleSlider() {
    var palette = state.currentPalette;
    if (palette && palette.gradient && palette.gradient.angle !== undefined) {
      elements.angleSlider.value = palette.gradient.angle;
      elements.angleValue.textContent = palette.gradient.angle + '°';
    }
  }

  function bindEvents() {
    elements.refreshBtn.addEventListener('click', function() {
      state.currentPalette = PG.createPalette(state.currentMode, state.currentStyle);
      updateAngleSlider();
      renderPalette();
    });

    elements.angleSlider.addEventListener('input', function(e) {
      var angle = parseInt(e.target.value, 10);
      if (state.currentPalette && state.currentPalette.gradient) {
        state.currentPalette.gradient.angle = angle;
        elements.angleValue.textContent = angle + '°';
        renderPalette();
      }
    });

    elements.modeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.currentMode = btn.getAttribute('data-mode');
        updateModeButtons();
        updateAngleControl();
        state.currentPalette = PG.createPalette(state.currentMode, state.currentStyle);
        updateAngleSlider();
        renderPalette();
      });
    });

    elements.styleBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var style = btn.getAttribute('data-style');
        var idx = state.selectedStyles.indexOf(style);
        if (idx === -1) {
          state.selectedStyles.push(style);
        } else {
          state.selectedStyles.splice(idx, 1);
        }
        state.currentStyle = state.selectedStyles.length > 0 ? state.selectedStyles[0] : null;
        updateStyleButtons();
        state.currentPalette = PG.createPalette(state.currentMode, state.currentStyle);
        updateAngleSlider();
        renderPalette();
      });
    });

    elements.favoriteBtn.addEventListener('click', function() {
      var palette = state.currentPalette;
      if (!palette) return;

      if (SM.isFavorite(palette.id)) {
        SM.removeFavorite(palette.id);
        showToast('已取消收藏');
      } else {
        SM.saveFavorite(palette);
        showToast('已收藏配色');
      }
      updateFavoriteButton();
      renderFavorites();
    });

    elements.pickerBtn.addEventListener('click', function() {
      if (global.EyeDropper) {
        var eyeDropper = new EyeDropper();
        eyeDropper.open().then(function(result) {
          var hex = result.sRGBHex;
          var colorObj = CU.createColorObj(hex);
          if (state.currentPalette && state.currentPalette.colors.length > 0) {
            state.currentPalette.colors[0] = colorObj;
            state.currentPalette.style = PG.detectStyles(state.currentPalette.colors);
            renderPalette();
            showToast('已应用取色: ' + hex);
          }
        }).catch(function(e) {
          console.log('取色器已取消');
        });
      } else {
        elements.colorPicker.click();
      }
    });

    elements.colorPicker.addEventListener('change', function(e) {
      var hex = e.target.value.toUpperCase();
      var colorObj = CU.createColorObj(hex);
      if (state.currentPalette && state.currentPalette.colors.length > 0) {
        state.currentPalette.colors[0] = colorObj;
        state.currentPalette.style = PG.detectStyles(state.currentPalette.colors);
        renderPalette();
        showToast('已应用颜色: ' + hex);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        state.currentPalette = PG.createPalette(state.currentMode, state.currentStyle);
        updateAngleSlider();
        renderPalette();
      }
    });
  }

  function init() {
    initElements();
    bindEvents();
    state.currentPalette = PG.createPalette(state.currentMode, null);
    updateAngleControl();
    updateAngleSlider();
    renderPalette();
    renderFavorites();
    updateModeButtons();
    updateStyleButtons();
  }

  global.UIController = {
    init: init,
    renderPalette: renderPalette,
    renderFavorites: renderFavorites,
    showToast: showToast,
    copyToClipboard: copyToClipboard,
    getState: function() { return state; }
  };
})(window);
