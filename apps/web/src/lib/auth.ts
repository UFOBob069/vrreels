// Mock auth functions for local development
export async function signInWithGoogle() {
  // Mock Google sign-in for local development
  console.log('Mock Google sign-in');
  return {
    uid: 'mock-user-id',
    displayName: 'Mock User',
    email: 'mock@example.com',
    getIdToken: async () => 'mock-token'
  };
}

export async function signOut() {
  // Mock sign-out for local development
  console.log('Mock sign-out');
}
