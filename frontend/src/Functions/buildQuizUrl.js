 const FilterUtils = {
    toQueryString: (filters) => {
      return Object.keys(filters)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`)
        .join('&');
    },
  
    buildFilters: (quizAnswers) => {
        const genreMap = {
            "Action": 28,
            "Adventure": 12,
            "Animation": 16,
            "Comedy": 35,
            "Crime": 80,
            "Documentary": 99,
            "Drama": 18,
            "Family": 10751,
            "Fantasy": 14,
            "History": 36,
            "Horror": 27,
            "Music": 10402,
            "Mystery": 9648,
            "Romance": 10749,
            "Science Fiction": 878,
            "TV Movie": 10770,
            "Thriller": 53,
            "War": 10752,
          };
          const peopleMap = {
            directors: {
              "Steven Spielberg": 488,
              "Quentin Tarantino": 138,
              "Christopher Nolan": 525,
              "Martin Scorsese": 1032
            },
            cast: {
              "Greta Gerwig": 45400,
              "Dwayne Johnson": 18918,
              "Leonardo DiCaprio": 6193,
              "Robert De Niro": 380,
              "Denzel Washington": 5292,
              "Will Smith": 2888,
              "Tom Cruise": 18897,
              "Jackie Chan": 18897
            }
          };          
        let filters = {};
        // Filter for genres (can have multiple)
        if (quizAnswers.genre) {
            const genreIds = quizAnswers.genre.map(genreName => genreMap[genreName]);
            filters.with_genres = genreIds.join('|');
        }
        
        // Filter for crew
        if (quizAnswers.cast !== 'None of these' && quizAnswers.director !== 'None of these') {
            filters.with_crew = `${peopleMap.cast[quizAnswers.cast]}|${peopleMap.directors[quizAnswers.director]}`;
        }else if (quizAnswers.cast !== 'None of these') {
            filters.with_crew = peopleMap.cast[quizAnswers.cast];
        } else if (quizAnswers.director !== 'None of these') {
        filters.with_crew = peopleMap.directors[quizAnswers.director];
        }             
          
        // Filter for decade (we use the decade to set the release year range)
        if (quizAnswers.decade) {
          const decadeStart = quizAnswers.decade.substring(0, 4);
          const decadeEnd = (parseInt(decadeStart) + 9).toString();
          Object.assign(filters, { 'primary_release_date.gte' : `${decadeStart}-01-01` });
          Object.assign(filters, { 'primary_release_date.lte' : `${decadeEnd}-12-31` });
        }
            
        //Filter for rating (extracted from full string like "PG-13")
        if (quizAnswers.rating) {
          filters.certification = quizAnswers.rating.split(':')[0];
        }
        return filters;
    },
  };

  const buildMovieUrl = ({ type, currentMovie, queryString, year, page, order,search, movieName}) => {
    const base = "https://api.themoviedb.org/3/";

    if (type === "similar" && currentMovie) {
      return `${base}movie/${currentMovie}/similar?language=en-US&page=${page}`;
    }
  
    if (type === "discover" && queryString) {
      return `${base}discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&${queryString}&page=${page}`;
    }
  
    if (type === "year" && year) {
      return `${base}discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&primary_release_year=${year}`;
    }

    if (type === "search" && movieName) {
        return `${base}search/movie?query=${encodeURIComponent(movieName)}&include_adult=false&language=en-US&page=${page}`;
    }
  
    return null;
  };
  
  
  export {FilterUtils, buildMovieUrl};  