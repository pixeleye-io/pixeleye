import { HomeHeader } from "./homeHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
        <HomeHeader />
        {children}
    </>
  );
}
