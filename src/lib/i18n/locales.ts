// Placeholder translations — have a native Sinhala speaker review these before shipping.
// Only static UI labels live here. Never put user-generated document data
// (procurement numbers, entity names, item descriptions, amounts, etc.) in
// this dictionary — those come from mock/API data and must render as-is.

export const en = {
  // Sidebar nav — shared by AdminSidebar and StaffSidebar
  "sidebar.dashboard": "Dashboard",
  "sidebar.priceSchedules": "Price Schedules",
  "sidebar.jobOrders": "Job Orders",
  "sidebar.commissions": "Commissions",
  "sidebar.otherExpenses": "Other Expenses",
  "sidebar.systemConfigs": "System Configs",
  "sidebar.create": "Create",
  "sidebar.history": "History",
  "sidebar.active": "Active",
  "sidebar.pending": "Pending",
  "sidebar.usersCreate": "Users · Create",
  "sidebar.usersList": "Users · List",

  // Staff dashboard
  "dashboard.greeting": "Hello {name} 👋",
  "dashboard.monthlyTarget": "Monthly Target",
  "dashboard.pendingCommission": "My Pending Commission",
  "dashboard.ordersToComplete": "Orders to Complete",
  "dashboard.myPerformance": "My Performance",
  "dashboard.pendingOrders": "Pending Orders ({count})",
  "dashboard.jobNumber": "Job Number",
  "dashboard.uploadBillCopy": "Upload Bill Copy",
  "dashboard.upload": "Upload",
  "dashboard.uploaded": "Uploaded",

  // Price Schedule — Create
  "tenders.createHeading": "New Price Schedule",
  "tenders.saveDraft": "Save Draft",
  "tenders.savePriceSchedule": "Save Price Schedule →",

  // Price Schedule — Source Document dropzone
  "dropzone.sourceDocument": "Source Document",
  "dropzone.dropHere": "Drop tender document here",
  "dropzone.fileTypesHint": "PDF / DOCX / image · or",
  "dropzone.browseFiles": "browse files",
  "dropzone.extracting": "AI extracting data from {fileName}…",
  "dropzone.extractedSuccessfully": "Extracted successfully",
  "dropzone.replaceFile": "Replace file",
  "dropzone.parse": "Parse",
  "dropzone.parsing": "Parsing…",

  // Price Schedule — Metadata form
  "metadataForm.heading": "Metadata (auto-filled by AI · read-only)",
  "metadataForm.procurementTitle": "Procurement Title",
  "metadataForm.uploadingDate": "Uploading Date",

  // Price Schedule — Line items
  "lineItems.heading": "Line Items (AI-extracted)",
  "lineItems.itemDescription": "Item Description",
  "lineItems.qty": "Qty",
  "lineItems.unitPrice": "Unit Price",
  "lineItems.vat": "VAT (15%)",
  "lineItems.subTotal": "Sub Total",
  "lineItems.totals": "TOTALS",
  "lineItems.untitledItem": "Untitled item",
  "lineItems.empty": "No line items yet — parse a document to extract them.",

  // Price Schedule — History table
  "tenders.historyHeadingStaff": "My Price Schedules",
  "tenders.historyHeadingAdmin": "Price Schedules History",
  "priceScheduleHistory.searchPlaceholder": "Search by procurement no, entity, date, value or status",
  "priceScheduleHistory.noResults": 'No price schedules match "{query}".',
  "priceScheduleHistory.export": "Export",
  "priceScheduleHistory.exportPdf": "PDF",
  "priceScheduleHistory.exportCsv": "CSV",
  "priceScheduleHistory.exportExcel": "Excel",
  "status.completed": "Completed",
  "status.draft": "Draft",

  // Commission Payments
  "commissions.pendingHeading": "Commission Payments Pending",
  "commissions.historyHeading": "Commission Payments History",
  "commissions.jobOrderNo": "Job order No",
  "commissions.amount": "Amount",
  "commissions.paymentRefNo": "Payment Ref No",
  "commissions.noPending": "No pending commission payments.",
  "commissions.noHistory": "No commission payment history yet.",

  // Shared across multiple forms/tables
  "common.procurementNo": "Procurement No",
  "common.procuringEntity": "Procuring Entity",
  "common.closingDate": "Closing Date",
  "common.totalValue": "Total Value",
  "common.status": "Status",
  "common.actions": "Actions",
  "common.view": "View",
  "common.edit": "Edit",

  "language.label": "Language",
} as const;

export type TranslationKey = keyof typeof en;

