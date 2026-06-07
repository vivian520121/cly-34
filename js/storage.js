(function(global) {
  'use strict';

  var STORAGE_KEY = 'color_palette_favorites';

  function getFavorites() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(favorites) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveFavorite(palette) {
    var favorites = getFavorites();
    var exists = favorites.some(function(p) { return p.id === palette.id; });
    if (!exists) {
      favorites.unshift(palette);
      saveFavorites(favorites);
    }
    return !exists;
  }

  function removeFavorite(id) {
    var favorites = getFavorites();
    var index = favorites.findIndex(function(p) { return p.id === id; });
    if (index !== -1) {
      favorites.splice(index, 1);
      saveFavorites(favorites);
      return true;
    }
    return false;
  }

  function isFavorite(id) {
    var favorites = getFavorites();
    return favorites.some(function(p) { return p.id === id; });
  }

  function clearFavorites() {
    return saveFavorites([]);
  }

  global.StorageManager = {
    getFavorites: getFavorites,
    saveFavorite: saveFavorite,
    removeFavorite: removeFavorite,
    isFavorite: isFavorite,
    clearFavorites: clearFavorites
  };
})(window);
