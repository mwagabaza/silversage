
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Region, Product, MarketInsight, BuyingOption, LocalResource } from '../types';
import { monetizeUrl, isPreferredPartner } from './affiliateConfig';

// Helper to get API key from either Vite env (Netlify) or standard env
const getApiKey = () => {
  // @ts-ignore - import.meta is a Vite feature
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return process.env.API_KEY;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- CACHING SYSTEM ---
const CACHE_TTL = 1000 * 60 * 60; // 1 Hour Cache
const generateCacheKey = (type: string, ...args: (string | undefined)[]) => {
  return `silversage_v1_${type}_${args.map(a => a?.trim().toLowerCase() || 'nil').join('_')}`;
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    
    const { timestamp, data } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch (e) {
    console.warn('Cache retrieval failed', e);
    return null;
  }
};

const setCache = (key: string, data: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    console.warn('Cache storage failed (quota exceeded?)', e);
  }
};
// ----------------------

// Helper to extract JSON array from text that might contain markdown or other text
const cleanJsonOutput = (text: string): string => {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
    }
    return cleaned;
  } catch (e) {
    return text;
  }
};

export const getCuratedProducts = async (
  query: string,
  region: Region,
  category?: string
): Promise<Product[]> => {
  
  const cacheKey = generateCacheKey('products', query, region, category);
  const cachedData = getFromCache<Product[]>(cacheKey);
  if (cachedData) {
    console.log("🚀 Serving products from cache");
    return cachedData;
  }

  // NOTE: We use Google Search Grounding.
  // RULE: When using tools: [{ googleSearch: {} }], we CANNOT use responseSchema or responseMimeType.
  const prompt = `
    You are a high-end curator for "SilverSage".
    The user is looking for: "${query}" ${category ? `in the category of ${category}` : ''}.
    
    Step 1: Use Google Search to find 6 SPECIFIC, REAL, HIGH-RATED products available right now in ${region}.
    Step 2: Return the results strictly as a JSON Array.
    
    Constraints:
    - Do NOT invent names. Use real brands (e.g., Stander, Able Life, Bose, Lively, etc.).
    - Prices must be current estimates in ${region}.
    - Focus on "Aging in Place" with dignity. No "medical" looking beige equipment unless necessary.
    - If Holiday/Black Friday: Focus on deals or giftable packaging.

    Output Requirements:
    - Return ONLY valid JSON. No markdown code blocks, no introduction text.
    - The JSON must be an array of objects with these exact keys:
      "id", "name", "brand", "description", "price", "currency", "category", "reasoning"

    Example Object Structure:
    {
      "id": "1",
      "name": "Product Name",
      "brand": "Brand",
      "description": "Visual description for image generation",
      "price": "100.00",
      "currency": "USD",
      "category": "Category",
      "reasoning": "Why this is a good choice"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    if (response.text) {
      const cleaned = cleanJsonOutput(response.text);
      const parsed = JSON.parse(cleaned);
      
      const enrichedProducts = parsed.map((p: Product) => {
        const imagePrompt = `professional product photography of ${p.brand} ${p.name}, ${p.category}, white background, studio lighting, high quality, minimal, commercial catalogue style`;
        const encodedPrompt = encodeURIComponent(imagePrompt);
        
        return {
          ...p,
          imageUrl: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random() * 9999)}`
        };
      });

      setCache(cacheKey, enrichedProducts);
      return enrichedProducts;
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getBuyingOptions = async (productName: string, region: Region): Promise<BuyingOption[]> => {
  const cacheKey = generateCacheKey('buying_options', productName, region);
  const cachedData = getFromCache<BuyingOption[]>(cacheKey);
  if (cachedData) return cachedData;

  const prompt = `Find purchase pages for "${productName}" in ${region}. Prioritize major retailers like Amazon, Walmart, or direct manufacturer sites.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const options: BuyingOption[] = [];

    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web?.uri && chunk.web?.title) {
          const rawUrl = chunk.web.uri;
          const monetized = monetizeUrl(rawUrl);
          
          options.push({
            title: chunk.web.title,
            url: monetized,
            source: new URL(rawUrl).hostname.replace('www.', '')
          });
        }
      });
    }

    const sortedOptions = options.sort((a, b) => {
      const aPref = isPreferredPartner(a.url);
      const bPref = isPreferredPartner(b.url);
      return (aPref === bPref) ? 0 : aPref ? -1 : 1;
    }).slice(0, 4);

    setCache(cacheKey, sortedOptions);
    return sortedOptions;
    
  } catch (error) {
    console.error("Error searching for buy links:", error);
    return [];
  }
};

export const getBusinessInsights = async (region: Region): Promise<MarketInsight[]> => {
  const cacheKey = generateCacheKey('insights', region);
  const cachedData = getFromCache<MarketInsight[]>(cacheKey);
  if (cachedData) return cachedData;

  const prompt = `
    Act as a strategy consultant for the "Longevity Economy" in ${region}.
    Generate 3 specific, lucrative product niches for aging adults that are trending RIGHT NOW for the upcoming Holiday Season.
  `;

  const insightSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        opportunityLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Niche'] },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "description", "opportunityLevel", "tags"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: insightSchema,
      }
    });

    if (response.text) {
      const data = JSON.parse(cleanJsonOutput(response.text));
      setCache(cacheKey, data);
      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching insights:", error);
    return [];
  }
};

export const getLocalResources = async (issue: string, zipCode: string): Promise<LocalResource[]> => {
    // Cache key includes issue and zip to prevent mixing locations
    const cacheKey = generateCacheKey('local_resources', issue, zipCode);
    const cachedData = getFromCache<LocalResource[]>(cacheKey);
    if (cachedData) return cachedData;

    const prompt = `
        Act as a social worker helping a family.
        Find 4 specific local resources, non-profits, government agencies, or support groups for "${issue}" serving the zip code area: ${zipCode} (and surrounding county).
        
        Prioritize:
        1. Government Area Agencies on Aging.
        2. Non-profit specialized associations (e.g., local Alzheimer's chapter).
        3. Free or subsidized community transport/meals.

        Return the results as a strict JSON Array.
        Do NOT include markdown.
        
        Schema:
        [
            {
                "name": "Name of Organization",
                "description": "Brief description of services offered",
                "contactInfo": "Phone number or website URL",
                "type": "Government" | "Non-Profit" | "Support Group"
            }
        ]
    `;

    try {
        // Using 2.5 Flash with Search to find real local phone numbers/sites
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        if (response.text) {
            const cleaned = cleanJsonOutput(response.text);
            const parsed = JSON.parse(cleaned);
            setCache(cacheKey, parsed);
            return parsed;
        }
        return [];
    } catch (error) {
        console.error("Error fetching local resources:", error);
        return [];
    }
};
