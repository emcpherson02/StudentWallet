class DataExportController {
    constructor(dataExportService) {
        this.dataExportService = dataExportService;
    }

    async exportUserData(req, res, next) {
        try {
            const filters = {
                startDate: req.query.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
                endDate: req.query.endDate || new Date().toISOString(),
                format: req.query.format || 'json'
            };

            const exportData = await this.dataExportService.generateExport(req.user, filters);

            if (filters.format === 'csv') {
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', 'attachment; filename=financial-data-export.zip');
                const JSZip = require('jszip');
                const zip = new JSZip();

                Object.entries(exportData.csv).forEach(([name, content]) => {
                    zip.file(`${name}.csv`, content);
                });

                const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
                return res.send(zipContent);
            }

            res.json({
                status: 'success',
                data: exportData.json
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DataExportController;