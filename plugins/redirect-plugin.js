/**
 * Custom plugin to integrate element redirects during build
 */

export default function redirectPlugin(context, options) {
  return {
    name: 'element-redirect-plugin',
    
    async loadContent() {
      // Dynamically import the redirects during build
      const { generateRedirects } = await import('../scripts/generate-element-redirects.js');
      const redirectConfig = await generateRedirects();
      return redirectConfig.redirects;
    },
    
    async contentLoaded({ content, actions }) {
      // The redirects are handled by the client-redirects plugin
      // which we configure in docusaurus.config.ts
    }
  };
}