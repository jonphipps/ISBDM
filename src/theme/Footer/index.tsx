import React from 'react';
import Footer from '@theme-original/Footer';
import type FooterType from '@theme/Footer';
import type {WrapperProps} from '@docusaurus/types';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.scss';

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <footer className={styles.iflaFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>Quick Links</h3>
              <ul className={styles.footerLinks}>
                <li><Link to={useBaseUrl('/docs')}>Documentation</Link></li>
                <li><Link to={useBaseUrl('/docs/about')}>About</Link></li>
                <li><Link to={useBaseUrl('/blog')}>Blog</Link></li>
                <li><Link to={useBaseUrl('/sitemap')}>Sitemap</Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>ISBD Elements</h3>
              <ul className={styles.footerLinks}>
                <li><Link to={useBaseUrl('/docs/statements')}>Statements</Link></li>
                <li><Link to={useBaseUrl('/docs/notes')}>Notes</Link></li>
                <li><Link to={useBaseUrl('/docs/attributes')}>Attributes</Link></li>
                <li><Link to={useBaseUrl('/docs/relationships/index')}>Relationships</Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>Resources</h3>
              <ul className={styles.footerLinks}>
                <li><Link to={useBaseUrl('/docs/ves')}>Value Vocabularies</Link></li>
                <li><Link to={useBaseUrl('/docs/ses')}>String Encoding Schemes</Link></li>
                <li><Link to={useBaseUrl('/docs/glossary')}>Glossary</Link></li>
                <li><Link to={useBaseUrl('/docs/fullex')}>Examples</Link></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>Connect</h3>
              <ul className={styles.footerLinks}>
                <li><Link to="https://github.com/iflastandards/ISBDM" target="_blank" rel="noopener noreferrer">GitHub</Link></li>
                <li><Link to="https://www.ifla.org" target="_blank" rel="noopener noreferrer">IFLA Website</Link></li>
              </ul>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <div className={styles.copyright}>
              <Link to="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                <img 
                  src={useBaseUrl('/img/cc0_by.png')} 
                  alt="Badge for Creative Commons Attribution 4.0 International license" 
                  height="30" 
                />
              </Link>
              <span>Gordon Dunsire and Mirna Willer (Main design and content editors).</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}