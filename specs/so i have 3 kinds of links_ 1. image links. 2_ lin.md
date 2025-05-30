<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# so i have 3 kinds of links: 1. image links. 2: links to other pages in the site 3: links to the web

the site is served from github pages using a custom domain: https://iflastandards.info/ISBDM and tested locally at: http://localhost:3000/ISBDM/. All of the links are generated from tsx components.
how do i approach each one?

Here’s how you should approach each type of link in your Docusaurus TSX components, given your deployment at `https://iflastandards.info/ISBDM` (with `baseUrl: '/ISBDM/'`) and local development at `http://localhost:3000/ISBDM/`:

---

## **1. Image Links**

**Best Practice:**
Always generate image URLs using `useBaseUrl` or by importing the image file. This ensures the correct `/ISBDM/` prefix is included, regardless of environment.

**Example (using `useBaseUrl`):**

```tsx
import useBaseUrl from '@docusaurus/useBaseUrl';

<img>
```

- This will resolve to `/ISBDM/img/x011.png` in production and `/ISBDM/img/x011.png` locally, matching your deployment[^2][^9].

**Alternative (importing the image):**

```tsx
import imageUrl from '@site/static/img/x011.png';

<img>
```

- This method also works and benefits from Webpack’s asset handling[^2][^9].

---

## **2. Links to Other Pages in the Site**

**Best Practice:**
Use Docusaurus’s `&lt;Link&gt;` component and always generate URLs with `useBaseUrl` or relative paths, not hardcoded absolute paths.

**Example:**

```tsx
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

&lt;Link to={useBaseUrl('/docs/assess/')}&gt;Assess Documentation&lt;/Link&gt;
```

- Using `useBaseUrl` ensures the base path is correct on both local and production deployments[^3][^4][^7].

**If linking to docs by document ID (recommended for maintainability):**

```tsx
&lt;Link to={useBaseUrl('/docs/your-doc-id')}&gt;Your Doc&lt;/Link&gt;
```

- Or use relative paths if within the same docs plugin instance[^5][^8].

---

## **3. Links to the Web (External Links)**

**Best Practice:**
Use the `&lt;Link&gt;` component for consistency, but set `target="_blank"` and `rel="noopener noreferrer"` for security and UX.

**Example:**

```tsx
import Link from '@docusaurus/Link';

&lt;Link to="https://external.site/resource" target="_blank" rel="noopener noreferrer"&gt;
  External Resource
&lt;/Link&gt;
```

- This will open the link in a new tab and follow security best practices[^5][^6].

**Tip:**
For many external links, consider centralizing them in a constants file for maintainability[^5].

---

## **Summary Table**

| Link Type | How to Generate in TSX Component | Notes |
| :-- | :-- | :-- |
| Images | `useBaseUrl('/img/filename.png')` or import image file | Handles base URL automatically |
| Internal Pages | `&lt;Link to={useBaseUrl('/docs/page')}&gt;...&lt;/Link&gt;` or relative paths | Always use `useBaseUrl` or `&lt;Link /&gt;` |
| External Links | `&lt;Link to="https://..." target="_blank" rel="noopener noreferrer"&gt;` | Opens in new tab, secure |


---

**Key Points:**

- Never hardcode `/ISBDM/` in your links; always use `useBaseUrl` or asset imports to ensure portability[^2][^3][^7].
- Use `&lt;Link&gt;` for all navigation to benefit from prefetching and SPA navigation[^4][^5].
- For images and assets, `useBaseUrl` or importing is preferred over absolute URLs[^2][^9].
- For external links, always include `target="_blank"` and `rel="noopener noreferrer"` for safety[^5][^6].

This approach guarantees your links and images work seamlessly both locally and on GitHub Pages, regardless of the base URL.

<div style="text-align: center">⁂</div>

[^1]: ISBDM

[^2]: https://docusaurus.io/docs/static-assets

