import numpy as np
from recommendation_system import build_interactions_matrix, build_similarity_matrix

class Recommender:
    def __init__(
        self,
        n_users,
        n_items,
        r_mat,
        kind="user",
        eps=1e-9,
    ):
        self.n_users = n_users
        self.n_items = n_items
        self.kind = kind
        self.eps = eps
        self.iter_m = build_interactions_matrix(r_mat, self.n_users, self.n_items)
        self.sim_m = build_similarity_matrix(self.iter_m, kind=self.kind)
        self.predictions = self._predict_all()
    
    def _predict_all(self):
        if self.kind == "user":
            predictions = \
                self.sim_m.dot(self.iter_m) / np.abs(self.sim_m + self.eps).sum(axis=0)[:, np.newaxis]
        elif self.kind == "item":
            predictions = \
                self.iter_m.dot(self.sim_m) / np.abs(self.sim_m + self.eps).sum(axis=0)[np.newaxis, :]
        return predictions