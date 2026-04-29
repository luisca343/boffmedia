'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { VgcMetaService } from '@/services/api/boffmedia/vgcService';

interface ComparisonRow {
  speciesId: string;
  speciesName: string;
  personalUsagePercent: number;
  metaUsagePercent: number;
  deltaPercent: number;
  absDeltaPercent: number;
  personalRawCount: number;
  metaRawCount: number;
}

interface ComparisonData {
  regulationId: string;
  source: 'champions' | 'smogon' | 'limitless';
  personalSampleSize: number;
  rowCount: number;
  rows: ComparisonRow[];
}

export function PersonalMetaComparisonTest() {
  const { data: session } = useSession();
  const [regulationId, setRegulationId] = useState('sv');
  const [source, setSource] = useState<'auto' | 'smogon' | 'champions' | 'limitless'>('auto');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!session?.user) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const token = session.user.accessToken || '';
      const result = await VgcMetaService.getPersonalMetaComparison(token, {
        regulationId,
        source,
      });
      console.log('Raw API response:', result);
      
      // Check if response is an error
      if ((result as any)?.statusCode && (result as any).statusCode !== 200) {
        setError((result as any).message || 'Failed to fetch comparison');
        return;
      }
      
      // Handle wrapped response if needed
      const actualData = (result as any)?.data || result;
      
      // Check if response is empty or missing rows
      if (!actualData || Object.keys(actualData).length === 0) {
        setError(`No data available for source: ${source} in regulation: ${regulationId}`);
        return;
      }
      
      if (!actualData?.rows) {
        console.error('Response missing rows property:', actualData);
        setError('Invalid response from server - missing rows data');
        return;
      }
      setData(actualData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        Please log in to test personal vs meta comparison.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Regulation</label>
          <input
            type="text"
            value={regulationId}
            onChange={(e) => setRegulationId(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="auto">Auto (Champions or Smogon)</option>
            <option value="smogon">Smogon</option>
            <option value="champions">Champions</option>
            <option value="limitless">Limitless</option>
          </select>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm">
              <strong>Regulation:</strong> {data.regulationId} | <strong>Source:</strong> {data.source} |{' '}
              <strong>Your Sample:</strong> {data.personalSampleSize} | <strong>Rows:</strong> {data.rowCount}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-1 text-left">Pokémon</th>
                  <th className="border px-2 py-1 text-right">Your %</th>
                  <th className="border px-2 py-1 text-right">Meta %</th>
                  <th className="border px-2 py-1 text-right">Delta %</th>
                  <th className="border px-2 py-1 text-right">|Delta|</th>
                  <th className="border px-2 py-1 text-right">Your Count</th>
                  <th className="border px-2 py-1 text-right">Meta Count</th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).slice(0, 20).map((row) => (
                  <tr key={row.speciesId} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{row.speciesName}</td>
                    <td className="border px-2 py-1 text-right">{row.personalUsagePercent.toFixed(2)}%</td>
                    <td className="border px-2 py-1 text-right">{row.metaUsagePercent.toFixed(2)}%</td>
                    <td className="border px-2 py-1 text-right">{row.deltaPercent.toFixed(2)}%</td>
                    <td className="border px-2 py-1 text-right">{row.absDeltaPercent.toFixed(2)}%</td>
                    <td className="border px-2 py-1 text-right">{row.personalRawCount}</td>
                    <td className="border px-2 py-1 text-right">{row.metaRawCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data.rows?.length || 0) > 20 && <p className="text-xs text-gray-500">Showing first 20 of {data.rowCount} rows</p>}
        </div>
      )}
    </div>
  );
}
