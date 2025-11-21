
import React, { useEffect, useState } from 'react';
import { MarketInsight, Region } from '../types';
import { getCareInsights } from '../services/geminiService';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  region: Region;
}

const MarketIntelligence: React.FC<Props> = ({ region }) => {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCareInsights(region);
      setInsights(data);
    } catch (err) {
      setError("Failed to load insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  if (loading && insights.length === 0) {
    return (
      <div className="p-8 bg-stone-900 text-white rounded-2xl animate-pulse">
        <div className="h-8 bg-stone-700 rounded w-2/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-24 bg-stone-800 rounded-xl"></div>
          <div className="h-24 bg-stone-800 rounded-xl"></div>
          <div className="h-24 bg-stone-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 md:p-8 shadow-xl border border-stone-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif text-white flex items-center gap-3">
            <Sparkles className="text-yellow-400" size={24} />
            Caregiver Pulse
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            Trending topics and seasonal care tips.
          </p>
        </div>
        <button 
          onClick={fetchInsights} 
          disabled={loading}
          className="p-2 hover:bg-stone-800 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-stone-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight, idx) => (
          <div key={idx} className="bg-stone-800/50 p-5 rounded-xl border border-stone-700/50 hover:border-sage-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-sage-100 group-hover:text-white transition-colors">{insight.title}</h3>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold ${
                insight.type === 'Essential' ? 'bg-red-900/40 text-red-200' :
                insight.type === 'Seasonal' ? 'bg-green-900/40 text-green-200' :
                'bg-blue-900/40 text-blue-200'
              }`}>
                {insight.type}
              </span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed mb-3">
              {insight.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag, tIdx) => (
                <span key={tIdx} className="text-xs text-stone-500 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketIntelligence;
