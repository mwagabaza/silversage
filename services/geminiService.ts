
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Region, Product, MarketInsight, BuyingOption, LocalResource, Category } from '../types';
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

// --- EVERGREEN FALLBACK CONTENT & IMAGE MAPPING ---

const UNSPLASH_MAP: Record<string, string[]> = {
  [Category.HOLIDAY]: [
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80', // Gift
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&q=80', // Gift
    'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80', // Cozy
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80'  // Sale/Shopping
  ],
  [Category.MOBILITY]: [
    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80', // Active
    'https://images.unsplash.com/photo-1561525599-7e66cb1292d2?w=800&q=80', // Outdoors
    'https://images.unsplash.com/photo-1552674605-469523f54050?w=800&q=80', // Active shoes
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80'  // Elderly
  ],
  [Category.COGNITION]: [
    'https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=800&q=80', // Reading
    'https://images.unsplash.com/photo-1586282023359-037293b41375?w=800&q=80', // Game/Chess
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80', // Digital
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80'  // Hands
  ],
  [Category.TECH]: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', // Tablet
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // Smart Home
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', // Phone
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80'  // Tech
  ],
  [Category.HOME]: [
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80', // Living Room
    'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?w=800&q=80', // Kitchen
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?w=800&q=80', // Interior
    'https://images.unsplash.com/photo-1583847661884-3883d81a6152?w=800&q=80'  // Cozy Home
  ],
  [Category.WELLNESS]: [
    'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80', // Spa
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', // Tea/Supplements
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&q=80', // Healthy
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'  // Yoga/Stretch
  ],
  [Category.LUXURY]: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Luxury Room
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80', // Chair
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80', // Texture
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80'  // Modern
  ]
};

// Replaces AI generation with curated Unsplash images for a more premium feel
const generateImage = (brand: string, name: string, category: string) => {
  // 1. Try to find exact category match
  let collection = UNSPLASH_MAP[category];
  
  // 2. Fallback to partial match if category is complex string
  if (!collection) {
      const key = Object.keys(UNSPLASH_MAP).find(k => category.includes(k) || k.includes(category));
      collection = key ? UNSPLASH_MAP[key] : UNSPLASH_MAP[Category.HOLIDAY];
  }

  // 3. Pick a random image from the collection
  // Using name.length as a seed to keep it consistent for the same product during session
  const index = (brand.length + name.length) % collection.length; 
  return collection[index];
};

