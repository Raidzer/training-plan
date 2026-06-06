export type RegisterFields = {
  name: string;
  lastName?: string;
  gender: "male" | "female";
  login: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
};

export type RegisterApiResponse = {
  error?: string;
};
