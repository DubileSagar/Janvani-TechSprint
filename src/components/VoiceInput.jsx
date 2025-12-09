import React, { useState, useEffect } from 'react';

const VoiceInput = ({
    id,
    name,
    value,
    onChange,
    placeholder,
    required,
    className,
    isTextArea = false,
    rows,
    language = 'en' 
}) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognizer = new SpeechRecognition();
            recognizer.continuous = false;
            recognizer.interimResults = false;
            recognizer.lang = language === 'hi' ? 'hi-IN' : 'en-US';

            recognizer.onstart = () => setIsListening(true);
            recognizer.onend = () => setIsListening(false);
            recognizer.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                
                const newValue = value ? `${value} ${transcript}` : transcript;

                
                const syntheticEvent = {
                    target: {
                        name: name,
                        value: newValue
                    }
                };
                onChange(syntheticEvent);
            };

            recognizer.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            setRecognition(recognizer);
        }
    }, [value, name, onChange]);

    const toggleListening = () => {
        if (!recognition) {
            alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                
            }
        }
    };

    const clearInput = () => {
        
        const syntheticEvent = {
            target: {
                name: name,
                value: ''
            }
        };
        onChange(syntheticEvent);
    };

    
    const containerStyle = {
        position: 'relative',
        width: '100%',
        display: 'block' 
    };

    
    
    const inputStyle = {
        paddingRight: '80px', 
        width: '100%',
        boxSizing: 'border-box' 
    };

    
    return (
        <div style={containerStyle}>
            {isTextArea ? (
                <textarea
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={className}
                    rows={rows}
                    style={inputStyle}
                />
            ) : (
                <input
                    type="text"
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={className}
                    style={inputStyle}
                />
            )}

            <div style={{
                position: 'absolute',
                right: '12px',
                top: isTextArea ? '12px' : '50%',
                transform: isTextArea ? 'none' : 'translateY(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 5,
                alignItems: 'center'
            }}>
                {value && (
                    <button
                        type="button"
                        onClick={clearInput}
                        style={{
                            background: '#e5e7eb', 
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            transition: 'background 0.2s',
                            padding: 0
                        }}
                        title="Clear text"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}

                <button
                    type="button"
                    onClick={toggleListening}
                    style={{
                        background: isListening ? '#fee2e2' : '#f0f9ff', 
                        border: isListening ? '1px solid #ef4444' : '1px solid transparent',
                        cursor: 'pointer',
                        color: isListening ? '#ef4444' : '#138808',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        transition: 'all 0.2s',
                        padding: 0,
                        boxShadow: isListening ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                    }}
                    title={isListening ? "Listening..." : "Speak to type"}
                >
                    {isListening ? (
                        
                        <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }}></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default VoiceInput;
