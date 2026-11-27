import { defineConfig } from 'vitepress';
import { sidebar } from './sidebar';

const repo = 'https://github.com/darshantj/dev-darshan';

export default defineConfig({
  title: 'Full-Stack AI, End to End',
  description: 'Building a production-style, AI-powered full-stack application from scratch.',
  lang: 'en-US',
  base: '/dev-darshan/',
  cleanUrls: true, // /guide/local-setup instead of /guide/local-setup.html
  lastUpdated: true, // "Last updated" from git history on every page

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-we-are-building' },
      { text: 'GitHub', link: repo },
    ],
    sidebar,
    search: { provider: 'local' },
    outline: [2, 3],
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    socialLinks: [{ icon: 'github', link: repo }],
  },
});
