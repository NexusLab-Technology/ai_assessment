/**
 * Unit Tests for FixedQuestionContainer Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FixedQuestionContainer from '@/components/ai-assessment/FixedQuestionContainer';

describe('FixedQuestionContainer', () => {
  test('renders children content correctly', () => {
    const testContent = 'Test question content';
    
    render(
      <FixedQuestionContainer>
        <div>{testContent}</div>
      </FixedQuestionContainer>
    );
    
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    const customClass = 'custom-test-class';
    
    const { container } = render(
      <FixedQuestionContainer className={customClass}>
        <div>Content</div>
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    expect(containerElement).toHaveClass(customClass);
  });

  test('maintains fixed container structure', () => {
    const { container } = render(
      <FixedQuestionContainer>
        <div>Content</div>
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    const contentElement = container.querySelector('.question-content');
    
    expect(containerElement).toBeInTheDocument();
    expect(contentElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('overflow-hidden');
    expect(contentElement).toHaveClass('overflow-y-auto');
  });

  test('renders with proper responsive classes', () => {
    const { container } = render(
      <FixedQuestionContainer>
        <div>Content</div>
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    
    // Check for responsive height classes
    expect(containerElement).toHaveClass('h-[600px]');
    expect(containerElement).toHaveClass('md:h-[650px]');
    expect(containerElement).toHaveClass('lg:h-[700px]');
    expect(containerElement).toHaveClass('sm:h-[500px]');
  });

  test('handles long content with scrolling', () => {
    const longContent = Array.from({ length: 50 }, (_, i) => (
      <p key={i}>This is a long paragraph number {i + 1} that should cause scrolling when there are many of them.</p>
    ));
    
    const { container } = render(
      <FixedQuestionContainer>
        <div>{longContent}</div>
      </FixedQuestionContainer>
    );
    
    const contentElement = container.querySelector('.question-content');
    expect(contentElement).toHaveClass('overflow-y-auto');
  });

  test('renders form elements properly', () => {
    render(
      <FixedQuestionContainer>
        <form>
          <input type="text" placeholder="Text input" />
          <textarea placeholder="Textarea input" />
          <select>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
          <input type="radio" name="radio" value="radio1" />
          <input type="checkbox" name="checkbox" value="checkbox1" />
        </form>
      </FixedQuestionContainer>
    );
    
    expect(screen.getByPlaceholderText('Text input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Textarea input')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('handles empty content gracefully', () => {
    const { container } = render(
      <FixedQuestionContainer>
        {null}
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    const contentElement = container.querySelector('.question-content');
    
    expect(containerElement).toBeInTheDocument();
    expect(contentElement).toBeInTheDocument();
  });

  test('applies proper styling classes', () => {
    const { container } = render(
      <FixedQuestionContainer>
        <div>Content</div>
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    const contentElement = container.querySelector('.question-content');
    
    // Container styling
    expect(containerElement).toHaveClass('w-full');
    expect(containerElement).toHaveClass('border');
    expect(containerElement).toHaveClass('border-gray-200');
    expect(containerElement).toHaveClass('rounded-lg');
    expect(containerElement).toHaveClass('bg-white');
    expect(containerElement).toHaveClass('shadow-sm');
    expect(containerElement).toHaveClass('flex');
    expect(containerElement).toHaveClass('flex-col');
    
    // Content styling
    expect(contentElement).toHaveClass('flex-1');
    expect(contentElement).toHaveClass('p-6');
    expect(contentElement).toHaveClass('md:p-8');
    expect(contentElement).toHaveClass('sm:p-4');
  });

  test('renders multiple children correctly', () => {
    render(
      <FixedQuestionContainer>
        <h1>Question Title</h1>
        <p>Question description</p>
        <input type="text" placeholder="Answer" />
        <button>Submit</button>
      </FixedQuestionContainer>
    );
    
    expect(screen.getByRole('heading', { name: 'Question Title' })).toBeInTheDocument();
    expect(screen.getByText('Question description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Answer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  test('maintains container dimensions with different content types', () => {
    const { container, rerender } = render(
      <FixedQuestionContainer>
        <div>Short content</div>
      </FixedQuestionContainer>
    );
    
    const containerElement = container.querySelector('.fixed-question-container');
    const initialHeight = containerElement?.classList.toString();
    
    // Re-render with long content
    rerender(
      <FixedQuestionContainer>
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <p key={i}>Very long content line {i + 1}</p>
          ))}
        </div>
      </FixedQuestionContainer>
    );
    
    const updatedHeight = containerElement?.classList.toString();
    
    // Container should maintain same height classes
    expect(initialHeight).toBe(updatedHeight);
    expect(containerElement).toHaveClass('h-[600px]');
  });

  test('handles nested components correctly', () => {
    const NestedComponent = () => (
      <div>
        <h2>Nested Component</h2>
        <div>
          <span>Deeply nested content</span>
        </div>
      </div>
    );
    
    render(
      <FixedQuestionContainer>
        <NestedComponent />
      </FixedQuestionContainer>
    );
    
    expect(screen.getByRole('heading', { name: 'Nested Component' })).toBeInTheDocument();
    expect(screen.getByText('Deeply nested content')).toBeInTheDocument();
  });
});