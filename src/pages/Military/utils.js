export function getMilitaryRows(data) {
  if (!data) return [];
  if (Array.isArray(data.militaries)) return data.militaries;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function getYearOptions(registrationYears = []) {
  if (registrationYears.length > 0) {
    return registrationYears.map((item) => item.year);
  }
  const years = [];
  for (let year = 2100; year >= 2020; year -= 1) {
    years.push(year);
  }
  return years;
}

export function getRegistrationCategories(data) {
  return Array.isArray(data?.categories) ? data.categories : [];
}

export function getIncomingTransferRequests(data) {
  return Array.isArray(data?.requests) ? data.requests : [];
}

export function getIncomingTransferRequestsByYear(requests = [], selectedYear) {
  return requests.filter(
    (request) => Number(request.transferYear || 0) === Number(selectedYear),
  );
}

export function getMergedIncreaseRows(incomingMilitariesByYear = [], incomingRequestsByYear = []) {
  const rows = [];
  const requestByMilitaryId = new Map();
  for (const request of incomingRequestsByYear) {
    const militaryId = request?.military?.id;
    if (!militaryId || requestByMilitaryId.has(militaryId)) continue;
    requestByMilitaryId.set(militaryId, request);
  }

  for (const military of incomingMilitariesByYear) {
    rows.push({
      type: "military",
      military,
      request: requestByMilitaryId.get(military.id) || null,
    });
  }

  for (const request of incomingRequestsByYear) {
    rows.push({
      type: "request",
      military: request?.military || null,
      request,
    });
  }

  return rows;
}

export function filterIncreaseRows(mergedRows = [], quickFilter = "all") {
  if (quickFilter === "pending") {
    return mergedRows.filter((row) => row.type === "request" && row.request?.id);
  }
  if (quickFilter === "accepted") {
    return mergedRows.filter((row) => !(row.type === "request" && row.request?.id));
  }
  return mergedRows;
}

export function getTransferTargetUnits(allUnits = [], currentAdminUnitId) {
  return allUnits.filter((unit) => unit.id !== currentAdminUnitId);
}

export function getSizeTableCategories(registrationCategories = [], registrationMilitaries = []) {
  const filteredCategories = registrationCategories.filter((category) => !category?.isOneSize);
  if (filteredCategories.length > 0) {
    return filteredCategories.map((category) => ({
      id: category.id,
      name: category.name,
      isOneSize: category.isOneSize,
    }));
  }

  const categoryMap = new Map();
  for (const military of registrationMilitaries) {
    for (const item of military.yearlyRegistrations || []) {
      if (!item?.categoryId) continue;
      if (item.category?.isOneSize) continue;
      if (!categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.category?.name || `CAT_${item.categoryId}`,
        });
      }
    }
  }
  return [...categoryMap.values()].sort((a, b) => a.id - b.id);
}
