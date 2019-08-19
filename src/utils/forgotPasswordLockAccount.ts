import { User } from "./../entity/User";
import { Redis } from "ioredis";
import { removeAllUserSessions } from "./removeAllUserSessions";

export const forgotPasswordLockAccount = async (
  userId: string,
  redis: Redis
) => {
  // can't login
  await User.update({ id: userId }, { forgotPasswordLocked: true });
  // remove all sessions
  await removeAllUserSessions(userId, redis);
};
