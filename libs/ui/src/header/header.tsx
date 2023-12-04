import { cx } from "class-variance-authority";
import { Divider } from "../divider";
import { ReactNode } from "react";

export interface HeaderProps {
  children?: ReactNode;
  className?: string;
}

function Header({ children, className }: HeaderProps) {
  return (
    <header className={cx("sticky top-0 z-40 bg-surface-container-lowest", className)}>
      {children}
      <Divider />
    </header>
  );
}

export default Header;
