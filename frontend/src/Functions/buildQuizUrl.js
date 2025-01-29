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
          
        let filters = {};
        // Filter for genres (can have multiple)
        if (quizAnswers.genre) {
            const genreIds = quizAnswers.genre.map(genreName => genreMap[genreName]);
            filters.with_genres = genreIds.join(',');
        }
      
        // Filter for mood (can have multiple)
        if (quizAnswers.mood) {
          filters.with_keywords = quizAnswers.mood.join(',');
        }
      
        // Filter for cast (can have a single or multiple)
        if (quizAnswers.cast) {
          filters.with_cast = quizAnswers.cast;
        }
      
        // Filter for decade (we use the decade to set the release year range)
        if (quizAnswers.decade) {
          const decadeStart = quizAnswers.decade.substring(0, 4);
          const decadeEnd = (parseInt(decadeStart) + 9).toString();
          filters.primary_release_year = `${decadeStart}-${decadeEnd}`; // Construct the range for the decade
        }
      
        // Filter for style (can be added to keywords)
        if (quizAnswers.style) {
          filters.with_keywords = filters.with_keywords
            ? `${filters.with_keywords},${quizAnswers.style}`
            : quizAnswers.style;
        }
      
        // Filter for favorite movie (can be added to keywords)
        if (quizAnswers.favorite_movie) {
          filters.with_keywords = filters.with_keywords
            ? `${filters.with_keywords},${quizAnswers.favorite_movie}`
            : quizAnswers.favorite_movie;
        }
      
        // Filter for movie type (can be added to keywords)
        if (quizAnswers.movie_type) {
          filters.with_keywords = filters.with_keywords
            ? `${filters.with_keywords},${quizAnswers.movie_type}`
            : quizAnswers.movie_type;
        }
      
        // Filter for rating (extracted from full string like "PG-13")
        if (quizAnswers.rating) {
          filters.certification = quizAnswers.rating.split(':')[0];
        }
      
        return filters;
    },
  };
  
  export default FilterUtils;  