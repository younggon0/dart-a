import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, getCompanyByCode, getCompanyByName } from '@/lib/companies';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const name = searchParams.get('name');

    if (code) {
      const company = getCompanyByCode(code);
      if (company) {
        return NextResponse.json({
          success: true,
          data: company,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    if (name) {
      const company = getCompanyByName(name);
      if (company) {
        return NextResponse.json({
          success: true,
          data: company,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    // Return all companies if no filters
    const companies = getAllCompanies();
    return NextResponse.json({
      success: true,
      data: companies,
      count: companies.length,
    });
  } catch (error) {
    console.error('Companies API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch companies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}