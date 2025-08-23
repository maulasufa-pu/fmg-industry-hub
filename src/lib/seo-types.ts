export type SeoDoc = {
  path: `/${string}`;
  title: string;
  description: string;
  image?: string;
  keywords?: readonly string[];
};

export type SeoDB = Record<`/${string}`, SeoDoc>;
