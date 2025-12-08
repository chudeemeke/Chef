
import React from 'react';

export type LoaderVariant = 'chef' | 'shopping';

interface LoadingAnimationProps {
  variant?: LoaderVariant;
  className?: string;
}

const ChefLoader = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <style>{`
      @keyframes pan-flip {
        0%, 10%, 90%, 100% { transform: rotate(0deg); transform-origin: 75% 55%; }
        40%, 50% { transform: rotate(-15deg); transform-origin: 75% 55%; }
      }
      @keyframes food-jump {
        0%, 10%, 90%, 100% { transform: translateY(0) scale(1) rotate(0); opacity: 0; }
        20% { opacity: 1; }
        45% { transform: translateY(-45px) scale(1.1) rotate(180deg); }
        80% { opacity: 1; }
      }
      .animate-pan { animation: pan-flip 1.8s ease-in-out infinite; }
      .animate-food { animation: food-jump 1.8s ease-in-out infinite; }
    `}</style>
    {/* Food Item */}
    <div className="absolute mb-6 ml-2 animate-food z-0">
        <div className="w-8 h-8 bg-yellow-400 dark:bg-yellow-500 rounded-full border-2 border-yellow-600 dark:border-yellow-700 shadow-sm relative overflow-hidden">
             <div className="absolute top-1 right-2 w-2 h-2 bg-yellow-200 rounded-full opacity-50"></div>
        </div>
    </div>
    {/* Pan */}
    <svg viewBox="0 0 100 100" className="w-24 h-24 text-gray-700 dark:text-gray-300 animate-pan z-10 drop-shadow-lg">
       <path fill="currentColor" d="M75,52 L95,52 C97,52 98,54 98,56 C98,58 97,60 95,60 L75,60 L75,52 Z" />
       <path fill="currentColor" d="M15,50 L75,50 C75,50 75,50 75,50 L75,55 C75,65 65,72 55,72 L35,72 C25,72 15,65 15,55 L15,50 Z" />
       <path fill="rgba(255,255,255,0.2)" d="M15,50 L75,50 L75,53 L15,53 Z" />
    </svg>
  </div>
);

const ShoppingLoader = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <style>{`
      @keyframes cart-roll {
        0%, 100% { transform: translateY(0) rotate(0); }
        25% { transform: translateY(-2px) rotate(-1deg); }
        75% { transform: translateY(1px) rotate(1deg); }
      }
      @keyframes wheel-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes grocery-pop-1 {
        0%, 100% { opacity: 0; transform: translateY(10px) scale(0.5); }
        20%, 80% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes grocery-pop-2 {
        0%, 100% { opacity: 0; transform: translateY(10px) scale(0.5); }
        30%, 70% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes track-slide {
         0% { opacity: 0; transform: translateX(20px); }
         50% { opacity: 1; }
         100% { opacity: 0; transform: translateX(-40px); }
      }
      .animate-cart { animation: cart-roll 2s ease-in-out infinite; }
      .animate-wheel { animation: wheel-spin 1s linear infinite; transform-origin: center; }
      .animate-item-1 { animation: grocery-pop-1 2s ease-in-out infinite; }
      .animate-item-2 { animation: grocery-pop-2 2s ease-in-out infinite; animation-delay: 0.5s; }
      .animate-track-1 { animation: track-slide 1s linear infinite; }
      .animate-track-2 { animation: track-slide 1s linear infinite; animation-delay: 0.5s; }
    `}</style>
    
    <div className="absolute bottom-6 w-full flex justify-center overflow-hidden h-4">
         <div className="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded-full animate-track-1 absolute mr-8"></div>
         <div className="w-4 h-1 bg-gray-300 dark:bg-gray-600 rounded-full animate-track-2 absolute ml-8"></div>
    </div>

    <div className="absolute mb-4 mr-2 animate-item-1 z-0">
        <div className="w-4 h-5 bg-red-500 rounded-sm border border-red-700 transform -rotate-12"></div>
    </div>
    <div className="absolute mb-5 ml-3 animate-item-2 z-0">
         <div className="w-4 h-6 bg-green-500 rounded-full border border-green-700 transform rotate-12"></div>
    </div>

    <svg viewBox="0 0 100 100" className="w-24 h-24 text-blue-600 dark:text-blue-400 animate-cart z-10 drop-shadow-md">
       <path fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M15,25 L25,25 L35,65 L75,65 L85,35 L28,35" />
       <circle cx="38" cy="75" r="6" fill="white" className="dark:fill-gray-800" stroke="currentColor" strokeWidth="3" />
       <path fill="currentColor" d="M38,72 L38,78 M35,75 L41,75" className="animate-wheel origin-[38px_75px]" />
       <circle cx="72" cy="75" r="6" fill="white" className="dark:fill-gray-800" stroke="currentColor" strokeWidth="3" />
       <path fill="currentColor" d="M72,72 L72,78 M69,75 L75,75" className="animate-wheel origin-[72px_75px]" />
       <path fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" d="M85,35 L92,20" />
       <circle cx="92" cy="20" r="3" fill="currentColor" />
    </svg>
  </div>
);

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ variant = 'chef', className }) => {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      {variant === 'chef' && <ChefLoader />}
      {variant === 'shopping' && <ShoppingLoader />}
    </div>
  );
};

export default LoadingAnimation;
