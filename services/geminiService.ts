
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Region, Product, MarketInsight, BuyingOption } from '../types';
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

// Helper to strip markdown code blocks if present
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned;
};

export const getCuratedProducts = async (
  query: string,
  region: Region,
  category?: string
): Promise<Product[]> => {
  
  const isHolidayContext = category?.includes('Holiday') || query.toLowerCase().includes('black friday') || query.toLowerCase().includes('gift');

  const prompt = `
    You are a high-end curator for "SilverSage".
    The user is looking for: "${query}" ${category ? `in the category of ${category}` : ''}.
    
    CRITICAL INSTRUCTION: You must list REAL, EXISTING products from established brands available in ${region}. 
    Do not invent fictional product names (e.g., do not make up "SilverWalk 3000"). 
    Use brands like Stander, Able Life, Bose, GrandPad, Levedao, Honda, etc., depending on the region.

    Find 6 distinct, high-quality products.
    Focus on:
    1. Design aesthetics (must not look medical).
    2. Premium quality and durability.
    ${isHolidayContext ? `3. "Gift-ability" and Holiday Appeal. Look for items that are popular specifically for Black Friday or make excellent gifts for aging parents.` : ''}

    Price: Estimate real market price in ${region} currency.
  `;

  const productSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING, description: "Specific model name" },
        brand: { type: Type.STRING, description: "Real brand name" },
        description: { type: Type.STRING },
        price: { type: Type.STRING },
        currency: { type: Type.STRING },
        category: { type: Type.STRING },
        reasoning: { type: Type.STRING, description: isHolidayContext ? "Why this makes a great gift or deal." : "Why this fits the SilverSage aesthetic." },
      },
      required: ["id", "name", "brand", "description", "price", "currency", "category", "reasoning"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: productSchema,
        temperature: 0.3, // Lower temperature for more factual accuracy
      }
    });

    if (response.text) {
      const parsed = JSON.parse(cleanJsonOutput(response.text));
      return parsed.map((p: Product, index: number) => ({
        ...p,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/400` // Better seed based on name
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getBuyingOptions = async (productName: string, region: Region): Promise<BuyingOption[]> => {
  // We explicitly ask for Amazon or major retailer links to maximize affiliate potential
  const prompt = `Find purchase pages for "${productName}" in ${region}. Prioritize major retailers like Amazon, Walmart, or direct manufacturer sites.`;
  
  try {
    // Using Google Search Grounding to get real links
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
          // HERE IS THE MAGIC: We convert the raw Google link into a Money Link
          const monetized = monetizeUrl(rawUrl);
          
          options.push({
            title: chunk.web.title,
            url: monetized,
            source: new URL(rawUrl).hostname.replace('www.', '')
          });
        }
      });
    }

    // Sort options to put preferred partners (Amazon/Walmart) at the top
    return options.sort((a, b) => {
      const aPref = isPreferredPartner(a.url);
      const bPref = isPreferredPartner(b.url);
      return (aPref === bPref) ? 0 : aPref ? -1 : 1;
    }).slice(0, 4);
    
  } catch (error) {
    console.error("Error searching for buy links:", error);
    return [];
  }
};

export const getBusinessInsights = async (region: Region): Promise<MarketInsight[]> => {
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
      model: 'gemini-2.5-flash', // Switched to Flash for speed
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: insightSchema,
      }
    });

    if (response.text) {
      return JSON.parse(cleanJsonOutput(response.text));
    }
    return [];
  } catch (error) {
    console.error("Error fetching insights:", error);
    return [];
  }
};
