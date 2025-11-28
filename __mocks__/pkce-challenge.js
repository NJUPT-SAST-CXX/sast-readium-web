module.exports = {
  generateVerifier: () => "mock-verifier",
  generateChallenge: async () => ({
    code_challenge: "mock-challenge",
    code_challenge_method: "S256",
  }),
  default: {
    generateVerifier: () => "mock-verifier",
    generateChallenge: async () => ({
      code_challenge: "mock-challenge",
      code_challenge_method: "S256",
    }),
  },
};
