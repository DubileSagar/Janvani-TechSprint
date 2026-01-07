import { supabase } from '../supabase';


let currentSession = null;

export const authService = {

  async sendOtp({ email }) {
    try {
      console.log('Attempting to send OTP to:', email);

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        console.error('Supabase sendOtp error:', error);
        throw error;
      }

      console.log('OTP sent successfully to email');
      return { success: true };
    } catch (error) {
      console.error('Supabase sendOtp error full object:', error);
      throw new Error(error?.message || 'Failed to send OTP');
    }
  },


  async login({ email, otp }) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email',
      });

      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }

      currentSession = data.session;
      const user = data.user;

      return { success: true, user };
    } catch (error) {
      console.error('Supabase login error:', error);
      throw new Error(error?.message || 'Failed to verify OTP');
    }
  },


  async signup({ name, phone, email, otp }) {
    try {
      // 1. Verify OTP via Email
      const { user } = await this.login({ email, otp });

      // 2. Update Profile (Store Phone in Metadata since Auth is via Email)
      const updates = {};
      if (name) updates.display_name = name;
      if (phone) updates.phone = phone; // Store phone in metadata

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase.auth.updateUser({
          data: updates
        });

        if (error) {
          console.error('Error updating user metadata:', error);
        } else {
          // Merge metadata phone into user object for immediate return usage
          if (data.user && data.user.user_metadata) {
            user.user_metadata = data.user.user_metadata;
          }
        }
      }

      return { success: true, user: { ...user, displayName: name, phone: phone } };
    } catch (error) {
      console.error('Supabase signup error:', error);
      throw new Error(error?.message || 'Failed to complete signup');
    }
  },


  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        throw error;
      }

      currentSession = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },


  getCurrentUser() {
    const { data: { user } } = supabase.auth.getUser();
    return user;
  },


  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },


  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChanged((event, session) => {
      callback(session?.user || null);
    });
  },


  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    return data;
  },


  async loginWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });

    if (error) throw error;
    return data;
  }
};

export default authService;