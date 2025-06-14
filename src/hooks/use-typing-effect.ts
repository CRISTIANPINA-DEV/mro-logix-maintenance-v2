import { useState, useEffect } from 'react';

export function useTypingEffect(
  phrases: string[],
  typingSpeed: number = 50,
  deletingSpeed: number = 30,
  pauseTime: number = 2000,
  replayDelay: number = 2000
) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const speed = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause at the end of typing
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      // Move to next phrase when done deleting
      if (phraseIndex === phrases.length - 1) {
        // If this was the last phrase, wait for replay delay then restart
        const timeout = setTimeout(() => {
          setPhraseIndex(0);
          setIsDeleting(false);
          setCharIndex(0);
          setText('');
        }, replayDelay);
        return () => clearTimeout(timeout);
      }
      setIsDeleting(false);
      setPhraseIndex(prev => prev + 1);
      return;
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentPhrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else {
        setText(currentPhrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime, replayDelay]);

  return text;
} 