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
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Regulation</label>
          <input
            type="text"
            value={regulationId}
            onChange={(e) => setRegulationId(e.target.value)}
            className="bg-layer-2 border border-edge rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'auto' | 'smogon' | 'champions' | 'limitless')}
            className="bg-layer-2 border border-edge rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-primary"
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
          className="bg-primary-active hover:bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-ink">
              <strong className="text-ink">Regulation:</strong> {data.regulationId} | <strong className="text-ink">Source:</strong> {data.source} |{' '}
              <strong className="text-ink">Your Sample:</strong> {data.personalSampleSize} | <strong className="text-ink">Rows:</strong> {data.rowCount}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-edge">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-edge bg-layer-2/60">
                  <th className="px-3 py-2 text-left text-ink-muted font-medium">Pokémon</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">Your %</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">Meta %</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">Delta %</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">|Delta|</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">Your Count</th>
                  <th className="px-3 py-2 text-right text-ink-muted font-medium">Meta Count</th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).slice(0, 20).map((row) => (
                  <tr key={row.speciesId} className="border-b border-edge/50 hover:bg-layer-3/30 transition-colors">
                    <td className="px-3 py-1.5 text-ink">{row.speciesName}</td>
                    <td className="px-3 py-1.5 text-right text-ink font-mono">{row.personalUsagePercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-ink font-mono">{row.metaUsagePercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right font-mono">{row.deltaPercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-ink font-mono">{row.absDeltaPercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-ink font-mono">{row.personalRawCount}</td>
                    <td className="px-3 py-1.5 text-right text-ink font-mono">{row.metaRawCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data.rows?.length || 0) > 20 && <p className="text-xs text-ink-muted">Showing first 20 of {data.rowCount} rows</p>}
        </div>
      )}
    </div>
  );
}