const FALLBACK_DATA: Record<string, Product[]> = {
  [Category.HOLIDAY]: [
    { id: 'f1', name: 'GrandPad Tablet', brand: 'GrandPad', price: '89.00', currency: 'USD', category: Category.TECH, reasoning: 'Specifically designed for seniors with simplified interface and secure connection.', description: 'A purpose-built tablet for seniors to connect with family via video calls and photo sharing.', imageUrl: generateImage('GrandPad', 'Tablet', Category.TECH) },
    { id: 'f2', name: 'Digital Day Clock', brand: 'American Lifetime', price: '45.00', currency: 'USD', category: Category.HOME, reasoning: 'Clearly spells out the day, date, and time without abbreviations.', description: 'High contrast digital clock with extra large display.', imageUrl: generateImage('American Lifetime', 'Digital Clock', Category.HOME) },
    { id: 'f3', name: 'Cozy Chenille Throw', brand: 'Ugg', price: '98.00', currency: 'USD', category: Category.HOME, reasoning: 'Tactile comfort is essential for emotional well-being.', description: 'Luxuriously soft throw blanket perfect for keeping warm.', imageUrl: generateImage('Ugg', 'Chenille Blanket', Category.HOME) },
  ],
  [Category.MOBILITY]: [
    { id: 'f4', name: 'EZ Adjust Bed Rail', brand: 'Stander', price: '119.00', currency: 'USD', category: Category.MOBILITY, reasoning: 'Adjustable length rail that helps with getting in and out of bed safely.', description: 'Sleek metal bed rail that tucks under the mattress.', imageUrl: generateImage('Stander', 'Bed Rail', Category.MOBILITY) },
    { id: 'f5', name: 'Space Saver Walker', brand: 'Able Life', price: '129.00', currency: 'USD', category: Category.MOBILITY, reasoning: 'Folds 4x smaller than average walkers, great for travel.', description: 'Compact folding walker in a modern color.', imageUrl: generateImage('Able Life', 'Walker', Category.MOBILITY) },
    { id: 'f6', name: 'Vive Health Upright Walker', brand: 'Vive', price: '179.00', currency: 'USD', category: Category.MOBILITY, reasoning: 'Encourages better posture and reduces wrist strain.', description: 'Red upright walker with forearm supports.', imageUrl: generateImage('Vive', 'Upright Walker', Category.MOBILITY) },
  ],
  [Category.COGNITION]: [
    { id: 'f7', name: 'Simple Music Player', brand: 'Relish', price: '149.00', currency: 'USD', category: Category.COGNITION, reasoning: 'Designed for dementia patients, highly intuitive "lift to play" mechanism.', description: 'Retro-styled radio with simple controls.', imageUrl: generateImage('Relish', 'Radio', Category.COGNITION) },
    { id: 'f8', name: 'Aquapaint Set', brand: 'Active Minds', price: '19.99', currency: 'USD', category: Category.COGNITION, reasoning: 'Dignified creative activity that uses only water to reveal images.', description: 'Art set with paintbrush and water canvas.', imageUrl: generateImage('Active Minds', 'Paint Set', Category.COGNITION) },
    { id: 'f9', name: 'Reminder Rosie', brand: 'Lifein', price: '120.00', currency: 'USD', category: Category.COGNITION, reasoning: 'Voice-controlled reminder clock to help with medication and appointments.', description: 'Voice activated alarm clock.', imageUrl: generateImage('Lifein', 'Reminder Rosie', Category.COGNITION) },
  ],
  [Category.TECH]: [
    { id: 'f10', name: 'Echo Show 8', brand: 'Amazon', price: '129.99', currency: 'USD', category: Category.TECH, reasoning: 'Drop-in feature allows easy video check-ins from family.', description: 'Smart display with camera and screen.', imageUrl: generateImage('Amazon', 'Echo Show', Category.TECH) },
    { id: 'f11', name: 'ViewClix Smart Frame', brand: 'ViewClix', price: '199.00', currency: 'USD', category: Category.TECH, reasoning: 'Remote managed photo frame that also supports video calls.', description: 'Digital photo frame displaying family photos.', imageUrl: generateImage('ViewClix', 'Smart Frame', Category.TECH) },
    { id: 'f12', name: 'Jitterbug Smart3', brand: 'Lively', price: '149.99', currency: 'USD', category: Category.TECH, reasoning: 'Smartphone with simplified menu and urgent response button.', description: 'Simple smartphone interface.', imageUrl: generateImage('Lively', 'Smartphone', Category.TECH) },
  ],
  [Category.HOME]: [
    { id: 'f13', name: 'Ring Video Doorbell', brand: 'Ring', price: '99.99', currency: 'USD', category: Category.HOME, reasoning: 'Security and convenience, allows answering door without getting up.', description: 'Video doorbell camera.', imageUrl: generateImage('Ring', 'Doorbell', Category.HOME) },
    { id: 'f14', name: 'Motion Sensor Night Lights', brand: 'Eufy', price: '19.99', currency: 'USD', category: Category.HOME, reasoning: 'Essential fall prevention for nighttime bathroom trips.', description: 'Small stick-on night lights.', imageUrl: generateImage('Eufy', 'Night Light', Category.HOME) },
    { id: 'f15', name: 'Lever Door Handles', brand: 'Schlage', price: '35.00', currency: 'USD', category: Category.HOME, reasoning: 'Easier to operate than knobs for arthritic hands.', description: 'Brushed nickel lever door handle.', imageUrl: generateImage('Schlage', 'Door Handle', Category.HOME) },
  ],
  [Category.WELLNESS]: [
    { id: 'f16', name: 'Theragun Mini', brand: 'Therabody', price: '199.00', currency: 'USD', category: Category.WELLNESS, reasoning: 'Portable percussive therapy for muscle relief and circulation.', description: 'Triangular handheld massage device.', imageUrl: generateImage('Therabody', 'Theragun', Category.WELLNESS) },
    { id: 'f17', name: 'Compression Socks', brand: 'Comrad', price: '28.00', currency: 'USD', category: Category.WELLNESS, reasoning: 'Stylish circulation support that doesn\'t look medical.', description: 'Striped compression socks.', imageUrl: generateImage('Comrad', 'Socks', Category.WELLNESS) },
    { id: 'f18', name: 'Happy Light', brand: 'Verilux', price: '59.99', currency: 'USD', category: Category.WELLNESS, reasoning: 'Light therapy to improve mood and regulate sleep cycles.', description: 'White light therapy tablet lamp.', imageUrl: generateImage('Verilux', 'Happy Light', Category.WELLNESS) },
  ],
  [Category.LUXURY]: [
    { id: 'f19', name: 'Eames Lounge Chair', brand: 'Herman Miller', price: '6995.00', currency: 'USD', category: Category.LUXURY, reasoning: 'The ultimate in ergonomic comfort and timeless style.', description: 'Black leather lounge chair with ottoman.', imageUrl: generateImage('Herman Miller', 'Eames Chair', Category.LUXURY) },
    { id: 'f20', name: 'Cashmere Travel Wrap', brand: 'White + Warren', price: '350.00', currency: 'USD', category: Category.LUXURY, reasoning: 'Versatile, lightweight warmth for home or travel.', description: 'Folded cashmere wrap.', imageUrl: generateImage('White + Warren', 'Cashmere', Category.LUXURY) },
    { id: 'f21', name: 'Tempur-Pedic Adjustable Base', brand: 'Tempur-Pedic', price: '1299.00', currency: 'USD', category: Category.LUXURY, reasoning: 'Zero-gravity positioning for perfect rest and circulation.', description: 'Adjustable bed base.', imageUrl: generateImage('Tempur-Pedic', 'Bed Base', Category.LUXURY) },
  ]
};

export const getFallbackProducts = (category: string | 'All'): Product[] => {
  if (category === 'All') return FALLBACK_DATA[Category.HOLIDAY]; // Default to holiday for 'All'
  return FALLBACK_DATA[category] || FALLBACK_DATA[Category.HOLIDAY];
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
        return {
          ...p,
          imageUrl: generateImage(p.brand, p.name, p.category)
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

export const getCareInsights = async (region: Region): Promise<MarketInsight[]> => {
  const cacheKey = generateCacheKey('care_insights', region);
  const cachedData = getFromCache<MarketInsight[]>(cacheKey);
  if (cachedData) return cachedData;

  const prompt = `
    Act as a compassionate lifestyle editor for a senior care magazine in ${region}.
    Generate 3 trending themes or helpful focus areas for families caring for aging adults right now (e.g., Seasonal Safety, Tech for Connection, Cozy Comforts).
    Focus on practical, emotional, or lifestyle improvements rather than business opportunities.
  `;

  const insightSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Seasonal', 'Trending', 'Essential'] },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "description", "type", "tags"]
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
    console.error("Error fetching care insights:", error);
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
