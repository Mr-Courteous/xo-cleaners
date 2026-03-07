import axios from 'axios';
import baseURL from './config';

/**
 * Fetches the organization's address from the API.
 * Returns the address string, or an empty string if not set / on error.
 *
 * Results are cached in memory for the session so that multiple
 * tickets printed in the same session don't fire repeated requests.
 */

let _cachedAddress: string | null = null;

export async function getOrgAddress(): Promise<string> {
    // Return cached value if we already fetched it
    if (_cachedAddress !== null) {
        return _cachedAddress;
    }

    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return '';

        const res = await axios.get(`${baseURL}/api/settings/organization/address`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        _cachedAddress = res.data?.address ?? '';
        return _cachedAddress;
    } catch (err) {
        console.warn('Could not fetch org address:', err);
        return '';
    }
}

/** Call this when the user logs out or updates the org profile so the cache is refreshed. */
export function clearOrgAddressCache() {
    _cachedAddress = null;
}
