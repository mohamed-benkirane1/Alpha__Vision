const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

const googleOAuthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL
  || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;

if (googleOAuthConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackUrl,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.trim().toLowerCase();
      if (!email) return done(new Error('Google account email is required.'), null);

      const avatar = profile.photos?.[0]?.value || null;

      let user = await User.findOne({ email });

      if (!user) {
        const generatedPassword = crypto.randomBytes(32).toString('hex');
        user = await User.create({
          name: profile.displayName || email,
          email,
          googleId: profile.id,
          avatar,
          password: generatedPassword,
        });
      } else {
        // Mettre à jour les infos Google sur un compte existant
        let changed = false;
        if (!user.googleId) { user.googleId = profile.id; changed = true; }
        if (!user.avatar && avatar) { user.avatar = avatar; changed = true; }
        if (changed) await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

passport.googleOAuthConfigured = googleOAuthConfigured;
passport.googleCallbackUrl = googleCallbackUrl;

module.exports = passport;
