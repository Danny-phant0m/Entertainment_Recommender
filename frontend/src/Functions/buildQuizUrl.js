 const FilterUtils = {
    toQueryString: (filters) => {
      return Object.keys(filters)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`)
        .join('&');
    },
  
    buildFilters: (quizAnswers) => {
        const keywords = {
            "Classic": 324700,
            "Biographical Documentary": 345747,
            "Foreign Language": 9294,
            "Foreign Language Adaptation": 158628,
            "Mysteries": 272789,
            "Dark Mysteries": 228281,
            "Children's Mysteries": 305517,
            "Gang Solves Mysteries": 317576,
            "Thrillers and Murder Mysteries": 324970,
            "Solving Mysteries": 345375,
            "Character Driven": 278680,
            "Stories": 338791,
            "Slow Burn Romance": 282984,
            "Slow Start": 326153,
            "Slow Burning": 245724,
            "Slow": 251666,
            "Fast Paced": 326457,
            "Fast Paced Romance": 324580,
            "Funny": 340685,
            "Emotional": 303624,
            "Thrilling": 331225,
            "Dark": 259094,
            "Relaxing": 305015,
            "Inspiring": 191446,
            "Inspiring Story": 155170,
            "relaxing":305015
          };

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
        
        // Filter for cast
        if (quizAnswers.cast !== 'None of these' && quizAnswers.director !== 'None of these') {
            filters.with_crew = `${peopleMap.cast[quizAnswers.cast]}|${peopleMap.directors[quizAnswers.director]}`;
        }else if (quizAnswers.cast !== 'None of these') {
            filters.with_crew = peopleMap.cast[quizAnswers.cast];
        } else if (quizAnswers.director !== 'None of these') {
        filters.with_crew = peopleMap.directors[quizAnswers.director];
        }             
      
        // Filter for mood (can have multiple)
        if (quizAnswers.mood) {
            const moodKeywords = quizAnswers.mood.flatMap(mood =>
              Object.entries(keywords)
                .filter(([key]) => key.toLowerCase().includes(mood.toLowerCase()))
                .map(([, id]) => id)
            );
            
            filters.with_keywords = moodKeywords.join('|');
            console.log("Keywords", filters.with_keywords);
          }
          
      
        // Filter for decade (we use the decade to set the release year range)
        if (quizAnswers.decade) {
          const decadeStart = quizAnswers.decade.substring(0, 4);
          const decadeEnd = (parseInt(decadeStart) + 9).toString();
          Object.assign(filters, { 'primary_release_date.gte' : `${decadeStart}-01-01` });
          Object.assign(filters, { 'primary_release_date.lte' : `${decadeEnd}-12-31` });
        }
      
        // // Filter for style (can be added to keywords)
        // if (quizAnswers.style) {
        //   filters.with_keywords = filters.with_keywords
        //     ? `${filters.with_keywords},${quizAnswers.style}`
        //     : quizAnswers.style;
        // }
      
        // // Filter for favorite movie (can be added to keywords)
        // if (quizAnswers.favorite_movie) {
        //   filters.with_keywords = filters.with_keywords
        //     ? `${filters.with_keywords},${quizAnswers.favorite_movie}`
        //     : quizAnswers.favorite_movie;
        // }
      
        // // Filter for movie type (can be added to keywords)
        // if (quizAnswers.movie_type) {
        //   filters.with_keywords = filters.with_keywords
        //     ? `${filters.with_keywords},${quizAnswers.movie_type}`
        //     : quizAnswers.movie_type;
        // }
      
        //Filter for rating (extracted from full string like "PG-13")
        if (quizAnswers.rating) {
          filters.certification = quizAnswers.rating.split(':')[0];
        }
        return filters;
    },
  };

  const buildMovieUrl = ({ type, currentMovie, queryString, year, page  }) => {
    const base = "https://api.themoviedb.org/3/";
    
    if (type === "similar" && currentMovie?.id) {
      return `${base}movie/${currentMovie.id}/similar?language=en-US&page=${page}`;
    }
  
    if (type === "discover" && queryString) {
      return `${base}discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&${queryString}&page=${page}`;
    }
  
    if (type === "year" && year) {
      return `${base}discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&primary_release_year=${year}`;
    }
  
    return null;
  };
  
  export {FilterUtils, buildMovieUrl};  