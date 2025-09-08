'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RequirementsConfirmationProps {
  requirements: string[];
  onConfirm: (selectedRequirements: string[]) => void;
  language: 'en' | 'ko';
  isCollapsed?: boolean;
}

export default function RequirementsConfirmation({
  requirements: initialRequirements,
  onConfirm,
  language,
  isCollapsed = false
}: RequirementsConfirmationProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleDelete = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    setHasConfirmed(true);
    setIsExpanded(false);
    onConfirm(requirements);
  };

  const translations = {
    en: {
      title: 'Analysis Requirements',
      subtitle: 'Review and confirm the analysis scope',
      confirm: 'Confirm & Proceed',
      confirmed: 'Requirements Confirmed',
      items: `${requirements.length} requirements selected`,
      empty: 'Please select at least one requirement'
    },
    ko: {
      title: '분석 요구사항',
      subtitle: '분석 범위를 검토하고 확인하세요',
      confirm: '확인 및 진행',
      confirmed: '요구사항 확인됨',
      items: `${requirements.length}개 요구사항 선택됨`,
      empty: '최소 하나의 요구사항을 선택하세요'
    }
  };

  const t = translations[language];

  // Collapsed view after confirmation
  if (hasConfirmed && !isExpanded) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{t.confirmed}</p>
              <p className="text-xs text-green-700">{t.items}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-green-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
          {hasConfirmed && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </button>
          )}
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    <span className="text-sm text-gray-700">{requirement}</span>
                  </div>
                  {!hasConfirmed && (
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1.5 hover:bg-red-100 rounded-md transition-colors group"
                      aria-label={`Delete ${requirement}`}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
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
        {!hasConfirmed && (
          <div className="flex justify-end">
            <Button
              onClick={handleConfirm}
              disabled={requirements.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t.confirm}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}