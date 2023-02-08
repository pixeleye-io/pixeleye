"use client";

import { api } from "~/utils/api";
import { useRegisterSegment } from "../../navbar";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { data } = api.project.getProject.useQuery({ id: params.id });

  useRegisterSegment(
    params.id,
    2,
    data
      ? {
          name: data.name,
          value: params.id,
        }
      : undefined,
  );
  return (
    <div>
      <h1>Project {params.id}</h1>
    </div>
  );
}
