export const sessionPeer = {
  loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',
  frontUrl: () => process.env.ELEARNING_FRONT_URL?.trim() ?? '',
};
