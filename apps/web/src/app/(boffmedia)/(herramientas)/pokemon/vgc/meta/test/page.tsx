'use client';

import { PersonalMetaComparisonTest } from '../_components/PersonalMetaComparisonTest';

export default function TestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Personal vs Meta Comparison Test</h1>
        <p className="text-gray-600">Test the authenticated endpoint that compares your meta usage with the global meta</p>
      </div>
      <PersonalMetaComparisonTest />
    </div>
  );
}
