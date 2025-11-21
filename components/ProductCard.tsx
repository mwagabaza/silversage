
import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Heart, Tag, Gift, Armchair, Brain, Smartphone, Home, HeartPulse, Star, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onFindPrice: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onFindPrice }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getCurrencySymbol = (currency: string) => {
    switch(currency) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'JPY': return '¥';
        case 'KRW': return '₩';
        default: return currency + ' ';
    }
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('holiday') || c.includes('gift')) return Gift;
    if (c.includes('mobility') || c.includes('access')) return Armchair;
    if (c.includes('brain') || c.includes('memory') || c.includes('cognition')) return Brain;
    if (c.includes('tech')) return Smartphone;
    if (c.includes('home') || c.includes('living')) return Home;
    if (c.includes('wellness') || c.includes('supplements')) return HeartPulse;
    if (c.includes('luxury')) return Star;
    return Package;
  };

  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 flex flex-col h-full">
      <div className="relative h-64 overflow-hidden bg-stone-100">
        {/* Placeholder Icon while loading */}
        <div className={`absolute inset-0 flex items-center justify-center text-stone-300 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
             <CategoryIcon size={48} strokeWidth={1.5} />
        </div>

        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`w-full h-full object-cover object-center transition-all duration-700 ${imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
             <span className="bg-stone-900/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                <Tag size={10} /> {product.brand}
             </span>
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-stone-400 hover:text-red-500 transition-colors">
          <Heart size={18} />
        </button>
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-sage-800 uppercase tracking-wider">
          {product.category}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">{product.name}</h3>
        </div>
        <p className="text-sm text-sage-700 font-medium mb-3">
           {getCurrencySymbol(product.currency)}{product.price}
        </p>
        
        <p className="text-sm text-stone-600 mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        <div className="mb-4 bg-sage-50 p-3 rounded-lg border border-sage-100">
          <p className="text-xs font-medium text-sage-800 uppercase mb-1">Curator's Note</p>
          <p className="text-xs text-sage-700 italic">"{product.reasoning}"</p>
        </div>

        <button 
            onClick={() => onFindPrice(product)}
            className="w-full mt-auto bg-stone-900 hover:bg-stone-800 text-white py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow group-hover:translate-y-[-2px]"
        >
          Find Best Price <Search size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
