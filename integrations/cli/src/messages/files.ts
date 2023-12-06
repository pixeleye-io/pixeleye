import { errMsg } from "./ui/theme";

export const dirNotFound = (path: string) =>
  errMsg`No such directory: ${path}
        Please make sure you are in the right directory and the path is correct.`;

export const noImagesFound = (path: string) =>
  errMsg`No images found in ${path}
            Please make sure you are in the right directory and the path is correct.`;
