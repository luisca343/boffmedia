import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import type { ChatPanelMessage } from '../ChatPanel';

// Simple component test: we test the core logic without React Testing Library matchers
// since the test setup doesn't have access to those custom matchers.

// This package's vitest config does not set `globals: true`, so Testing
// Library never registers its automatic afterEach cleanup: every render would
// stack another copy of the panel in the same document and the queries below
// would fail with "Found multiple elements". Unmount explicitly.
afterEach(cleanup);

// Mock the i18n hook
vi.mock('../../i18n', () => ({
  useToolT: () => (key: string, values?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
      'chat.placeholder': 'Type a message…',
      'chat.empty': 'No messages yet',
      'chat.send': 'Send',
      'chat.aria': 'Chat',
      'chat.mute': `Mute {name}`,
      'chat.unmute': `Unmute {name}`,
    };
    let text = translations[key] ?? key;
    if (values?.name) text = text.replace('{name}', String(values.name));
    return text;
  },
  BATTLESIM_NS: 'tools.battlesim',
}));

// Mock the bsim-kit export
vi.mock('../bsim-kit', () => ({
  BSIM_FOCUS_CUT: 'mock-focus-cut',
  BSIM_FOCUS: 'mock-focus',
}));

// Mock sanitizeHtml to demonstrate it blocks scripts
vi.mock('../../engine/sanitizeHtml', () => ({
  sanitizeHtml: (html: string) => {
    // Simple sanitizer: removes script tags and javascript: hrefs
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, 'blocked:');
  },
}));

