import React, { useCallback, useEffect, useRef, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/Star';
import { Fade, Button } from "@mui/material";
import '../styles/posterStyles.css';
import CircularProgress from "@mui/material/CircularProgress";
import MovieQuiz from "./quiz";
import { FilterUtils,buildMovieUrl } from '../Functions/buildQuizUrl.js'
import { useNavigate } from "react-router-dom";


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
  const navigate = useNavigate();
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
  const apiSourceRef = useRef(""); // Track API source
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [ endOfPages, setEndOfPages ] = useState(false);
  const [totalPages, setTotalPages] = useState(0); // track total pages
  const [showFavMovie, setShowFavMovie] = useState(true)
  const [showRecommendationButton, setShowRecommendationButton] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);

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
    let url;

    if(endOfPages){
      console.log("End of pages now showing")
      // apiSourceRef.current = "similar" 
      url = buildMovieUrl({ type: "year", year: randomYear, page: page});
    }else if(quizAnswers.favorite_movie && showFavMovie){
      console.log("Similar movies to the users movie now showing")
      apiSourceRef.current = "search"
      url = buildMovieUrl({ type: "search", movieName: quizAnswers.favorite_movie, page:page});
    }else if(!endOfPages && !showFavMovie){  
      console.log("Discover movies with users query now showing")
      apiSourceRef.current = "discover"
      url = buildMovieUrl({ type: "discover", queryString: queryString, page: page});
    }
    console.log(url)
    fetch(url,options)
      .then((res) => res.json())
      .then((data) => {
        if (!data.results || data.results.length === 0) {
          if (!endOfPages) {
              setEndOfPages(true);
          }
          return;
      }    
        const filteredMovies = data.results.filter((movie) => movie.backdrop_path && !displayedMovieIdsRef.current.includes(movie.id)); 
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
  }, [page,quizAnswers,showFavMovie, endOfPages]);

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
      setPage((prevPage) => prevPage + 1);
    } else if(showFavMovie) {
      setShowFavMovie(false);
      setEndOfPages(false)
    }else{
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
    console.log("No rated ",notRatedCountRef.current)
    if (notRatedCountRef.current >= 5  && apiSourceRef.current === "similar") {
        setMovies([])
        fetchMovies()
        notRatedCountRef.current = 0; 
    }
    else if(notRatedCountRef.current >= 10 && apiSourceRef.current === "discover"){
      console.log("The number of not rated", notRatedCountRef.current)
        setMovies([])
        setEndOfPages(true)
        notRatedCountRef.current = 0;         

    }else if(notRatedCountRef.current >= 10 && apiSourceRef.current === "search"){
      console.log("The number of not rated for search", notRatedCountRef.current)
        setMovies([])
        setShowFavMovie(false);
        setEndOfPages(false);
        notRatedCountRef.current = 0;         
    }
    
    displayedMovieIdsRef.current.push(currentMovie?.id);
    if(value >= 3){
        setMovies([])
        const url = buildMovieUrl({ type: "search", movieName:currentMovie.title, page: page});
        fetch(url, options)
        .then((res) => res.json())
        .then((data) => {
          if (!data.results || data.results.length === 0) {
            fetchMovies();
            notRatedCountRef.current = 0;
            return;
          }
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
    
      // If 30 ratings are collected, send them
      if (ratings.length + 1 >= 31) {
        setShowRecommendationButton(true);
      }
      setFadeIn(true); // Trigger fade-in
      setLoading(false); // Stop loading
  };

  const ShowRecommendations = () => {
    setLoading(true);
    console.log("Movies rated now sending")
    const resultsArray = [];
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
              const movieNames = data.recommended_movies;

              movieNames.forEach((movieName) => {
                const url = buildMovieUrl({ type: "search", movieName, page: 1});
                fetch(url, options)
                  .then(res => res.json())
                  .then(res => { 
                    console.log(movieName, res.results[0])      
                    resultsArray.push(res.results[0]);
                  })
                  .catch(err => console.error(err));
              });
              setLoading(false)
            })
            .catch((error) => {
              console.error("Error submitting rating:", error);
            });
        console.log(resultsArray)
        // navigate("/recommendations", { state: { resultsArray} });
        setRatings([]);
}

  const date = new Date(currentMovie?.release_date);
  const formattedDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

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
              <p>Release Date: {formattedDate}</p>
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
            {showRecommendationButton && (
              <Button
                variant="contained"
                onMouseEnter={() => setHoverButton(true)}
                onMouseLeave={() => setHoverButton(false)}
                onClick={() => { ShowRecommendations(); }}
                style={{
                  position: "absolute",
                  top: "5%",
                  right: "5%",
                  backgroundColor: hoverButton ? "white" : "rgba(0, 0, 0, 0.6)",
                  color: hoverButton ? "black" : "white",
                  padding: "10px 20px",
                  fontSize: "16px",
                }}
              >          
                Get Recommendations
              </Button>
            )}
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
