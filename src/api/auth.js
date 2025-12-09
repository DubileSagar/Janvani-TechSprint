import { supabase } from '../supabase';


let currentSession = null;

export const authService = {
  
  async sendOtp({ phone }) {
    try {
      
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      console.log('Attempting to send OTP to:', formattedPhone);

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('Supabase sendOtp error:', error);
        throw error;
      }

      console.log('OTP sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Firebase sendOtp error full object:', error);
      console.error('Firebase sendOtp error code:', error.code);
      console.error('Firebase sendOtp error message:', error.message);
      throw new Error(error?.message || 'Failed to send OTP');
    }
  },

  
  async login({ phone, otp }) {
    try {
      
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
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

  
  async signup({ name, phone, otp }) {
    try {
      
      const { user } = await this.login({ phone, otp });

      
      if (name) {
        const { data, error } = await supabase.auth.updateUser({
          data: { display_name: name }
        });

        if (error) {
          console.error('Error updating user metadata:', error);
        }
      }

      
      return { success: true, user: { ...user, displayName: name } };
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