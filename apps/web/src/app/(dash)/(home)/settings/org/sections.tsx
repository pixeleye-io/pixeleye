"use client";

import { API, useTeam } from "@/libs";
import { queries } from "@/queries";
import { Team } from "@pixeleye/api";
import { Button, Input } from "@pixeleye/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

interface ProfileFormData {
    name: string;
    avatarURL: string;
}

export function OrgProfileSettingsSection() {


    const { team } = useTeam();



    const { register, handleSubmit, } = useForm<ProfileFormData>({
        defaultValues: {
            name: team?.name,
            avatarURL: team?.avatarURL,
        },
    });

    const queryClient = useQueryClient();

    const mutateTeam = useMutation({
        mutationFn: (data: ProfileFormData) => {
            return API.patch(`/teams/{teamID}/admin`, {
                params: {
                    teamID: team!.id,
                },
                body: data,
            });
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries(queries.teams.list());

            const teams = queryClient.getQueryData(queries.teams.list().queryKey) as Team[];

            queryClient.setQueryData(queries.teams.list().queryKey, teams.map((t) => {
                if (t.id === team!.id) {
                    return {
                        ...t,
                        ...data,
                    }
                }

                return t;
            }))

            return { previousTeams: teams };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(queries.teams.list());
        },
        onError: (_, __, context: any) => {
            queryClient.setQueryData(queries.teams.list().queryKey, context.previousTeams);
        },
    })


    const onSubmit = handleSubmit(async (data) => {
        await mutateTeam.mutateAsync(data);
    })



    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <Input label="Name" required {...register("name", {
                required: true,
                minLength: 1,
                maxLength: 255,
            })} />
            <Input label="Avatar" type="url" {...register("avatarURL", {
                required: false,
            })} />
            <Button loading={mutateTeam.isPending}>Save</Button>
        </form>
    )




}