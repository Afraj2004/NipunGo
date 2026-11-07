import { render, screen } from '@testing-library/react';
import Footer from './Footer';

// react-router-dom v7 can't be resolved by CRA's Jest, so stub the bits Footer uses
jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>{children}</a>
    ),
  }),
  { virtual: true }
);

test('footer shows the NipunGo logo and the current year', () => {
  render(<Footer />);
  expect(screen.getByAltText(/nipungo logo/i)).toBeInTheDocument();
  expect(
    screen.getByText(new RegExp(`© ${new Date().getFullYear()} NipunGo`))
  ).toBeInTheDocument();
});
