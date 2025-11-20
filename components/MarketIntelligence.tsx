import React, { useEffect, useState } from 'react';
import { MarketInsight, Region } from '../types';
import { getBusinessInsights } from '../services/geminiService';
import { TrendingUp, Lightbulb, Target, RefreshCw } from 'lucide-react';

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
      const data = await getBusinessInsights(region);
      setInsights(data);
    } catch (err) {
      setError("Failed to load market intelligence.");
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
        <div className="h-8 bg-stone-700 rounded w-1/3 mb-6"></div>
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
            <TrendingUp className="text-sage-400" />
            Market Intelligence: {region}
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            AI-generated opportunities for the longevity economy.
          </p>
        </div>
        <button 
          onClick={fetchInsights} 
          disabled={loading}
          className="p-2 hover:bg-stone-800 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight, idx) => (
          <div key={idx} className="bg-stone-800/50 p-5 rounded-xl border border-stone-700/50 hover:border-sage-500/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-sage-100">{insight.title}</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                insight.opportunityLevel === 'High' ? 'bg-green-900/40 text-green-300' :
                insight.opportunityLevel === 'Medium' ? 'bg-yellow-900/40 text-yellow-300' :
                'bg-blue-900/40 text-blue-300'
              }`}>
                {insight.opportunityLevel} Priority
              </span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed mb-3">
              {insight.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag, tIdx) => (
                <span key={tIdx} className="text-xs text-stone-500 bg-stone-900 px-2 py-1 rounded">
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