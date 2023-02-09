import Divider from "../divider/divider";

export interface HeaderProps {
  children?: React.ReactNode;
}

function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      {children}
      <Divider />
    </header>
  );
}

export default Header;
