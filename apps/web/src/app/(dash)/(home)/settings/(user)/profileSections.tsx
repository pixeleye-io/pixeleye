"use client";

import { SettingsTemplate } from "../settingsTemplate";
import { Input, Button } from "@pixeleye/ui";
import { User } from "@pixeleye/api";
import { API } from "@/libs";
import { useForm } from "react-hook-form";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/queries";

interface AccountFormValues {
  name: string;
  avatar: string;
}

export function UpdateAccountData({ user }: { user: User }) {
  const methods = useForm<AccountFormValues>({
    defaultValues: {
      name: user.name,
      avatar: user.avatar,
    },
  });

  const queryClient = useQueryClient();

  const onSubmit = methods.handleSubmit(async (data) =>
    API.patch("/v1/user/me", { body: data }).then(() => {
      queryClient.invalidateQueries(queries.user.get());
    })
  );

  return (
    <SettingsTemplate description="Update your profile" title="Profile">
      <form {...methods} onSubmit={onSubmit} className="space-y-4">
        <Input label="Name" {...methods.register("name", { required: true })} />
        <Input type="url" label="Avatar URL" {...methods.register("avatar")} />
        <Button type="submit">Update</Button>
      </form>
    </SettingsTemplate>
  );
}
