import { defineConfig } from '@semilayer/core'

export default defineConfig({
  stack: 'default',
  sources: {
    main: {
      bridge: '@semilayer/bridge-postgres',
    },
  },
  lenses: {
    // Define your lenses here. Example:
    //
    // articles: {
    //   source: 'main',
    //   table: 'articles',
    //   fields: {
    //     id: { type: 'number', primaryKey: true },
    //     title: { type: 'text' },
    //     body: { type: 'text' },
    //   },
    //   facets: {
    //     search: { fields: ['title', 'body'] },
    //   },
    // },
  },
})
