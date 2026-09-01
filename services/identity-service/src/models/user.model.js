import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../lib/env.js';

const User_Status = Object.freeze([
    "pending",
    "active",
    "banned",
    "deleted",
])

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 80,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: function () { return this.provider === 'local'; },
            select: false,
        },

        // OAuth
        provider: {
            type: String,
            enum: ['local', 'github'],
            default: 'local'
        },
        githubId: {
            type: String,
            index: true,
            sparse: true
        },
        githubUsername: {
            type: String
        },
        githubAccessToken: {
            type: String,
            select: false
        },

        // Profile
        profilePic: {
            type: String,
            default: ''
        },
        profileFileId: {
            type: String
        },


        // account status
        status: {
            type: String,
            default: "pending",
            enum: User_Status
        },
        registrationExpiresAt: {
            type: Date,
        },


        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date
        },


        // here we add fiels of networkid of docker every user wise so it is centelized and we can easily manage the network of docker for each user
        networkName: {
            type: String,
            required: true,
            index: true
        },
    },
    {
        timestamps: true,
        optimisticConcurrency: true,
    }
);

userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ registrationExpiresAt: 1 }, {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: 'pending' },
});


userSchema.pre('save', async function () {
    if (this.provider !== 'local') return;
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, Number(env.BCRYPT_ROUNDS || 10));
});

userSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
    }
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

export const User = mongoose.model('User', userSchema);
