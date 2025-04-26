import { toast as sonnerToast } from "sonner"; // Assuming you use "sonner" package for toasts.

export const toast = {
  success: (message) => sonnerToast.success(message),
  error: (message) => sonnerToast.error(message),
  info: (message) => sonnerToast(message),
};
