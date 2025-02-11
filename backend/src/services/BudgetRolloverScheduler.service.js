// budgetRolloverScheduler.service.js
class BudgetRolloverScheduler {
    constructor(budgetService, budgetRolloverService) {
        this.budgetService = budgetService;
        this.budgetRolloverService = budgetRolloverService;
    }

    async checkUserBudgetsOnLogin(userId) {
        console.log(`[BudgetRollover] Starting budget check for user: ${userId}`);
        try {
            const userBudgets = await this.budgetService.getBudgets(userId);
            console.log(`[BudgetRollover] Found ${userBudgets.length} budgets to check`);

            const today = new Date();
            let rolloversProcessed = 0;

            for (const budget of userBudgets) {
                const endDate = new Date(budget.endDate);
                console.log(`[BudgetRollover] Checking budget ${budget.id}:
                    Category: ${budget.category}
                    End Date: ${endDate.toISOString()}
                    Current Date: ${today.toISOString()}`);

                if (endDate <= today) {
                    console.log(`[BudgetRollover] Processing rollover for budget ${budget.id}`);
                    await this.budgetRolloverService.processRollover(userId, budget.id);
                    rolloversProcessed++;
                } else {
                    console.log(`[BudgetRollover] Budget ${budget.id} not due for rollover yet`);
                }
            }

            console.log(`[BudgetRollover] Completed check for user ${userId}. 
                Processed ${rolloversProcessed} rollovers out of ${userBudgets.length} budgets`);
        } catch (error) {
            console.error('[BudgetRollover] Error during budget check:', error);
        }
    }

    /* Commented out for future deployment
    initializeDailyCheck() {
        cron.schedule('0 0 * * *', async () => {
            try {
                await this.checkAndProcessRollovers();
            } catch (error) {
                console.error('Error in daily rollover check:', error);
            }
        });
    }
    */
}

module.exports = BudgetRolloverScheduler;