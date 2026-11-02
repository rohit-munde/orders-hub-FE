import { httpService } from '../../../services/http/httpService';

export type UserDetails = {
  name: string;
  pictureUrl: string | null;
  connectedInboxCount: number;
  trackedOrderCount: number;
};

export async function getCurrentUserDetails(appToken: string): Promise<UserDetails> {
  return httpService.get<UserDetails>('/api/v1/users/me', {
    token: appToken,
  });
}

export type AccountDeletionResult = {
  accountDeleted: boolean;
  connectedAccountsDeleted: number;
  ordersDeleted: number;
};

/** Permanently deletes the signed-in user's OrdersHub account and all of their data. */
export async function deleteCurrentUserAccount(
  appToken: string,
): Promise<AccountDeletionResult> {
  return httpService.delete<AccountDeletionResult>('/api/v1/users/me', {
    token: appToken,
  });
}
