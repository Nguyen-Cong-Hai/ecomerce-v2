export interface IUser {
  _id: string;
  email: string;
  name: string;
  avatar: string;
  phoneNumber: string;
  address: string;
  role: {
    name: string;
    permissions: string[];
  };
}
