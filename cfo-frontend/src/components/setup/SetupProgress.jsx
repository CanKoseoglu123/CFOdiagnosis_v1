// src/components/setup/SetupProgress.jsx
// VS25: Simple step indicator component (squares per design system)

import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 'company', label: 'Company' },
  { key: 'pillar', label: 'FP&A' }
];

export default function SetupProgress({ currentStep }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-semibold
                  ${isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'}`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-3 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
