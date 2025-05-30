import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface ButtonProps {
  /** The button text content */
  children: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional additional CSS class */
  className?: string;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
  type = 'button',
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(styles.button, className, {
        [styles.disabled]: disabled,
      })}
    >
      {children}
    </button>
  );
};

export default Button;