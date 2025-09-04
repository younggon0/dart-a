// Company mapping - currently hardcoded to Samsung
// In the future, this could be expanded to support multiple companies

export interface Company {
  name: string;
  nameKo?: string;
  code: string;
  sector?: string;
  hasData?: boolean;
}

// Companies with data availability status
export const COMPANIES: Company[] = [
  {
    name: 'Samsung Electronics',
    nameKo: '삼성전자',
    code: '00126380',
    sector: 'Technology',
    hasData: true
  },
  {
    name: 'SK Hynix',
    nameKo: 'SK하이닉스',
    code: '00164779',
    sector: 'Technology',
    hasData: false
  },
  {
    name: 'LG Electronics',
    nameKo: 'LG전자',
    code: '00401731',
    sector: 'Technology',
    hasData: false
  },
  {
    name: 'Hyundai Motor',
    nameKo: '현대자동차',
    code: '00164742',
    sector: 'Automotive',
    hasData: false
  },
  {
    name: 'POSCO Holdings',
    nameKo: '포스코홀딩스',
    code: '00266961',
    sector: 'Materials',
    hasData: false
  },
  {
    name: 'KB Financial Group',
    nameKo: 'KB금융지주',
    code: '00258801',
    sector: 'Finance',
    hasData: false
  },
  {
    name: 'Shinhan Financial Group',
    nameKo: '신한지주',
    code: '00264273',
    sector: 'Finance',
    hasData: false
  },
  {
    name: 'NAVER',
    nameKo: '네이버',
    code: '00885164',
    sector: 'Technology',
    hasData: false
  },
  {
    name: 'Kakao',
    nameKo: '카카오',
    code: '00918295',
    sector: 'Technology',
    hasData: false
  },
  {
    name: 'Celltrion',
    nameKo: '셀트리온',
    code: '00421045',
    sector: 'Healthcare',
    hasData: false
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