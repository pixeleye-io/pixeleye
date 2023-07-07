import { Button, Input, Link, LogoWatching } from "@pixeleye/ui";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 lg:w-3/5">
        <div className="mx-auto w-full max-w-sm ">
          <div>
            <h2 className="text-2xl font-bold leading-9 tracking-tight text-primary-background">
              Sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-primary-background">
              Not a member? <Link href="#">Sign up for an account</Link>
            </p>
          </div>

          <div className="mt-10">
            <div className="mt-6 grid grid-cols-1 gap-4">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 text-primary-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]"
              >
                <svg
                  className="h-5 w-5"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold leading-6">GitHub</span>
              </a>
            </div>

            <div className="mt-10">
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-background px-6 text-primary-background">
                    Or continue with
                  </span>
                </div>
              </div>
              <div>
                <form action="#" method="POST" className="space-y-6">
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    label="Email address"
                  />

                  <Input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    label="Password"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-600"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-3 block text-sm leading-6 text-primary-background"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm leading-6">
                      <Link href="#">Forgot password?</Link>
                    </div>
                  </div>

                  <div>
                    <Button full type="submit" className="">
                      Sign in
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative lg:flex items-center hidden w-0 flex-1 z-0">
        <span className="border-l border-border inset-y-0 left-10 absolute" />
        <div className="flex bg-background z-10 py-4 text-primary-background">
          <LogoWatching className="w-16 " />
          <h3 className="text-4xl pt-1 font-bold">ixeleye</h3>
        </div>
      </div>
    </div>
  );
}
