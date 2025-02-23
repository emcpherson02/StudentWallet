class DataExportController {
    constructor(dataExportService) {
        this.dataExportService = dataExportService;
    }

    async exportUserData(req, res, next) {
        try {
            const { userId, format = 'json' } = req.query;
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                selectedCategories: req.query.categories ? req.query.categories.split(',') : [],
                includeData: {
                    transactions: req.query.includeTransactions !== 'false',
                    budgets: req.query.includeBudgets !== 'false',
                    loan: req.query.includeLoan !== 'false',
                    notifications: req.query.includeNotifications !== 'false'
                }
            };

            const exportData = await this.dataExportService.generateExport(userId, filters);

            if (format === 'csv') {
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', 'attachment; filename=user-data-export.zip');

                const JSZip = require('jszip');
                const zip = new JSZip();

                Object.entries(exportData.csv).forEach(([name, content]) => {
                    zip.file(`${name}.csv`, content);
                });

                const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
                res.send(zipContent);
            } else {
                res.json({
                    status: 'success',
                    data: exportData.json
                });
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DataExportController;