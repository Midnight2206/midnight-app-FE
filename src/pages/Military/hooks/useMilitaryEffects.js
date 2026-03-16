import { useEffect } from "react";

export function useMilitaryEffects({
  canRegisterSizes,
  registrationCategories,
  setSelectedRegistrationCategoryIds,
  yearOptions,
  selectedYear,
  setSelectedYear,
  setPage,
  setRegistrationImportPreview,
  registrationImportKeepExisting,
  selectedRegistrationCategoryIds,
  searchInput,
  setSearchTerm,
}) {
  useEffect(() => {
    if (!canRegisterSizes) return;
    if (!registrationCategories.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRegistrationCategoryIds([]);
      return;
    }

    setSelectedRegistrationCategoryIds((prev) => {
      const validSet = new Set(registrationCategories.map((category) => category.id));
      const filtered = prev.filter((id) => validSet.has(id));
      if (filtered.length > 0) return filtered;
      return registrationCategories.map((category) => category.id);
    });
  }, [canRegisterSizes, registrationCategories, setSelectedRegistrationCategoryIds]);

  useEffect(() => {
    if (yearOptions.includes(selectedYear)) return;
    if (yearOptions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedYear(yearOptions[0]);
      setPage(1);
    }
  }, [selectedYear, yearOptions, setSelectedYear, setPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegistrationImportPreview(null);
  }, [
    selectedYear,
    registrationImportKeepExisting,
    selectedRegistrationCategoryIds,
    setRegistrationImportPreview,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchTerm]);
}

