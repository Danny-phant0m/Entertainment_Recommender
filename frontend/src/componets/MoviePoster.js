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
import MovieQuiz from "./quiz";
import { FilterUtils,buildMovieUrl } from '../Functions/buildQuizUrl.js'


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
              const top4Cast = creditsData.cast?.slice(0, 4).map((member) => member.name) || [];// Get first 4 cast names
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
  const notRatedCountRef = useRef(0); // stores the each time a user does not rate a movie
  const displayedMovieIdsRef = useRef([]);
  const currentMovie = movies[currentMovieIndex];
  const apiSourceRef = useRef("similar"); // Track API source
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [ endOfPages, setEndOfPages ] = useState(false);
  const [totalPages, setTotalPages] = useState(0); // track total pages

  const handleQuizComplete = (answers) => {
    setQuizAnswers(answers);
    setQuizCompleted(true);
  };

  const fetchMovies = useCallback(async() => {
    const queryString = FilterUtils.toQueryString(FilterUtils.buildFilters(quizAnswers));
    const matchGte = queryString.match(/primary_release_date\.gte=(\d{4})-01-01/);
    const matchLte = queryString.match(/primary_release_date\.lte=(\d{4})-12-31/);

    const startYear = matchGte ? parseInt(matchGte[1], 10) : null;
    const endYear = matchLte ? parseInt(matchLte[1], 10) : null;

    const randomYear = Math.floor(Math.random() * (Number(endYear) - Number(startYear) + 1)) + Number(startYear);
    const randomOrder = Math.random() < 0.5 ? 'desc' : 'asc';

    let url

    if(endOfPages){
      url = buildMovieUrl({ type: "year", year: randomYear, page: page, order: randomOrder});
    }else if(quizAnswers.favorite_movie){
      url = buildMovieUrl({ type: "search", movieName: quizAnswers.favorite_movie, page:page});
    }else {  
      url = buildMovieUrl({ type: "discover", queryString: queryString, page: page});
    }
    fetch(url,options)
      .then((res) => res.json())
      .then((data) => {
        const filteredMovies = data.results.filter(
          (movie) => !displayedMovieIdsRef.current.includes(movie.id)
        );      
        apiSourceRef.current = "discover";
        setMovies(filteredMovies);
        setCurrentMovieIndex(0);
        console.log(filteredMovies)
        getCast(data.results, setCastNames);
        setTotalPages(data.total_pages);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [page,quizAnswers,endOfPages]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  if (!quizCompleted) {
    return <MovieQuiz onQuizComplete={handleQuizComplete} />;
  }
  
  const loadMoreMovies = () => {
    console.log("The total pages we have ",totalPages)
    console.log("the current page number ",page)
    setCurrentMovieIndex(0); // Reset to the first movie
    if (page < totalPages) {
      // setMovies([]); // Clear the current movie data
      setPage((prevPage) => prevPage + 1);
    } else {
      setEndOfPages(true);
      setPage(1);
    }
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

    if (value === null) {
        notRatedCountRef.current++;
    } else {
        notRatedCountRef.current = 0; 
    }
    if (notRatedCountRef.current >= 5  && apiSourceRef.current === "similar") {
        setMovies([])
        fetchMovies()
        notRatedCountRef.current = 0; 
    }
    else if(notRatedCountRef.current >= 10 && apiSourceRef.current === "discover"){
      // const randomBool = Math.random() < 0.5;
      // console.log(randomBool)
        setMovies([])
        setEndOfPages(true)
        fetchMovies()
        notRatedCountRef.current = 0;         
    }
    
    displayedMovieIdsRef.current.push(currentMovie?.id);
    if(value >= 3){
        setMovies([])
        const url = buildMovieUrl({ type: "similar", currentMovie:currentMovie.id , page: page});
        fetch(url, options)
        .then((res) => res.json())
        .then((data) => {
            getCast(data.results,setCastNames)
            const filteredMovies = data.results.filter(
                (movie) => !displayedMovieIdsRef.current.includes(movie.id)
              );
              apiSourceRef.current = "similar";
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
                console.log("Recommended movies:", data.recommended_movies);
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
