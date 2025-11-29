// src/components/ui/__tests__/input.test.tsx
// Unit tests for Input component

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { Input } from '../input'

describe('Input', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />)

      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Input className="custom-class" />)

      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })
  })

  describe('types', () => {
    it('should default to text type', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })

    it('should support email type', () => {
      render(<Input type="email" />)

      const input = document.querySelector('input[type="email"]')
      expect(input).toBeInTheDocument()
    })

    it('should support password type', () => {
      render(<Input type="password" />)

      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should support number type', () => {
      render(<Input type="number" />)

      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error border when error is true', () => {
      render(<Input error />)

      expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
    })

    it('should not show error border when error is false', () => {
      render(<Input error={false} />)

      expect(screen.getByRole('textbox')).toHaveClass('border-neutral-300')
    })

    it('should set aria-invalid when error is true', () => {
      render(<Input error />)

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('should not set aria-invalid when error is false', () => {
      render(<Input error={false} />)

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    })
  })

  describe('states', () => {
    it('should handle disabled state', () => {
      render(<Input disabled />)

      expect(screen.getByRole('textbox')).toBeDisabled()
      expect(screen.getByRole('textbox')).toHaveClass('disabled:cursor-not-allowed')
    })

    it('should handle readonly state', () => {
      render(<Input readOnly />)

      expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    })

    it('should handle required state', () => {
      render(<Input required />)

      expect(screen.getByRole('textbox')).toBeRequired()
    })
  })

  describe('user interaction', () => {
    it('should handle onChange events', async () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })

      expect(handleChange).toHaveBeenCalled()
    })

    it('should handle typing', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello')

      expect(input).toHaveValue('Hello')
    })

    it('should handle onFocus events', () => {
      const handleFocus = vi.fn()
      render(<Input onFocus={handleFocus} />)

      const input = screen.getByRole('textbox')
      fireEvent.focus(input)

      expect(handleFocus).toHaveBeenCalled()
    })

    it('should handle onBlur events', () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)

      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)

      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('controlled vs uncontrolled', () => {
    it('should work as controlled input', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />)

      expect(screen.getByRole('textbox')).toHaveValue('initial')

      rerender(<Input value="updated" onChange={() => {}} />)

      expect(screen.getByRole('textbox')).toHaveValue('updated')
    })

    it('should work as uncontrolled input with defaultValue', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="default" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('default')

      await user.clear(input)
      await user.type(input, 'new value')

      expect(input).toHaveValue('new value')
    })
  })

  describe('accessibility', () => {
    it('should have focus styles', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toHaveClass('focus:ring-2')
    })

    it('should support aria-label', () => {
      render(<Input aria-label="Email address" />)

      expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">Enter your email</span>
        </>
      )

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help-text')
    })
  })

  describe('forwarded props', () => {
    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Input ref={ref} />)

      expect(ref).toHaveBeenCalled()
    })

    it('should forward data attributes', () => {
      render(<Input data-testid="custom-input" />)

      expect(screen.getByTestId('custom-input')).toBeInTheDocument()
    })

    it('should forward min/max attributes for number input', () => {
      render(<Input type="number" min={0} max={100} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('should forward maxLength attribute', () => {
      render(<Input maxLength={50} />)

      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '50')
    })
  })
})
