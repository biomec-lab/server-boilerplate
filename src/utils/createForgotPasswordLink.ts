import { Redis } from "ioredis";
import { v4 } from "uuid";
import { forgotPasswordPrefix } from "../constants/prefix";

export const createForgotPasswordLink = async (
  url: string,
  userId: string,
  redis: Redis
) => {
  const id = v4();
  await redis.set(`${forgotPasswordPrefix}${id}`, userId, "ex", 60 * 60 * 24);
  return `${url}/change-password/${id}`;
};
