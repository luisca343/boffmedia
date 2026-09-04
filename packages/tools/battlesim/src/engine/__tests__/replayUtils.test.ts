import { describe, expect, it } from 'vitest';

import { validateReplayTranscript } from '../replayUtils';

/**
 * The paste box is the last place a bad transcript can be reported as text
 * rather than as a crash inside the player, so the marker set is pinned here.
 */
const VALID = [
  '|player|p1|Alice|1|',
  '|player|p2|Bob|2|',
  '|teamsize|p1|6',
  '|teamsize|p2|6',
  '|gametype|singles',
  '|gen|9',
  '|start',
  '|switch|p1a: Alice|Pikachu, L50, M|100/100',
  '|switch|p2a: Bob|Eevee, L50, F|100/100',
  '|turn|1',
].join('\n');

describe('validateReplayTranscript', () => {
  it('accepts a Showdown transcript carrying all three markers', () => {
    expect(validateReplayTranscript(VALID)).toBeNull();
  });

  it('reports whitespace-only input as empty, not malformed', () => {
    expect(validateReplayTranscript('   \n  ')).toBe('empty');
  });

  it.each([
    ['|player|', '|player|'],
    ['|start', '|start'],
    ['|turn|', '|turn|'],
  ])('rejects a transcript with no %s line', (_label, marker) => {
    const stripped = VALID.split('\n')
      .filter((line) => !line.startsWith(marker))
      .join('\n');
    expect(validateReplayTranscript(stripped)).toBe('markers');
  });

  it('rejects arbitrary pasted prose', () => {
    expect(validateReplayTranscript('here is my replay, thanks')).toBe('markers');
  });

  // The bug this validator was written around: the protocol line is a bare
  // `|start`, so a check for `'|start|'` matched nothing and the marker was
  // never actually enforced. A transcript that only has the pipe-suffixed
  // spelling is not a real transcript.
  it('does not accept `|start|` in place of the bare `|start` line', () => {
    const fake = VALID.replace('\n|start\n', '\n|startsomethingelse\n');
    expect(validateReplayTranscript(fake)).toBe('markers');
  });
});
