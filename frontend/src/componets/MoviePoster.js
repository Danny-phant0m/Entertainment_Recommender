import React, { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/Star';

const labels = {
    1: 'Useless',
    2: 'Poor',
    3: 'Ok',
    4: 'Good',
    5: 'Excellent',
  };
  
  function getLabelText(value) {
    return `${value} Star${value !== 1 ? 's' : ''}, ${labels[value]}`;
  }

const MovieCard = () => {
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [value, setValue] = React.useState(2);
  const [hover, setHover] = React.useState(-1);

  useEffect(() => {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
      },
    };
    fetch(
      "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc",
      options
    )
      .then((res) => res.json())
      .then((data) => setMovies(data.results))
      .catch((err) => console.error(err));
  }, []);

  const currentMovie = movies[currentMovieIndex];

  const handleNextMovie = () => {
    setCurrentMovieIndex((prevIndex) =>
      prevIndex < movies.length - 1 ? prevIndex + 1 : 0
    );
  };


  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(https://image.tmdb.org/t/p/original${currentMovie?.backdrop_path})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        color: "white",
        textShadow: "1px 1px 5px rgba(0, 0, 0, 0.8)",
      }}
    >
      {currentMovie && (
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "1%",
            right: "60%",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.6)",
            borderRadius: "25px",
          }}
        >
          <h1>{currentMovie.title}</h1>
          <p>{currentMovie.overview}</p>
        </div>
      )}
        <Typography
            variant="h3"
            sx={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 30,
            fontWeight: 'bold',
            color: '# ',
            textAlign: 'center',
            position: "absolute",
            top: "1%",
            width: "30%",
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            padding: '10px',
            borderRadius: '25px',
            textShadow: "1px 1px 5px rgba(0, 0, 0, 0.8)",
            }}
        >
        Entertainment Recommender
      </Typography>
      <IconButton
        onClick={handleNextMovie}
        style={{
          position: "absolute",
          top: "50%",
          right: "5%",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <ArrowForwardIosIcon style={{ color: "white", fontSize: "30px" }} />
      </IconButton>
      <Box sx={{
        position: "fixed",
        bottom: '20%', 
        right: '10%',
        '& > legend': { mt: 2 },
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderRadius: "25px",
        padding: "20px",
      }}>
      <Rating
        name="hover-feedback"
        value={value}
        precision={1}
        getLabelText={getLabelText}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        onChangeActive={(event, newHover) => {
          setHover(newHover);
        }}
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
        size="large"
      />
      {value !== null && (
        <Box sx={{ ml: 2 }}>{labels[hover !== -1 ? hover : value]}</Box>
      )}
    </Box>
    </div>
  );
};

export default MovieCard;
