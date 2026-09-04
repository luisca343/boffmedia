import { describe, it, expect, afterEach } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { FieldLayer, fieldOverlays } from '../FieldLayer';
import { SideScreens } from '../SideScreens';
import { feed, openBattle } from './helpers';

afterEach(cleanup);

/** Lets the fade's `setTimeout` run so departed layers are actually dropped. */
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 500)); });

describe('FieldLayer', () => {
  it('derives the weather overlay from the field, and drops it when it expires', async () => {
    const battle = openBattle();
    const { container, rerender } = render(<FieldLayer battle={battle} />);
    expect(container.querySelector('[data-fx^="weather:"]')).toBeNull();

    feed(battle, ['|-weather|RainDance']);
    await act(async () => { rerender(<FieldLayer battle={battle} />); });
    const rain = container.querySelector('[data-fx="weather:rain"]') as HTMLElement;
    expect(rain).not.toBeNull();
    expect(rain.querySelector('div')!.getAttribute('style')).toContain('weather-raindance.jpg');

    feed(battle, ['|-weather|none']);
    await act(async () => { rerender(<FieldLayer battle={battle} />); });
    await settle();
    expect(container.querySelector('[data-fx="weather:rain"]')).toBeNull();
  });

  it('shows the trick room grid on |-fieldstart| and removes it on |-fieldend|', async () => {
    const battle = openBattle();
    const { container, rerender } = render(<FieldLayer battle={battle} />);

    feed(battle, ['|-fieldstart|move: Trick Room']);
    await act(async () => { rerender(<FieldLayer battle={battle} />); });
    const room = container.querySelector('[data-fx="room:trickroom"]') as HTMLElement;
    expect(room).not.toBeNull();
    expect(room.querySelector('div')!.getAttribute('style')).toContain('weather-trickroom.png');

    feed(battle, ['|-fieldend|move: Trick Room']);
    await act(async () => { rerender(<FieldLayer battle={battle} />); });
    await settle();
    expect(container.querySelector('[data-fx="room:trickroom"]')).toBeNull();
  });

  it('stacks weather, terrain and a room at once', () => {
    const battle = openBattle([
      '|-weather|Sandstorm',
      '|-fieldstart|move: Electric Terrain',
      '|-fieldstart|move: Trick Room',
    ]);
    const keys = fieldOverlays(battle).map((o) => o.key);
    expect(keys).toEqual(['weather:sand', 'terrain:electric', 'room:trickroom']);
  });

  it('never references the missing fx/trickroom.png', () => {
    const battle = openBattle(['|-fieldstart|move: Trick Room']);
    const [room] = fieldOverlays(battle);
    expect(room.url).toContain('fx/weather-trickroom.png');
    expect(room.url).not.toMatch(/fx\/trickroom\.png/);
  });
});

describe('SideScreens', () => {
  it('renders screens as CSS only — never an <img>', () => {
    const { container } = render(
      <SideScreens side="ally" conditions={{ reflect: {}, lightscreen: {}, auroraveil: {}, tailwind: {}, safeguard: {}, mist: {}, luckychant: {} }} />,
    );
    // The whole point: seven of these have no art in the pack, and the old
    // Hazard drew `fx/${id}.png` for every one of them.
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelector('[data-screen="reflect"]')).not.toBeNull();
    expect(container.querySelector('[data-screen="lightscreen"]')).not.toBeNull();
    expect(container.querySelector('[data-screen="auroraveil"]')).not.toBeNull();
    expect(container.querySelector('[data-screen="tailwind"]')).not.toBeNull();
    // Chip-only: three more washes over the same half read as mud.
    expect(container.querySelector('[data-screen="safeguard"]')).toBeNull();
    expect(container.querySelector('[data-screen="mist"]')).toBeNull();
    expect(container.querySelector('[data-screen="luckychant"]')).toBeNull();
  });

  it('paints the half of the field its side owns', () => {
    const foe = render(<SideScreens side="foe" conditions={{ reflect: {} }} />);
    expect((foe.container.querySelector('[data-bsim-screens]') as HTMLElement).style.bottom).toBe('55%');
    cleanup();
    const ally = render(<SideScreens side="ally" conditions={{ reflect: {} }} />);
    expect((ally.container.querySelector('[data-bsim-screens]') as HTMLElement).style.top).toBe('45%');
  });

  it('renders nothing when the side has only hazards', () => {
    const { container } = render(<SideScreens side="ally" conditions={{ spikes: { level: 2 } }} />);
    expect(container.firstChild).toBeNull();
  });
});
