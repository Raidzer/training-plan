import type { App, FormProps } from "antd";

export type RegisterFields = {
  name: string;
  lastName?: string;
  gender: "male" | "female";
  login: string;
  email: string;
  password: string;
  timezone: string;
};

export type RegisterApiResponse = {
  error?: unknown;
};

export type RegisterPayload = Omit<RegisterFields, "lastName"> & {
  lastName?: string;
};

export type RegisterSubmitHandler = NonNullable<FormProps<RegisterFields>["onFinish"]>;

export type RegisterMessageApi = Pick<
  ReturnType<typeof App.useApp>["message"],
  "error" | "success" | "warning"
>;
