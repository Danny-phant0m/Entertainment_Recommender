import numpy as np
from recommendation_system import build_interactions_matrix, build_similarity_matrix, n_users,n_movies, train_set

# predicts ratings on user/item similarites
class Recommender:
    def __init__(
        self, 
        n_users,
        n_items,
        r_mat,
        kind="user",
        eps=1e-9,
    ):
        self.n_users = n_users # number of users 
        self.n_items = n_items # number of items
        self.kind = kind # determines id user-user or item-item
        self.eps = eps
        self.iter_m = build_interactions_matrix(r_mat, self.n_users, self.n_items) # interaction matix
        self.sim_m = build_similarity_matrix(self.iter_m, kind=self.kind)# similarity matrix based on kind
        self.predictions = self._predict_all() # predicted ratings matrix
    
    # function to made the predictions by multiplying similarity and interaction matrix and the result is normalized
    def _predict_all(self):
        if self.kind == "user":
            predictions = \
                self.sim_m.dot(self.iter_m) / np.abs(self.sim_m + self.eps).sum(axis=0)[:, np.newaxis] 
        elif self.kind == "item":
            predictions = \
                self.iter_m.dot(self.sim_m) / np.abs(self.sim_m + self.eps).sum(axis=0)[np.newaxis, :]
        return predictions
    
print("User-based predictions sample:")
print(Recommender(n_users, n_movies, train_set, kind="user").predictions[:4, :4])
print("-" * 97)
print("item-based predictions sample:")
print(Recommender(n_users, n_movies, train_set, kind="item").predictions[:4, :4])