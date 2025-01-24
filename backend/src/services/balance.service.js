class BalanceService {
    constructor(balanceModel, plaidService, notificationService) {
        this.balanceModel = balanceModel;
        this.plaidService = plaidService;
        this.notificationService = notificationService;
    }

    async getCurrentBalance(userId) {
        try {
            const manualBalance = await this.balanceModel.getBalance(userId);

            try {
                const plaidBalances = await this.plaidService.getBalances(userId);
                if (!plaidBalances) {
                    return {
                        total: manualBalance.amount,
                        manual: manualBalance.amount,
                        plaid: 0,
                        lastUpdated: manualBalance.lastUpdated
                    };
                }

                const totalPlaidBalance = plaidBalances.reduce((sum, account) => {
                    const balance = account.balance.available || account.balance.current || 0;
                    return sum + balance;
                }, 0);

                return {
                    total: manualBalance.amount + totalPlaidBalance,
                    manual: manualBalance.amount,
                    plaid: totalPlaidBalance,
                    accounts: plaidBalances,
                    lastUpdated: new Date().toISOString()
                };
            } catch (error) {
                console.error('Plaid balance fetch error:', error);
                return {
                    total: manualBalance.amount,
                    manual: manualBalance.amount,
                    plaid: 0,
                    lastUpdated: manualBalance.lastUpdated
                };
            }
        } catch (error) {
            console.error('Balance fetch error:', error);
            throw new DatabaseError('Failed to fetch balance');
        }
    }

    async addToBalance(userId, amount, description = '') {
        try {
            if (!amount || isNaN(amount)) {
                throw new ValidationError('Invalid amount');
            }

            const updatedBalance = await this.balanceModel.updateBalance(userId, amount);
            await this.notificationService.checkAndNotifyLowBalance(userId, updatedBalance.amount);
            return updatedBalance;
        } catch (error) {
            throw new DatabaseError('Failed to update balance');
        }
    }

    async deductFromBalance(userId, amount, description = '') {
        const updatedBalance = await this.balanceModel.updateBalance(userId, -Math.abs(amount), description);
        await this.notificationService.checkAndNotifyLowBalance(userId, updatedBalance.amount);
        return updatedBalance;
    }

    async setInitialBalance(userId, amount) {
        try {
            if (!amount || isNaN(amount)) {
                throw new ValidationError('Invalid amount');
            }

            return await this.balanceModel.setInitialBalance(userId, amount);
        } catch (error) {
            throw new DatabaseError('Failed to set initial balance');
        }
    }
}

module.exports = BalanceService;