// Import after mocks
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  describe('text rendering', () => {
    it('renders messages as text with sanitized HTML', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'Player1', message: 'Hello world', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} />);

      expect(screen.getByText(/Player1:/)).toBeTruthy();
      expect(screen.getByText(/Hello world/)).toBeTruthy();
    });

    it('treats script tags as literal text (they get stripped by sanitizer)', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'Attacker', message: '<script>alert("xss")</script>Normal text', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} />);

      const logArea = screen.getByRole('log');
      // Script tags are removed by sanitizeHtml, leaving only "Normal text"
      expect(logArea.textContent).toContain('Normal text');
      expect(logArea.textContent).not.toContain('alert');
      expect(logArea.textContent).not.toContain('<script>');
    });

    it('treats javascript: hrefs as literal text (they get blocked by sanitizer)', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'Attacker', message: '<a href="javascript:void(0)">Click me</a>', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} />);

      const logArea = screen.getByRole('log');
      // The security property is that nothing executable survives, not that the
      // sanitizer writes any particular marker string: the anchor's text may
      // remain, but there must be no javascript: href left to click.
      expect(logArea.textContent).not.toContain('javascript:');
      expect(logArea.innerHTML).not.toContain('javascript:');
      expect(logArea.querySelector('a[href^="javascript:"]')).toBeNull();
    });

    it('renders timestamps when provided', () => {
      const now = new Date();
      now.setHours(14);
      now.setMinutes(35);
      const timestamp = now.getTime();

      const messages: ChatPanelMessage[] = [
        { sender: 'Player1', message: 'Test', timestamp },
      ];

      render(<ChatPanel messages={messages} />);

      // Check that time is rendered (14:35 format)
      expect(screen.queryByText(/14:35/)).toBeTruthy();
    });
  });

  describe('message length bounds', () => {
    it('allows sending messages up to the input limit', () => {
      const onSend = vi.fn();
      const message = 'a'.repeat(280); // Well under 300 char server limit

      render(<ChatPanel messages={[]} onSend={onSend} />);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;
      const button = screen.getAllByRole('button').find(b => b.textContent === 'Send');

      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(button!);

      expect(onSend).toHaveBeenCalledWith(message);
    });

    it('trims whitespace before sending', () => {
      const onSend = vi.fn();
      const messageWithWhitespace = '  hello world  ';

      render(<ChatPanel messages={[]} onSend={onSend} />);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;
      const button = screen.getAllByRole('button').find(b => b.textContent === 'Send');

      fireEvent.change(input, { target: { value: messageWithWhitespace } });
      fireEvent.click(button!);

      expect(onSend).toHaveBeenCalledWith('hello world');
    });

    it('does not send empty messages', () => {
      const onSend = vi.fn();

      render(<ChatPanel messages={[]} onSend={onSend} />);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;
      const button = screen.getAllByRole('button').find(b => b.textContent === 'Send');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button!);

      expect(onSend).not.toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
      render(<ChatPanel messages={[]} onSend={() => {}} />);

      const button = screen.getAllByRole('button').find(b => b.textContent === 'Send') as HTMLButtonElement;

      expect(button.disabled).toBe(true);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'hello' } });

      expect(button.disabled).toBe(false);
    });
  });

  describe('mute feature', () => {
    it('shows mute button when opponentName is provided', () => {
      // The mute control lives in the composer, so a chat the viewer can send
      // in is the case under test — which is every battler.
      render(<ChatPanel messages={[]} onSend={vi.fn()} opponentName="Rival" />);

      const buttons = screen.getAllByRole('button');
      const muteButton = buttons.find((b) => b.getAttribute('aria-label')?.includes('Mute'));
      expect(muteButton).toBeTruthy();
    });

    it('does not show mute button when opponentName is not provided', () => {
      render(<ChatPanel messages={[]} onSend={vi.fn()} />);

      // The mute button should not exist
      const buttons = screen.getAllByRole('button');
      const muteButton = buttons.find((b) => b.getAttribute('aria-label')?.includes('Mute'));
      expect(muteButton).toBeFalsy();
    });

    it('hides opponent messages when muted', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'You', message: 'Your message', timestamp: Date.now() },
        { sender: 'Rival', message: 'Rival message 1', timestamp: Date.now() },
        { sender: 'You', message: 'Another message', timestamp: Date.now() },
        { sender: 'Rival', message: 'Rival message 2', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} onSend={vi.fn()} opponentName="Rival" />);

      // Both messages are visible initially
      expect(screen.queryByText('Rival message 1')).toBeTruthy();
      expect(screen.queryByText('Rival message 2')).toBeTruthy();

      // Click mute button
      const buttons = screen.getAllByRole('button');
      const muteButton = buttons.find((b) => b.getAttribute('aria-label')?.includes('Mute'))!;
      fireEvent.click(muteButton);

      // Rival messages are hidden
      expect(screen.queryByText('Rival message 1')).toBeFalsy();
      expect(screen.queryByText('Rival message 2')).toBeFalsy();

      // Your messages are still visible
      expect(screen.queryByText('Your message')).toBeTruthy();
      expect(screen.queryByText('Another message')).toBeTruthy();
    });

    it('unmutes when clicking mute button again', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'Rival', message: 'Rival message', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} onSend={vi.fn()} opponentName="Rival" />);

      const buttons = screen.getAllByRole('button');
      const muteButton = buttons.find((b) => b.getAttribute('aria-label')?.includes('Mute'))!;

      // Mute
      fireEvent.click(muteButton);
      expect(screen.queryByText('Rival message')).toBeFalsy();

      // Unmute
      fireEvent.click(muteButton);
      expect(screen.queryByText('Rival message')).toBeTruthy();
    });

    it('shows empty state when all messages are from muted opponent', () => {
      const messages: ChatPanelMessage[] = [
        { sender: 'Rival', message: 'Message 1', timestamp: Date.now() },
        { sender: 'Rival', message: 'Message 2', timestamp: Date.now() },
      ];

      render(<ChatPanel messages={messages} onSend={vi.fn()} emptyText="No messages" opponentName="Rival" />);

      const buttons = screen.getAllByRole('button');
      const muteButton = buttons.find((b) => b.getAttribute('aria-label')?.includes('Mute'))!;
      fireEvent.click(muteButton);

      expect(screen.queryByText('No messages')).toBeTruthy();
    });

    it('clears input after sending', () => {
      const onSend = vi.fn();

      render(<ChatPanel messages={[]} onSend={onSend} />);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;
      const button = screen.getAllByRole('button').find(b => b.textContent === 'Send');

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(button!);

      expect(input.value).toBe('');
    });
  });

  describe('form submission', () => {
    it('sends on form submission', () => {
      const onSend = vi.fn();

      render(<ChatPanel messages={[]} onSend={onSend} />);

      const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'hello' } });
      // Simulate form submission
      fireEvent.submit(input.closest('form')!);

      expect(onSend).toHaveBeenCalledWith('hello');
    });

    it('does not show input when disabled', () => {
      const onSend = vi.fn();

      render(<ChatPanel messages={[]} onSend={onSend} disabled={true} />);

      // Input and button should not be present when disabled
      expect(screen.queryByPlaceholderText('Type a message…')).toBeFalsy();
    });
  });
});
