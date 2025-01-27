import React, { useCallback, useEffect, useRef, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/Star';
import { Fade } from "@mui/material";
import '../styles/posterStyles.css';
import CircularProgress from "@mui/material/CircularProgress";

const labels = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Ok',
  4: 'Good',
  5: 'Excellent',
};

function getLabelText(value) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${labels[value]}`;
}

const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
    },
  };

const getCast = (data,setCastNames) => {
    data.forEach((movie) => {
    fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?language=en-US`, options)
            .then((res) => res.json())
            .then((creditsData) => {
              const top4Cast = creditsData.cast.slice(0, 4).map((member) => member.name); // Get first 4 cast names
              setCastNames((prevCasts) => ({
                ...prevCasts,
                [movie.id]: top4Cast,
              }));
            })
            .catch((err) => console.error(`Error fetching credits for movie ${movie.id}:`, err));
        });
}

const MovieCard = () => {
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [value, setValue] = React.useState(5);
  const [hover, setHover] = React.useState(-1);
  const [fadeIn, setFadeIn] = useState(true); // For fade effect
  const [castNames, setCastNames] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState([]); 
  let notRatedCount = 0;
  const displayedMovieIdsRef = useRef([]);
  const currentMovie = movies[currentMovieIndex];
  
  const fetchMovies = useCallback(() => {
    fetch(
      `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`,
      options
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(displayedMovieIdsRef.current)
        const filteredMovies = data.results.filter(
            (movie) => !displayedMovieIdsRef.current.includes(movie.id)
          );
        setMovies(filteredMovies);
        getCast(data.results, setCastNames);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [page]);
  
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);
  

  const loadMoreMovies = () => {
    setCurrentMovieIndex(0); // Reset to the first movie
    setMovies([]); // Clear the current movie data
    setPage((prevPage) => prevPage + 1); // Load the next page
  };

  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = resolve; 
    });
  };

  const handleNextMovie = () => {
    setFadeIn(true);
    setLoading(true)

    // If value is null, count how many times it's been null
    if (value === null) {
        notRatedCount++;
    } else {
        notRatedCount = 0; 
    }

    if (notRatedCount >= 2) {
        console.log(notRatedCount)
        fetchMovies()
        notRatedCount = 0; 
    }
    
    displayedMovieIdsRef.current.push(currentMovie.id);
    
    if(value >= 3){
        setMovies([])
        fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}/recommendations?language=en-US&page=${page}`, options)
        .then((res) => res.json())
        .then((data) => {
            getCast(data.results,setCastNames)
            const filteredMovies = data.results.filter(
                (movie) => !displayedMovieIdsRef.current.includes(movie.id)
              );
            setMovies(filteredMovies);
            setCurrentMovieIndex(0);
            setLoading(false)
        })
        .catch((err) => console.error("Error fetching recommendations:", err));
      }
    
        const nextMovieIndex = currentMovieIndex + 1;
        if (nextMovieIndex < movies.length) {
          const nextMovie = movies[nextMovieIndex];
          if (nextMovie.backdrop_path) {
            const backdropUrl = `https://image.tmdb.org/t/p/original${nextMovie.backdrop_path}`;
             preloadImage(backdropUrl);
          }
          setCurrentMovieIndex(nextMovieIndex);
        } else {
          loadMoreMovies();
        }  

      if (value) {
        setRatings((prev) => [...prev, { movieId: currentMovie.id, rating: value }]);
      }
    
      // If 10 ratings are collected, send them
      if (ratings.length + 1 >= 11) {
        console.log("Movies rated now sending")
        fetch("http://127.0.0.1:8000/submit_rating/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ratings),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Rating submitted successfully:", data);
            //   const movieNames = ["Sonic", "Avatar", "Inception"];

            // movieNames.forEach((movieName) => {
            //   fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieName)}&include_adult=false&language=en-US&page=1`, options)
            //     .then(res => res.json())
            //     .then(res => console.log(movieName, res))
            //     .catch(err => console.error(err));
            // });
            })
            .catch((error) => {
              console.error("Error submitting rating:", error);
            });
        setRatings([]);
      }
      setFadeIn(true); // Trigger fade-in
      setLoading(false); // Stop loading
  };

  return (
    <div
      className="movie-card-container"
      style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${currentMovie?.backdrop_path})`,
      }}
    >
        {loading && (
        <div className="loader">
          <CircularProgress
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            color="primary"
          />
        </div>
      )}
      {!loading && (
      <Fade in={fadeIn} timeout={500}>
        <div className="movie-card-content" style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${currentMovie?.backdrop_path})`,
      }}>
          {currentMovie && (
            <div className="movie-info-box">
              <h1>{currentMovie.title}</h1>
              <p>{currentMovie.overview}</p>
              {/* Check if current movie ID matches and show cast names */}
              {castNames[currentMovie.id] && (
                <p>{castNames[currentMovie.id].join(", ")}</p>
              )}
            </div>
          )}

            <Typography
                variant="h3"
                sx={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: 30,
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'center',
                position: "absolute",
                left: '1%',
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

          <Box className="rating-box">
            <Typography component="legend">Rate the Movie</Typography>
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
              defaultValue={3}
            />
            {value !== null && (
              <Box sx={{ ml: 2 }}>{labels[hover !== -1 ? hover : value]}</Box>
            )}
          </Box>
        </div>
      </Fade>
      )}
    </div>
  );
};

export default MovieCard;
