"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  setPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`h-10 w-10 rounded-md text-sm font-semibold transition-colors ${
            page === i
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          {i + 1}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <button
        onClick={() => handlePageChange(0)}
        disabled={page === 0}
        className="btn h-10 w-10 p-0 disabled:opacity-50"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 0}
        className="btn h-10 w-10 p-0 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {renderPageNumbers()}
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="btn h-10 w-10 p-0 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => handlePageChange(totalPages - 1)}
        disabled={page === totalPages - 1}
        className="btn h-10 w-10 p-0 disabled:opacity-50"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
