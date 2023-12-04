"use client";

import { Button, Input } from "@pixeleye/ui";
import { RegisterSegment } from "../../breadcrumbStore";
import { SubmitHandler, useForm } from "react-hook-form";
import { API, useTeam } from "@/libs";
import { useRouter } from "next/navigation";
import { useKeyStore } from "@/stores/apiKeyStore";
import { useEffect } from "react";

type FormValues = {
  name: string;
  url: string;
};

export default function CustomGitPage() {
  const { register, handleSubmit, formState } = useForm<FormValues>();

  const setKey = useKeyStore((state) => state.setKey);

  const { team } = useTeam();

  const router = useRouter();

  useEffect(() => {
    if (team?.type !== "user") {
      router.replace(`/add/${team?.type}?team=${team?.id}`);
    }
  }, [router, team]);

  const onSubmit: SubmitHandler<FormValues> = (data) =>
    API.post("/v1/teams/{teamID}/projects", {
      params: {
        teamID: team?.id || "",
      },
      body: {
        ...data,
        snapshotBlur: true,
        source: "custom",
      },
    }).then((project) => {
      setKey(project.id, project.token!);
      router.push(`/projects/${project.id}`);
    });

  return (
    <>
      <RegisterSegment
        order={2}
        reference="custom"
        segment={[
          {
            name: "Add project",
            value: "/add",
          },
          {
            name: "Generic git",
            value: "/add/custom",
          },
        ]}
      />
      <main className="container">
        <h1 className="text-xl font-semibold pt-12">Generic git projects</h1>
        <p className="text-on-surface-variant pt-2">
          You can add any git repository to your team. If you&apos;re using a
          first party supported git provider, we recommend using the provider
          specific add page. Projects added here won&apos;t have our deep
          integration features.
        </p>
        <form className="py-12 space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Project name"
            required
            {...register("name", {
              required: true,
            })}
          />
          <Input label="Project url" type="url" {...register("url", {})} />
          <Button loading={formState.isSubmitting} type="submit">
            Add project
          </Button>
        </form>
      </main>
    </>
  );
}
