import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import { Button } from '../../../components/demo/Button';
import '@testing-library/jest-dom/vitest';

describe('Button component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });
  
  it('renders with custom props', () => {
    render(
      <Button 
        type="submit" 
        disabled={true} 
        className="custom-class"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'Submit' });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('custom-class');
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    
    render(
      <Button onClick={handleClick} disabled={true}>
        Click me
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});