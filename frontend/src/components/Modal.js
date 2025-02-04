import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/Modal.module.css';

const Modal = ({ title, children, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const modalContent = (
        <div className={styles.modalOverlay}>
            <div 
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button 
                        onClick={onClose}
                        className={styles.closeButton}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(
        modalContent,
        document.body
    );
};

export default Modal;