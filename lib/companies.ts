// Company mapping - currently hardcoded to Samsung
// In the future, this could be expanded to support multiple companies

export interface Company {
  name: string;
  nameKo?: string;
  code: string;
  sector?: string;
}

export const COMPANIES: Company[] = [
  {
    name: 'Samsung Electronics',
    nameKo: '삼성전자',
    code: '00126380',
    sector: 'Technology'
  }
];

export function getCompanyByCode(code: string): Company | null {
  return COMPANIES.find(c => c.code === code) || null;
}

export function getCompanyByName(name: string): Company | null {
  const normalizedName = name.toLowerCase().trim();
  return COMPANIES.find(c => 
    c.name.toLowerCase().includes(normalizedName) ||
    (c.nameKo && c.nameKo.includes(name))
  ) || null;
}

export function getAllCompanies(): Company[] {
  return COMPANIES;
}