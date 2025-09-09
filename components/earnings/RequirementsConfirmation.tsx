'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RequirementsConfirmationProps {
  requirements: string[];
  onConfirm: (selectedRequirements: string[]) => void;
  language: 'en' | 'ko';
  isConfirmed?: boolean;
}

export default function RequirementsConfirmation({
  requirements: initialRequirements,
  onConfirm,
  language,
  isConfirmed = false
}: RequirementsConfirmationProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the card bottom into view when component mounts
    if (cardRef.current && !isConfirmed) {
      setTimeout(() => {
        const cardBottom = cardRef.current?.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        if (cardBottom && cardBottom > windowHeight) {
          // Scroll so the bottom of the card aligns with the bottom of the viewport
          window.scrollBy({ 
            top: cardBottom - windowHeight + 20, // 20px padding from bottom
            behavior: 'smooth' 
          });
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [isConfirmed]);
  
  useEffect(() => {
    if (isConfirmed) {
      setIsProcessing(true);
      // Stop spinning after planning phase (when tasks are generated)
      setTimeout(() => {
        setIsProcessing(false);
      }, 2900); // Just before plan appears
    }
  }, [isConfirmed]);

  const handleDelete = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    onConfirm(requirements);
  };

  const translations = {
    en: {
      title: 'Analysis Requirements',
      subtitle: 'Review and confirm the analysis scope',
      confirm: 'Confirm & Proceed',
      confirming: 'Planning execution...',
      confirmed: 'Plan ready',
      empty: 'Please select at least one requirement'
    },
    ko: {
      title: '분석 요구사항',
      subtitle: '분석 범위를 검토하고 확인하세요',
      confirm: '확인 및 진행',
      confirming: '실행 계획 중...',
      confirmed: '계획 준비 완료',
      empty: '최소 하나의 요구사항을 선택하세요'
    }
  };

  const t = translations[language];

  return (
    <Card ref={cardRef} className="p-6 bg-white shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>

        {/* Requirements List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {requirements.map((requirement, index) => (
              <motion.div
                key={requirement}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors">
                  <span className="text-sm text-gray-700">{requirement}</span>
                  {!isConfirmed && (
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1 hover:bg-red-100 rounded-md transition-colors group"
                      aria-label={`Delete ${requirement}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-600" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {requirements.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
              {t.empty}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={requirements.length === 0 || isProcessing || isConfirmed}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center animate-pulse">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t.confirming}
              </span>
            ) : isConfirmed ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t.confirmed}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t.confirm}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}