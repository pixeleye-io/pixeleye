import { User } from '../models/user';
import { Method } from '../types/method';

type GET = Method<{
  '/user': {
    res: User;
    req: undefined;
  };
}>;


export interface UserAPI {
  get: GET;
}