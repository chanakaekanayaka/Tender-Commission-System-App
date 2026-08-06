import { z } from "zod";

export const linkVendorExcelUploadSchema = z.object({
  priceScheduleId: z.string().trim().min(1, "Select a Price Schedule to link."),
});

export type LinkVendorExcelUploadInput = z.infer<typeof linkVendorExcelUploadSchema>;
