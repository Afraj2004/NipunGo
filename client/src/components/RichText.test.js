import { render, screen } from '@testing-library/react';
import RichText, { cleanMessageText } from './RichText';

test('**bold** is rendered as bold, with no raw asterisks left', () => {
  const { container } = render(<RichText text="Aapko ek **Plumber** ki zaroorat hai." />);
  const strong = container.querySelector('strong');
  expect(strong).toHaveTextContent('Plumber');
  expect(container.textContent).not.toContain('*');
});

test('bullet lines are rendered as bullets', () => {
  render(<RichText text={'Check karo:\n- Valve band karo\n* Bartan rakho'} />);
  expect(screen.getByText('Valve band karo')).toBeInTheDocument();
  expect(screen.getByText('Bartan rakho')).toBeInTheDocument();
});

test('JSON and code fences from the AI are hidden', () => {
  const text = 'Plumber bula loon?\n```json\n{"action": "BOOKING_SUGGESTION", "service": "Plumber"}\n```';
  expect(cleanMessageText(text)).toBe('Plumber bula loon?');
});

test('HTML in a message is shown as text, never executed', () => {
  const { container } = render(<RichText text={'<img src=x onerror=alert(1)> hi'} />);
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('<img');
});
