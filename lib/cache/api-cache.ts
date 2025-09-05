import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Cache for query analysis results
const analysisCache = new LRUCache<string, any>({
  max: 500, // Maximum 500 items
  // No TTL - cache indefinitely (demo server)
});

// Cache for generated responses
const responseCache = new LRUCache<string, string>({
  max: 100, // Maximum 100 responses
  // No TTL - cache indefinitely (demo server)
});

// Cache statistics
let cacheStats = {
  analysisHits: 0,
  analysisMisses: 0,
  responseHits: 0,
  responseMisses: 0,
};

/**
 * Generate cache key from parameters
 */
function generateCacheKey(...params: string[]): string {
  const combined = params.join('|');
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Get cached analysis result
 */
export function getCachedAnalysis(query: string): any | null {
  const key = generateCacheKey(query.toLowerCase().trim());
  const cached = analysisCache.get(key);
  
  if (cached) {
    cacheStats.analysisHits++;
    console.log(`Cache HIT for analysis: ${query.substring(0, 50)}...`);
    return cached;
  }
  
  cacheStats.analysisMisses++;
  return null;
}

/**
 * Set analysis result in cache
 */
export function setCachedAnalysis(query: string, result: any): void {
  const key = generateCacheKey(query.toLowerCase().trim());
  analysisCache.set(key, result);
  console.log(`Cached analysis for: ${query.substring(0, 50)}...`);
}

/**
 * Get cached response
 */
export function getCachedResponse(
  query: string, 
  context: string, 
  language: string
): string | null {
  // Use first 500 chars of context to avoid huge keys
  const contextHash = generateCacheKey(context.substring(0, 500));
  const key = generateCacheKey(query.toLowerCase().trim(), contextHash, language);
  const cached = responseCache.get(key);
  
  if (cached) {
    cacheStats.responseHits++;
    console.log(`Cache HIT for response: ${query.substring(0, 50)}...`);
    return cached;
  }
  
  cacheStats.responseMisses++;
  return null;
}

/**
 * Set response in cache
 */
export function setCachedResponse(
  query: string,
  context: string,
  language: string,
  response: string
): void {
  const contextHash = generateCacheKey(context.substring(0, 500));
  const key = generateCacheKey(query.toLowerCase().trim(), contextHash, language);
  responseCache.set(key, response);
  console.log(`Cached response for: ${query.substring(0, 50)}...`);
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  analysisCache.clear();
  responseCache.clear();
  console.log('All caches cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const analysisHitRate = cacheStats.analysisHits / 
    (cacheStats.analysisHits + cacheStats.analysisMisses) || 0;
  const responseHitRate = cacheStats.responseHits / 
    (cacheStats.responseHits + cacheStats.responseMisses) || 0;
  
  return {
    ...cacheStats,
    analysisHitRate: (analysisHitRate * 100).toFixed(1) + '%',
    responseHitRate: (responseHitRate * 100).toFixed(1) + '%',
    analysisCacheSize: analysisCache.size,
    responseCacheSize: responseCache.size,
  };
}

/**
 * Log cache statistics
 */
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('=== Cache Statistics ===');
  console.log(`Analysis Cache: ${stats.analysisCacheSize} items, Hit Rate: ${stats.analysisHitRate}`);
  console.log(`Response Cache: ${stats.responseCacheSize} items, Hit Rate: ${stats.responseHitRate}`);
  console.log(`Total Hits: ${stats.analysisHits + stats.responseHits}`);
  console.log(`Total Misses: ${stats.analysisMisses + stats.responseMisses}`);
}