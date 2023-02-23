export default async function ReviewPage({
  params,
}: {
  params: { id: string; snapId: string };
}) {
  return (
    <div>
      <h1>Review Snapshot</h1>
      {params.id} - {params.snapId}
    </div>
  );
}
