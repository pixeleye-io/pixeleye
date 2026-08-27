"use client";

import { Button, Input } from "@pixeleye/ui";
import { SubmitHandler, useForm } from "react-hook-form";
import { API } from "@/libs";
import { useRouter } from "next/navigation";

type FormValues = {
  teamName: string;
  baseURL: string;
  accessToken: string;
};

export function BitbucketServerConnectForm() {
  const { register, handleSubmit, formState } = useForm<FormValues>();

  const router = useRouter();

  const onSubmit: SubmitHandler<FormValues> = (data) =>
    API.post("/v1/git/bitbucket-server", {
      body: data,
    }).then(({ team }) => {
      router.push(`/add/bitbucket_server?team=${team.id}`);
      router.refresh();
    });

  return (
    <main className="container">
      <h1 className="text-xl font-semibold pt-12">Connect Bitbucket Server</h1>
      <p className="text-on-surface-variant pt-2">
        Connect a self-hosted Bitbucket Server (Data Center) instance using an
        HTTP access token. Generate one from your Bitbucket Server profile
        under Manage account &rarr; HTTP access tokens, with project/repository
        read permission.
      </p>
      <form className="py-12 space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Team name"
          required
          {...register("teamName", { required: true })}
        />
        <Input
          label="Bitbucket Server URL"
          placeholder="https://bitbucket.example.com"
          type="url"
          required
          {...register("baseURL", { required: true })}
        />
        <Input
          label="HTTP access token"
          type="password"
          required
          {...register("accessToken", { required: true })}
        />
        <Button loading={formState.isSubmitting} type="submit">
          Connect
        </Button>
      </form>
    </main>
  );
}
