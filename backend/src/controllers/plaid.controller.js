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
            const result = await this.plaidService.exchangePublicToken(publicToken, userId);
            res.status(200).json({
                message: 'Public token exchanged and stored successfully!',
                accounts: result.accounts
            });
        } catch (error) {
            next(error);
        }
    }

    async getAccounts(req, res, next) {
        try {
            const { userId } = req.params;
            const accounts = await this.plaidService.getAccounts(userId);
            res.json({ accounts });
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            console.log('Received request for transactions:', {
                userId,
                startDate,
                endDate
            });

            const transactions = await this.plaidService.fetchTransactions(userId, startDate, endDate);
            res.json({ transactions });
        } catch (error) {
            console.error('Transaction fetch error:', error);
            next(error);
        }
    }

    async getBalances(req, res, next) {
        try {
            const { userId } = req.params;
            const balances = await this.plaidService.getBalances(userId);
            res.json({ balances });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PlaidController;