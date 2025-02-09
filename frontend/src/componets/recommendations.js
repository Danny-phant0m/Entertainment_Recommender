import React from 'react';
import { Box, Card, CardMedia, CardContent, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';

const Recommendations = () => {
    const { state } = useLocation();
    const movies = state?.movies || [];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2 }}>
      {movies.map((movie) => (
        <Card key={movie.id} sx={{ position: 'relative', cursor: 'pointer' }}>
          <CardMedia
            component="img"
            image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            sx={{ height: 300 }}
          />
          <CardContent
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              opacity: 0,
              transition: 'opacity 0.3s',
              '&:hover': { opacity: 1 }
            }}
          >
            <Typography variant="h6">{movie.title}</Typography>
            <Typography variant="body2">{movie.overview.substring(0, 80)}...</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Recommendations;
