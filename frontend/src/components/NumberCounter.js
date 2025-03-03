import React, { useState, useEffect } from 'react';

const NumberCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        const startValue = count;
        const endValue = value;

        const animation = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;

            if (progress < 1) {
                setCount(startValue + (endValue - startValue) * progress);
                requestAnimationFrame(animation);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(animation);
    }, [value, duration]);

    return <span>£{count.toFixed(2)}</span>;
};

export default NumberCounter;