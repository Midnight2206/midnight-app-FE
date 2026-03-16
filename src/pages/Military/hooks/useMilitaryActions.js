import { toast } from "sonner";

import { getApiErrorMessage } from "@/utils/apiError";

export function useMilitaryActions({
  confirm,
  sortConfig,
  setSortConfig,
  setPage,
  newUnitName,
  createUnit,
  setNewUnitName,
  refetchUnits,
  downloadTemplate,
  canImport,
  importFile,
  militaryImportType,
  importMilitaries,
  setImportFile,
  setMilitaryImportReport,
  refetch,
  setSelectedRegistrationCategoryIds,
  canRegisterSizes,
  selectedRegistrationCategoryIds,
  downloadRegistrationTemplate,
  registrationTemplateIncludeExisting,
  selectedYear,
  registrationImportFile,
  registrationImportPreview,
  registrationImportKeepExisting,
  importMilitaryRegistrations,
  setRegistrationImportFile,
  setRegistrationImportPreview,
  setOpenRegistrationImportDialog,
  previewMilitaryRegistrationsImport,
  isSuperAdmin,
  newRegistrationYear,
  createMilitaryRegistrationYear,
  setSelectedYear,
  refetchYears,
  selectedUnitId,
  resetMilitaries,
  refetchRegistrationList,
  selectedMilitary,
  updateMilitaryRegistrations,
  setOpenRegistrationDialog,
  setSelectedMilitary,
  transferTargetUnits,
  selectedType,
  setCutTransferMilitary,
  setCutTransferTargetUnitId,
  setCutTransferTypeId,
  setCutTransferYear,
  setCutTransferNote,
  setOpenCutTransferDialog,
  cutTransferMilitary,
  cutTransferTypeId,
  cutTransferTargetUnitId,
  cutTransferYear,
  cutTransferNote,
  createCutTransferRequest,
  refetchIncomingTransferRequests,
  acceptTransferRequest,
  undoCutTransferRequest,
  canManageRegistrationPeriod,
  upsertRegistrationPeriod,
  isCreatingCutTransferRequest,
  isAcceptingTransferRequest,
  isUndoingCutTransferRequest,
  yearStatusMap,
}) {
  const handleSort = (key) => {
    setPage(1);
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: "asc" };
    });
  };

  const sortLabel = sortConfig.direction === "asc" ? "A-Z" : "Z-A";

  const handleCreateUnit = async (e) => {
    e.preventDefault();

    if (!newUnitName.trim()) {
      toast.error("Vui lòng nhập tên đơn vị.");
      return;
    }

    try {
      await createUnit({ name: newUnitName.trim() }).unwrap();
      toast.success("Tạo đơn vị thành công.");
      setNewUnitName("");
      await refetchUnits();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo đơn vị thất bại."));
    }
  };

  const handleDownloadTemplate = async () => {
    if (!militaryImportType) {
      toast.error("Vui lòng chọn danh sách cần tải template.");
      return;
    }

    try {
      const rawData = await downloadTemplate({
        type: militaryImportType,
      }).unwrap();
      const blob = rawData instanceof Blob ? rawData : new Blob([rawData]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `military-import-template-${militaryImportType}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file template.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tải template thất bại."));
    }
  };

  const handleImport = async () => {
    if (!canImport) return;
    if (!militaryImportType) {
      toast.error("Vui lòng chọn danh sách cần import.");
      return;
    }
    if (!importFile) {
      toast.error("Vui lòng chọn file import.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("type", militaryImportType);

      const raw = await importMilitaries(formData).unwrap();
      const payload = raw?.data || raw;
      const importedRows = Number(payload?.importedRows || 0);
      const skippedRows = Number(payload?.skippedRows || 0);

      setMilitaryImportReport({
        batchId: payload?.batchId || "",
        importedRows,
        skippedRows,
        importedNewRows: Number(payload?.importedNewRows || 0),
        importedTransferRows: Number(payload?.importedTransferRows || 0),
        conflicts: Array.isArray(payload?.conflicts) ? payload.conflicts : [],
      });

      if (skippedRows > 0) {
        toast.warning(
          `Import hoàn tất: ${importedRows} dòng thành công, ${skippedRows} dòng bị bỏ qua do xung đột.`,
        );
      } else {
        toast.success(`Import danh sách quân nhân thành công (${importedRows} dòng).`);
      }
      setImportFile(null);
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Import thất bại."));
    }
  };

  const handleToggleRegistrationCategory = (categoryId) => {
    setSelectedRegistrationCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleDownloadRegistrationTemplate = async () => {
    if (!canRegisterSizes) return;
    if (selectedRegistrationCategoryIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục để tạo template.");
      return;
    }

    try {
      const rawData = await downloadRegistrationTemplate({
        categoryIds: selectedRegistrationCategoryIds.join(","),
        includeExisting: registrationTemplateIncludeExisting ? "true" : "false",
        year: selectedYear,
      }).unwrap();
      const blob = rawData instanceof Blob ? rawData : new Blob([rawData]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `size-registration-template-${selectedYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tạo và tải template đăng ký cỡ số.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo template đăng ký cỡ số thất bại."));
    }
  };

  const handleImportRegistrations = async () => {
    if (!canRegisterSizes) return;
    if (!registrationImportFile) {
      toast.error("Vui lòng chọn file import đăng ký cỡ số.");
      return;
    }
    if (selectedRegistrationCategoryIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục để import.");
      return;
    }
    const approvalToken = registrationImportPreview?.approval?.token;
    if (!approvalToken) {
      toast.error("Bạn cần xem trước (dry-run) trước khi import để đảm bảo an toàn.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", registrationImportFile);
      formData.append("categoryIds", selectedRegistrationCategoryIds.join(","));
      formData.append("keepExisting", registrationImportKeepExisting ? "true" : "false");
      formData.append("year", String(selectedYear));
      formData.append("approvalToken", approvalToken);
      await importMilitaryRegistrations(formData).unwrap();
      toast.success("Import đăng ký cỡ số thành công.");
      setRegistrationImportFile(null);
      setRegistrationImportPreview(null);
      setOpenRegistrationImportDialog(false);
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Import đăng ký cỡ số thất bại."));
    }
  };

  const handlePreviewRegistrationImport = async () => {
    if (!canRegisterSizes) return;
    if (!registrationImportFile) {
      toast.error("Vui lòng chọn file import đăng ký cỡ số.");
      return;
    }
    if (selectedRegistrationCategoryIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục để preview import.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", registrationImportFile);
      formData.append("categoryIds", selectedRegistrationCategoryIds.join(","));
      formData.append("keepExisting", registrationImportKeepExisting ? "true" : "false");
      formData.append("year", String(selectedYear));
      const raw = await previewMilitaryRegistrationsImport(formData).unwrap();
      const previewData = raw?.data?.data ?? raw?.data ?? raw;
      setRegistrationImportPreview(previewData || null);
      toast.success("Đã tạo preview import. Vui lòng kiểm tra trước khi xác nhận import.");
    } catch (err) {
      setRegistrationImportPreview(null);
      toast.error(getApiErrorMessage(err, "Preview import thất bại."));
    }
  };

  const handleCreateRegistrationYear = async () => {
    if (!isSuperAdmin) return;

    const year = Number(newRegistrationYear);
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      toast.error("Năm phải trong khoảng 2020 - 2100.");
      return;
    }

    try {
      await createMilitaryRegistrationYear({ year, isActive: true }).unwrap();
      toast.success(`Đã thêm năm ${year} vào danh mục năm.`);
      setSelectedYear(year);
      await refetchYears();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thêm năm thất bại."));
    }
  };

  const handleReset = async () => {
    if (!isSuperAdmin) return;
    const ok = await confirm({
      title: "Reset dữ liệu quân nhân",
      description: "Bạn chắc chắn muốn reset dữ liệu quân nhân? Thao tác này không thể hoàn tác.",
      confirmText: "Reset dữ liệu",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const params = selectedUnitId ? { unitId: selectedUnitId } : {};
      await resetMilitaries(params).unwrap();
      toast.success("Reset dữ liệu thành công.");
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reset dữ liệu thất bại."));
    }
  };

  const refreshAll = async () => {
    if (canRegisterSizes) {
      await Promise.all([refetch(), refetchRegistrationList(), refetchUnits(), refetchYears()]);
      return;
    }
    await Promise.all([refetch(), refetchUnits(), refetchYears()]);
  };

  const handleOpenRegistrationDialog = (military) => {
    setSelectedMilitary(military);
    setOpenRegistrationDialog(true);
  };

  const handleCloseRegistrationDialog = () => {
    setOpenRegistrationDialog(false);
    setSelectedMilitary(null);
  };

  const handleSaveRegistrations = async (registrations) => {
    if (!selectedMilitary?.id) return;

    try {
      await updateMilitaryRegistrations({
        militaryId: selectedMilitary.id,
        year: selectedYear,
        registrations,
      }).unwrap();
      toast.success("Lưu đăng ký cỡ số thành công.");
      setOpenRegistrationDialog(false);
      setSelectedMilitary(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lưu đăng ký cỡ số thất bại."));
    }
  };

  const handleOpenCutTransferDialog = (military) => {
    const typeOptions = Array.isArray(military?.typeAssignments)
      ? military.typeAssignments
          .map((item) => item?.type)
          .filter((item) => Number.isInteger(Number(item?.id)) && Number(item.id) > 0)
      : [];
    const preferredTypeId = Number(
      typeOptions.find((item) => item.code === selectedType)?.id || 0,
    );
    const firstTypeId = Number(typeOptions?.[0]?.id || 0);
    const initialTypeId =
      Number.isInteger(preferredTypeId) && preferredTypeId > 0
        ? preferredTypeId
        : firstTypeId;
    setCutTransferMilitary(military);
    setCutTransferTypeId(Number.isInteger(initialTypeId) && initialTypeId > 0 ? String(initialTypeId) : "");
    setCutTransferTargetUnitId(
      transferTargetUnits.length > 0 ? String(transferTargetUnits[0].id) : "",
    );
    setCutTransferYear(selectedYear);
    setCutTransferNote("");
    setOpenCutTransferDialog(true);
  };

  const handleSubmitCutTransferRequest = async () => {
    if (!cutTransferMilitary?.id) return;
    const typeId = Number(cutTransferTypeId);
    const toUnitId = Number(cutTransferTargetUnitId);
    const transferYear = Number(cutTransferYear);

    if (!Number.isInteger(typeId) || typeId <= 0) {
      toast.error("Vui lòng chọn loại quân nhân.");
      return;
    }

    if (!Number.isInteger(toUnitId) || toUnitId <= 0) {
      toast.error("Vui lòng chọn đơn vị chuyển đến.");
      return;
    }

    if (!Number.isInteger(transferYear) || transferYear < 1900 || transferYear > 2100) {
      toast.error("Năm điều chuyển không hợp lệ.");
      return;
    }

    try {
      await createCutTransferRequest({
        militaryId: cutTransferMilitary.id,
        typeId,
        toUnitId,
        transferYear,
        note: cutTransferNote.trim() || undefined,
      }).unwrap();
      toast.success("Đã cắt bảo đảm và gửi yêu cầu đến đơn vị mới.");
      setOpenCutTransferDialog(false);
      setCutTransferMilitary(null);
      setCutTransferTypeId("");
      await Promise.all([refetch(), refetchIncomingTransferRequests()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo yêu cầu điều chuyển thất bại."));
    }
  };

  const handleAcceptTransferRequest = async (requestId, assignedUnitId) => {
    const parsedAssignedUnitId = Number(assignedUnitId);
    if (!Number.isInteger(parsedAssignedUnitId) || parsedAssignedUnitId <= 0) {
      toast.error("Vui lòng chọn assignedUnit tiếp nhận trước khi nhận bảo đảm.");
      return;
    }

    try {
      await acceptTransferRequest({ requestId, assignedUnitId: parsedAssignedUnitId }).unwrap();
      toast.success("Đã nhận bảo đảm quân trang cho quân nhân.");
      await Promise.all([refetch(), refetchIncomingTransferRequests()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Nhận bảo đảm thất bại."));
    }
  };

  const handleUndoCutTransferRequest = async (requestId) => {
    const confirmed = await confirm({
      title: "Hoàn tác cắt bảo đảm",
      description: "Bạn có chắc muốn hoàn tác cắt bảo đảm và hủy yêu cầu điều chuyển?",
      confirmText: "Xác nhận hoàn tác",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      await undoCutTransferRequest({ requestId }).unwrap();
      toast.success("Đã hoàn tác cắt bảo đảm.");
      await Promise.all([refetch(), refetchIncomingTransferRequests()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Hoàn tác thất bại."));
    }
  };

  const handleChangeRegistrationPeriodStatus = async (status) => {
    if (!canManageRegistrationPeriod) return;
    try {
      await upsertRegistrationPeriod({
        year: selectedYear,
        status,
      }).unwrap();
      toast.success(
        `Đã ${status === "OPEN" ? "mở" : "khóa"} đợt đăng ký cỡ số năm ${selectedYear}.`,
      );
      await Promise.all([refetchYears(), refetchRegistrationList()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật trạng thái đợt đăng ký thất bại."));
    }
  };

  const isSubmittingCutTransfer =
    isCreatingCutTransferRequest || isAcceptingTransferRequest || isUndoingCutTransferRequest;
  const isSelectedYearOpen = yearStatusMap.get(selectedYear) === "OPEN";

  return {
    handleSort,
    sortLabel,
    handleCreateUnit,
    handleDownloadTemplate,
    handleImport,
    handleToggleRegistrationCategory,
    handleDownloadRegistrationTemplate,
    handleImportRegistrations,
    handlePreviewRegistrationImport,
    handleCreateRegistrationYear,
    handleReset,
    refreshAll,
    handleOpenRegistrationDialog,
    handleCloseRegistrationDialog,
    handleSaveRegistrations,
    handleOpenCutTransferDialog,
    handleSubmitCutTransferRequest,
    handleAcceptTransferRequest,
    handleUndoCutTransferRequest,
    handleChangeRegistrationPeriodStatus,
    isSubmittingCutTransfer,
    isSelectedYearOpen,
  };
}
