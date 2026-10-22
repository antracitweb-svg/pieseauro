"use strict";

/*
 * Enhanced Parts Integration for AutoPiese Marketplace
 * Integrates enhanced parts commands into the existing project
 */

// Import enhanced parts commands
let PartsCommands = null;

// Load enhanced parts commands
try {
  if (typeof module !== 'undefined' && module.exports) {
    PartsCommands = require('./enhanced-parts.js');
  } else {
    // If running in browser, wait for PartsCommands to be available globally
    if (window && window.PartsCommands) {
      PartsCommands = window.PartsCommands;
    }
  }
} catch (error) {
  console.warn('Could not load enhanced parts commands:', error);
  PartsCommands = null;
}

/*
 * Enhanced Parts Integration
 * Provides enhanced parts management functionality for the AutoPiese marketplace
 */

const PartsIntegration = {
  // ===== INITIALIZATION =====
  
  async init() {
    try {
      // Check if enhanced parts commands are available
      if (!PartsCommands) {
        console.warn('Enhanced parts commands not available');
        return false;
      }
      
      // Initialize enhanced parts functionality
      await this.initializeEnhancedParts();
      
      // Set up event listeners for enhanced parts commands
      this.setupEnhancedPartsEventListeners();
      
      console.log('Enhanced parts integration initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize enhanced parts integration:', error);
      return false;
    }
  },
  
  // ===== ENHANCED PARTS FUNCTIONALITY =====
  
  async initializeEnhancedParts() {
    try {
      // Initialize enhanced parts commands
      if (PartsCommands) {
        // Set up global parts commands
        window.PartsCommands = PartsCommands;
        
        // Initialize enhanced parts search
        await this.initializeEnhancedPartsSearch();
        
        // Initialize enhanced parts favorites
        await this.initializeEnhancedPartsFavorites();
        
        // Initialize enhanced parts cart
        await this.initializeEnhancedPartsCart();
        
        // Initialize enhanced parts analytics
        await this.initializeEnhancedPartsAnalytics();
      }
    } catch (error) {
      console.error('Failed to initialize enhanced parts:', error);
      throw error;
    }
  },
  
  // ===== ENHANCED PARTS SEARCH =====
  
  async initializeEnhancedPartsSearch() {
    try {
      // Add enhanced search functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.searchParts) {
        // Override existing search functionality with enhanced version
        window.searchParts = PartsCommands.searchParts;
        window.findCompatibleParts = PartsCommands.findCompatibleParts;
      }
    } catch (error) {
      console.error('Failed to initialize enhanced parts search:', error);
      throw error;
    }
  },
  
  // ===== ENHANCED PARTS FAVORITES =====
  
  async initializeEnhancedPartsFavorites() {
    try {
      // Add enhanced favorites functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.addToFavorites) {
        // Override existing favorites functionality with enhanced version
        window.addToFavorites = PartsCommands.addToFavorites;
        window.removeFromFavorites = PartsCommands.removeFromFavorites;
        window.getFavorites = PartsCommands.getFavorites;
      }
    } catch (error) {
      console.error('Failed to initialize enhanced parts favorites:', error);
      throw error;
    }
  },
  
  // ===== ENHANCED PARTS CART =====
  
  async initializeEnhancedPartsCart() {
    try {
      // Add enhanced cart functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.addToCart) {
        // Override existing cart functionality with enhanced version
        window.addToCart = PartsCommands.addToCart;
        window.removeFromCart = PartsCommands.removeFromCart;
        window.getCart = PartsCommands.getCart;
      }
    } catch (error) {
      console.error('Failed to initialize enhanced parts cart:', error);
      throw error;
    }
  },
  
  // ===== ENHANCED PARTS ANALYTICS =====
  
  async initializeEnhancedPartsAnalytics() {
    try {
      // Add enhanced analytics functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.getPartsAnalytics) {
        // Override existing analytics functionality with enhanced version
        window.getPartsAnalytics = PartsCommands.getPartsAnalytics;
        window.getAccountStats = PartsCommands.getAccountStats;
      }
    } catch (error) {
      console.error('Failed to initialize enhanced parts analytics:', error);
      throw error;
    }
  },
  
  // ===== EVENT LISTENERS =====
  
  setupEnhancedPartsEventListeners() {
    try {
      // Set up enhanced parts search event listeners
      this.setupEnhancedPartsSearchEventListeners();
      
      // Set up enhanced parts favorites event listeners
      this.setupEnhancedPartsFavoritesEventListeners();
      
      // Set up enhanced parts cart event listeners
      this.setupEnhancedPartsCartEventListeners();
      
      // Set up enhanced parts analytics event listeners
      this.setupEnhancedPartsAnalyticsEventListeners();
    } catch (error) {
      console.error('Failed to setup enhanced parts event listeners:', error);
    }
  },
  
  // ===== ENHANCED PARTS SEARCH EVENT LISTENERS =====
  
  setupEnhancedPartsSearchEventListeners() {
    try {
      // Set up enhanced search functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.searchParts) {
        // Add enhanced search functionality to search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.addEventListener('input', async (event) => {
            const searchTerm = event.target.value.trim();
            if (searchTerm.length >= 2) {
              try {
                const results = await PartsCommands.searchParts({
                  q: searchTerm,
                  limit: 10
                });
                
                // Display search results
                this.displayEnhancedSearchResults(results.data.listings || []);
              } catch (error) {
                console.error('Enhanced search failed:', error);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to setup enhanced parts search event listeners:', error);
    }
  },
  
  // ===== ENHANCED PARTS FAVORITES EVENT LISTENERS =====
  
  setupEnhancedPartsFavoritesEventListeners() {
    try {
      // Set up enhanced favorites functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.addToFavorites) {
        // Add enhanced favorites functionality to favorite buttons
        document.addEventListener('click', async (event) => {
          if (event.target.matches('[data-fav]')) {
            const listingId = parseInt(event.target.dataset.fav);
            try {
              await PartsCommands.addToFavorites(listingId);
              event.target.classList.add('pulse');
              setTimeout(() => event.target.classList.remove('pulse'), 1000);
            } catch (error) {
              console.error('Enhanced favorites failed:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to setup enhanced parts favorites event listeners:', error);
    }
  },
  
  // ===== ENHANCED PARTS CART EVENT LISTENERS =====
  
  setupEnhancedPartsCartEventListeners() {
    try {
      // Set up enhanced cart functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.addToCart) {
        // Add enhanced cart functionality to cart buttons
        document.addEventListener('click', async (event) => {
          if (event.target.matches('[data-cart]')) {
            const listingId = parseInt(event.target.dataset.cart);
            try {
              await PartsCommands.addToCart(listingId);
              event.target.classList.add('pulse');
              setTimeout(() => event.target.classList.remove('pulse'), 1000);
            } catch (error) {
              console.error('Enhanced cart failed:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to setup enhanced parts cart event listeners:', error);
    }
  },
  
  // ===== ENHANCED PARTS ANALYTICS EVENT LISTENERS =====
  
  setupEnhancedPartsAnalyticsEventListeners() {
    try {
      // Set up enhanced analytics functionality
      if (typeof PartsCommands !== 'undefined' && PartsCommands.getPartsAnalytics) {
        // Add enhanced analytics functionality to analytics buttons
        document.addEventListener('click', async (event) => {
          if (event.target.matches('[data-analytics]')) {
            try {
              const analytics = await PartsCommands.getPartsAnalytics();
              this.displayEnhancedAnalytics(analytics.data);
            } catch (error) {
              console.error('Enhanced analytics failed:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to setup enhanced parts analytics event listeners:', error);
    }
  },
  
  // ===== DISPLAY FUNCTIONS =====
  
  // Display enhanced search results
  displayEnhancedSearchResults(listings) {
    const searchResultsContainer = document.getElementById('searchResults');
    if (!searchResultsContainer) return;
    
    searchResultsContainer.innerHTML = listings.map(listing => `
      <div class="enhanced-search-result">
        <h3>${listing.title}</h3>
        <p>${listing.description}</p>
        <p><strong>Preț:</strong> ${listing.price} lei</p>
        <p><strong>Localitate:</strong> ${listing.county}</p>
        <button class="btn primary" onclick="PartsCommands.addToCart(${listing.id})">Adaugă în coș</button>
        <button class="btn ghost" onclick="PartsCommands.addToFavorites(${listing.id})">Favorite</button>
      </div>
    `).join('');
  },
  
  // Display enhanced analytics
  displayEnhancedAnalytics(analytics) {
    const analyticsContainer = document.getElementById('analytics');
    if (!analyticsContainer) return;
    
    analyticsContainer.innerHTML = `
      <div class="enhanced-analytics">
        <h3>Analize Piese</h3>
        <p><strong>Număr total de piese:</strong> ${analytics.total_listings || 0}</p>
        <p><strong>Număr total de vânzări:</strong> ${analytics.total_sales || 0}</p>
        <p><strong>Venituri totale:</strong> ${analytics.total_revenue || 0} lei</p>
        <p><strong>Număr de utilizatori activi:</strong> ${analytics.active_users || 0}</p>
        <p><strong>Număr de piese în favorite:</strong> ${analytics.favorite_listings || 0}</p>
        <p><strong>Număr de piese în coș:</strong> ${analytics.cart_listings || 0}</p>
      </div>
    `;
  },
  
  // ===== UTILITY FUNCTIONS =====
  
  // Show enhanced notification
  showEnhancedNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `enhanced-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  },
  
  // ===== PUBLIC API =====
  
  // Get enhanced parts commands
  getPartsCommands() {
    return PartsCommands;
  },
  
  // Check if enhanced parts integration is available
  isAvailable() {
    return PartsCommands !== null;
  },
  
  // Get enhanced parts integration status
  getStatus() {
    return {
      available: this.isAvailable(),
      partsCommands: PartsCommands !== null,
      enhancedSearch: typeof PartsCommands !== 'undefined' && PartsCommands.searchParts !== undefined,
      enhancedFavorites: typeof PartsCommands !== 'undefined' && PartsCommands.addToFavorites !== undefined,
      enhancedCart: typeof PartsCommands !== 'undefined' && PartsCommands.addToCart !== undefined,
      enhancedAnalytics: typeof PartsCommands !== 'undefined' && PartsCommands.getPartsAnalytics !== undefined,
    };
  },
};

// Auto-initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PartsIntegration.init().then(success => {
      if (success) {
        console.log('Enhanced parts integration completed successfully');
      } else {
        console.warn('Enhanced parts integration completed with warnings');
      }
    });
  });
} else {
  // DOM is already loaded
  PartsIntegration.init().then(success => {
    if (success) {
      console.log('Enhanced parts integration completed successfully');
    } else {
      console.warn('Enhanced parts integration completed with warnings');
    }
  });
}

// Export the enhanced parts integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PartsIntegration;
}

// Make globally available
window.PartsIntegration = PartsIntegration;