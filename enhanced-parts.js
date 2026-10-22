"use strict";

/*
 * Enhanced Parts Commands for AutoPiese Marketplace
 * Reconstructed parts management system with advanced features
 */

const ERR = {
  PARTS_NOT_FOUND: 'Piesele căutate nu au fost găsite.',
  PARTS_CREATE_SUCCESS: 'Piesa a fost creată cu succes!',
  PARTS_UPDATE_SUCCESS: 'Piesa a fost actualizată cu succes!',
  PARTS_DELETE_SUCCESS: 'Piesa a fost ștearsă cu succes!',
  PARTS_SEARCH_SUCCESS: 'Căutarea pieselor a fost efectuată cu succes!',
  PARTS_COMPATIBILITY_SUCCESS: 'Compatibilitatea pieselor a fost verificată cu succes!',
  PARTS_FAVORITE_SUCCESS: 'Piesa a fost adăugată la favorite!',
  PARTS_FAVORITE_REMOVED_SUCCESS: 'Piesa a fost eliminată din favorite!',
  PARTS_CART_ADDED_SUCCESS: 'Piesa a fost adăugată în coș!',
  PARTS_CART_REMOVED_SUCCESS: 'Piesa a fost eliminată din coș!',
  PARTS_ORDER_SUCCESS: 'Comanda a fost plasată cu succes!',
  PARTS_ANALYTICS_SUCCESS: 'Analiza pieselor a fost generată cu succes!',
  PARTS_EXPORT_SUCCESS: 'Datele pieselor au fost exportate cu succes!',
  PARTS_SYNC_SUCCESS: 'Inventarul pieselor a fost sincronizat cu succes!',
  PARTS_RECOMMENDATIONS_SUCCESS: 'Recomandările pentru piese au fost generate cu succes!',
  PARTS_VALIDATE_SUCCESS: 'Datele pieselor au fost validate cu succes!',
  PARTS_CART_LOADED_SUCCESS: 'Coșul de piese a fost încărcat cu succes!',
  PARTS_FAVORITES_LOADED_SUCCESS: 'Favoritele de piese au fost încărcate cu succes!',
  PARTS_ACCOUNT_STATS_SUCCESS: 'Statistici cont pentru piese au fost încărcate cu succes!',
  PARTS_SEARCH_FAILED: 'Nu s-a putut efectua căutarea pieselor.',
  PARTS_COMPATIBILITY_FAILED: 'Nu s-a putut verifica compatibilitatea pieselor.',
  PARTS_CART_FAILED: 'Nu s-a putut gestiona coșul de piese.',
  PARTS_ANALYTICS_FAILED: 'Nu s-au putut genera analizele pieselor.',
  PARTS_EXPORT_FAILED: 'Nu s-au putut exporta datele pieselor.',
  PARTS_SYNC_FAILED: 'Nu s-a putut sincroniza inventarul pieselor.',
  PARTS_RECOMMENDATIONS_FAILED: 'Nu s-au putut genera recomandările pentru piese.',
  PARTS_VALIDATE_FAILED: 'Nu s-au putut valida datele pieselor.',
};

/*
 * Enhanced Parts Commands for AutoPiese Marketplace
 * Reconstructed parts management system with advanced features
 */

const PartsCommands = {
  // ===== CORE PARTS MANAGEMENT =====
  
  // Parts Listing Commands
  createListing: async function(listingData) {
    try {
      const formData = new FormData();
      formData.append('type', 'piesa');
      formData.append('title', listingData.title);
      formData.append('price', listingData.price || 0);
      formData.append('category', listingData.category);
      formData.append('make', listingData.make);
      formData.append('model', listingData.model);
      formData.append('year', listingData.year);
      formData.append('condition', listingData.condition);
      formData.append('description', listingData.description);
      formData.append('quantity', listingData.quantity || 1);
      formData.append('negotiable', listingData.negotiable || false);
      formData.append('delivery', listingData.delivery || false);
      
      if (listingData.images && listingData.images.length > 0) {
        listingData.images.forEach((img, index) => {
          if (img.startsWith('data:')) {
            const blob = dataURItoBlob(img);
            formData.append(`image_${index}`, blob, `part_${Date.now()}_${index}.jpg`);
          }
        });
      }
      
      const response = await api('/api/listings', {
        method: 'POST',
        body: formData,
        headers: {}
      });
      
      toast(ERR.PARTS_CREATE_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_CREATE_SUCCESS };
    } catch (error) {
      console.error('Error creating part listing:', error);
      toast(error.message || ERR.PARTS_CREATE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CREATE_FAILED };
    }
  },
  
  updateListing: async function(listingId, updateData) {
    try {
      const response = await api(`/api/listings/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      toast(ERR.PARTS_UPDATE_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_UPDATE_SUCCESS };
    } catch (error) {
      console.error('Error updating part listing:', error);
      toast(error.message || ERR.PARTS_UPDATE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_UPDATE_FAILED };
    }
  },
  
  deleteListing: async function(listingId) {
    try {
      const response = await api(`/api/listings/${listingId}`, {
        method: 'DELETE'
      });
      
      toast(ERR.PARTS_DELETE_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_DELETE_SUCCESS };
    } catch (error) {
      console.error('Error deleting part listing:', error);
      toast(error.message || ERR.PARTS_DELETE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_DELETE_FAILED };
    }
  },
  
  // Parts Search and Filter Commands
  searchParts: async function(searchParams = {}) {
    try {
      const response = await api('/api/listings', {
        method: 'GET',
        searchParams: searchParams
      });
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_SEARCH_SUCCESS,
        count: response.total || 0
      };
    } catch (error) {
      console.error('Error searching parts:', error);
      toast(error.message || ERR.PARTS_SEARCH_FAILED);
      return { success: false, error: error.message || ERR.PARTS_SEARCH_FAILED };
    }
  },
  
  getPartDetails: async function(listingId) {
    try {
      const response = await api(`/api/listings/${listingId}`);
      
      return { success: true, data: response, message: ERR.PARTS_DETAILS_SUCCESS };
    } catch (error) {
      console.error('Error getting part details:', error);
      toast(error.message || ERR.PARTS_NOT_FOUND);
      return { success: false, error: error.message || ERR.PARTS_NOT_FOUND };
    }
  },
  
  // Parts Compatibility and Filtering
  findCompatibleParts: async function(vehicleInfo) {
    try {
      const { make, model, year, engine, fuel } = vehicleInfo;
      
      const vehicleCatalog = await api('/api/catalog/resolve', {
        method: 'GET',
        searchParams: { q: `${make} ${model} ${year}` }
      });
      
      if (!vehicleCatalog.match) {
        return { 
          success: false, 
          error: ERR.PARTS_COMPATIBILITY_FAILED,
          message: 'Nu s-au găsit piese compatibile cu vehiculul specificat.'
        };
      }
      
      const searchResults = await PartsCommands.searchParts({
        make,
        model,
        year,
        engine,
        fuel,
        sortBy: 'relevance'
      });
      
      return {
        success: true,
        data: {
          compatible: searchResults.data.listings || [],
          suggestions: generatePartSuggestions(vehicleCatalog, searchResults.data.listings || [])
        },
        message: ERR.PARTS_COMPATIBILITY_SUCCESS
      };
    } catch (error) {
      console.error('Error finding compatible parts:', error);
      toast(error.message || ERR.PARTS_COMPATIBILITY_FAILED);
      return { success: false, error: error.message || ERR.PARTS_COMPATIBILITY_FAILED };
    }
  },
  
  // Parts Favorites Management
  addToFavorites: async function(listingId) {
    try {
      const response = await api(`/api/favorites/${listingId}`, {
        method: 'POST'
      });
      
      toast(ERR.PARTS_FAVORITE_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_FAVORITE_SUCCESS };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  removeFromFavorites: async function(listingId) {
    try {
      const response = await api(`/api/favorites/${listingId}`, {
        method: 'DELETE'
      });
      
      toast(ERR.PARTS_FAVORITE_REMOVED_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_FAVORITE_REMOVED_SUCCESS };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  getFavorites: async function() {
    try {
      const response = await api('/api/favorites');
      
      return { success: true, data: response, message: ERR.PARTS_FAVORITES_LOADED_SUCCESS };
    } catch (error) {
      console.error('Error getting favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  // Parts Cart Management
  addToCart: async function(listingId) {
    try {
      const cart = readJSON('autopiese_cart', []);
      if (!cart.includes(listingId)) {
        cart.push(listingId);
        writeJSON('autopiese_cart', cart.slice(0, 50));
      }
      
      toast(ERR.PARTS_CART_ADDED_SUCCESS);
      return { success: true, message: ERR.PARTS_CART_ADDED_SUCCESS };
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  removeFromCart: async function(listingId) {
    try {
      let cart = readJSON('autopiese_cart', []);
      cart = cart.filter(id => id !== listingId);
      writeJSON('autopiese_cart', cart);
      
      toast(ERR.PARTS_CART_REMOVED_SUCCESS);
      return { success: true, message: ERR.PARTS_CART_REMOVED_SUCCESS };
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  getCart: async function() {
    try {
      const cart = readJSON('autopiese_cart', []);
      const cartItems = await Promise.all(
        cart.map(async id => {
          try {
            const response = await api(`/api/listings/${id}`);
            return response.listing;
          } catch {
            return null;
          }
        })
      );
      
      return { 
        success: true, 
        data: cartItems.filter(item => item), 
        message: ERR.PARTS_CART_LOADED_SUCCESS,
        count: cartItems.filter(item => item).length
      };
    } catch (error) {
      console.error('Error getting cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  // Parts Ordering
  createOrder: async function(orderData) {
    try {
      const response = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      toast(ERR.PARTS_ORDER_SUCCESS);
      return { success: true, data: response, message: ERR.PARTS_ORDER_SUCCESS };
    } catch (error) {
      console.error('Error creating order:', error);
      toast(error.message || ERR.PARTS_ORDER_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ORDER_FAILED };
    }
  },
  
  // Parts Analytics and Statistics
  getPartsAnalytics: async function(timeRange = '30d') {
    try {
      const response = await api(`/api/stats/mine`);
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_ANALYTICS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting parts analytics:', error);
      toast(error.message || ERR.PARTS_ANALYTICS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ANALYTICS_FAILED };
    }
  },
  
  getAccountStats: async function(range = '12m') {
    try {
      const response = await api(`/api/stats/account?range=${range}`);
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_ACCOUNT_STATS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting account stats:', error);
      toast(error.message || ERR.PARTS_ANALYTICS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ANALYTICS_FAILED };
    }
  },
  
  // Parts Export and Import
  exportPartsData: async function() {
    try {
      const response = await api('/api/account/export');
      
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autopiese-parts-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast(ERR.PARTS_EXPORT_SUCCESS);
      return { success: true, message: ERR.PARTS_EXPORT_SUCCESS };
    } catch (error) {
      console.error('Error exporting parts data:', error);
      toast(error.message || ERR.PARTS_EXPORT_FAILED);
      return { success: false, error: error.message || ERR.PARTS_EXPORT_FAILED };
    }
  },
  
  // Parts Validation and Utilities
  validatePartListing: function(listingData) {
    const errors = [];
    
    if (!listingData.title || listingData.title.trim().length < 10) {
      errors.push('Titlul trebuie să aibă cel puțin 10 caractere');
    }
    
    if (!listingData.price || listingData.price < 0) {
      errors.push('Prețul trebuie să fie un număr valid');
    }
    
    if (!listingData.category) {
      errors.push('Categoria este obligatorie');
    }
    
    if (!listingData.make) {
      errors.push('Marca este obligatorie');
    }
    
    if (!listingData.model) {
      errors.push('Modelul este obligatoriu');
    }
    
    if (listingData.images && listingData.images.length > 10) {
      errors.push('Numărul de poze nu poate depăși 10');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      message: errors.length > 0 ? ERR.PARTS_VALIDATE_FAILED : ERR.PARTS_VALIDATE_SUCCESS
    };
  },
  
  // Parts Synchronization
  syncPartsInventory: async function() {
    try {
      await syncVehicleDb();
      await syncFavorites();
      
      toast(ERR.PARTS_SYNC_SUCCESS);
      return { success: true, message: ERR.PARTS_SYNC_SUCCESS };
    } catch (error) {
      console.error('Error syncing parts inventory:', error);
      toast(error.message || ERR.PARTS_SYNC_FAILED);
      return { success: false, error: error.message || ERR.PARTS_SYNC_FAILED };
    }
  },
  
  // Parts Recommendations
  getPartsRecommendations: async function(userPreferences = {}) {
    try {
      const { category, make, model, year, budget } = userPreferences;
      
      const searchParams = {};
      if (category) searchParams.filterCategory = category;
      if (make) searchParams.filterMake = make;
      if (model) searchParams.filterModel = model;
      if (year) searchParams.filterYear = year;
      if (budget) searchParams.maxPrice = budget;
      
      const response = await PartsCommands.searchParts(searchParams);
      
      const recommendations = generateRecommendations(response.data.listings || [], userPreferences);
      
      return {
        success: true,
        data: recommendations,
        message: ERR.PARTS_RECOMMENDATIONS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting parts recommendations:', error);
      toast(error.message || ERR.PARTS_RECOMMENDATIONS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_RECOMMENDATIONS_FAILED };
    }
  },
  
  // ===== UTILITY FUNCTIONS =====
  
  // Generate part suggestions based on vehicle catalog
  generatePartSuggestions: function(vehicleCatalog, parts) {
    const suggestions = [];
    
    parts.forEach(part => {
      const compatibility = calculatePartCompatibility(part, vehicleCatalog);
      if (compatibility.score > 0.7) {
        suggestions.push({
          part: part,
          compatibility: compatibility,
          reason: generateCompatibilityReason(compatibility)
        });
      }
    });
    
    return suggestions.sort((a, b) => b.compatibility.score - a.compatibility.score).slice(0, 10);
  },
  
  // Calculate part compatibility with vehicle
  calculatePartCompatibility: function(part, vehicleCatalog) {
    let score = 0;
    const maxScore = 100;
    
    if (part.make === vehicleCatalog.make) score += 30;
    if (part.model === vehicleCatalog.model) score += 40;
    if (part.year === vehicleCatalog.year_from || part.year === vehicleCatalog.year_to) score += 20;
    if (part.engine === vehicleCatalog.engine) score += 10;
    
    return {
      score: score / maxScore,
      matches: {
        make: part.make === vehicleCatalog.make,
        model: part.model === vehicleCatalog.model,
        year: part.year === vehicleCatalog.year_from || part.year === vehicleCatalog.year_to,
        engine: part.engine === vehicleCatalog.engine
      }
    };
  },
  
  // Generate compatibility reason
  generateCompatibilityReason: function(compatibility) {
    const reasons = [];
    
    if (compatibility.matches.make) reasons.push('marcă compatibilă');
    if (compatibility.matches.model) reasons.push('model compatibil');
    if (compatibility.matches.year) reasons.push('an compatibil');
    if (compatibility.matches.engine) reasons.push('motor compatibil');
    
    return reasons.length > 0 ? reasons.join(', ') : 'compatibilitate generală';
  },
  
  // Generate recommendations based on user preferences
  generateRecommendations: function(parts, preferences) {
    const recommendations = [];
    
    parts.forEach(part => {
      let score = 0;
      
      if (preferences.category && part.category === preferences.category) score += 30;
      if (preferences.make && part.make === preferences.make) score += 25;
      if (preferences.model && part.model === preferences.model) score += 20;
      if (preferences.year && part.year === preferences.year) score += 15;
      if (preferences.budget && part.price <= preferences.budget) score += 10;
      
      if (score > 0) {
        recommendations.push({
          part: part,
          score: score,
          reason: generateRecommendationReason(part, preferences)
        });
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  },
  
  // Generate recommendation reason
  generateRecommendationReason: function(part, preferences) {
    const reasons = [];
    
    if (preferences.category && part.category === preferences.category) reasons.push('categoria potrivită');
    if (preferences.make && part.make === preferences.make) reasons.push('marca potrivită');
    if (preferences.model && part.model === preferences.model) reasons.push('model potrivit');
    if (preferences.year && part.year === preferences.year) reasons.push('an potrivit');
    if (preferences.budget && part.price <= preferences.budget) reasons.push('preț accesibil');
    
    return reasons.length > 0 ? reasons.join(', ') : 'compatibilitate generală';
  },
  
  // Data URI to Blob conversion
  dataURItoBlob: function(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  },
};

// Export the parts commands
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PartsCommands;
}

// Make globally available
window.PartsCommands = PartsCommands;