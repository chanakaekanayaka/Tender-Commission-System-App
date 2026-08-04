/** Shared default page size for backend-paginated tables — imported by both Server Component
 *  pages (passed into `paginateFind`) and client table components (passed into `Pagination`'s
 *  `limit` prop for the "Showing X–Y of Z" label), so the two never drift apart. */
export const DEFAULT_PAGE_SIZE = 10;
