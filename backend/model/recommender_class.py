import numpy as np
import optuna
from recommendation_system import build_interactions_matrix, build_similarity_matrix, n_users,n_movies, train_set,test_set,get_mse


# predicts ratings on user/item similarites
class Recommender:
    def __init__(
        self, 
        n_users,
        n_items,
        r_mat,
        k=40, # the number of neighbors to use when computing the similarity score
        kind="user",
        bias_sub=False,
        eps=1e-9,
    ):
        self.n_users = n_users # number of users 
        self.n_items = n_items # number of items
        self.kind = kind # determines id user-user or item-item
        self.eps = eps
        self.iter_m = build_interactions_matrix(r_mat, self.n_users, self.n_items) # interaction matix
        self.sim_m = build_similarity_matrix(self.iter_m, kind=self.kind)# similarity matrix based on kind
        self.bias_sub = bias_sub
        self.k = k
        self.predictions = self._predict_all() # predicted ratings matrix
    
    # function to made the predictions by multiplying similarity and interaction matrix and the result is normalized
    def _predict_all(self):
        pred = np.empty_like(self.iter_m) # create an empty matrix the same size of the interaction matrix
        if self.kind == "user":
            # Computes the new interaction matrix if needed.
            iter_m = self.iter_m
            if self.bias_sub:
                user_bias = self.iter_m.mean(axis=1)[:, np.newaxis]
                iter_m -= user_bias
            # An user has the higher similarity score with itself,
            # so we skip the first element.
            sorted_ids = np.argsort(-self.sim_m)[:, 1:self.k+1] # sorts the sim matrix in dec order and get top k similar user/items
            for user_id, k_users in enumerate(sorted_ids): # loop through each user
                pred[user_id, :] = self.sim_m[user_id, k_users].dot(self.iter_m[k_users, :]) # gets predicted ratings
                pred[user_id, :] /= \
                    np.abs(self.sim_m[user_id, k_users] + self.eps).sum() + self.eps # normalize the prediction
            if self.bias_sub:
                pred += user_bias
        elif self.kind == "item":
            # Computes the new interaction matrix if needed.
            iter_m = self.iter_m
            if self.bias_sub:
                item_bias = self.iter_m.mean(axis=0)[np.newaxis, :]
                iter_m -= item_bias
            # An item has the higher similarity score with itself,
            # so we skip the first element. because it comparing with itself
            sorted_ids = np.argsort(-self.sim_m)[:, 1:self.k+1]
            for item_id, k_items in enumerate(sorted_ids):
                pred[:, item_id] = self.sim_m[item_id, k_items].dot(iter_m[:, k_items].T)
                pred[:, item_id] /= \
                    np.abs(self.sim_m[item_id, k_items] + self.eps).sum() + self.eps
            if self.bias_sub:
                pred += item_bias
                
        return pred.clip(0, 5)
    
    # get the top recommendations
    def get_top_recomendations(self, item_id, user_id ,n=6):
        if self.kind == "user":
            sim_row = self.sim_m[user_id - 1, :] 
            items_idxs = np.argsort(-sim_row)[1:n+1]
            similarities = sim_row[items_idxs]  
            return items_idxs + 1, similarities
            pass
        if self.kind == "item":
            sim_row = self.sim_m[item_id - 1, :] # get the similarity score for the item id
            items_idxs = np.argsort(-sim_row)[1:n+1] # sorts the scores in dec order
            similarities = sim_row[items_idxs] # get the top n sim scores  
            return items_idxs + 1, similarities # Returns the similarties scores of the items

def objective(trial):
    # The list of hyper-parameters we want to optmizer. For each one we define the bounds
    # and the corresponding name.
    k = trial.suggest_int("k", 10, 200) # Choose random K  
    bias_sub = trial.suggest_categorical("bias_sub", [False, True]) # Randomly subtracts the bias value or not

    # Instantiating the model
    model = Recommender(n_users, n_movies, train_set, kind="item", k=k, bias_sub=bias_sub)
    # Evaluating the performance
    _, test_mse = get_mse(model, train_set, test_set)
    return test_mse

study = optuna.create_study(direction="minimize")
# Here the parameter search effectively begins.
study.optimize(objective, n_trials=100)