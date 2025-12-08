import type { AxiosError } from "axios";

type AxiosErrorPayload = {
  error?: string;
  message?: string;
};

const isAxiosError = (error: unknown): error is AxiosError<AxiosErrorPayload> => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in (error as Record<string, unknown>)
  );
};

export const getErrorMessage = (error: unknown, fallback = "An unexpected error occurred."): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string") {
      return data;
    }

    if (data) {
      return data.error ?? data.message ?? fallback;
    }
  }

  return fallback;
};
