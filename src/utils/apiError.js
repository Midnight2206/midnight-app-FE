export function getApiErrorMessage(error, fallback = "Có lỗi xảy ra, vui lòng thử lại.") {
  const status = Number(
    error?.status ??
      error?.originalStatus ??
      error?.data?.statusCode ??
      error?.response?.status,
  );

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  const rawMessage = error?.data?.message || error?.response?.data?.message;

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    if (/forbidden|permission|không có quyền/i.test(rawMessage)) {
      return "Bạn không có quyền thực hiện thao tác này.";
    }

    if (/unauthorized|unauthenticated|đăng nhập/i.test(rawMessage)) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
    }

    return rawMessage;
  }

  return fallback;
}
