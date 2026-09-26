import React from 'react';

const PillLoader = ({ text = "Loading AI help for you" }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A28]/90 backdrop-blur-md">
      <div className="text-center">
        <div className="h-40">
          <div className="pill-bounce">
            <div className="pill-flop origin-center">
              <div 
                className="inline-block h-8 w-20 rounded-full border border-[#6B8F71] pill-gradient shadow-lg shadow-[#6B8F71]/50"
              ></div>
            </div>
          </div>
        </div>
        
        <div className="block text-center">
          <div 
            className="inline-block h-2 w-16 rounded-full bg-[#6B8F71]/50 pill-shadow shadow-sm shadow-[#6B8F71]/30"
          ></div>
        </div>
        
        <div className="mt-6 max-w-xs animate-pulse text-center text-sm font-bold uppercase tracking-wide text-[#E8F2E9]">
          {text}
        </div>
      </div>
    </div>
  );
};

export default PillLoader;