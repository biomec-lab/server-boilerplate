import { createTestConn } from "../../../testUtils/createTestConn";
import { Connection } from "typeorm";
import {
  duplicateEmail,
  emailNotLongEnough,
  passwordNotLongEnough,
  invalidEmail
} from "./errorMessage";
import { User } from "../../../entity/User";
import { TestClient } from "../../../utils/TestClient";
import * as faker from "faker";

faker.seed(Date.now() + 5);
const email = faker.internet.email();
const password = faker.internet.password();

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  await conn.close();
});

describe("Register user", () => {
  const client = new TestClient(process.env.TEST_HOST as string);
  it("check for duplicate emails", async () => {
    // make sure we can register a user
    const response: any = await client.register(email, password);
    expect(response.data.register).toBeNull();
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  it("catch bad emails", async () => {
    const response3: any = await client.register("sp", password);
    expect(response3.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        }
      ]
    });
  });

  it("catch bad password", async () => {
    const response4: any = await client.register(faker.internet.email(), "ad");

    expect(response4.data).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });

  it("catch bad password and email", async () => {
    const response5: any = await client.register("sp", "ad");
    expect(response5.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        },
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });
});
