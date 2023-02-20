import { authOptions } from "@pixeleye/auth";
import { Select } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { serverApi } from "~/lib/server";

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default async function AccessProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = serverApi(session).project.getProjectWithUsers({
    id: params.id,
  });
  return (
    <div>
      <section>
        <h3 className="mb-2 text-2xl">Contributors</h3>
        <p className="mb-4 text-base text-gray-700 dark:text-gray-300">
          These are synced from your git repo. Once a contributor has a Pixeleye
          account, they will appear in the list below.{" "}
        </p>
        <div className="relative flow-root h-full overflow-hidden ">
          <div className="-mx-6 -my-2 overflow-x-auto lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Source
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(await data).users.map((person) => (
                    <tr key={person.user.id}>
                      <td className="py-4 pl-6 pr-3 text-sm whitespace-nowrap sm:pl-0">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <img
                              className="w-10 h-10 rounded-full"
                              src={person.user.image || ""}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {person.user.name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {person.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {capitalizeFirstLetter(person.type)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <Select
                          className="max-w-[10rem]"
                          hiddenLabel
                          label="Role"
                          value={person.role}
                        >
                          <Select.Item value="owner">Owner</Select.Item>
                          <Select.Item value="reviewer">Reviewer</Select.Item>
                          <Select.Item value="viewer">Viewer</Select.Item>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
