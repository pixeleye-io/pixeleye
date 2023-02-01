import Breadcrumbs from "./breadcrumbs";

export default {
  title: "navigation/Breadcrumbs",
  component: Breadcrumbs,
};

export const Default = () => (
  <Breadcrumbs>
    <Breadcrumbs.Item hideLeadingSlash href="#">
      Home
    </Breadcrumbs.Item>
    <Breadcrumbs.Item href="#">Library</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#">Data</Breadcrumbs.Item>
  </Breadcrumbs>
);
