const cron = require('node-cron');

class SchedulerService {
    constructor(emailSummaryService) {
        this.emailSummaryService = emailSummaryService;
        this.initializeSchedules();
    }

    initializeSchedules() {
        // Schedule weekly summary emails for Sunday at 8am
        cron.schedule('0 8 * * 0', async () => {
            console.log('Running weekly summary email job');
            try {
                await this.emailSummaryService.processWeeklySummaries();
                console.log('Weekly summary emails processed successfully');
            } catch (error) {
                console.error('Error processing weekly summary emails:', error);
            }
        });

        console.log('Email summary scheduler initialized');
    }
}

module.exports = SchedulerService;