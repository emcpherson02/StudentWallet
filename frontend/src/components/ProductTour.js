import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { X } from 'lucide-react';

const tourSteps = [
    {
        title: "Welcome to StudentWallet! 👋",
        content: "Let's take a quick tour of your new financial management dashboard. We'll show you how to make the most of your account.",
        type: 'modal'
    },
    {
        title: "Quick Actions",
        content: "These buttons provide quick access to essential functions. You can add transactions, create budgets, and link your bank account.",
        target: '.quickActions',
        position: 'bottom'
    },
    {
        title: "Link Your Bank",
        content: "Connect your bank securely using Plaid to automatically import transactions and track your spending.",
        target: '.accountsContainer',
        position: 'right'
    },
    {
        title: "Recent Transactions",
        content: "View your latest transactions here. You can also add manual transactions for cash spending.",
        target: '.transactionsContainer',
        position: 'left'
    },
    {
        title: "Active Budgets",
        content: "Set up and track your budgets to manage your spending effectively.",
        target: '.budgetsContainer',
        position: 'right'
    },
    {
        title: "Navigation Menu",
        content: "Access different pages like Transactions Dashboard, Budget Dashboard, Analytics, and Loan management.",
        target: '.sidebarNav',
        position: 'right'
    },
    {
        title: "Notifications",
        content: "Check your notification history here for budget alerts and loan updates.",
        target: '.notification-button',
        position: 'left'
    },
    {
        title: "User Menu",
        content: "Manage your account settings and preferences here.",
        target: '.userBtn',
        position: 'left'
    }
];

const ProductTour = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [popupStyle, setPopupStyle] = useState({});
    const { currentUser } = useAuth();

    const updatePosition = useCallback(() => {
        const currentTourStep = tourSteps[currentStep];

        // Remove any existing highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
            el.style.removeProperty('z-index');
            el.style.removeProperty('background');
            el.style.removeProperty('position');
        });

        if (currentTourStep.type === 'modal') {
            setPopupStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            });
            return;
        }

        // Log for debugging
        console.log('Looking for element:', currentTourStep.target);

        const targetElement = document.querySelector(currentTourStep.target);
        console.log('Found element:', targetElement);

        if (!targetElement) {
            console.log(`Target element not found: ${currentTourStep.target}`);
            return;
        }

        // Add highlight to current element
        targetElement.classList.add('tour-highlight');
        targetElement.style.zIndex = '1000';
        targetElement.style.position = 'relative';
        targetElement.style.background = 'white';

        // Get element position
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const style = { position: 'absolute', zIndex: '1001' };

        switch (currentTourStep.position) {
            case 'right':
                style.top = `${rect.top + scrollY + (rect.height / 2)}px`;
                style.left = `${rect.right + 20}px`;
                style.transform = 'translateY(-50%)';
                break;
            case 'left':
                // Special handling for notification button and user menu
                if (currentTourStep.target.includes('notification-button') || currentTourStep.target.includes('userBtn')) {
                    // Calculate if there's enough space above
                    const spaceAbove = rect.top;
                    const popupHeight = 180; // Approximate height of popup

                    style.top = `${Math.max(popupHeight, rect.top + scrollY)}px`;
                    style.left = `${Math.max(20, rect.left - 420)}px`;
                    // Remove vertical centering transform for these elements
                    style.transform = 'none';
                } else {
                    style.top = `${rect.top + scrollY + (rect.height / 2)}px`;
                    style.left = `${Math.max(20, rect.left - 420)}px`;
                    style.transform = 'translateY(-50%)';
                }
                break;
            case 'bottom':
                style.top = `${rect.bottom + scrollY + 20}px`;
                style.left = `${rect.left + (rect.width / 2)}px`;
                style.transform = 'translateX(-50%)';
                break;
            case 'top':
                style.top = `${rect.top + scrollY - 180}px`;
                style.left = `${rect.left + (rect.width / 2)}px`;
                style.transform = 'translateX(-50%)';
                break;
        }

        // Ensure popup stays within viewport
        if (style.top < 0) {
            style.top = '20px';
        }

        // Also check right edge of screen
        const viewportWidth = window.innerWidth;
        if (parseFloat(style.left) + 420 > viewportWidth) { // 420 is popup width
            style.left = `${viewportWidth - 440}px`; // 20px margin from right edge
        }

        // Ensure the element is in view
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        setPopupStyle(style);
    }, [currentStep]);

    useEffect(() => {
        const hasCompletedTutorial = localStorage.getItem(`tutorial_completed_${currentUser.uid}`);
        if (hasCompletedTutorial) {
            setIsVisible(false);
        }
    }, [currentUser.uid]);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [updatePosition]);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem(`tutorial_completed_${currentUser.uid}`, 'true');
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        if (window.confirm('Are you sure you want to skip the tour? You can access it later from settings.')) {
            handleComplete();
        }
    };

    if (!isVisible) return null;

    const currentTourStep = tourSteps[currentStep];

    return (
        <div className="tour-container">
            <div className="tour-overlay" />

            <div className="tour-popup" style={popupStyle}>
                <button className="tour-close" onClick={handleSkip}>
                    <X size={20} />
                </button>

                <h3 className="tour-title">{currentTourStep.title}</h3>
                <p className="tour-content">{currentTourStep.content}</p>

                <div className="tour-footer">
                    <div className="tour-progress">
                        Step {currentStep + 1} of {tourSteps.length}
                    </div>

                    <button
                        onClick={handleNext}
                        className="tour-button"
                    >
                        {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductTour;