"use client";

import { useQueryClient } from "@tanstack/react-query";
import { API_SECRET } from "../../add/page";

interface TokenViewProps {
  projectId: string;
  projectKey: string;
}

export default function TokenView({ projectId, projectKey }: TokenViewProps) {
  const secret = useQueryClient().getQueryData([
    API_SECRET,
    projectId,
  ]) as string;

  return (
    <div>
      <h1>Token</h1>
      <p>Key: {projectKey}</p>
      <p>Secret: {secret}</p>
    </div>
  );
}
