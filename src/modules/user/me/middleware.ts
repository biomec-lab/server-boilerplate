import { Resolver } from "../../../types/graphql-utils";

export default async (
  resolver: Resolver,
  parent: any,
  args: any,
  context: any,
  info: any
) => {
  // middleware
  // if (!context.session || !context.session.userId) {
  //   throw Error("no cookie");
  // }
  const result = await resolver(parent, args, context, info);
  // afterware
  return result;
};
