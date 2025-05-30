import React, { useMemo } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './InLink.module.scss';

export interface InLinkProps {
  /**
   * URL to link to - will be processed through useBaseUrl
   */
  href: string;
  
  /**
   * Link content
   */
  children: React.ReactNode;
  
  /**
   * CSS class name
   */
  className?: string;
  
  /**
   * Enable smart wrapping before parentheses
   * @default true
   */
  smartWrap?: boolean;
}

/**
 * Processes text to add zero-width spaces before parentheses for smart wrapping
 */
const processTextForSmartWrap = (text: string): string => {
  // Insert zero-width space before the first opening parenthesis
  return text.replace(/\(/g, '\u200B(');
};

/**
 * Recursively processes React children to apply smart wrapping to text nodes
 */
const processChildrenForSmartWrap = (children: React.ReactNode): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return processTextForSmartWrap(child);
    }
    if (React.isValidElement(child)) {
      const childWithProps = child as React.ReactElement<any>;
      if (childWithProps.props.children) {
        return React.cloneElement(childWithProps, {
          ...childWithProps.props,
          children: processChildrenForSmartWrap(childWithProps.props.children),
        });
      }
    }
    return child;
  });
};

/**
 * InLink component for internal documentation links with consistent styling
 * and smart text wrapping that breaks before parentheses when needed
 */
export const InLink: React.FC<InLinkProps> = ({
  href,
  children,
  className,
  smartWrap = true,
}) => {
  // Process URL through useBaseUrl
  const processedHref = useBaseUrl(href);
  
  // Process children for smart wrapping if enabled
  const processedChildren = useMemo(() => {
    if (smartWrap) {
      return processChildrenForSmartWrap(children);
    }
    return children;
  }, [children, smartWrap]);
  
  return (
    <Link
      to={processedHref}
      className={clsx(
        'linkInline',
        styles.inLink,
        className
      )}
    >
      {processedChildren}
    </Link>
  );
};

export default InLink;