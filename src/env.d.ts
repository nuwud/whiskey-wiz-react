/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_SHOPIFY_STORE_URL: string;
  readonly VITE_SHOPIFY_ACCESS_TOKEN: string;
  readonly VITE_SHOPIFY_SHOP_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
