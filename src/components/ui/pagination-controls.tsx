"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationControlsProps) {
  if (totalPages <= 1 && !totalItems) return null

  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1
  const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }
      
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 bg-white dark:bg-[#161B22]/50 border-t border-slate-100 dark:border-[#2A3242] rounded-b-2xl transition-colors duration-300">
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {totalItems ? (
          <>
            Showing <span className="font-bold text-slate-900 dark:text-white">{startItem}</span> to{" "}
            <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> results
          </>
        ) : (
          `Page ${currentPage} of ${totalPages}`
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          className="dark:bg-[#1C2128] dark:border-[#30363D] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#30363D]"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          className="dark:bg-[#1C2128] dark:border-[#30363D] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#30363D]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1 px-2">
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onPageChange(page)}
              className={
                currentPage === page
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                  : "dark:bg-[#1C2128] dark:border-[#30363D] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#30363D] w-8 h-8 font-bold"
              }
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
          className="dark:bg-[#1C2128] dark:border-[#30363D] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#30363D]"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
          className="dark:bg-[#1C2128] dark:border-[#30363D] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#30363D]"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
