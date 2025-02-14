import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import '../styles/PieChart.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const PieChartComponent = ({ data, title }) => {
    return (
        <div className="budget-chart-card">
            <h3 className="budget-chart-title">{title}</h3>
            <PieChart width={400} height={300}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => [`£${value.toFixed(2)}`, 'Amount']} />
                <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ right: -50, top: '50%', transform: 'translateY(-50%)' }}
                />
            </PieChart>
        </div>
    );
};

export default PieChartComponent;