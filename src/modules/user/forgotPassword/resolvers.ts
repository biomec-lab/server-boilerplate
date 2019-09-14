import { ResolverMap } from "../../../types/graphql-utils";
import { forgotPasswordLockAccount } from "../../../utils/forgotPasswordLockAccount";
import { createForgotPasswordLink } from "../../../utils/createForgotPasswordLink";
import { User } from "../../../entity/User";
import { userNotFoundError, expiredKeyError } from "./errorMessage";
import { passwordNotLongEnough } from "../register/errorMessage";
import { forgotPasswordPrefix } from "../../../constants/prefix";
import * as yup from "yup";
import { formatYupError } from "../../../utils/formatYupError";
import * as bcrypt from "bcryptjs";

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .min(3, passwordNotLongEnough)
    .max(255)
});

export const resolvers: ResolverMap = {
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: "email",
            message: userNotFoundError
          }
        ];
      }
      await forgotPasswordLockAccount(user.id, redis);
      // TODO: add frontend url
      await createForgotPasswordLink("", user.id, redis);
      // TODO: send email with url
      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: expiredKeyError
          }
        ];
      }
      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatePromise = User.update(
        { id: userId },
        {
          forgotPasswordLocked: false,
          password: hashedPassword
        }
      );

      const deleteKeyPromise = redis.del(redisKey);

      await Promise.all([updatePromise, deleteKeyPromise]);

      return null;
    }
  }
};
