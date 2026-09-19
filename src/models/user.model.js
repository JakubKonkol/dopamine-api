import mongoose from 'mongoose';

const { Schema } = mongoose;

export const MEDIA_TYPES = ['movie', 'tv'];

/** A movie or TV show reference inside a user's library or playlist. */
const mediaRefSchema = new Schema(
  {
    mediaType: { type: String, enum: MEDIA_TYPES, required: true },
    tmdbId: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const playlistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    items: { type: [mediaRefSchema], default: [] },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    library: {
      watchlist: { type: [mediaRefSchema], default: [] },
      history: { type: [mediaRefSchema], default: [] },
    },
    playlists: { type: [playlistSchema], default: [] },
  },
  { timestamps: true },
);

/** Safe representation returned to clients (never includes the hash). */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    email: this.email,
    username: this.username,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
