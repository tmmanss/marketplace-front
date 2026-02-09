const PROFILE_PREFIX = 'marketplace_profile';

const getUserKey = (user) => {
  if (user) {
    return (
      user._id ||
      user.id ||
      user.userId ||
      user.email ||
      user.name ||
      null
    );
  }

  const rawUser = localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      const derived =
        parsed?._id || parsed?.id || parsed?.userId || parsed?.email || parsed?.name;
      if (derived) return derived;
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
    }
  }

  const token = localStorage.getItem('accessToken');
  if (token) {
    return `token:${token.slice(0, 16)}`;
  }

  return 'device';
};

export const loadProfile = (user) => {
  const userKey = getUserKey(user);
  if (!userKey) return null;
  const raw = localStorage.getItem(`${PROFILE_PREFIX}:${userKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse profile data', error);
    localStorage.removeItem(`${PROFILE_PREFIX}:${userKey}`);
    return null;
  }
};

export const saveProfile = (user, profile) => {
  const userKey = getUserKey(user);
  if (!userKey) return false;
  localStorage.setItem(`${PROFILE_PREFIX}:${userKey}`, JSON.stringify(profile));
  return true;
};

export const clearProfile = (user) => {
  const userKey = getUserKey(user);
  if (!userKey) return;
  localStorage.removeItem(`${PROFILE_PREFIX}:${userKey}`);
};
