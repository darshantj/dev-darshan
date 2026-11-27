import type { DefaultTheme } from 'vitepress';

/** One entry per page that exists. Add to this as each docs step lands. */
export const sidebar: DefaultTheme.Sidebar = [
  {
    text: 'Guide',
    items: [{ text: 'What we are building', link: '/guide/what-we-are-building' }],
  },
];
