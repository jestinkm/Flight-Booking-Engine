import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Calendar, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const DEFAULT_OFFERS = [
  {
    id: 'off-1',
    code: 'SKYNEXA25',
    title: 'Global Autumn Getaway',
    discount: '25% OFF',
    discountPercent: 25,
    description: 'Get an exclusive 25% discount across all long-haul and transatlantic flight routes.',
    validUntil: '2026-12-31',
    routes: 'All International Flights',
    minSpend: '$200'
  },
  {
    id: 'off-2',
    code: 'FLY10',
    title: 'Domestic Express Saver',
    discount: '10% OFF',
    discountPercent: 10,
    description: 'Instant 10% reduction on non-stop domestic routes with zero seat selection charges.',
    validUntil: '2026-11-30',
    routes: 'Domestic Routes',
    minSpend: '$50'
  },
  {
    id: 'off-3',
    code: 'FAMILY50',
    title: 'Family & Group Travel Special',
    discount: '$50 OFF',
    discountPercent: 15,
    description: 'Save $50 instantly when booking travel for 3 or more passengers on any scheduled flight.',
    validUntil: '2027-01-15',
    routes: 'Group bookings (3+ travelers)',
    minSpend: '$400'
  },
  {
    id: 'off-4',
    code: 'EARLYBIRD',
    title: 'Early Bird Horizon',
    discount: '20% OFF',
    discountPercent: 20,
    description: 'Plan at least 30 days ahead and save 20% on any business or economy class seat.',
    validUntil: '2026-12-15',
    routes: 'Bookings made 30+ days ahead',
    minSpend: '$150'
  }
];

const Offers = () => {
  const [offers, setOffers] = useState(DEFAULT_OFFERS);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get('/offers');
        const list = res.data?.offers || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (list && list.length > 0) {
          setOffers(list);
        }
      } catch {
        // Fallback to default offers
      }
    };
    fetchOffers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Promo code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-skyblue-light text-skyblue text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Special Promotions
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy">
            Exclusive Deals & Flight Offers
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Unlock premium travel savings. Apply these verified promo codes during checkout to enjoy discounted fares.
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id || offer.code}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 hover:border-skyblue/50 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-navy text-skyblue text-xs font-black uppercase tracking-wider">
                    {offer.discount || `${offer.discountPercent}% OFF`}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-skyblue" />
                    <span>Valid until {offer.validUntil || 'Dec 2026'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-navy">{offer.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applicable on:</span>
                    <span className="font-semibold text-navy">{offer.routes || 'All Routes'}</span>
                  </div>
                  {offer.minSpend && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Minimum spend:</span>
                      <span className="font-semibold text-navy">{offer.minSpend}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Box & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 bg-slate-100 rounded-xl font-mono text-xs font-bold text-navy border border-slate-200">
                  <span>{offer.code}</span>
                  <button
                    onClick={() => handleCopy(offer.code)}
                    className="p-1 text-slate-500 hover:text-navy transition"
                    title="Copy code"
                  >
                    {copiedCode === offer.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <Link
                  to="/search"
                  className="w-full sm:w-auto px-5 py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Book with Offer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Offers;
