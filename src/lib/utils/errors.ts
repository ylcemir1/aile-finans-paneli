import type { ActionResult } from "@/types";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  "23505": "Bu kayit zaten mevcut",
  "23503": "Iliskili kayit bulunamadi",
  "42501": "Bu islemi yapmaya yetkiniz yok",
  PGRST116: "Kayit bulunamadi",
};

export function handleActionError(error: unknown): ActionResult {
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }

  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code: string; message: string };
    const message = ERROR_MESSAGES[pgError.code];
    if (message) {
      return { success: false, error: message };
    }
  }

  console.error("Unexpected error:", error);
  return {
    success: false,
    error: "Beklenmeyen bir hata olustu. Lutfen tekrar deneyin.",
  };
}
