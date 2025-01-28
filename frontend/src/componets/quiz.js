import React, { useState } from 'react';
import { Button, Box, Typography, Radio, RadioGroup, FormControlLabel, CircularProgress, Fade, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    backgroundImage: 'url(your-image-url)', // Set your background image URL here
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    filter: 'blur(8px)', 
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '-1',
  },
  quizContainer: {
    padding: '20px',
    textAlign: 'center',
    width: '90%',
    maxWidth: '600px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '10%',
    left: '30%',
    bottom: '10%',
  },
  questionNumber: {
    color: '#FFD700', 
    fontWeight: 'bold',
    marginBottom: '20px',
    paddingBottom: '20px'
  },
  answerContainer: {
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'left',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
  },
  progress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
  },
});

const MovieQuiz = ({ onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const totalQuestions = 5;
  const [fadeIn, setFadeIn] = useState(true);
  const classes = useStyles();

  const questions = [
    {
      question: 'What genres do you enjoy the most?',
      options: ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'],
      key: 'genre',
    },
    {
      question: 'Which decade of movies do you prefer?',
      options: ['1980s', '1990s', '2000s', '2010s', '2020s'],
      key: 'decade',
    },
    {
      question: 'What is your favorite movie type?',
      options: ['Blockbusters', 'Indie Films', 'Documentaries', 'Animated', 'Foreign Films'],
      key: 'movie_type',
    },
    {
      question: 'What mood do you prefer for movies?',
      options: ['Funny', 'Thrilling', 'Emotional', 'Relaxing', 'Dark'],
      key: 'mood',
    },
    {
      question: 'Do you like movies with:',
      options: ['Fast-paced action', 'Slow-burn plots', 'Mix of both', 'Character-driven stories', 'Mysteries'],
      key: 'style',
    },
  ];

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentQuestionIndex === totalQuestions - 1) {
        onQuizComplete(answers); // Submit answers and proceed
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1); // Go to next question
      }
      setFadeIn(true);
    }, 500); // Add delay for smooth transition
  };

  const handleAnswerChange = (event) => {
    setAnswers({ ...answers, [questions[currentQuestionIndex].key]: event.target.value });
  };

  return (
    <>
      <div className={classes.root} />
      <div className={classes.quizContainer}>
        <Typography variant="h5" className={classes.questionNumber}>
          Question {currentQuestionIndex + 1} / {totalQuestions}
        </Typography>
        <Fade in={fadeIn} timeout={500}>
          <Box>
            <Typography variant="h5" style={{ marginBottom: '40px', color: 'black' }}>
              {questions[currentQuestionIndex].question}
            </Typography>
            <RadioGroup
              name="quiz"
              value={answers[questions[currentQuestionIndex].key] || ''}
              onChange={handleAnswerChange}
            >
              {questions[currentQuestionIndex].options.map((option, index) => (
                <Paper key={index} className={classes.answerContainer} elevation={3} style={{ borderRadius: '15px' }}>
                  <FormControlLabel
                    value={option}
                    control={<Radio />}
                    label={option}
                    style={{ color: 'black' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!answers[questions[currentQuestionIndex].key]}
            >
              Next
            </Button>
          </Box>
        </Fade>
      </div>
      {loading && <CircularProgress size={50} className={classes.progress} />}
    </>
  );
};

export default MovieQuiz;
