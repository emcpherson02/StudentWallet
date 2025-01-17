class PlaidController {
    constructor(plaidService) {
        this.plaidService = plaidService;
    }

    async createLinkToken(req, res, next) {
        try {
            const { userId } = req.body;
            const linkToken = await this.plaidService.createLinkToken(userId);
            res.json({ linkToken });
        } catch (error) {
            next(error);
        }
    }

    async exchangePublicToken(req, res, next) {
        try {
            const { publicToken, userId } = req.body;
            await this.plaidService.exchangePublicToken(publicToken, userId);
            res.status(200).json({ message: 'Public token exchanged and stored successfully!' });
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const { userId, startDate, endDate } = req.body;
            const transactions = await this.plaidService.fetchTransactions(userId, startDate, endDate);
            res.json({ transactions });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PlaidController;