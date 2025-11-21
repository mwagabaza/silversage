
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Region, Category, Product, BuyingOption, LocalResource } from './types';
import { getCuratedProducts, getBuyingOptions, getLocalResources } from './services/geminiService';
import ProductCard from './components/ProductCard';
import MarketIntelligence from './components/MarketIntelligence';
import { Search, Globe, ChevronDown, Sparkles, Menu, X, Gift, ExternalLink, Loader2, Info, ShieldCheck, Timer, HeartHandshake, Building2, Mail, CheckCircle, MapPin, Phone } from 'lucide-react';

function App() {
  // State
  const [region, setRegion] = useState<Region>(Region.US); // Default to US, removed UI selector
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Modals
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // Buying Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyingOptions, setBuyingOptions] = useState<BuyingOption[]>([]);
  const [findingOptions, setFindingOptions] = useState(false);

  // Ref to track the latest search request ID to prevent race conditions
  const searchRequestId = useRef(0);

  // Core Search Logic
  const handleSearch = useCallback(async (queryOverride?: string) => {
    const requestId = ++searchRequestId.current;
    setLoading(true);

    try {
      const categoryFilter = activeCategory !== 'All' ? activeCategory : undefined;
      const term = queryOverride !== undefined ? queryOverride : searchQuery;
      const actualQuery = term || (categoryFilter ? `best ${categoryFilter} products` : "best products for aging parents");
      
      const results = await getCuratedProducts(actualQuery, region, categoryFilter);
      
      if (requestId === searchRequestId.current) {
        setProducts(results);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      if (requestId === searchRequestId.current) {
        setLoading(false);
      }
    }
  }, [activeCategory, region, searchQuery]);

  // Initial Load
  useEffect(() => {
    setActiveCategory(Category.HOLIDAY);
    handleSearch("Black Friday deals for aging parents and seniors");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contextual Refresh
  useEffect(() => {
    if (searchQuery === '') {
         handleSearch();
    } else {
         handleSearch(); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]); // Removed region dependency as it is now static/internal

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

              {/* Community Resources Link */}
              <button 
                onClick={() => setShowResourcesModal(true)}
                className="flex items-center gap-2 text-stone-700 hover:text-sage-800 font-medium text-sm bg-stone-100 hover:bg-sage-50 px-3 py-2 rounded-full transition-colors"
              >
                <HeartHandshake size={16} className="text-sage-600" />
                <span>Community Resources</span>
              </button>
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
                <button 
                    onClick={() => { setShowResourcesModal(true); setShowMobileMenu(false); }}
                    className="flex items-center gap-2 w-full text-left py-2 text-stone-600 font-bold"
                >
                    <HeartHandshake size={16} /> Community Resources
                </button>
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
            The premier marketplace for the longevity economy. Real products, vetted for quality, and tailored to specific needs like <span className="font-semibold text-sage-800">mobility, brain health, and daily living</span>.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search (e.g. 'Bose Hearphones', 'Walker', 'Memory Game')"
              className="w-full pl-6 pr-14 py-4 rounded-full border-2 border-stone-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 outline-none transition-all shadow-sm text-stone-800 placeholder:text-stone-400"
            />
            <button 
              onClick={() => handleSearch()}
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
                 <Building2 size={18} className="text-yellow-400" />
                 Manufacturer?
               </h3>
               <p className="text-sage-200 text-sm mb-4">
                 List your product on SilverSage.store. We charge a standard 15% commission on referred sales.
               </p>
               <button 
                onClick={() => setShowPartnerModal(true)}
                className="w-full py-2 bg-white text-stone-900 font-bold rounded-lg text-sm hover:bg-sage-50 transition-colors"
               >
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

      {/* --- Resources Modal --- */}
      {showResourcesModal && (
        <ResourcesModal onClose={() => setShowResourcesModal(false)} />
      )}

      {/* --- Partner Modal --- */}
      {showPartnerModal && (
        <PartnerModal onClose={() => setShowPartnerModal(false)} />
      )}

      {/* --- Support Modal --- */}
      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
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
              <li><button onClick={() => setShowSupportModal(true)} className="hover:text-white text-left">Contact Support</button></li>
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

// --- Sub-components ---

const ResourcesModal = ({ onClose }: { onClose: () => void }) => {
  const [issue, setIssue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocalResource[]>([]);
  const [searched, setSearched] = useState(false);

  const sensitiveTopics = [
    "Memory Care & Dementia Support",
    "Mobility & Accessibility Assistance",
    "Vision & Eye Health Support",
    "Hearing Loss Resources",
    "Caregiver Burnout & Respite",
    "Nutrition & Meal Delivery",
    "Social Isolation & Companionship"
  ];

  const handleLocalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !zipCode) return;

    setLoading(true);
    try {
      const data = await getLocalResources(issue, zipCode);
      setResults(data);
      setSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-stone-100 flex justify-between items-start bg-white flex-shrink-0">
              <div>
                <h3 className="font-serif font-bold text-2xl text-stone-900 flex items-center gap-2">
                  <HeartHandshake className="text-sage-600" /> Community Connect
                </h3>
                <p className="text-stone-500 text-sm mt-1">Find local support services in your area.</p>
              </div>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                  <X size={24} />
              </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-stone-50">
             <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm mb-8">
                <form onSubmit={handleLocalSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">I am looking for support with...</label>
                      <select 
                        value={issue} 
                        onChange={(e) => setIssue(e.target.value)}
                        required
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors text-sm"
                      >
                        <option value="">Select a Topic</option>
                        {sensitiveTopics.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Near Zip Code</label>
                      <input 
                        type="text" 
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                        pattern="[0-9]*"
                        placeholder="e.g. 90210"
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors text-sm" 
                      />
                   </div>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-stone-900 hover:bg-sage-700 text-white p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                     {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                     Find Local Help
                   </button>
                </form>
             </div>

             {loading && (
               <div className="text-center py-12">
                 <Loader2 className="animate-spin mx-auto text-sage-600 mb-4" size={32} />
                 <p className="text-stone-500">Searching community databases for {zipCode}...</p>
               </div>
             )}

             {!loading && searched && results.length === 0 && (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-300">
                 <p className="text-stone-500">We couldn't find specific results for this exact zip code.</p>
                 <p className="text-sm text-stone-400 mt-1">Try a nearby city name or a broader zip code.</p>
               </div>
             )}

             {!loading && results.length > 0 && (
               <div>
                  <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-sage-600" /> Local Resources Found
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((res, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-stone-200 hover:border-sage-400 hover:shadow-md transition-all">
                         <div className="flex justify-between items-start mb-2">
                           <h5 className="font-bold text-lg text-stone-900">{res.name}</h5>
                           <span className="text-[10px] uppercase font-bold px-2 py-1 bg-stone-100 rounded text-stone-500">{res.type}</span>
                         </div>
                         <p className="text-sm text-stone-600 mb-4 leading-relaxed">{res.description}</p>
                         <div className="flex items-center gap-2 text-sm font-medium text-sage-700 bg-sage-50 p-2 rounded">
                            <Phone size={14} />
                            <span>{res.contactInfo}</span>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* Static National Resources (Fallback) */}
             <div className="mt-12 border-t border-stone-200 pt-8">
                <h4 className="font-bold text-stone-500 text-xs uppercase mb-4 flex items-center gap-2">
                   <Globe size={12} /> National Support Organizations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {[
                       { name: "AARP Caregiving", url: "https://www.aarp.org/caregiving/", desc: "Guides & Tools" },
                       { name: "Alzheimer's Association", url: "https://www.alz.org/", desc: "24/7 Helpline" },
                       { name: "Eldercare Locator (USA)", url: "https://eldercare.acl.gov/", desc: "Gov Services Search" },
                       { name: "Family Caregiver Alliance", url: "https://www.caregiver.org/", desc: "Support Groups" },
                       { name: "Meals on Wheels", url: "https://www.mealsonwheelsamerica.org/", desc: "Nutrition" }
                     ].map((res, i) => (
                       <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded-lg hover:border-stone-300 transition-colors group">
                          <span className="font-medium text-sm text-stone-700 group-hover:text-stone-900">{res.name}</span>
                          <ExternalLink size={12} className="text-stone-300 group-hover:text-stone-500" />
                       </a>
                     ))}
                  </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const PartnerModal = ({ onClose }: { onClose: () => void }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating API call
    setTimeout(() => setSubmitted(true), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
              <Building2 className="text-sage-600" /> Manufacturer Portal
            </h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
            </button>
        </div>
        
        <div className="p-6">
          {submitted ? (
             <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-bold text-stone-900">Request Received</h4>
                <p className="text-stone-600 text-sm">Thank you for your interest. Our partnership team will review your product and get back to you within 48 hours.</p>
                <button onClick={onClose} className="mt-4 bg-stone-900 text-white px-6 py-2 rounded-lg font-medium">Close</button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-stone-600 mb-4">Connect with SilverSage to list your products. We look for high-quality, dignified items for the longevity economy.</p>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Company Name</label>
                <input required type="text" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" placeholder="e.g. Acme Mobility" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Contact Name</label>
                  <input required type="text" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Email</label>
                  <input required type="email" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Website / Product URL</label>
                <input required type="url" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" placeholder="https://" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Message</label>
                <textarea required rows={3} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" placeholder="Tell us about your product..."></textarea>
              </div>
              <button type="submit" className="w-full bg-sage-700 hover:bg-sage-800 text-white py-3 rounded-lg font-bold transition-colors">
                Submit Application
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const SupportModal = ({ onClose }: { onClose: () => void }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setSubmitted(true), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
              <Mail className="text-sage-600" /> Contact Support
            </h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
            </button>
        </div>
        
        <div className="p-6">
          {submitted ? (
             <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-bold text-stone-900">Message Sent</h4>
                <p className="text-stone-600 text-sm">Thanks for reaching out. We'll get back to you shortly.</p>
                <button onClick={onClose} className="mt-4 bg-stone-900 text-white px-6 py-2 rounded-lg font-medium">Close</button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Your Name</label>
                <input required type="text" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Email Address</label>
                <input required type="email" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Topic</label>
                <select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors">
                  <option>General Inquiry</option>
                  <option>Product Suggestion</option>
                  <option>Report an Issue</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">How can we help?</label>
                <textarea required rows={4} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-sage-500 outline-none transition-colors" placeholder="Details..."></textarea>
              </div>
              <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-lg font-bold transition-colors">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
