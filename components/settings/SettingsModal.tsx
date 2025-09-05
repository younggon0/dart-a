'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
}

export function SettingsModal({ isOpen, onClose, language, onLanguageChange }: SettingsModalProps) {
  const t = useTranslation(language);
  const [darkMode, setDarkMode] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  
  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAutoExport = localStorage.getItem('autoExport');
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    if (savedAutoExport === 'true') {
      setAutoExport(true);
    }
  }, []);
  
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value as 'en' | 'ko');
    localStorage.setItem('language', value);
  };

  const handleAutoExportToggle = (checked: boolean) => {
    setAutoExport(checked);
    localStorage.setItem('autoExport', checked.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.settings.title}</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">{t.settings.close}</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t.settings.theme}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="dark-mode">
                  {t.settings.darkMode}
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </div>

          {/* Language Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t.settings.language}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Label htmlFor="language-select">
                  {t.settings.interfaceLanguage}
                </Label>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[120px]" id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t.header.languageToggle.english}</SelectItem>
                  <SelectItem value="ko">{t.header.languageToggle.korean}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t.settings.export}
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-export">
                {t.settings.autoExport}
              </Label>
              <Switch
                id="auto-export"
                checked={autoExport}
                onCheckedChange={handleAutoExportToggle}
              />
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t.settings.about}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.settings.version}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.settings.description}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}