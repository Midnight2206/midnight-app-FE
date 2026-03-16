export function getPaginationMeta(data, fallbackLimit = 10) {
  const pagination = data?.pagination || {};

  return {
    page: Number(pagination.page || 1),
    limit: Number(pagination.limit || fallbackLimit),
    total: Number(pagination.total || 0),
    totalPages: Number(pagination.totalPages || 1),
  };
}

export function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 0) return [];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}
