class MfaController {
    constructor(mfaService) {
        this.mfaService = mfaService;
    }

    async enableMfa(req, res, next) {
        try {
            const { userId, phoneNumber } = req.body;

            const result = await this.mfaService.enableMfa(userId, phoneNumber);

            res.status(200).json({
                status: 'success',
                message: 'MFA enabled successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async disableMfa(req, res, next) {
        try {
            const { userId } = req.body;

            const result = await this.mfaService.disableMfa(userId);

            res.status(200).json({
                status: 'success',
                message: 'MFA disabled successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getMfaStatus(req, res, next) {
        try {
            const { userId } = req.query;

            const status = await this.mfaService.getMfaStatus(userId);

            res.status(200).json({
                status: 'success',
                data: status
            });
        } catch (error) {
            next(error);
        }
    }

    async sendVerificationCode(req, res, next) {
        try {
            const { userId } = req.body;

            const result = await this.mfaService.sendVerificationCode(userId);

            res.status(200).json({
                status: 'success',
                message: 'Verification code sent successfully',
                data: {
                    // Only include the code in development/PoC environments
                    code: process.env.NODE_ENV === 'development' ? result.code : undefined
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyCode(req, res, next) {
        try {
            const { userId, code } = req.body;

            const result = await this.mfaService.verifyCode(userId, code);

            res.status(200).json({
                status: 'success',
                message: 'Code verified successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MfaController;