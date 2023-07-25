import { cx } from "class-variance-authority";
import Divider from "../divider";

export interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

function Header({ children, className }: HeaderProps) {
  return (
    <header
      className={cx("sticky top-0 z-40 bg-surface", className)}
    >
      {children}
      <Divider />
    </header>
  );
}

export default Header;
