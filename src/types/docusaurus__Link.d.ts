// docusaurus/src/types/docusaurus__Link.d.ts
declare module '@docusaurus/Link' {
    import * as React from 'react';
    interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
        to: string;
        children?: React.ReactNode;
        [key: string]: any;
    }
    const Link: React.FC<LinkProps>;
    export default Link;
}