// IMPORTANT: Replace this placeholder with your actual Web Client ID from the Google Cloud Console.

import { BackendUser } from "../common/types/BackendUser";

// Keep the API URL in one place so it can be replaced by an environment variable later.
const GOOGLE_AUTH_API_URL = 'http://10.0.2.2:8080/api/v1/auth/google';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;


const parseBackendUser = (value: unknown): BackendUser => {
    if (
        !isRecord(value) ||
        typeof value.subject !== 'string' ||
        typeof value.email !== 'string' ||
        typeof value.name !== 'string' ||
        (typeof value.pictureUrl !== 'string' && value.pictureUrl !== null)
    ) {
        throw new Error('The backend returned an unexpected user response.');
    }

    return {
        subject: value.subject,
        email: value.email,
        name: value.name,
        pictureUrl: value.pictureUrl,
    };
};

export const authenticateWithBackend = async (
    idToken: string,
): Promise<BackendUser> => {
    let response: Response;

    try {
        response = await fetch(GOOGLE_AUTH_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });
    } catch {
        throw new Error(
            `Could not reach the authentication API at ${GOOGLE_AUTH_API_URL}. ` +
            'Make sure the backend is running and reachable from this device.',
        );
    }

    const responseText = await response.text();
    let responseBody: unknown = null;

    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch {
            responseBody = responseText;
        }
    }

    if (!response.ok) {
        const backendMessage =
            isRecord(responseBody) && typeof responseBody.message === 'string'
                ? `: ${responseBody.message}`
                : '';

        throw new Error(
            `Backend authentication failed (${response.status} ${response.statusText})${backendMessage}`,
        );
    }

    return parseBackendUser(responseBody);
};