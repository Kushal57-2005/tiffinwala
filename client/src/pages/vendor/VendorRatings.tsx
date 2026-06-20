/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';
import { DashboardHeader } from '../../components/DashboardHeader';

interface IRating {
  _id: string;
  customerId: string;
  vendorId: string;
  name: string;
  stars: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export const VendorRatings: React.FC = () => {
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [ratings, setRatings] = useState<IRating[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track cursor movement for parallax floating elements
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get vendor profile to find vendorId
      const profileRes = await api.get('/vendor/profile');
      if (!profileRes.data?.success || !profileRes.data?.data) {
        throw new Error('Failed to load vendor profile.');
      }
      const vendorId = profileRes.data.data._id;

      // 2. Fetch ratings using vendorId
      const ratingsRes = await api.get(`/ratings/vendor/${vendorId}`);
      if (ratingsRes.data?.success && ratingsRes.data?.data) {
        const result = ratingsRes.data.data.result?.[0];
        if (result) {
          setAvgRating(Number(result.avgStar) || 0);
          setTotalRatings(Number(result.totalRatings) || 0);
          setRatings(result.ratings || []);
        } else {
          setAvgRating(0);
          setTotalRatings(0);
          setRatings([]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching ratings:', err);
      setError(err.message || 'Failed to load ratings and reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  // Calculate star counts for breakdown
  const starBreakdown = [5, 4, 3, 2, 1].map((starNum) => {
    const count = ratings.filter((r) => r.stars === starNum).length;
    const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
    return { stars: starNum, count, percentage };
  });

  const renderStars = (stars: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i <= stars ? 'fill-current' : 'text-charcoal/20'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 relative overflow-hidden select-text transition-all duration-300"
    >
      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Background Spices Overlay */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Background Spices Parallax */}
      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[12%] left-[6%] opacity-[0.85] pointer-events-none z-10 hidden md:block"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill="#E0653A"
            opacity="0.9"
          />
          <path
            d="M2 22C6 18 12 14 22 2"
            stroke="#FBF4EC"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* Top Header */}
        <DashboardHeader role="vendor" subpageTitle="Ratings & Reviews" />

        {/* Mobile Navbar */}
        <MobileNavbar role="vendor" activeTab="ratings" />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm font-semibold flex-1">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-spice" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#2B2118]/50">
              Loading Reviews...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Ratings Summary & Breakdown */}
            <div className="lg:col-span-4 space-y-6">
              {/* Avg Rating Card */}
              <div className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-3">
                  Average Rating
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-6xl font-display font-black text-charcoal tracking-tight">
                    {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-2xl text-amber-500 font-bold">★</span>
                </div>
                <div className="flex justify-center mb-4">
                  {renderStars(Math.round(avgRating))}
                </div>
                <p className="text-xs text-charcoal/60 font-semibold">
                  Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                </p>
              </div>

              {/* Star Breakdown Card */}
              <div className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-4">
                  Rating Breakdown
                </h3>
                <div className="space-y-3">
                  {starBreakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-3 text-xs font-semibold">
                      <span className="w-3 text-charcoal/60 text-right">{row.stars}</span>
                      <span className="text-amber-500">★</span>
                      <div className="flex-1 h-2 rounded-full bg-charcoal/5 overflow-hidden">
                        <div
                          style={{ width: `${row.percentage}%` }}
                          className="h-full rounded-full bg-amber-500"
                        />
                      </div>
                      <span className="w-8 text-charcoal/60 text-right">{row.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Customer Reviews List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="px-1 border-b border-[#2B2118]/5 pb-2 flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-[#2B2118]">
                  Customer Reviews
                </h2>
                <span className="text-xs font-bold font-body px-2.5 py-0.5 rounded-full bg-spice/10 text-spice border border-spice/15">
                  {ratings.length} Reviews
                </span>
              </div>

              {ratings.length === 0 ? (
                <div className="bg-white/20 border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 mb-4 text-[#2B2118]/20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.44.82-.44.992 0l1.84 4.7c.062.158.21.269.379.283l5.068.375c.477.035.668.62.319.957l-3.8 3.666c-.12.115-.174.281-.137.445l1.006 4.965c.095.467-.407.828-.821.579l-4.32-2.61a1.005 1.005 0 00-.99 0l-4.32 2.61c-.414.25-.915-.11-.82-.579l1.005-4.965c.038-.163-.017-.33-.137-.445l-3.8-3.666c-.349-.338-.158-.922.32-.957l5.067-.375c.17-.014.317-.125.38-.283l1.839-4.7z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-base font-bold text-charcoal mb-1">
                    No ratings or reviews yet
                  </h3>
                  <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed">
                    Once customers order from you and submit their ratings, their feedback and reviews will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rate) => (
                    <div
                      key={rate._id}
                      className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[24px] p-5 shadow-[0_12px_40px_-10px_rgba(43,33,24,0.08)] flex flex-col gap-3 animate-fade-in-up"
                    >
                      {/* Review Top Row */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-charcoal">
                            {rate.name || 'Anonymous Customer'}
                          </h4>
                          <span className="text-[10px] text-charcoal/40 font-semibold block mt-0.5">
                            {new Date(rate.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {renderStars(rate.stars)}
                      </div>

                      {/* Review Content */}
                      {rate.review && (
                        <p className="text-xs text-charcoal/80 leading-relaxed font-medium bg-white/30 rounded-xl p-3 border border-charcoal/5">
                          "{rate.review}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorRatings;
