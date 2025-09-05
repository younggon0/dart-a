import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tableId = searchParams.get('id') || 'b2575fce560aa343c52359592e50cd24';
  
  try {
    const result = await query<{data: unknown}>(`
      SELECT data
      FROM tables 
      WHERE id = $1
    `, [tableId]);
    
    if (result.length > 0 && result[0].data) {
      const data = result[0].data;
      
      // Find operating profit row
      let operatingProfitRow = null;
      let revenueRow = null;
      let headers = null;
      
      if (Array.isArray(data)) {
        headers = data[0];
        
        for (const row of data) {
          if (Array.isArray(row)) {
            const firstCell = String(row[0] || '');
            if (firstCell.includes('영업이익') || firstCell.includes('영업손익')) {
              operatingProfitRow = row;
            }
            if (firstCell.includes('매출액') || firstCell.includes('매출')) {
              revenueRow = row;
            }
          }
        }
      }
      
      return NextResponse.json({
        tableId,
        headers,
        operatingProfitRow,
        revenueRow,
        totalRows: Array.isArray(data) ? data.length : 0
      });
    }
    
    return NextResponse.json({ error: 'Table not found' });
  } catch (error) {
    console.error('Get table error:', error);
    return NextResponse.json(
      { error: 'Failed to get table' },
      { status: 500 }
    );
  }
}