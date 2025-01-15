class PlaidController {
    constructor(plaidService) {
        this.plaidService = plaidService;
    }

    async createLinkToken(req, res, next) {
        try {
            const { userId } = req.body; // Same parameter as original
            const linkToken = await this.plaidService.createLinkToken(userId);
            res.json({ linkToken }); // Same response format as original
        } catch (error) {
            next(error);
        }
    }

    async exchangePublicToken(req, res, next) {
        try {
            const { publicToken, userId } = req.body; // Same parameters as original
            await this.plaidService.exchangePublicToken(publicToken, userId);
            // Same response format as original
            res.status(200).json({ message: 'Public token exchanged and stored successfully!' });
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const { userId, startDate, endDate } = req.body; // Same parameters as original
            const userDoc = await this.plaidService.db.collection('users').doc(userId).get();

            if (!userDoc.exists || !userDoc.data().accessToken) {
                return res.status(404).json({ error: 'User or access token not found' });
            }

            const transactions = await this.plaidService.fetchTransactions(
                userDoc.data().accessToken,
                startDate,
                endDate
            );

            res.json({ transactions }); // Same response format as original
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PlaidController;