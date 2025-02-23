import React, { useState } from 'react';
import {
    Download, FileDown, Filter, AlertCircle, Calendar,
    DollarSign, Tag, Settings, Bell, User,
    ChevronDown, CheckCircle2
} from 'lucide-react';

const DataExport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        selectedCategories: [],
        transactionType: '',
        minAmount: '',
        maxAmount: '',
        includeData: {
            profile: true,
            transactions: true,
            budgets: true,
            loan: true,
            notifications: true
        }
    });

    const dataTypeIcons = {
        profile: <User size={16} />,
        transactions: <DollarSign size={16} />,
        budgets: <Tag size={16} />,
        loan: <Settings size={16} />,
        notifications: <Bell size={16} />
    };

    const handleExport = async (format) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                format,
                startDate: filters.startDate,
                endDate: filters.endDate,
                categories: filters.selectedCategories.join(','),
                transactionType: filters.transactionType,
                minAmount: filters.minAmount,
                maxAmount: filters.maxAmount,
                ...Object.entries(filters.includeData).reduce((acc, [key, value]) => ({
                    ...acc,
                    [`include${key.charAt(0).toUpperCase() + key.slice(1)}`]: value
                }), {})
            });

            const response = await fetch(`/api/user/export-data?${queryParams}`);

            if (!response.ok) throw new Error('Failed to export data');

            const data = format === 'csv' ? await response.blob() : await response.json();
            const filename = `studentwallet-export.${format === 'csv' ? 'zip' : 'json'}`;
            const type = format === 'csv' ? 'application/zip' : 'application/json';

            const blob = format === 'json' ? new Blob([JSON.stringify(data, null, 2)], { type }) : data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Show success message
            setError({ type: 'success', message: 'Export completed successfully!' });
            setTimeout(() => setError(null), 3000);
        } catch (err) {
            setError({ type: 'error', message: 'Failed to export data. Please try again.' });
            console.error('Export error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Export Your Data</h3>
                    <p className="text-sm text-gray-600">Download your financial records and settings</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                    <Filter size={18} />
                    <span>Filters</span>
                    <ChevronDown
                        size={16}
                        className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {error && (
                <div className={`flex items-center gap-2 p-4 rounded-md ${
                    error.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {error.type === 'success' ?
                        <CheckCircle2 size={20} /> :
                        <AlertCircle size={20} />
                    }
                    <span>{error.message}</span>
                </div>
            )}

            {showFilters && (
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Include Data</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(filters.includeData).map(([key, value]) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        value ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setFilters(f => ({
                                            ...f,
                                            includeData: {
                                                ...f.includeData,
                                                [key]: e.target.checked
                                            }
                                        }))}
                                        className="hidden"
                                    />
                                    {dataTypeIcons[key]}
                                    <span className="text-sm capitalize">{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                    onClick={() => handleExport('json')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Download size={20} />
                    Export as JSON
                </button>

                <button
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FileDown size={20} />
                    Export as CSV
                </button>

                {loading && (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataExport;