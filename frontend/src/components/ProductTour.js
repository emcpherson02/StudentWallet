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
        position: 'bottom'  // Changed from 'right' to 'bottom'
    },
    {
        title: "Active Budgets",
        content: "Set up and track your budgets to manage your spending effectively.",
        target: '.budgetsContainer',
        position: 'bottom'  // Changed from 'right' to 'bottom'
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
        });

        // Remove any previous step specific classes
        document.body.classList.remove('tour-modal-step');
        document.body.classList.remove('tour-sidebar-step');
        document.body.classList.remove('tour-top-bar-step');

        // Handle modal type
        if (currentTourStep.type === 'modal') {
            document.body.classList.add('tour-modal-step');
            setPopupStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10000
            });
            return;
        }

        // Determine which element to highlight
        let targetElement = null;

        // For sidebar navigation
        if (currentTourStep.target === '.sidebarNav') {
            document.body.classList.add('tour-sidebar-step');
            targetElement = document.querySelector(currentTourStep.target);
        }
        // For notification button or user menu
        else if (currentTourStep.target === '.notification-button' || currentTourStep.target === '.userBtn') {
            document.body.classList.add('tour-top-bar-step');
            targetElement = document.querySelector(currentTourStep.target);
        }
        // For all other elements
        else {
            targetElement = document.querySelector(currentTourStep.target);
        }

        if (!targetElement) {
            console.log(`Target element not found: ${currentTourStep.target}`);
            return;
        }

        // Add highlight to current element
        targetElement.classList.add('tour-highlight');

        // Get element position
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const style = {
            position: 'absolute',
            zIndex: 12000  // Very high z-index to ensure visibility
        };

        switch (currentTourStep.position) {
            case 'right':
                style.top = `${rect.top + scrollY + (rect.height / 2)}px`;
                style.left = `${rect.right + 20}px`;
                style.transform = 'translateY(-50%)';
                break;
            case 'left':
                if (currentTourStep.target.includes('notification-button') ||
                    currentTourStep.target.includes('userBtn')) {
                    style.top = `${rect.top + scrollY + rect.height + 15}px`;
                    style.left = `${rect.left - 320}px`;
                } else {
                    style.top = `${rect.top + scrollY + (rect.height / 2)}px`;
                    style.left = `${Math.max(20, rect.left - 420)}px`;
                    style.transform = 'translateY(-50%)';
                }
                break;
            case 'bottom':
                style.top = `${rect.bottom + scrollY + 20}px`;
                style.left = `${rect.left + (rect.width / 2) - 190}px`; // Center horizontally
                break;
            case 'top':
                style.top = `${rect.top + scrollY - 180}px`;
                style.left = `${rect.left + (rect.width / 2)}px`;
                style.transform = 'translateX(-50%)';
                break;
        }

        // Ensure popup stays within viewport
        const viewportWidth = window.innerWidth;
        if (style.left && parseFloat(style.left) + 420 > viewportWidth) {
            style.left = `${viewportWidth - 440}px`;
        }

        if (style.top && style.top < window.scrollY) {
            style.top = `${window.scrollY + 20}px`;
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

    // Check if tour has been completed previously
    useEffect(() => {
        const hasCompletedTutorial = localStorage.getItem(`tutorial_completed_${currentUser?.uid}`);
        if (hasCompletedTutorial) {
            setIsVisible(false);
        }
    }, [currentUser?.uid]);

    // Update position on step change and window resize
    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('resize', updatePosition);
            cleanup();
        };
    }, [updatePosition]);

    // Cleanup function to remove all tour-related classes
    const cleanup = () => {
        document.body.classList.remove('tour-modal-step');
        document.body.classList.remove('tour-sidebar-step');
        document.body.classList.remove('tour-top-bar-step');
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
    };

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        cleanup();

        if (currentUser?.uid) {
            localStorage.setItem(`tutorial_completed_${currentUser.uid}`, 'true');
        }

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
            <div className="tour-overlay"></div>

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