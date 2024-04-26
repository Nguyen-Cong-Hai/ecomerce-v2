export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: {
    name: string;
    permissions: string[];
  };
}
