import { warnMsg } from "./ui/theme";

export const noParentBuildFound = () =>
  warnMsg`No parent build found.
          This could be because:
          - This is the first build
          - This is a new project and we have a limited history
          - Too many commits since the last build
          Checkout our docs for more info: https://pixeleye.io/docs`;
