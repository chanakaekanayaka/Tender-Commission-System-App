export interface ItemSpec {
  id: string;
  label: string;
  value: string;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  specs: ItemSpec[];
}

