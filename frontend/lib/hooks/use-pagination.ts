"use client";

import { useState, useMemo } from "react";

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
  totalPages?: number;
}

interface UsePaginationReturn {
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  total: number;
  setTotal: (total: number) => void;
  totalPages: number;
  setTotalPages: (totalPages: number) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  total: initialTotal = 0,
  totalPages: initialTotalPages = 1,
}: UsePaginationProps = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const pagination = useMemo(
    () => ({
      page,
      limit,
      total,
      totalPages,
    }),
    [page, limit, total, totalPages]
  );

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToFirstPage = () => {
    setPage(1);
  };

  const goToLastPage = () => {
    setPage(totalPages);
  };

  const canGoNext = page < totalPages;
  const canGoPrevious = page > 1;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return {
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    pagination,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
  };
}
