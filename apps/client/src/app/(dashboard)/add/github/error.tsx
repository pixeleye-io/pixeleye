"use client";

export default function GithubAddError({ error }: { error: Error }) {
  return <>Error: {error}</>;
}
