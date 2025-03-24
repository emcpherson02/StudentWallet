
const setupEmailTestRoutes = (router, emailSummaryService, authMiddleware) => {
    router.post(
        '/trigger-summary-email',
        authMiddleware.verifyToken,
        async (req, res, next) => {
            try {
                const { userId, sendEmail } = req.body;

                if (!userId) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'userId is required'
                    });
                }

                const summaryEndDate = new Date();
                const summaryStartDate = new Date(summaryEndDate);
                summaryStartDate.setDate(summaryStartDate.getDate() - 7);

                console.log(`Generating summary for user ${userId} from ${summaryStartDate.toISOString()} to ${summaryEndDate.toISOString()}`);

                // Generate the summary data
                const summaryData = await emailSummaryService.generateWeeklySummary(
                    userId,
                    summaryStartDate.toISOString(),
                    summaryEndDate.toISOString()
                );

                // Format email content
                const emailContent = emailSummaryService.formatEmailContent(summaryData);

                // Send the email if requested
                if (sendEmail === true) {
                    await emailSummaryService.sendSummaryEmail(userId, emailContent);

                    res.status(200).json({
                        status: 'success',
                        message: 'Weekly summary email generated and sent successfully',
                        preview: emailContent.html.substring(0, 500) + '...' // Send a preview of the email
                    });
                } else {
                    // Return the formatted email content for preview
                    res.status(200).json({
                        status: 'success',
                        message: 'Weekly summary email generated successfully',
                        subject: emailContent.subject,
                        html: emailContent.html
                    });
                }
            } catch (error) {
                console.error('Error generating weekly summary email:', error);
                next(error);
            }
        }
    );

    // Add a dedicated preview endpoint that returns the HTML directly for browser viewing
    router.get(
        '/preview-summary-email',
        authMiddleware.verifyToken,
        async (req, res, next) => {
            try {
                const { userId } = req.query;

                if (!userId) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'userId is required'
                    });
                }

                // Generate summary for the specified date range or default to past week
                const summaryEndDate = new Date();
                const summaryStartDate = new Date(summaryEndDate);
                summaryStartDate.setDate(summaryStartDate.getDate() - 7);

                // Generate the summary data
                const summaryData = await emailSummaryService.generateWeeklySummary(
                    userId,
                    summaryStartDate.toISOString(),
                    summaryEndDate.toISOString()
                );

                // Format email content
                const emailContent = emailSummaryService.formatEmailContent(summaryData);

                // Return the HTML directly for browser viewing
                res.setHeader('Content-Type', 'text/html');
                res.send(emailContent.html);
            } catch (error) {
                console.error('Error generating email preview:', error);
                res.status(500).send(`<h1>Error generating email preview</h1><p>${error.message}</p>`);
            }
        }
    );

    return router;
};

module.exports = setupEmailTestRoutes;