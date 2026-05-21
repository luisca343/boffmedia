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
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
        Please log in to test personal vs meta comparison.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-surface-400 uppercase tracking-wide mb-1">Regulation</label>
          <input
            type="text"
            value={regulationId}
            onChange={(e) => setRegulationId(e.target.value)}
            className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-1.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 uppercase tracking-wide mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'auto' | 'smogon' | 'champions' | 'limitless')}
            className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-1.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
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
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
          <p className="font-semibold text-sm">Error:</p>
          <p className="text-xs mt-0.5">{error}</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-3">
          <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-sm text-surface-300">
              <strong className="text-surface-100">Regulation:</strong> {data.regulationId} | <strong className="text-surface-100">Source:</strong> {data.source} |{' '}
              <strong className="text-surface-100">Your Sample:</strong> {data.personalSampleSize} | <strong className="text-surface-100">Rows:</strong> {data.rowCount}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-surface-700">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-700 bg-surface-800/60">
                  <th className="px-3 py-2 text-left text-surface-400 font-medium">Pokémon</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">Your %</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">Meta %</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">Delta %</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">|Delta|</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">Your Count</th>
                  <th className="px-3 py-2 text-right text-surface-400 font-medium">Meta Count</th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).slice(0, 20).map((row) => (
                  <tr key={row.speciesId} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                    <td className="px-3 py-1.5 text-surface-200">{row.speciesName}</td>
                    <td className="px-3 py-1.5 text-right text-surface-300 font-mono">{row.personalUsagePercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-surface-300 font-mono">{row.metaUsagePercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right font-mono">{row.deltaPercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-surface-300 font-mono">{row.absDeltaPercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-surface-300 font-mono">{row.personalRawCount}</td>
                    <td className="px-3 py-1.5 text-right text-surface-300 font-mono">{row.metaRawCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data.rows?.length || 0) > 20 && <p className="text-xs text-surface-500">Showing first 20 of {data.rowCount} rows</p>}
        </div>
      )}
    </div>
  );
}
