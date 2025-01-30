import React, { useState } from 'react';
import { Button, Box, Typography, Radio, RadioGroup, FormControlLabel, CircularProgress, Fade, Paper,FormGroup, TextField, Checkbox } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    backgroundImage: 'url(/images/Background_Image.jfif)',
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
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  questionNumber: {
    color: 'white', 
    fontWeight: 'bold',
    marginBottom: '20px',
    paddingBottom: '20px'
  },
  answerContainer: {
    padding: '10px',
    textAlign: 'left',
    marginBottom: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
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
  const totalQuestions = 6;
  const [fadeIn, setFadeIn] = useState(true);
  const classes = useStyles();

  const questions = [
    {
      question: 'What’s your favorite movie genre?',
      options: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime','Documentary', 'Drama','Family','Fantasy','History','Horror','Music','Mystery','Romance','Sci-Fi','Thriller','War'],
      key: 'genre',
    },
    {
      question: 'Which decade of movies do you prefer?',
      options: ['1980s', '1990s', '2000s', '2010s', '2020s'],
      key: 'decade',
    },
    {
      question: 'What is your preferred movie ratings?',
      options: ['A: All ages (Recommended for children)', 'PG: Parental guidance recommended', 'PG-13: Parental guidance is advised for children under 13', '18+: Suitable for adults only'],
      key: 'rating',
    },
    {
      question: 'Do you have a favorite director?',
      options: ['Steven Spielberg', 'Quentin Tarantino', 'Christopher Nolan', 'Martin Scorsese', 'Greta Gerwig', 'None of these'],
      key: 'director',
    },  
    {
      question: 'Do you have a favorite actor?',
      options: ['Dwayne Johnson', 'Leonardo DiCaprio', 'Robert De Niro', 'Denzel Washington', 'Will Smith','Tom Cruise','Jackie Chan','None of these' ],
      key: 'cast',
    },
    {
      question: 'What is your favorite movie?',
      key: 'favorite_movie',
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
    const choice = event.target.value;
    const key = questions[currentQuestionIndex].key;
  
    // For genre and mood, store as an array (multiple choices)
    if (key === 'genre' || key === 'mood') {
      const prevChoices = answers[key] || [];
  
      // Add or remove choice from the list
      const updatedChoices = prevChoices.includes(choice)
        ? prevChoices.filter(item => item !== choice) // Remove if already selected
        : [...prevChoices, choice]; // Add if not selected
  
      setAnswers({ ...answers, [key]: updatedChoices });
    } else {
      // For other questions, just store the single choice
      setAnswers({ ...answers, [key]: choice });
    }
  };
  
  const key = questions[currentQuestionIndex].key
  const GroupComponent = key === 'genre' | key === 'mood' ? FormGroup : RadioGroup;
  const Control = key === 'genre' | key === 'mood' ? Checkbox : Radio;

  return (
    <>
      <div className={classes.root} />
      <div className={classes.quizContainer}>
        <Typography variant="h5" className={classes.questionNumber}>
          Question {currentQuestionIndex + 1} / {totalQuestions}
        </Typography>
        <Fade in={fadeIn} timeout={500}>
          <Box>
            <Typography variant="h5" style={{ marginBottom: '40px', color: 'White' }}>
              {questions[currentQuestionIndex].question}
            </Typography>
            {questions[currentQuestionIndex].key === 'favorite_movie' ? (
              <TextField
                variant="outlined"
                fullWidth
                placeholder="Enter your favorite movie"
                value={answers['favorite_movie'] || ''}
                onChange={handleAnswerChange}
                style={{ marginBottom: '20px', color: 'black' }}
                slotProps={{
                  input: {
                    maxLength: 100, // Prevents overly long inputs
                  },
                }}
              />
            ) : (
            <GroupComponent
               row={questions[currentQuestionIndex].options.length > 7}
               name="quiz"
               value={answers[questions[currentQuestionIndex].key] || ''}
               onChange={handleAnswerChange}
               style={{
                 flexWrap: questions[currentQuestionIndex].options.length > 7 ? 'wrap' : 'nowrap',
                 justifyContent: 'center',
               }}
            >
              {questions[currentQuestionIndex].options.map((option, index) => (
                <Paper key={index} className={classes.answerContainer} elevation={3} style={{ borderRadius: '15px', margin: '5px', backgroundColor: 'rgba(255, 255, 255, 0.8)', }}>
                  <FormControlLabel
                    value={option}
                    control={<Control/>}
                    label={option}
                    style={{ color: 'black' }}
                  />
                </Paper>
              ))}
            </GroupComponent>
            )}
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
