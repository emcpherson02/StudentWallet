import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import { Calendar, Download, FileDown, AlertTriangle, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getApiUrl } from '../utils/api';
import styles from '../styles/ExportComponent.module.css';

const DataExport = () => {
    const { currentUser } = useAuth();
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [format, setFormat] = useState('json');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            const token = await currentUser.getIdToken();

            const response = await axios({
                url: getApiUrl('/exports/financial-data'),
                method: 'GET',
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    format
                },
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: format === 'csv' ? 'blob' : 'json'
            });

            if (format === 'csv') {
                const blob = new Blob([response.data], { type: 'application/zip' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'financial-data-export.zip';
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                link.remove();
            } else {
                const dataStr = JSON.stringify(response.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'financial-data-export.json';
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                link.remove();
            }
            setSuccess(true);
        } catch (err) {
            setError('Failed to export data. Please try again.');
            console.error('Export error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h2>Export Data</h2>
                </div>

                <div className={styles.card}>
                    <div className={styles.formGroup}>
                        <label>Date Range</label>
                        <div className={styles.dateInputs}>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                maxDate={endDate}
                                className={styles.datePicker}
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                maxDate={new Date()}
                                className={styles.datePicker}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Format</label>
                        <div className={styles.formatOptions}>
                            <button
                                className={`${styles.formatButton} ${format === 'json' ? styles.active : ''}`}
                                onClick={() => setFormat('json')}
                            >
                                JSON
                            </button>
                            <button
                                className={`${styles.formatButton} ${format === 'csv' ? styles.active : ''}`}
                                onClick={() => setFormat('csv')}
                            >
                                CSV
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <AlertTriangle size={16} />
                            <div className={styles.errorMessage}>
                                <h3>Error</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className={styles.success}>
                            <CheckCircle size={16} />
                            <div className={styles.successMessage}>
                                <h3>Success</h3>
                                <p>Data exported successfully!</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className={styles.exportButton}
                    >
                        {loading ? (
                            <div className={styles.loadingWrapper}>
                                <div className={styles.spinner}></div>
                                <span>Exporting...</span>
                            </div>
                        ) : (
                            <div className={styles.buttonContent}>
                                <Download size={16} />
                                <span>Export Data</span>
                            </div>
                        )}
                    </button>

                    <div className={styles.exportInfo}>
                        <h3>Includes:</h3>
                        <ul>
                            <li>Transaction history</li>
                            <li>Budget information</li>
                            <li>Loan details</li>
                            <li>Spending analytics</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;