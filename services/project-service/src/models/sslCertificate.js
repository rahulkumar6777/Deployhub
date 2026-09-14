import mongoose from 'mongoose';

const sslCertificateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            index: true,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        issuedAt: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: String,
            required: true,
        },
        lastRenewAttempt: {
            type: Date,
        },
        nextRenewAt: {
            type: Date,
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'failed', 'pending'],
            default: 'active',
            index: true,
        },
        lastError: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export const SslCertificate = mongoose.model('SslCertificate', sslCertificateSchema);
