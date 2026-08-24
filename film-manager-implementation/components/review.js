class Review {
    constructor(filmId, reviewerId, completed, reviewDate, rating, review, coreviewerId) {
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.completed = completed;

        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self = selfLink;

        if (coreviewerId) {
            this.coreviewerId = coreviewerId;
            this.drafts = selfLink + "/drafts";
        }
        if (reviewDate)
            this.reviewDate = reviewDate;
        if (typeof rating === 'number' && rating >= 0 && rating <= 10) {
            this.rating = rating;
        }
        if (review)
            this.review = review;

    }
}

module.exports = Review;


