'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface ProductPaginationProps {
  currentPage: number
  totalPages: number
}

export function ProductPagination({ currentPage, totalPages }: ProductPaginationProps) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/products?${params.toString()}`
  }

  if (totalPages <= 1) return null

  const pages = generatePagination(currentPage, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 0 && (
          <PaginationItem>
            <PaginationPrevious asChild>
              <Link href={createPageUrl(currentPage - 1)}>Anterior</Link>
            </PaginationPrevious>
          </PaginationItem>
        )}

        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <PaginationItem key={pageNum}>
              <PaginationLink asChild isActive={isActive}>
                <Link href={createPageUrl(pageNum)}>{pageNum + 1}</Link>
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationNext asChild>
              <Link href={createPageUrl(currentPage + 1)}>Próxima</Link>
            </PaginationNext>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

function generatePagination(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }

  if (current < 3) {
    return [0, 1, 2, 3, '...', total - 1]
  }

  if (current > total - 4) {
    return [0, '...', total - 4, total - 3, total - 2, total - 1]
  }

  return [0, '...', current - 1, current, current + 1, '...', total - 1]
}
