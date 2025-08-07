import { render, screen } from '@testing-library/react'
import Home from '../app/page'

test('renders homepage', () => {
  render(<Home />)
  expect(screen.getByText(/FMG Industry Hub/i)).toBeInTheDocument()
})
