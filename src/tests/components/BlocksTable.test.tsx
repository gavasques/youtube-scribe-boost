
// Integration tests for BlocksTable component
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { BlocksTable } from '@/components/Blocks/BlocksTable'

const mockBlocks = [
  {
    id: '1',
    title: 'Test Block',
    content: 'Test content',
    type: 'GLOBAL' as const,
    scope: 'PERMANENT' as const,
    priority: 1,
    isActive: true,
    categories: [],
    createdAt: '2024-01-01'
  }
]

const mockProps = {
  blocks: mockBlocks,
  onEdit: vi.fn(),
  onToggleActive: vi.fn(),
  onDelete: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn()
}

describe('BlocksTable', () => {
  it('should render blocks table with data', () => {
    render(<BlocksTable {...mockProps} />)
    
    expect(screen.getByText('Test Block')).toBeInTheDocument()
    expect(screen.getByText('GLOBAL')).toBeInTheDocument()
  })

  it('should show empty state when no blocks', () => {
    render(<BlocksTable {...mockProps} blocks={[]} />)
    
    expect(screen.getByText(/nenhum bloco encontrado/i)).toBeInTheDocument()
  })
})
