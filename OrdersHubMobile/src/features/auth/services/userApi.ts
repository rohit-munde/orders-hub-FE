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
