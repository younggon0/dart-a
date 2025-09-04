'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
  name: string;
  nameKo?: string;
  code: string;
  sector?: string;
}

interface CompanySelectorProps {
  selectedCompany?: Company;
  onCompanyChange?: (company: Company) => void;
}

export default function CompanySelector({ selectedCompany, onCompanyChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(selectedCompany || null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data);
          if (!selected && data.data.length > 0) {
            setSelected(data.data[0]);
            if (onCompanyChange) {
              onCompanyChange(data.data[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCompanies();
  }, [selected, onCompanyChange]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!selected) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500">No company selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Selected Company</Label>
            <div className="mt-1">
              <p className="font-semibold">{selected.name}</p>
              {selected.nameKo && (
                <p className="text-sm text-gray-600">{selected.nameKo}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">Code: {selected.code}</Badge>
            {selected.sector && (
              <Badge variant="secondary">{selected.sector}</Badge>
            )}
          </div>

          {companies.length > 1 && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-gray-500">Available Companies</Label>
              <div className="mt-2 space-y-1">
                {companies.map((company) => (
                  <button
                    key={company.code}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                      selected.code === company.code ? 'bg-blue-50 border-blue-200 border' : ''
                    }`}
                    onClick={() => {
                      setSelected(company);
                      if (onCompanyChange) {
                        onCompanyChange(company);
                      }
                    }}
                  >
                    <span className="text-sm">{company.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}