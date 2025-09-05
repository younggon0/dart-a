'use client';

import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel 
} from '@/components/ui/select';
import { AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
  name: string;
  nameKo?: string;
  code: string;
  sector?: string;
  hasData?: boolean;
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
            // Auto-select first company with data, or first company if none have data
            const companyWithData = data.data.find((c: Company) => c.hasData) || data.data[0];
            setSelected(companyWithData);
            if (onCompanyChange) {
              onCompanyChange(companyWithData);
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

  const handleCompanyChange = (companyCode: string) => {
    const company = companies.find(c => c.code === companyCode);
    if (company) {
      setSelected(company);
      if (onCompanyChange) {
        onCompanyChange(company);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Company</label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!companies.length) {
    return (
      <div className="text-sm text-gray-500">No companies available</div>
    );
  }

  // Group companies by data availability
  const companiesWithData = companies.filter(c => c.hasData === true);
  const companiesWithoutData = companies.filter(c => c.hasData === false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-700">Company</label>
      </div>
      
      <Select value={selected?.code || ''} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selected && (
              <div className="flex items-center gap-2">
                {selected.hasData ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span>{selected.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {companiesWithData.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-green-700">
                Available Data
              </SelectLabel>
              {companiesWithData.map((company) => (
                <SelectItem key={company.code} value={company.code}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{company.name}</span>
                    {company.sector && (
                      <span className="text-xs text-gray-500">• {company.sector}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {companiesWithoutData.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                No Data Available
              </SelectLabel>
              {companiesWithoutData.map((company) => (
                <SelectItem key={company.code} value={company.code}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{company.name}</span>
                    {company.sector && (
                      <span className="text-xs text-gray-400">• {company.sector}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {selected?.hasData === false && (
        <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-md border border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
          <p className="text-xs text-orange-800">
            No financial data available for {selected.name}. Only Samsung Electronics has data currently.
          </p>
        </div>
      )}
    </div>
  );
}