
// services/affiliateConfig.ts

/**
 * YOUR AFFILIATE IDS
 * ------------------
 * Step 1: Sign up for these programs.
 * Step 2: Replace the placeholder strings below with your actual IDs.
 */
export const AFFILIATE_IDS = {
    // Amazon Associates (https://affiliate-program.amazon.com/)
    // This is the most critical one for a general product site.
    amazon: 'silversage-20', 
  
    // Walmart Affiliate Program (via Impact Radius)
    walmart: '1234567',
  
    // Target Partners
    target: 'example_id',
  };
  
  /**
   * Takes a raw URL and appends your affiliate tags if the domain matches.
   */
  export const monetizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
  
      // 1. Amazon Logic
      if (domain.includes('amazon')) {
        // Amazon uses the 'tag' query parameter
        urlObj.searchParams.set('tag', AFFILIATE_IDS.amazon);
        return urlObj.toString();
      }
  
      // 2. Walmart Logic
      if (domain.includes('walmart')) {
        // Walmart usually requires a specific structure or distinct tracker via Impact Radius.
        // This is a simplified example. usually you redirect via an impact.com link.
        // For now, we will just append a source param as a placeholder.
        urlObj.searchParams.set('sourceid', AFFILIATE_IDS.walmart);
        return urlObj.toString();
      }
  
      // 3. Skimlinks / Generic Fallback
      // If you use a service like Skimlinks, you don't need manual logic here; 
      // you just add their JavaScript snippet to index.html.
      
      return url;
    } catch (e) {
      // If URL parsing fails, return original
      return url;
    }
  };
  
  /**
   * Helper to determine if a source is a "Preferred Partner"
   * This allows you to highlight buttons in the UI for partners you earn more from.
   */
  export const isPreferredPartner = (url: string): boolean => {
    return url.includes('amazon') || url.includes('walmart');
  };