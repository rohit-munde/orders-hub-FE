export type GoogleAuthenticationRequest = {
  idToken: string;
  serverAuthCode: string;
};

export type AuthSession = {
  appToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    pictureUrl: string | null;
  };
};