[^3]: https://docusaurus.io/docs/advanced/routing

[^4]: https://docusaurus.io/docs/2.x/docusaurus-core

[^5]: https://app.studyraid.com/en/read/12346/398571/linking-between-documentation-pages-and-external-resources

[^6]: https://stackoverflow.com/questions/55935949/docusaurus-how-to-open-external-links-in-new-tab

[^7]: https://docusaurus.io/docs/next/advanced/routing

[^8]: https://docusaurus.io/docs/markdown-features/links

[^9]: https://docusaurus.io/docs/markdown-features/assets

[^10]: https://docusaurus.io/docs/deployment

[^11]: https://docusaurus.io/docs/api/docusaurus-config

[^12]: https://github.com/MichalLytek/Docusaurus/blob/master/docs/getting-started-publishing.md

[^13]: https://docusaurus.io/docs/3.3.2/api/plugins/@docusaurus/plugin-content-pages

[^14]: https://github.com/facebook/docusaurus/discussions/4633

[^15]: https://appliku.com/post/start-and-deploy-docusaurus-documentation-static-site-on-your-own-server/

[^16]: https://docusaurus.io/docs/2.x/api/plugins/@docusaurus/plugin-content-docs

[^17]: https://github.com/facebook/docusaurus/blob/main/website/src/pages/index.tsx

[^18]: https://github.com/facebook/docusaurus/issues/4111

[^19]: https://docusaurus.io/docs/3.3.2/api/plugins/@docusaurus/plugin-content-blog

[^20]: https://docusaurus.io/docs/typescript-support

[^21]: https://docusaurus.io/docs/markdown-features/links

[^22]: https://docusaurus.io/docs/3.4.0/api/plugins/@docusaurus/plugin-content-docs

[^23]: https://docusaurus.community/contributing/customisations/

[^24]: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

[^25]: https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs

[^26]: https://docusaurus.io/docs/markdown-features/react

[^27]: https://github.com/facebook/docusaurus/issues/3889

[^28]: https://github.com/facebook/docusaurus/issues/5374

[^29]: https://github.com/facebook/docusaurus/issues/6809

[^30]: https://github.com/facebook/docusaurus/issues/2697

[^31]: https://docusaurus.community/knowledge/component-library/new/Imageonclick/

[^32]: https://docusaurus.io/docs/api/themes/configuration

[^33]: https://v1.docusaurus.io/docs/en/1.14.4/navigation

[^34]: https://github.com/facebook/docusaurus/issues/7402

[^35]: https://stackoverflow.com/questions/63268853/how-do-i-link-to-non-docusaurus-defined-routes-from-a-docusuarus-footer

[^36]: https://docusaurus.io/docs/3.3.2/api/themes/configuration

[^37]: https://docusaurus.io/docs/sidebar

[^38]: https://docusaurus.io/feature-requests/p/external-links-opening-in-new-tabs-should-be-optional-a11y

[^39]: https://github.com/facebook/docusaurus/issues/7047

[^40]: https://github.com/facebook/docusaurus/issues/3024

[^41]: https://github.com/facebook/docusaurus/issues/2515

[^42]: https://docusaurus.io/blog/preparing-your-site-for-docusaurus-v3

[^43]: https://docusaurus.community/knowledge/component-library/new/Card/

[^44]: https://github.com/facebook/docusaurus/issues/2724

[^45]: https://docusaurus.io/docs/deployment

[^46]: https://docusaurus.io/docs/static-assets

[^47]: https://docusaurus.io/docs/creating-pages

[^48]: https://app.studyraid.com/en/read/12346/398586/configuring-custom-domains-and-https

[^49]: https://github.com/facebook/docusaurus/issues/2832

[^50]: https://docusaurus.io/docs/advanced/routing

[^51]: https://docusaurus.io/docs/versioning

[^52]: https://docusaurus.io/docs/next/migration/v3

