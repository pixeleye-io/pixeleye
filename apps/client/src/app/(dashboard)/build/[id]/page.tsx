import { Container } from "@pixeleye/ui";

export default async function BuildPage({
  params,
}: {
  params: { id: string };
}) {
  return <Container>{params.id}</Container>;
}