export const si: Record<TranslationKey, string> = {
  "sidebar.dashboard": "පුවරුව",
  "sidebar.priceSchedules": "මිල ලේඛන",
  "sidebar.jobOrders": "රැකියා නියෝග",
  "sidebar.commissions": "කොමිස්",
  "sidebar.otherExpenses": "වෙනත් වියදම්",
  "sidebar.systemConfigs": "පද්ධති සැකසුම්",
  "sidebar.create": "සාදන්න",
  "sidebar.history": "ඉතිහාසය",
  "sidebar.active": "ක්‍රියාකාරී",
  "sidebar.pending": "පොරොත්තු",
  "sidebar.usersCreate": "පරිශීලකයින් · සාදන්න",
  "sidebar.usersList": "පරිශීලකයින් · ලැයිස්තුව",

  "dashboard.greeting": "ආයුබෝවන් {name} 👋",
  "dashboard.monthlyTarget": "මාසික ඉලක්කය",
  "dashboard.pendingCommission": "මගේ පොරොත්තු කොමිස්",
  "dashboard.ordersToComplete": "සම්පූර්ණ කළ යුතු ඇණවුම්",
  "dashboard.myPerformance": "මගේ කාර්යසාධනය",
  "dashboard.pendingOrders": "පොරොත්තු ඇණවුම් ({count})",
  "dashboard.jobNumber": "රැකියා අංකය",
  "dashboard.uploadBillCopy": "බිල් පිටපත උඩුගත කරන්න",
  "dashboard.upload": "උඩුගත කරන්න",
  "dashboard.uploaded": "උඩුගත කළා",

  "tenders.createHeading": "නව මිල ලේඛනය",
  "tenders.saveDraft": "කෙටුම්පත සුරකින්න",
  "tenders.savePriceSchedule": "මිල ලේඛනය සුරකින්න →",

  "dropzone.sourceDocument": "මූලාශ්‍ර ලේඛනය",
  "dropzone.dropHere": "ටෙන්ඩර් ලේඛනය මෙහි දමන්න",
  "dropzone.fileTypesHint": "PDF / DOCX / රූපය · හෝ",
  "dropzone.browseFiles": "ගොනු පිරික්සන්න",
  "dropzone.extracting": "{fileName} වෙතින් AI දත්ත උපුටා ගනිමින්…",
  "dropzone.extractedSuccessfully": "සාර්ථකව උපුටා ගන්නා ලදී",
  "dropzone.replaceFile": "ගොනුව වෙනස් කරන්න",
  "dropzone.parse": "විශ්ලේෂණය කරන්න",
  "dropzone.parsing": "විශ්ලේෂණය කරමින්…",

  "metadataForm.heading": "පාර්ශ්ව දත්ත (AI මගින් ස්වයංක්‍රීයව පුරවා ඇත · කියවීමට පමණි)",
  "metadataForm.procurementTitle": "ප්‍රසම්පාදන මාතෘකාව",
  "metadataForm.uploadingDate": "උඩුගත කළ දිනය",

  "lineItems.heading": "අයිතම (AI-උපුටාගත්)",
  "lineItems.itemDescription": "අයිතම විස්තරය",
  "lineItems.qty": "ප්‍රමාණය",
  "lineItems.unitPrice": "ඒකක මිල",
  "lineItems.vat": "වැට් (15%)",
  "lineItems.subTotal": "උප එකතුව",
  "lineItems.totals": "එකතුව",
  "lineItems.untitledItem": "නම් නොකළ අයිතමය",
  "lineItems.empty": "තවම අයිතම නොමැත — ඒවා උපුටා ගැනීමට ලේඛනයක් විශ්ලේෂණය කරන්න.",

  "tenders.historyHeadingStaff": "මගේ මිල ලේඛන",
  "tenders.historyHeadingAdmin": "මිල ලේඛන ඉතිහාසය",
  "priceScheduleHistory.searchPlaceholder": "ප්‍රසම්පාදන අංකය, ආයතනය, දිනය, අගය හෝ තත්ත්වය අනුව සොයන්න",
  "priceScheduleHistory.noResults": '"{query}" ට ගැලපෙන මිල ලේඛන නොමැත.',
  "priceScheduleHistory.export": "අපනයනය",
  "priceScheduleHistory.exportPdf": "PDF",
  "priceScheduleHistory.exportCsv": "CSV",
  "priceScheduleHistory.exportExcel": "Excel",
  "status.completed": "සම්පූර්ණයි",
  "status.draft": "කෙටුම්පත",

  "commissions.pendingHeading": "පොරොත්තු කොමිස් ගෙවීම්",
  "commissions.historyHeading": "කොමිස් ගෙවීම් ඉතිහාසය",
  "commissions.jobOrderNo": "රැකියා නියෝග අංකය",
  "commissions.amount": "මුදල",
  "commissions.paymentRefNo": "ගෙවීම් යොමු අංකය",
  "commissions.noPending": "පොරොත්තු කොමිස් ගෙවීම් නොමැත.",
  "commissions.noHistory": "කොමිස් ගෙවීම් ඉතිහාසයක් තවම නොමැත.",

  "common.procurementNo": "ප්‍රසම්පාදන අංකය",
  "common.procuringEntity": "ප්‍රසම්පාදන ආයතනය",
  "common.closingDate": "අවසන් දිනය",
  "common.totalValue": "මුළු අගය",
  "common.status": "තත්ත්වය",
  "common.actions": "ක්‍රියා",
  "common.view": "බලන්න",
  "common.edit": "සංස්කරණය",

  "language.label": "භාෂාව",
};

export const locales = { en, si } as const;

export type Language = keyof typeof locales;
