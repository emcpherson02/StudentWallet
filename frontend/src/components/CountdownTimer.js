import React, { useState, useEffect } from 'react';
import styles from '../styles/CountdownTimer.module.css';

const CountdownTimer = ({ nextInstallmentDate, amount }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(nextInstallmentDate) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000 * 60); // Update every minute

        return () => clearInterval(timer);
    }, [nextInstallmentDate, calculateTimeLeft()]);

    if (!timeLeft.days && !timeLeft.hours) {
        return null; // Don't show if installment date has passed
    }

    return (
        <div className={styles.countdownContainer}>
            <h4>Next Installment</h4>
            <div className={styles.countdownDetails}>
                <div className={styles.amount}>£{amount.toFixed(2)}</div>
                <div className={styles.countdownBoxes}>
                    <div className={styles.timeBox}>
                        <span>{timeLeft.days}</span>
                        <label>Days</label>
                    </div>
                    <div className={styles.timeBox}>
                        <span>{timeLeft.hours}</span>
                        <label>Hours</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;