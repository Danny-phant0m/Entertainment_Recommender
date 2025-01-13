import numpy as np
from recommendation_system import build_interactions_matrix, build_similarity_matrix, n_users,n_movies, train_set

# predicts ratings on user/item similarites
class Recommender:
    def __init__(
        self, 
        n_users,
        n_items,
        r_mat,
        k=40, # the number of neighbors to use when computing the similarity score
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
        pred = np.empty_like(self.iter_m) # create an empty matrix the same size of the interaction matrix
        if self.kind == "user":
            # An user has the higher similarity score with itself,
            # so we skip the first element.
            sorted_ids = np.argsort(-self.sim_m)[:, 1:self.k+1] # sorts the sim matrix in dec order and get top k similar user/items
            for user_id, k_users in enumerate(sorted_ids): # loop through each user
                pred[user_id, :] = self.sim_m[user_id, k_users].dot(self.iter_m[k_users, :]) # gets predicted ratings
                pred[user_id, :] /= np.abs(self.sim_m[user_id, k_users] + self.eps).sum() # normalizes the prediction
        elif self.kind == "item":
            # An item has the higher similarity score with itself,
            # so we skip the first element.
            sorted_ids = np.argsort(-self.sim_m)[:, 1:self.k+1]
            for item_id, k_items in enumerate(sorted_ids):
                pred[:, item_id] = self.sim_m[item_id, k_items].dot(self.iter_m[:, k_items].T)
                pred[:, item_id] /= np.abs(self.sim_m[item_id, k_items] + self.eps).sum()
        return pred
    