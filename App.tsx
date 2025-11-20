
import React, { useState, useEffect, useCallback } from 'react';
import { Region, Category, Product, BuyingOption } from './types';
import { getCuratedProducts, getBuyingOptions } from './services/geminiService';
import ProductCard from './components/ProductCard';
import MarketIntelligence from './components/MarketIntelligence';
import { Search, Globe, ChevronDown, Sparkles, Menu, X, Gift, ExternalLink, Loader2, Info, ShieldCheck, Timer } from 'lucide-react';

function App() {
  // State
  const [region, setRegion] = useState<Region>(Region.US);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Buying Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyingOptions, setBuyingOptions] = useState<BuyingOption[]>([]);
  const [findingOptions, setFindingOptions] = useState(false);

  // Initial Load - Prioritize Holiday/Thanksgiving
  useEffect(() => {
    setActiveCategory(Category.HOLIDAY);
    // Updated to target Black Friday specifically
    handleSearch("Black Friday deals for aging parents and seniors");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const categoryFilter = activeCategory !== 'All' ? activeCategory : undefined;
      // If query is empty, provide a default broad query based on category
      const actualQuery = query || (categoryFilter ? `best ${categoryFilter} products` : "best products for aging parents");
      
      const results = await getCuratedProducts(actualQuery, region, categoryFilter);
      setProducts(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, region]);

  const handleFindPrice = async (product: Product) => {
      setSelectedProduct(product);
      setFindingOptions(true);
      setBuyingOptions([]);
      
      try {
          const options = await getBuyingOptions(`${product.brand} ${product.name}`, region);
          setBuyingOptions(options);
      } catch (e) {
          console.error(e);
      } finally {
          setFindingOptions(false);
      }
  };

  // Trigger search when filters change (debounced effect logic handled manually above for simplicity)
  useEffect(() => {
    if (products.length > 0 && searchQuery === '') {
        // Contextual refresh based on category change if no manual search
        const query = activeCategory === Category.HOLIDAY ? "Black Friday gifts for grandparents" : "";
        handleSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, activeCategory]);


  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-sage-200">
      
      {/* --- Header --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => {setActiveCategory('All'); setSearchQuery(''); handleSearch('trending');}}>
              <div className="w-8 h-8 bg-sage-700 rounded-full flex items-center justify-center text-white shadow-md">
                <span className="font-serif font-bold text-lg">S</span>
              </div>
              <span className="font-serif text-2xl font-bold text-stone-800 tracking-tight">SilverSage</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex gap-5 text-sm font-medium text-stone-600">
                <button 
                    onClick={() => setActiveCategory(Category.HOLIDAY)}
                    className={`flex items-center gap-1 transition-colors ${activeCategory === Category.HOLIDAY ? 'text-red-700 font-bold' : 'text-red-600 hover:text-red-800'}`}
                >
                    <Gift size={14} /> Gift Guide
                </button>
                {Object.values(Category).slice(1, 5).map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`hover:text-sage-700 transition-colors ${activeCategory === cat ? 'text-sage-800 font-bold' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
              
              <div className="h-6 w-px bg-stone-300 mx-2"></div>

              {/* Region Selector */}
              <div className="relative group">
                <button className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium text-sm">
                  <Globe size={18} />
                  <span>{region}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden hidden group-hover:block p-1 z-50">
                  {Object.values(Region).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-sage-50 ${region === r ? 'bg-sage-50 text-sage-800 font-semibold' : 'text-stone-600'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-stone-600">
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-4 absolute w-full z-50 shadow-xl">
             <div className="space-y-2">
                {Object.values(Category).map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setShowMobileMenu(false); }}
                    className={`block w-full text-left py-2 text-stone-600 ${activeCategory === cat ? 'font-bold text-sage-700' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- Hero Section --- */}
        <section className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border border-red-100 animate-pulse">
             <Timer size={12} />
             Black Friday Pre-Sales are Live
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6 leading-tight">
            Curating dignity and delight for the people you love.
          </h1>
          <p className="text-lg text-stone-600 mb-8 leading-relaxed">
            The premier marketplace for the longevity economy. Real products, vetted for quality, tailored for <span className="font-semibold text-sage-800">{region}</span>.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              placeholder="Search (e.g. 'Bose Hearphones', 'Walker', 'Memory Game')"
              className="w-full pl-6 pr-14 py-4 rounded-full border-2 border-stone-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 outline-none transition-all shadow-sm text-stone-800 placeholder:text-stone-400"
            />
            <button 
              onClick={() => handleSearch(searchQuery)}
              className="absolute right-2 top-2 p-2 bg-stone-900 text-white rounded-full hover:bg-sage-700 transition-colors"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={20} />}
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- Sidebar / Business Insights --- */}
          <aside className="lg:col-span-4 space-y-8 order-2 lg:order-1">
             {/* Category Cloud */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
               <h3 className="font-serif font-bold text-stone-900 mb-4">Curated Collections</h3>
               <div className="flex flex-wrap gap-2">
                 {Object.values(Category).map(cat => (
                   <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors border ${
                      activeCategory === cat 
                      ? 'bg-sage-100 border-sage-200 text-sage-900 font-medium' 
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            <MarketIntelligence region={region} />

            <div className="bg-gradient-to-br from-sage-800 to-stone-900 text-sage-100 p-6 rounded-2xl shadow-lg relative overflow-hidden border border-sage-700">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
               <h3 className="font-serif font-bold text-xl mb-2 flex items-center gap-2">
                 <Sparkles size={18} className="text-yellow-400" />
                 Manufacturer?
               </h3>
               <p className="text-sage-200 text-sm mb-4">
                 List your product on SilverSage.store. We charge a standard 15% commission on referred sales.
               </p>
               <button className="w-full py-2 bg-white text-stone-900 font-bold rounded-lg text-sm hover:bg-sage-50 transition-colors">
                 Partner Portal
               </button>
            </div>
          </aside>

          {/* --- Product Grid --- */}
          <section className="lg:col-span-8 order-1 lg:order-2">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                {activeCategory === 'All' ? 'Curated Recommendations' : activeCategory}
              </h2>
            </div>

            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-stone-100">
                      <div className="h-56 bg-stone-100 w-full"></div>
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-stone-100 w-3/4 rounded"></div>
                        <div className="h-4 bg-stone-100 w-1/2 rounded"></div>
                        <div className="h-16 bg-stone-100 w-full rounded"></div>
                      </div>
                   </div>
                 ))}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.length > 0 ? (
                  products.map((product, idx) => (
                    <ProductCard 
                        key={product.id || idx} 
                        product={product} 
                        onFindPrice={handleFindPrice}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-stone-100 border-dashed">
                    <p className="text-stone-400">No products found. Try a different search.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* --- Buying Options Modal --- */}
      {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-stone-100 flex justify-between items-start">
                      <div>
                          <h3 className="font-serif font-bold text-xl text-stone-900">Buying Options</h3>
                          <p className="text-stone-500 text-sm">{selectedProduct.name}</p>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="text-stone-400 hover:text-stone-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-6 bg-stone-50 min-h-[200px]">
                      {findingOptions ? (
                          <div className="flex flex-col items-center justify-center py-8 text-stone-500 gap-3">
                              <Loader2 className="animate-spin text-sage-600" size={32} />
                              <p className="text-sm font-medium">Scanning retailers in {region}...</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {buyingOptions.length > 0 ? (
                                  buyingOptions.map((opt, idx) => (
                                      <a 
                                        key={idx} 
                                        href={opt.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-sage-400 hover:shadow-md transition-all group"
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-bold text-xs uppercase">
                                                  {opt.source.substring(0, 2)}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-stone-900 group-hover:text-sage-800">{opt.source}</p>
                                                  <p className="text-xs text-stone-500 truncate max-w-[200px]">{opt.title}</p>
                                              </div>
                                          </div>
                                          <ExternalLink size={16} className="text-stone-400 group-hover:text-sage-600" />
                                      </a>
                                  ))
                              ) : (
                                  <div className="text-center py-8 text-stone-500">
                                      <p>No specific online retailers found via quick search.</p>
                                      <a href={`https://www.google.com/search?q=${encodeURIComponent(selectedProduct.brand + ' ' + selectedProduct.name)}`} target="_blank" rel="noreferrer" className="text-sage-700 underline mt-2 block">
                                          Search Google manually
                                      </a>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-stone-100 text-xs text-stone-500 text-center">
                      * SilverSage.store may earn a commission from these links. Prices are estimates.
                  </div>
              </div>
          </div>
      )}

      {/* --- About/Mission Modal --- */}
      {showAboutModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowAboutModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="font-serif font-bold text-2xl text-stone-900">Our Mission</h3>
                     <button onClick={() => setShowAboutModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={24} />
                     </button>
                  </div>
                  
                  <div className="prose prose-stone text-stone-600 text-sm leading-relaxed space-y-4 mb-8">
                    <p>
                      <strong>SilverSage.store</strong> is a curated shopping guide focused on products that improve the quality of life for aging adults. Our content is designed for Gen-X and Millennial caregivers looking for high-quality, well-researched recommendations for mobility devices, hearing support, vision care, supplements, home safety products, and cognitive wellness tools.
                    </p>
                    <p>
                      We publish product reviews, buying guides, comparison content, and educational articles to help families choose trusted brands. Our content is original, human-reviewed, and regularly updated to reflect the best available products across major global markets (US/North America, Europe, Korea, Japan, Australia).
                    </p>
                  </div>

                  <div className="bg-sage-50 p-4 rounded-xl border border-sage-100 mb-4">
                    <h4 className="font-bold text-sage-800 text-sm flex items-center gap-2 mb-2">
                      <ShieldCheck size={16} /> Privacy & Integrity
                    </h4>
                    <p className="text-xs text-sage-700">
                      We value your privacy. We use cookies to improve the browsing experience and affiliate links to support our curation. We do not sell your personal health data.
                    </p>
                  </div>
               </div>
            </div>
         </div>
      )}

      <footer className="bg-stone-900 text-stone-400 py-12 mt-20 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-stone-100">
              <div className="w-6 h-6 bg-stone-700 rounded-full flex items-center justify-center text-xs">S</div>
              <span className="font-serif font-bold text-xl">SilverSage</span>
            </div>
            <p className="text-sm max-w-md leading-relaxed mb-4">
              Redefining the aesthetic of aging. We believe functional tools should also be beautiful objects that respect the dignity of their users.
            </p>
            <div className="text-xs text-stone-600 border-t border-stone-800 pt-4">
                <strong>Affiliate Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. SilverSage.store participates in various affiliate marketing programs, which means we may get paid commissions on editorially chosen products purchased through our links to retailer sites.
            </div>
          </div>
          <div>
            <h4 className="font-bold text-stone-100 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setActiveCategory(Category.HOLIDAY)} className="hover:text-white">Holiday Gift Guide</button></li>
              <li><button onClick={() => {setActiveCategory('All'); handleSearch('trending')}} className="hover:text-white">Best Sellers</button></li>
              <li><button onClick={() => setActiveCategory(Category.LUXURY)} className="hover:text-white">Luxury Care</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-stone-100 mb-4">About</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setShowAboutModal(true)} className="hover:text-white text-left">Our Mission</button></li>
              <li><button onClick={() => setShowAboutModal(true)} className="hover:text-white text-left">Privacy Policy</button></li>
              <li><a href="mailto:hello@silversage.store" className="hover:text-white">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-stone-800 text-xs text-center flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} SilverSage.store</span>
          <span>Launched for the {new Date().getFullYear()} Holiday Season.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
