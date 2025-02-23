import React from 'react';
import { AlertTriangle, Lightbulb, TrendingUp, Activity } from 'lucide-react';
import '../styles/TransactionInsights.css';

const TransactionInsights = ({ insights }) => {
    if (!insights) return null;

    return (
        <div className="insights-container">
            <h2 className="insights-title">Financial Insights</h2>

            {/* Spending Patterns */}
            <div className="insights-section">
                <div className="section-header">
                    <TrendingUp className="icon blue" />
                    <h3>Spending Patterns</h3>
                </div>
                <div className="patterns-content">
                    <p className="patterns-text">
                        Top spending categories:
                        {insights.spendingPatterns.topCategories.map(([category, amount], index) => (
                            <span key={category} className="category-amount">
                                {category} (£{amount.toFixed(2)})
                                {index < 2 ? ',' : ''}
                            </span>
                        ))}
                    </p>
                    <p className="patterns-text">
                        Monthly spending trend:
                        <span className={insights.spendingPatterns.monthlyTrend > 0 ?
                            'trend-negative' : 'trend-positive'}>
                            {insights.spendingPatterns.monthlyTrend > 0 ? ' +' : ' '}
                            {insights.spendingPatterns.monthlyTrend}%
                        </span>
                    </p>
                </div>
            </div>

            {/* Unusual Transactions */}
            {insights.unusualTransactions.length > 0 && (
                <div className="insights-section">
                    <div className="section-header">
                        <Activity className="icon yellow" />
                        <h3>Unusual Transactions</h3>
                    </div>
                    <div className="unusual-transactions">
                        {insights.unusualTransactions.map(transaction => (
                            <div key={transaction.id} className="unusual-transaction-card">
                                <p className="transaction-title">
                                    £{Math.abs(transaction.amount).toFixed(2)} - {transaction.description}
                                </p>
                                <p className="transaction-details">
                                    {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="insights-section">
                <div className="section-header">
                    <Lightbulb className="icon purple" />
                    <h3>Recommendations</h3>
                </div>
                <div className="recommendations">
                    {insights.recommendations.map((rec, index) => (
                        <div key={index} className={`recommendation-card ${
                            rec.type === 'warning' ? 'warning' : 'suggestion'
                        }`}>
                            <div className="recommendation-content">
                                {rec.type === 'warning' ? (
                                    <AlertTriangle className="recommendation-icon" />
                                ) : (
                                    <Lightbulb className="recommendation-icon" />
                                )}
                                <p>{rec.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransactionInsights;