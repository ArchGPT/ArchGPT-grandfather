import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '🐶 archgpt',
  description: 'Git hooks made easy',
  base: '/archgpt/',
  themeConfig: {
    outline: [2, 3],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/typicode/archgpt' },
    ],
    carbonAds: {
      code: 'CWYDP53L',
      placement: 'typicodegithubio',
    },
    sidebar: [
      { text: 'Introduction', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Guide', link: '/guide' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
      { text: 'Migrating from v4', link: '/migrating-from-v4' },
    ],
  },
})
